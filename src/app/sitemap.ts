import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { isDemo } from "@/lib/firebase-admin";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isDemo()) return [];
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const products = await getProducts();
  return [
    { url: site },
    { url: site + "/catalogo" },
    ...(products.some((p) => p.occasion === "Halloween")
      ? [{ url: site + "/halloween" }]
      : []),
    ...products
      .filter((p) => !p.demo)
      .map((p) => ({
        url: site + "/producto/" + p.id,
        lastModified: new Date(p.updatedAt),
      })),
  ];
}
