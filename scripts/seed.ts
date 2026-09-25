import { db, col, isDemo } from "../src/lib/firebase-admin";
import { demoProducts, demoConfig } from "../src/lib/demo";
import { createHash } from "node:crypto";
async function main() {
  if (!isDemo())
    throw new Error("La carga demostrativa se bloquea en producción.");
  const result = await db().runTransaction(async (tx) => {
    const settings = col("settings").doc("store");
    const docs = await tx.getAll(
      settings,
      ...demoProducts.map((p) => col("products").doc(p.id)),
    );
    if (docs.some((d) => d.exists))
      throw new Error(
        "Ya hay datos. No se sobrescriben productos ni configuración existentes.",
      );
    tx.create(settings, demoConfig);
    for (const p of demoProducts) {
      tx.create(col("products").doc(p.id), p);
      for (const v of p.variants)
        tx.set(
          col("skus").doc(createHash("sha256").update(v.sku).digest("hex")),
          { productId: p.id },
        );
    }
    tx.set(col("schema").doc("version"), { version: 1, at: Date.now() });
    return demoProducts.length;
  });
  console.log(
    `Catálogo demostrativo creado: ${result} prendas. No se habilitaron pagos.`,
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
