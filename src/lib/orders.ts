import "server-only";
import { col, db, isDemo } from "./firebase-admin";
import {
  checkoutSchema,
  productSchema,
  configSchema,
  couponSchema,
  type Checkout,
  type Order,
  type Product,
  type Coupon,
} from "./schema";
import {
  priceCart,
  mergeLines,
  shouldApplyPayment,
  stockAfterPayment,
} from "./commerce";
import { AppError } from "./errors";
import { hash, same, tokenFor } from "./security";
import {
  paymentBlockReason,
  paymentEnvironment,
  wompi,
  type ProviderTransaction,
} from "./payments";
export async function createOrder(
  input: Checkout,
  guest: string,
  uid: string | null,
) {
  const body = checkoutSchema.parse(input),
    now = Date.now(),
    lines = mergeLines(body.lines);
  const id = hash(guest + ":" + body.idempotencyKey).slice(0, 40),
    orderRef = col("orders").doc(id),
    token = tokenFor(id, guest);
  const fingerprint = hash(JSON.stringify({ ...body, lines }));
  const order = await db().runTransaction(async (tx) => {
    const existing = await tx.get(orderRef);
    if (existing.exists) {
      const old = existing.data() as Order;
      if (old.guestHash !== hash(guest) || old.fingerprint !== fingerprint)
        throw new AppError(
          409,
          "Esta solicitud ya existe con otros datos. Revisa tu compra.",
        );
      if (
        old.reservationState !== "active" ||
        old.expiresAt < now ||
        old.paymentStatus !== "PENDING"
      )
        throw new AppError(
          409,
          "Este intento ya terminó. Consulta el pedido antes de iniciar otra compra.",
        );
      return old;
    }
    const configDoc = await tx.get(col("settings").doc("store"));
    if (!configDoc.exists)
      throw new AppError(
        503,
        "Configura el negocio y las tarifas en administración.",
      );
    const config = configSchema.parse(configDoc.data());
    const block = paymentBlockReason(config);
    if (block) throw new AppError(503, block);
    if (
      body.department !== body.customer.department ||
      body.city !== body.customer.city
    )
      throw new AppError(
        400,
        "El destino de entrega cambió. Calcula de nuevo.",
      );
    const ids = [...new Set(lines.map((l) => l.productId))];
    const productDocs = await tx.getAll(
      ...ids.map((id) => col("products").doc(id)),
    );
    const products = productDocs.map((d) =>
      productSchema.parse({ ...d.data(), id: d.id }),
    );
    if (!isDemo() && products.some((p) => p.demo))
      throw new AppError(
        409,
        "No se venden productos demostrativos en producción.",
      );
    let coupon: Coupon | null = null;
    if (body.coupon) {
      const cd = await tx.get(col("coupons").doc(body.coupon));
      if (!cd.exists) throw new AppError(422, "Cupón inválido.");
      coupon = couponSchema.parse(cd.data());
    }
    const quote = priceCart(lines, products, config, body, coupon, now);
    if (quote.total !== body.expectedTotal)
      throw new AppError(
        409,
        "El total cambió. Revisa los precios y confirma nuevamente.",
        "PRICE_CHANGED",
      );
    for (const p of products) {
      tx.update(col("products").doc(p.id), {
        variants: p.variants.map((v) => {
          const l = lines.find(
            (l) => l.productId === p.id && l.variantId === v.id,
          );
          return l ? { ...v, reserved: v.reserved + l.quantity } : v;
        }),
        updatedAt: now,
      });
    }
    if (coupon)
      tx.update(col("coupons").doc(coupon.code), {
        reserved: coupon.reserved + 1,
      });
    const order: Order = {
      id,
      reference: `KN-${id}-1`,
      fingerprint,
      guestHash: hash(guest),
      tokenHash: hash(token),
      customerUid: uid,
      customer: body.customer,
      quote,
      orderStatus: "pending_payment",
      paymentStatus: "PENDING",
      shipmentStatus: "unfulfilled",
      reservationState: "active",
      createdAt: now,
      expiresAt: now + 15 * 60 * 1000,
      updatedAt: now,
      transactionId: null,
      paymentUpdatedAt: 0,
      environment: paymentEnvironment(),
      termsVersion: config.termsVersion,
      marketing: body.marketing,
      issue: null,
    };
    tx.create(orderRef, order);
    tx.create(col("consents").doc(id), {
      orderId: id,
      termsVersion: config.termsVersion,
      contractAccepted: true,
      marketing: body.marketing,
      createdAt: now,
    });
    return order;
  });
  return {
    orderId: id,
    token,
    payment: wompi.checkout(order),
    expiresAt: order.expiresAt,
  };
}
export async function authorizedOrder(
  id: string,
  guest: string | undefined,
  uid: string | null,
  token?: string,
) {
  const doc = await col("orders").doc(id).get();
  const o = doc.data() as Order | undefined;
  if (
    !o ||
    !(
      (guest && same(o.guestHash, hash(guest))) ||
      (uid && o.customerUid === uid) ||
      (token && same(o.tokenHash, hash(token)))
    )
  )
    throw new AppError(
      404,
      "Pedido no encontrado o código de acceso inválido.",
    );
  return o;
}
export function publicOrder(o: Order) {
  return {
    id: o.id,
    reference: o.reference,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    shipmentStatus: o.shipmentStatus,
    quote: o.quote,
    createdAt: o.createdAt,
    expiresAt: o.expiresAt,
    tracking: o.tracking || null,
    issue: o.issue,
    refund: o.refund || null,
    environment: o.environment,
  };
}
export async function applyPayment(
  t: ProviderTransaction,
  eventTime = Date.now(),
) {
  const match = /^KN-([a-f0-9]{40})-1$/.exec(t.reference);
  if (!match) throw new AppError(400, "Referencia de pago desconocida.");
  const id = match[1],
    eventId = hash(t.id + ":" + t.status),
    orderRef = col("orders").doc(id),
    eventRef = col("paymentEvents").doc(eventId);
  return db().runTransaction(async (tx) => {
    const [od, ed] = await tx.getAll(orderRef, eventRef);
    if (!od.exists) throw new AppError(404, "Pedido no encontrado.");
    if (ed.exists) return { duplicate: true };
    const o = od.data() as Order;
    if (
      o.environment !== paymentEnvironment() ||
      o.reference !== t.reference ||
      o.quote.total * 100 !== t.amount_in_cents ||
      t.currency !== "COP"
    )
      throw new AppError(
        409,
        "Importe, moneda, referencia o ambiente no coincide.",
      );
    if (o.transactionId && o.transactionId !== t.id)
      throw new AppError(409, "Otro intento de pago requiere revisión manual.");
    const apply = shouldApplyPayment(
      o.paymentStatus,
      t.status,
      o.paymentUpdatedAt,
      eventTime,
    );
    const ids = [...new Set(o.quote.lines.map((l) => l.productId))];
    const docs = await tx.getAll(...ids.map((id) => col("products").doc(id)));
    const products = docs.map((d) => ({ ...d.data(), id: d.id }) as Product);
    const couponRef = o.quote.coupon
      ? col("coupons").doc(o.quote.coupon)
      : null;
    const couponDoc = couponRef ? await tx.get(couponRef) : null;
    const now = Date.now();
    const update: Partial<Order> = { transactionId: t.id, updatedAt: now };
    if (apply) {
      update.paymentStatus = t.status;
      update.paymentUpdatedAt = eventTime;
      if (t.status === "APPROVED") {
        const active = o.reservationState === "active";
        const shortage = o.quote.lines.some((l) => {
          const v = products
            .find((p) => p.id === l.productId)
            ?.variants?.find((v) => v.id === l.variantId);
          return (
            !v ||
            stockAfterPayment(v.stock, v.reserved, l.quantity, active).shortage
          );
        });
        for (const p of products) {
          if (!p.variants) continue;
          tx.update(col("products").doc(p.id), {
            variants: p.variants.map((v) => {
              const l = o.quote.lines.find(
                (l) => l.productId === p.id && l.variantId === v.id,
              );
              if (!l) return v;
              if (shortage)
                return active
                  ? { ...v, reserved: Math.max(0, v.reserved - l.quantity) }
                  : v;
              const next = stockAfterPayment(
                v.stock,
                v.reserved,
                l.quantity,
                active,
              );
              return { ...v, stock: next.stock, reserved: next.reserved };
            }),
            updatedAt: now,
          });
        }
        update.reservationState = shortage ? "released" : "consumed";
        update.orderStatus = shortage ? "manual_review" : "paid";
        update.issue = shortage
          ? "Pago recibido sin stock suficiente: resolver entrega o reembolso."
          : null;
        if (couponRef && couponDoc?.exists) {
          const c = couponDoc.data() as Coupon;
          tx.update(couponRef, {
            used: c.used + 1,
            reserved: active ? Math.max(0, c.reserved - 1) : c.reserved,
          });
        }
        tx.set(col("mailQueue").doc(id + "-paid"), {
          orderId: id,
          template: shortage ? "payment-review" : "order-confirmed",
          status: "pending_provider_configuration",
          createdAt: now,
        });
      } else if (
        ["DECLINED", "ERROR", "VOIDED"].includes(t.status) &&
        o.reservationState === "active"
      ) {
        for (const p of products)
          if (p.variants)
            tx.update(col("products").doc(p.id), {
              variants: p.variants.map((v) => {
                const l = o.quote.lines.find(
                  (l) => l.productId === p.id && l.variantId === v.id,
                );
                return l
                  ? { ...v, reserved: Math.max(0, v.reserved - l.quantity) }
                  : v;
              }),
              updatedAt: now,
            });
        update.reservationState = "released";
        update.orderStatus = "cancelled";
        if (couponRef && couponDoc?.exists)
          tx.update(couponRef, {
            reserved: Math.max(0, (couponDoc.data() as Coupon).reserved - 1),
          });
      }
    }
    tx.update(orderRef, update);
    tx.create(eventRef, {
      orderId: id,
      transactionId: t.id,
      status: t.status,
      amount: t.amount_in_cents,
      receivedAt: now,
      applied: apply,
    });
    return { duplicate: false, applied: apply };
  });
}
export async function expireReservations() {
  const candidates = await col("orders")
    .where("reservationState", "==", "active")
    .where("expiresAt", "<=", Date.now())
    .limit(100)
    .get();
  let released = 0;
  for (const candidate of candidates.docs) {
    await db().runTransaction(async (tx) => {
      const snap = await tx.get(candidate.ref),
        o = snap.data() as Order;
      if (
        o.reservationState !== "active" ||
        o.expiresAt > Date.now() ||
        o.paymentStatus === "APPROVED"
      )
        return;
      const ids = [...new Set(o.quote.lines.map((l) => l.productId))],
        products = await tx.getAll(...ids.map((id) => col("products").doc(id)));
      const coupon = o.quote.coupon
        ? await tx.get(col("coupons").doc(o.quote.coupon))
        : null;
      for (const doc of products) {
        const p = doc.data() as Product;
        if (!p?.variants) continue;
        tx.update(doc.ref, {
          variants: p.variants.map((v) => {
            const l = o.quote.lines.find(
              (l) => l.productId === doc.id && l.variantId === v.id,
            );
            return l
              ? { ...v, reserved: Math.max(0, v.reserved - l.quantity) }
              : v;
          }),
        });
      }
      if (coupon?.exists)
        tx.update(coupon.ref, {
          reserved: Math.max(0, (coupon.data() as Coupon).reserved - 1),
        });
      tx.update(candidate.ref, {
        reservationState: "released",
        orderStatus: "cancelled",
        updatedAt: Date.now(),
        issue: "La reserva venció. El pago, si llega después, se conciliará.",
      });
      released++;
    });
  }
  return released;
}
