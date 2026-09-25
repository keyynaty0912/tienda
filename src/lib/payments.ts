import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { AppError } from "./errors";
import type { Order, StoreConfig } from "./schema";
export const transactionSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  reference: z.string().max(255),
  amount_in_cents: z.number().int().positive(),
  currency: z.literal("COP"),
  status: z.enum(["PENDING", "APPROVED", "DECLINED", "ERROR", "VOIDED"]),
});
export type ProviderTransaction = z.infer<typeof transactionSchema>;
export const eventSchema = z.object({
  event: z.literal("transaction.updated"),
  environment: z.enum(["test", "prod"]),
  timestamp: z.number().int().positive(),
  signature: z.object({
    properties: z
      .array(z.string().regex(/^[a-zA-Z0-9_.]+$/))
      .min(1)
      .max(30),
    checksum: z.string().regex(/^[0-9a-fA-F]{64}$/),
  }),
  data: z.record(z.string(), z.unknown()),
});
export function integrity(
  reference: string,
  amount: number,
  expires: string,
  secret: string,
) {
  return createHash("sha256")
    .update(`${reference}${amount}COP${expires}${secret}`)
    .digest("hex");
}
export function eventChecksum(
  data: Record<string, unknown>,
  properties: string[],
  timestamp: number,
  secret: string,
) {
  const values = properties.map((prop) => {
    let value: unknown = data;
    for (const key of prop.split(".")) {
      if (
        ["__proto__", "prototype", "constructor"].includes(key) ||
        typeof value !== "object" ||
        value === null ||
        !Object.hasOwn(value, key)
      )
        throw new AppError(401, "Firma inválida.");
      value = (value as Record<string, unknown>)[key];
    }
    if (typeof value !== "string" && typeof value !== "number")
      throw new AppError(401, "Firma inválida.");
    return String(value);
  });
  return createHash("sha256")
    .update(values.join("") + timestamp + secret)
    .digest("hex");
}
export function verifyEvent(
  input: unknown,
  secret: string,
  environment: "sandbox" | "production",
) {
  const e = eventSchema.parse(input);
  if (e.environment !== (environment === "production" ? "prod" : "test"))
    throw new AppError(401, "Ambiente del evento incorrecto.");
  if (e.timestamp > Date.now() / 1000 + 300)
    throw new AppError(401, "Fecha del evento incorrecta.");
  for (const p of [
    "transaction.id",
    "transaction.status",
    "transaction.amount_in_cents",
  ])
    if (!e.signature.properties.includes(p))
      throw new AppError(401, "Firma incompleta.");
  const calculated = eventChecksum(
    e.data,
    e.signature.properties,
    e.timestamp,
    secret,
  );
  if (
    !timingSafeEqual(
      Buffer.from(calculated, "hex"),
      Buffer.from(e.signature.checksum, "hex"),
    )
  )
    throw new AppError(401, "Firma de evento inválida.");
  return e;
}
export function paymentEnvironment() {
  return process.env.WOMPI_ENV === "production" ? "production" : "sandbox";
}
export function paymentBlockReason(config?: StoreConfig) {
  if (process.env.CHECKOUT_ENABLED !== "true")
    return "Las compras aún no están habilitadas.";
  if (!process.env.FIREBASE_PROJECT_ID)
    return "Firebase está pendiente de configuración.";
  if ((process.env.ORDER_TOKEN_SECRET || "").length < 32)
    return "Falta la configuración segura de pedidos.";
  const prod = paymentEnvironment() === "production",
    prefix = prod ? "prod" : "test";
  if (
    !process.env.WOMPI_PUBLIC_KEY?.startsWith(`pub_${prefix}_`) ||
    !process.env.WOMPI_PRIVATE_KEY?.startsWith(`prv_${prefix}_`) ||
    !process.env.WOMPI_INTEGRITY_SECRET?.startsWith(`${prefix}_integrity_`) ||
    !process.env.WOMPI_EVENTS_SECRET?.startsWith(`${prefix}_events_`)
  )
    return "Wompi está pendiente de configuración en el ambiente seleccionado.";
  if (
    prod &&
    (process.env.LIVE_PAYMENTS_APPROVED !== "true" ||
      process.env.CATALOG_MODE !== "production" ||
      !config?.legalReviewed ||
      !config?.taxesConfirmed ||
      !config?.pricesIncludeTax ||
      !config?.supportReady ||
      !config?.seller.name ||
      !config?.seller.address ||
      !config?.seller.email ||
      !config?.seller.taxId)
  )
    return "Producción requiere autorización, datos del vendedor y configuración operativa completa.";
  return null;
}
export interface PaymentProvider {
  checkout(order: Order): { url: string; fields: Record<string, string> };
  lookup(id: string): Promise<ProviderTransaction>;
}
export const wompi: PaymentProvider = {
  checkout(order) {
    const expires = new Date(order.expiresAt).toISOString();
    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return {
      url: "https://checkout.wompi.co/p/",
      fields: {
        "public-key": process.env.WOMPI_PUBLIC_KEY!,
        currency: "COP",
        "amount-in-cents": String(order.quote.total * 100),
        reference: order.reference,
        "signature:integrity": integrity(
          order.reference,
          order.quote.total * 100,
          expires,
          process.env.WOMPI_INTEGRITY_SECRET!,
        ),
        "expiration-time": expires,
        "redirect-url": `${site}/pago?pedido=${order.id}`,
      },
    };
  },
  async lookup(id) {
    if (!/^[a-zA-Z0-9_-]{1,150}$/.test(id))
      throw new AppError(400, "Identificador de pago inválido.");
    if (!process.env.WOMPI_PRIVATE_KEY)
      throw new AppError(
        503,
        "La conciliación requiere la clave privada de Wompi.",
      );
    const host =
      paymentEnvironment() === "production"
        ? "production.wompi.co"
        : "sandbox.wompi.co";
    const res = await fetch(
      `https://${host}/v1/transactions/${encodeURIComponent(id)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok)
      throw new AppError(
        502,
        "No se pudo consultar el pago. No intentes pagar de nuevo hasta verificar su estado.",
      );
    return transactionSchema.parse((await res.json()).data);
  },
};
