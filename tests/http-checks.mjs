import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
async function request(route, body, origin = base) {
  const res = await fetch(base + route, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
const line = {
  productId: "vestido-alma",
  variantId: "vestido-alma-2",
  quantity: 1,
};
const q = await request("/api/quote", {
  lines: [line],
  department: "Antioquia",
  city: "Medellín",
});
assert.equal(q.status, 200);
assert.equal(q.body.total, 102800);
assert.equal(
  (
    await request("/api/quote", {
      lines: [line],
      department: "Otro",
      city: "Otro",
    })
  ).status,
  422,
);
assert.equal(
  (
    await request("/api/quote", {
      lines: [line],
      department: "Antioquia",
      city: "Medellín",
      coupon: "INVALIDO",
    })
  ).status,
  422,
);
assert.equal(
  (
    await request("/api/quote", {
      lines: [{ ...line, quantity: 999 }],
      department: "Antioquia",
      city: "Medellín",
    })
  ).status,
  400,
);
assert.equal(
  (
    await request(
      "/api/quote",
      { lines: [line], department: "Antioquia", city: "Medellín" },
      "https://otro.example",
    )
  ).status,
  403,
);
assert.equal((await fetch(base + "/api/admin?resource=orders")).status, 403);
assert.equal(
  (await request("/api/admin", { resource: "products", data: {} })).status,
  403,
);
assert.equal((await request("/api/checkout", {})).status, 503);
assert.equal((await request("/api/payments/webhook", {})).status, 503);
assert.equal((await request("/api/maintenance", {})).status, 401);
assert.equal((await fetch(base + "/api/account")).status, 401);
assert.equal((await (await fetch(base + "/api/session")).json()).user, null);
assert.match(await (await fetch(base + "/robots.txt")).text(), /Disallow: \//);
console.log(
  "13 verificaciones HTTP correctas: cotización, cobertura, cupón, cantidad, origen, roles, bloqueo de pagos, mantenimiento, cuenta, sesión y robots.",
);
