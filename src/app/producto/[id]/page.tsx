import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { ProductDetail } from "@/components/product";
import { isDemo } from "@/lib/firebase-admin";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    p = await getProduct(id);
  return {
    title: p?.name || "Prenda no encontrada",
    description: p?.description,
    alternates: { canonical: "/producto/" + id },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    p = await getProduct(id);
  if (!p) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.reference,
    image: p.images.map(
      (i) =>
        new URL(
          i.src,
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        ).href,
    ),
    description: p.description,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "COP",
      availability: p.variants.some((v) => v.stock > v.reserved)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
  return (
    <>
      {!p.demo && !isDemo() && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ProductDetail key={p.id} product={p} />
    </>
  );
}
