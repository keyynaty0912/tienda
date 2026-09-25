import type { MetadataRoute } from "next";
import { isDemo } from "@/lib/firebase-admin";
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: isDemo() ? undefined : "/",
        disallow: isDemo()
          ? "/"
          : [
              "/admin",
              "/api",
              "/checkout",
              "/carrito",
              "/cuenta",
              "/pedido",
              "/pago",
              "/favoritos",
              "/buscar",
            ],
      },
    ],
    sitemap: isDemo() ? undefined : site + "/sitemap.xml",
  };
}
