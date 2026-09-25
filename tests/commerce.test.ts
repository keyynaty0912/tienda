import test from "node:test";
import assert from "node:assert/strict";
import {
  priceCart,
  mergeLines,
  shouldApplyPayment,
  stockAfterPayment,
} from "../src/lib/commerce";
import { demoProducts, demoConfig } from "../src/lib/demo";
import { checkoutSchema, type Coupon } from "../src/lib/schema";
const p = demoProducts[0],
  line = { productId: p.id, variantId: p.variants[0].id, quantity: 1 },
  destination = { department: "Antioquia", city: "Medellín" };
test("precios e importes enteros calculados con el catálogo del servidor", () => {
  const q = priceCart([line], demoProducts, demoConfig, destination);
  assert.equal(q.subtotal, 89900);
  assert.equal(q.shipping, 12900);
  assert.equal(q.total, 102800);
  assert.ok(Number.isSafeInteger(q.total * 100));
});
test("rechaza variante agotada y cantidad mayor al disponible", () => {
  assert.throws(
    () =>
      priceCart(
        [{ ...line, variantId: p.variants[2].id }],
        demoProducts,
        demoConfig,
        destination,
      ),
    /Stock insuficiente/,
  );
  assert.throws(
    () =>
      priceCart(
        [{ ...line, quantity: 4 }],
        demoProducts,
        demoConfig,
        destination,
      ),
    /Stock insuficiente/,
  );
});
test("agrega líneas repetidas antes de validar stock, impide eludir límites", () => {
  assert.deepEqual(mergeLines([line, line]), [{ ...line, quantity: 2 }]);
  assert.throws(
    () =>
      priceCart(
        [line, line, line, line],
        demoProducts,
        demoConfig,
        destination,
      ),
    /Stock insuficiente/,
  );
});
test("reserva de última unidad deja disponibilidad cero para la siguiente compra", () => {
  const product = structuredClone(p);
  product.variants[0].stock = 1;
  product.variants[0].reserved = 0;
  priceCart([line], [product], demoConfig, destination);
  product.variants[0].reserved = 1;
  assert.throws(
    () => priceCart([line], [product], demoConfig, destination),
    /Stock insuficiente/,
  );
});
test("destino sin tarifa no permite finalizar", () =>
  assert.throws(
    () =>
      priceCart([line], demoProducts, demoConfig, {
        department: "Otro",
        city: "Otro",
      }),
    /cobertura/,
  ));
const coupon: Coupon = {
  code: "PRUEBA",
  percent: 10,
  minimum: 0,
  startsAt: 100,
  endsAt: 1000,
  limit: 2,
  used: 0,
  reserved: 0,
  active: true,
};
test("cupones válidos, vencidos y reservados cuentan en el límite", () => {
  assert.equal(
    priceCart([line], demoProducts, demoConfig, destination, coupon, 500)
      .discount,
    8990,
  );
  assert.throws(
    () =>
      priceCart([line], demoProducts, demoConfig, destination, coupon, 1000),
    /cupón/,
  );
  assert.throws(
    () =>
      priceCart(
        [line],
        demoProducts,
        demoConfig,
        destination,
        { ...coupon, reserved: 2 },
        500,
      ),
    /cupón/,
  );
});
test("eventos repetidos o fuera de orden no revierten una aprobación", () => {
  assert.equal(shouldApplyPayment("APPROVED", "APPROVED", 10, 20), false);
  assert.equal(shouldApplyPayment("APPROVED", "PENDING", 10, 20), false);
  assert.equal(shouldApplyPayment("DECLINED", "PENDING", 10, 20), false);
  assert.equal(shouldApplyPayment("PENDING", "DECLINED", 20, 10), false);
  assert.equal(shouldApplyPayment("DECLINED", "APPROVED", 20, 10), true);
});
test("pago tardío consume solo stock libre y detecta falta de stock", () => {
  assert.deepEqual(stockAfterPayment(3, 1, 1, false), {
    stock: 2,
    reserved: 1,
    shortage: false,
  });
  assert.deepEqual(stockAfterPayment(1, 1, 1, false), {
    stock: 1,
    reserved: 1,
    shortage: true,
  });
  assert.deepEqual(stockAfterPayment(3, 1, 1, true), {
    stock: 2,
    reserved: 0,
    shortage: false,
  });
});
test("checkout requiere consentimiento contractual, email y celular colombiano", () => {
  const body = {
    lines: [line],
    ...destination,
    coupon: "",
    customer: {
      name: "Andrea Pérez",
      email: "andrea@example.com",
      phone: "+57 300 123 4567",
      ...destination,
      address: "Calle 10 # 20-30",
      complement: "",
    },
    idempotencyKey: "2f611081-0b75-4d15-a716-d6d056c4aabc",
    acceptTerms: true,
    marketing: false,
    expectedTotal: 102800,
  };
  assert.ok(checkoutSchema.safeParse(body).success);
  assert.equal(
    checkoutSchema.safeParse({ ...body, acceptTerms: false }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({
      ...body,
      customer: { ...body.customer, phone: "123" },
    }).success,
    false,
  );
});
