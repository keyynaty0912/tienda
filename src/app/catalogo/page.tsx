import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
export const metadata = {
  title: "La colección",
  alternates: { canonical: "/catalogo" },
};
export default function Page() {
  return (
    <Suspense
      fallback={<p className="container section">Cargando colección…</p>}
    >
      <Catalog />
    </Suspense>
  );
}
