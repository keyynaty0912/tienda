import { NextResponse } from "next/server";
import { z } from "zod";
import { col, db, isDemo } from "@/lib/firebase-admin";
import {
  requireRole,
  checkOrigin,
  readJson,
  failure,
  hash,
  limitRequest,
} from "@/lib/security";
import {
  productSchema,
  configSchema,
  couponSchema,
  idSchema,
  type Product,
  type Order,
} from "@/lib/schema";
import { AppError } from "@/lib/errors";
const resources = [
  "products",
  "orders",
  "settings",
  "coupons",
  "policies",
  "support",
  "audit",
] as const;
const roles: Record<string, string[]> = {
  products: ["admin", "catalog"],
  orders: ["admin", "fulfillment", "support"],
  settings: ["admin"],
  coupons: ["admin", "catalog"],
  policies: ["admin"],
  support: ["admin", "support"],
  audit: ["admin"],
};
export async function GET(req: Request) {
  try {
    const resource = z
      .enum(resources)
      .parse(new URL(req.url).searchParams.get("resource"));
    await requireRole(roles[resource]);
    const docs =
      resource === "settings"
        ? await col(resource).limit(1).get()
        : await col(resource).limit(300).get();
    return NextResponse.json(docs.docs.map((d) => ({ ...d.data(), id: d.id })));
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const raw = await readJson(req),
      resource = z.enum(resources).parse(raw.resource),
      u = await requireRole(roles[resource]);
    await limitRequest(req, "admin:" + u.uid, 100);
    const audit = col("audit").doc();
    if (resource === "products") {
      const p = productSchema.parse(raw.data);
      if (!isDemo() && p.demo && p.active)
        throw new AppError(
          400,
          "Un producto demostrativo no puede publicarse en producción.",
        );
      await db().runTransaction(async (tx) => {
        const ref = col("products").doc(p.id),
          old = await tx.get(ref),
          before = old.data() as Product | undefined;
        const allSkus = [
          ...new Set([
            ...p.variants.map((v) => v.sku),
            ...(before?.variants.map((v) => v.sku) || []),
          ]),
        ];
        if (new Set(p.variants.map((v) => v.sku)).size !== p.variants.length)
          throw new AppError(400, "Cada variante necesita un SKU único.");
        const skuDocs = await tx.getAll(
          ...allSkus.map((s) => col("skus").doc(hash(s))),
        );
        for (const v of before?.variants || [])
          if (v.reserved > 0 && !p.variants.some((n) => n.id === v.id))
            throw new AppError(
              409,
              "No se puede eliminar una variante con reservas.",
            );
        p.variants = p.variants.map((v) => {
          const reserved =
            before?.variants.find((b) => b.id === v.id)?.reserved || 0;
          if (v.stock < reserved)
            throw new AppError(
              409,
              "El stock no puede ser menor que las reservas activas.",
            );
          const sku = skuDocs.find((d) => d.id === hash(v.sku));
          if (sku?.exists && sku.data()?.productId !== p.id)
            throw new AppError(409, `SKU ya asignado: ${v.sku}`);
          return { ...v, reserved };
        });
        for (const sku of skuDocs) {
          if (p.variants.some((v) => hash(v.sku) === sku.id))
            tx.set(sku.ref, { productId: p.id });
          else if (sku.data()?.productId === p.id) tx.delete(sku.ref);
        }
        tx.set(ref, {
          ...p,
          createdAt: before?.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
        tx.create(audit, {
          actor: u.uid,
          action: before ? "product.updated" : "product.created",
          target: p.id,
          at: Date.now(),
          beforeHash: hash(JSON.stringify(before || {})),
          afterHash: hash(JSON.stringify(p)),
        });
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "settings") {
      const config = configSchema.parse(raw.data);
      await db().runTransaction(async (tx) => {
        const ref = col("settings").doc("store"),
          old = await tx.get(ref);
        tx.set(ref, { ...config, updatedAt: Date.now() });
        tx.create(audit, {
          actor: u.uid,
          action: "settings.updated",
          at: Date.now(),
          beforeHash: hash(JSON.stringify(old.data() || {})),
        });
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "coupons") {
      const c = couponSchema.parse(raw.data);
      await db().runTransaction(async (tx) => {
        const ref = col("coupons").doc(c.code),
          doc = await tx.get(ref),
          old = doc.data();
        if (c.endsAt <= c.startsAt)
          throw new AppError(
            400,
            "La fecha final debe ser posterior a la inicial.",
          );
        tx.set(ref, {
          ...c,
          used: old?.used || 0,
          reserved: old?.reserved || 0,
        });
        tx.create(audit, {
          actor: u.uid,
          action: "coupon.updated",
          target: c.code,
          at: Date.now(),
        });
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "policies") {
      const p = z
        .object({
          id: idSchema,
          title: z.string().min(3).max(160),
          content: z.string().min(20).max(25000),
          version: z.string().min(1).max(60),
          reviewed: z.boolean(),
        })
        .parse(raw.data);
      await db().runTransaction(async (tx) => {
        const ref = col("policies").doc(p.id);
        await tx.get(ref);
        tx.set(col("policyVersions").doc(), {
          ...p,
          actor: u.uid,
          at: Date.now(),
        });
        tx.set(ref, { ...p, updatedAt: Date.now() });
        tx.create(audit, {
          actor: u.uid,
          action: "policy.updated",
          target: p.id,
          at: Date.now(),
        });
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "orders") {
      const b = z
        .object({
          id: idSchema,
          status: z.enum(["preparing", "shipped", "delivered"]).optional(),
          carrier: z.string().max(100).optional(),
          tracking: z.string().max(120).optional(),
          refund: z
            .object({
              amount: z.number().int().positive(),
              reference: z.string().min(3).max(100),
              reason: z.string().min(10).max(500),
            })
            .optional(),
        })
        .parse(raw.data);
      if (b.refund && u.role !== "admin")
        throw new AppError(
          403,
          "Solo administración puede registrar reembolsos.",
        );
      if (b.status && !["admin", "fulfillment"].includes(String(u.role)))
        throw new AppError(403, "Rol sin permiso para preparar o enviar.");
      await db().runTransaction(async (tx) => {
        const ref = col("orders").doc(b.id),
          doc = await tx.get(ref);
        if (!doc.exists) throw new AppError(404, "Pedido no encontrado.");
        const o = doc.data() as Order;
        if (o.paymentStatus !== "APPROVED")
          throw new AppError(409, "El pago no está confirmado.");
        const update: Record<string, unknown> = { updatedAt: Date.now() };
        if (b.refund) {
          if (!o.transactionId)
            throw new AppError(409, "No hay transacción vinculada.");
          if (o.refund)
            throw new AppError(
              409,
              "Este pedido ya tiene un reembolso registrado.",
            );
          if (b.refund.amount > o.quote.total)
            throw new AppError(400, "Importe de reembolso inválido.");
          update.refund = {
            ...b.refund,
            status: "externally_recorded",
            transactionId: o.transactionId,
          };
        } else {
          const next: { [key: string]: string } = {
            paid: "preparing",
            preparing: "shipped",
            shipped: "delivered",
          };
          if (!b.status || next[o.orderStatus] !== b.status)
            throw new AppError(409, "Transición de pedido no permitida.");
          if (b.status === "shipped" && (!b.carrier || !b.tracking))
            throw new AppError(400, "Registra transportadora y guía.");
          update.orderStatus = b.status;
          if (b.status === "shipped") {
            update.shipmentStatus = "shipped";
            update.tracking = { carrier: b.carrier, number: b.tracking };
            tx.set(col("mailQueue").doc(b.id + "-shipped"), {
              orderId: b.id,
              template: "shipment-updated",
              status: "pending_provider_configuration",
              createdAt: Date.now(),
            });
          }
          if (b.status === "delivered") update.shipmentStatus = "delivered";
        }
        tx.update(ref, update);
        tx.create(audit, {
          actor: u.uid,
          action: b.refund ? "refund.recorded" : "order.updated",
          target: b.id,
          at: Date.now(),
          details: b.refund
            ? { amount: b.refund.amount, reference: b.refund.reference }
            : b.status,
        });
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "support") {
      const b = z
        .object({
          id: idSchema,
          status: z.enum(["open", "in_review", "resolved"]),
          response: z.string().max(4000),
        })
        .parse(raw.data);
      await db().runTransaction(async (tx) => {
        const ref = col("support").doc(b.id),
          doc = await tx.get(ref);
        if (!doc.exists) throw new AppError(404, "Solicitud no encontrada.");
        tx.update(ref, {
          status: b.status,
          response: b.response,
          updatedAt: Date.now(),
          agent: u.uid,
        });
        tx.create(audit, {
          actor: u.uid,
          action: "support.updated",
          target: b.id,
          at: Date.now(),
        });
      });
      return NextResponse.json({ ok: true });
    }
    throw new AppError(400, "Operación no permitida.");
  } catch (e) {
    return failure(e);
  }
}
