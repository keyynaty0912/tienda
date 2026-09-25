import "server-only";
import { col, firebaseConfigured, isDemo } from "./firebase-admin";
import { demoProducts, demoConfig, defaultConfig } from "./demo";
import {
  productSchema,
  configSchema,
  type Product,
  type StoreConfig,
} from "./schema";
export async function getProducts(): Promise<Product[]> {
  if (!firebaseConfigured()) return isDemo() ? demoProducts : [];
  const snap = await col("products")
    .where("active", "==", true)
    .limit(500)
    .get();
  return snap.docs
    .map((d) => productSchema.parse({ ...d.data(), id: d.id }))
    .filter((p) => isDemo() || !p.demo);
}
export async function getProduct(id: string) {
  return (await getProducts()).find((p) => p.id === id) || null;
}
export async function getConfig(): Promise<StoreConfig> {
  if (!firebaseConfigured()) return isDemo() ? demoConfig : defaultConfig;
  const doc = await col("settings").doc("store").get();
  return doc.exists ? configSchema.parse(doc.data()) : defaultConfig;
}
