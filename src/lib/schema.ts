import { z } from "zod";
export const idSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const variantSchema = z.object({
  id: idSchema,
  sku: z.string().min(1).max(80),
  size: z.string().min(1).max(20),
  color: z.string().min(1).max(40),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  stock: z.number().int().min(0).max(100000),
  reserved: z.number().int().min(0).default(0),
});
export const productSchema = z
  .object({
    id: idSchema,
    name: z.string().min(2).max(120),
    reference: z.string().max(80),
    description: z.string().max(3000),
    category: z.enum(["Bebé", "Niña", "Niño", "Unisex"]),
    age: z.string().max(40),
    occasion: z.string().max(50),
    price: z.number().int().positive().max(100000000),
    images: z
      .array(
        z.object({
          src: z
            .string()
            .max(1000)
            .refine(
              (s) =>
                s.startsWith("/assets/") ||
                /^https:\/\/(firebasestorage\.googleapis\.com|storage\.googleapis\.com)\//.test(
                  s,
                ),
              "Usa imágenes locales o de Firebase Storage",
            ),
          alt: z.string().min(3).max(250),
          color: z.string().max(40).optional(),
        }),
      )
      .min(1)
      .max(12),
    variants: z.array(variantSchema).min(1).max(60),
    measurements: z
      .array(
        z.object({
          size: z.string().max(20),
          length: z.number().positive(),
          chest: z.number().positive(),
        }),
      )
      .max(60)
      .default([]),
    composition: z.string().max(1000).default(""),
    care: z.string().max(1000).default(""),
    active: z.boolean().default(false),
    featured: z.boolean().default(false),
    demo: z.boolean().default(true),
    createdAt: z.number().default(0),
    updatedAt: z.number().default(0),
  })
  .refine(
    (p) => new Set(p.variants.map((v) => v.id)).size === p.variants.length,
    "Variantes duplicadas",
  )
  .refine(
    (p) => p.variants.every((v) => v.reserved <= v.stock),
    "Stock menor a reservas",
  );
export type Product = z.infer<typeof productSchema>;
export type Variant = Product["variants"][number];
export const lineSchema = z.object({
  productId: idSchema,
  variantId: idSchema,
  quantity: z.number().int().min(1).max(10),
});
export type CartLine = z.infer<typeof lineSchema>;
export const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+?57[\s-]?)?3(?:[\s-]?\d){9}$/,
      "Ingresa un celular colombiano válido",
    ),
  department: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  address: z.string().trim().min(5).max(200),
  complement: z.string().max(200).default(""),
});
export const quoteSchema = z.object({
  lines: z.array(lineSchema).min(1).max(30),
  department: z.string().max(80),
  city: z.string().max(80),
  coupon: z.string().trim().toUpperCase().max(40).default(""),
});
export const checkoutSchema = quoteSchema.extend({
  customer: customerSchema,
  idempotencyKey: z.uuid(),
  acceptTerms: z.literal(true),
  marketing: z.boolean().default(false),
  expectedTotal: z.number().int().positive(),
});
export type Checkout = z.infer<typeof checkoutSchema>;
export const couponSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_-]{3,40}$/),
  percent: z.number().int().min(1).max(100),
  minimum: z.number().int().min(0),
  startsAt: z.number().int(),
  endsAt: z.number().int(),
  limit: z.number().int().min(1),
  used: z.number().int().min(0).default(0),
  reserved: z.number().int().min(0).default(0),
  active: z.boolean(),
});
export type Coupon = z.infer<typeof couponSchema>;
export const shippingSchema = z.object({
  department: z.string().min(2),
  city: z.string().min(2),
  price: z.number().int().min(0),
  eta: z.string().max(120),
  active: z.boolean(),
});
export const configSchema = z.object({
  seller: z.object({
    name: z.string().max(160),
    taxId: z.string().max(60),
    address: z.string().max(200),
    email: z.string().max(200),
    phone: z.string().max(40),
    whatsapp: z.string().max(30),
  }),
  hero: z.object({ title: z.string().max(160), subtitle: z.string().max(200) }),
  shipping: z.array(shippingSchema).max(2000),
  termsVersion: z.string().max(40),
  legalReviewed: z.boolean(),
  taxesConfirmed: z.boolean(),
  pricesIncludeTax: z.boolean(),
  supportReady: z.boolean(),
  updatedAt: z.number().default(0),
});
export type StoreConfig = z.infer<typeof configSchema>;
export type PricedLine = CartLine & {
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  sku: string;
};
export type Quote = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: "COP";
  coupon: string;
  eta: string;
};
export type PaymentStatus =
  "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "VOIDED";
export type Order = {
  id: string;
  reference: string;
  fingerprint: string;
  guestHash: string;
  tokenHash: string;
  customerUid: string | null;
  customer: Checkout["customer"];
  quote: Quote;
  orderStatus:
    | "pending_payment"
    | "paid"
    | "preparing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "manual_review";
  paymentStatus: PaymentStatus;
  shipmentStatus: "unfulfilled" | "shipped" | "delivered";
  reservationState: "active" | "consumed" | "released";
  createdAt: number;
  expiresAt: number;
  updatedAt: number;
  transactionId: string | null;
  paymentUpdatedAt: number;
  environment: "sandbox" | "production";
  termsVersion: string;
  marketing: boolean;
  issue: string | null;
  tracking?: { carrier: string; number: string };
  refund?: {
    status: string;
    amount: number;
    reference: string;
    reason: string;
  };
};
