import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  eventChecksum,
  verifyEvent,
  integrity,
  paymentBlockReason,
} from "../src/lib/payments";
const secret = "test_events_example",
  timestamp = Math.floor(Date.now() / 1000);
const data = {
  transaction: {
    id: "t-1",
    status: "APPROVED",
    amount_in_cents: 10280000,
    currency: "COP",
    reference: "ref",
  },
};
const properties = [
  "transaction.id",
  "transaction.status",
  "transaction.amount_in_cents",
];
const event = () => ({
  event: "transaction.updated",
  environment: "test",
  timestamp,
  data,
  signature: {
    properties,
    checksum: eventChecksum(data, properties, timestamp, secret),
  },
});
test("integridad Wompi incluye referencia, centavos, COP, expiración y secreto en orden", () => {
  const expiry = "2026-09-25T12:00:00.000Z";
  assert.equal(
    integrity("ref", 10280000, expiry, "secret"),
    createHash("sha256")
      .update("ref10280000COP" + expiry + "secret")
      .digest("hex"),
  );
});
test("evento válido y propiedades dinámicas firmadas se aceptan", () => {
  assert.equal(
    verifyEvent(event(), secret, "sandbox").event,
    "transaction.updated",
  );
  const extra = [...properties, "transaction.currency"];
  assert.ok(
    verifyEvent(
      {
        ...event(),
        signature: {
          properties: extra,
          checksum: eventChecksum(data, extra, timestamp, secret),
        },
      },
      secret,
      "sandbox",
    ),
  );
});
test("monto manipulado, firma falsa y ambiente mezclado se rechazan", () => {
  assert.throws(() =>
    verifyEvent(
      {
        ...event(),
        data: { transaction: { ...data.transaction, amount_in_cents: 1 } },
      },
      secret,
      "sandbox",
    ),
  );
  assert.throws(() =>
    verifyEvent(
      { ...event(), signature: { properties, checksum: "0".repeat(64) } },
      secret,
      "sandbox",
    ),
  );
  assert.throws(() => verifyEvent(event(), secret, "production"));
});
test("firmas incompletas y rutas peligrosas se rechazan", () => {
  assert.throws(() =>
    verifyEvent(
      {
        ...event(),
        signature: {
          properties: ["transaction.id"],
          checksum: eventChecksum(data, ["transaction.id"], timestamp, secret),
        },
      },
      secret,
      "sandbox",
    ),
  );
  assert.throws(() => eventChecksum(data, ["__proto__.id"], timestamp, secret));
});
test("sin habilitación explícita el checkout está cerrado", () => {
  const before = process.env.CHECKOUT_ENABLED;
  process.env.CHECKOUT_ENABLED = "false";
  assert.match(paymentBlockReason() || "", /no están habilitadas/);
  if (before === undefined) delete process.env.CHECKOUT_ENABLED;
  else process.env.CHECKOUT_ENABLED = before;
});
