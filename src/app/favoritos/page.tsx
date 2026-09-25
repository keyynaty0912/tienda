import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
export const metadata = {
  title: "Tus favoritos",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense>
      <Catalog favoritesOnly />
    </Suspense>
  );
}
