import { createHash } from "node:crypto";
import { db, col, isDemo } from "../src/lib/firebase-admin";
import { halloweenProducts } from "../src/lib/halloween";
import { productSchema } from "../src/lib/schema";

async function main() {
  if (!isDemo())
    throw new Error(
      "Esta colección ilustrativa solo se carga en modo demostración.",
    );
  const products = halloweenProducts.map((p) => productSchema.parse(p));
  const count = await db().runTransaction(async (tx) => {
    const refs = products.map((p) => col("products").doc(p.id));
    const snapshots = await tx.getAll(...refs);
    const pending = products.filter((_, index) => !snapshots[index].exists);
    const skuRefs = pending.flatMap((p) =>
      p.variants.map((v) =>
        col("skus").doc(createHash("sha256").update(v.sku).digest("hex")),
      ),
    );
    if (
      skuRefs.length &&
      (await tx.getAll(...skuRefs)).some((doc) => doc.exists)
    )
      throw new Error("Un SKU ya existe; no se modifica el inventario.");
    for (const p of pending) {
      tx.create(col("products").doc(p.id), p);
      for (const v of p.variants)
        tx.create(
          col("skus").doc(createHash("sha256").update(v.sku).digest("hex")),
          { productId: p.id },
        );
    }
    return pending.length;
  });
  console.log(
    `Halloween: ${count} productos de demostración añadidos. Los datos existentes se conservaron.`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
