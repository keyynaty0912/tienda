import { redirect, notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const map: Record<string, string> = {
    bebe: "Bebé",
    nina: "Niña",
    nino: "Niño",
    unisex: "Unisex",
  };
  const { category } = await params;
  if (!map[category]) notFound();
  redirect("/catalogo?categoria=" + encodeURIComponent(map[category]));
}
