import { AppError } from "./errors";
import type {
  CartLine,
  Product,
  Coupon,
  StoreConfig,
  Quote,
  PaymentStatus,
} from "./schema";
export function mergeLines(lines: CartLine[]) {
  const result = new Map<string, CartLine>();
  for (const l of lines) {
    const key = `${l.productId}:${l.variantId}`,
      old = result.get(key);
    result.set(key, { ...l, quantity: l.quantity + (old?.quantity || 0) });
  }
  if ([...result.values()].some((l) => l.quantity > 10))
    throw new AppError(400, "Máximo diez unidades por variante.");
  return [...result.values()];
}
export function priceCart(
  lines: CartLine[],
  products: Product[],
  config: StoreConfig,
  destination: { department: string; city: string },
  coupon: Coupon | null = null,
  now = Date.now(),
): Quote {
  const priced = mergeLines(lines).map((l) => {
    const p = products.find((p) => p.id === l.productId && p.active),
      v = p?.variants.find((v) => v.id === l.variantId);
    if (!p || !v)
      throw new AppError(409, "Una prenda o variante ya no está disponible.");
    if (v.stock - v.reserved < l.quantity)
      throw new AppError(
        409,
        `Stock insuficiente: ${p.name}, talla ${v.size}.`,
        "OUT_OF_STOCK",
      );
    return {
      ...l,
      name: p.name,
      price: p.price,
      size: v.size,
      color: v.color,
      image: p.images[0].src,
      sku: v.sku,
    };
  });
  const subtotal = priced.reduce((a, l) => a + l.price * l.quantity, 0);
  const shipping = config.shipping.find(
    (s) =>
      s.active &&
      s.department === destination.department &&
      s.city === destination.city,
  );
  if (!shipping)
    throw new AppError(
      422,
      "No hay cobertura configurada para este destino.",
      "NO_COVERAGE",
    );
  let discount = 0;
  if (coupon) {
    if (
      !coupon.active ||
      now < coupon.startsAt ||
      now >= coupon.endsAt ||
      coupon.used + coupon.reserved >= coupon.limit ||
      subtotal < coupon.minimum
    )
      throw new AppError(
        422,
        "El cupón no es válido, venció o alcanzó su límite.",
        "INVALID_COUPON",
      );
    discount = Math.floor((subtotal * coupon.percent) / 100);
  }
  const total = subtotal - discount + shipping.price;
  if (!Number.isSafeInteger(total * 100) || total <= 0)
    throw new AppError(400, "Importe inválido.");
  return {
    lines: priced,
    subtotal,
    discount,
    shipping: shipping.price,
    total,
    currency: "COP",
    coupon: coupon?.code || "",
    eta: shipping.eta,
  };
}
export function shouldApplyPayment(
  current: PaymentStatus,
  incoming: PaymentStatus,
  oldTime: number,
  newTime: number,
) {
  if (current === "APPROVED") return false;
  if (incoming === "APPROVED") return true;
  if (newTime < oldTime) return false;
  if (current !== "PENDING" && incoming === "PENDING") return false;
  return incoming !== current;
}
export function stockAfterPayment(
  stock: number,
  reserved: number,
  qty: number,
  active: boolean,
) {
  if (active)
    return {
      stock: stock - qty,
      reserved: reserved - qty,
      shortage: stock < qty || reserved < qty,
    };
  if (stock - reserved < qty) return { stock, reserved, shortage: true };
  return { stock: stock - qty, reserved, shortage: false };
}
