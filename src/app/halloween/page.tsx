import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { HALLOWEEN } from "@/lib/halloween";

export const metadata = {
  title: "Halloween · Disfraces para niños y niñas",
  description:
    "Pequeños disfraces, grandes aventuras. Descubre dragones, astronautas, princesas y brujitas en Key & Naty.",
  alternates: { canonical: "/halloween" },
};

export default function Page() {
  return (
    <Suspense
      fallback={<p className="container section">Cargando Halloween…</p>}
    >
      <Catalog collection={HALLOWEEN} />
    </Suspense>
  );
}
