import { notFound } from "next/navigation";
import Link from "next/link";
import { policies } from "@/lib/policies";
import { col, firebaseConfigured } from "@/lib/firebase-admin";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return { title: policies[(await params).slug]?.title || "Política" };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!policies[slug]) notFound();
  const stored = firebaseConfigured()
    ? (await col("policies").doc(slug).get()).data()
    : null;
  const p = stored || {
    ...policies[slug],
    version: "borrador-1",
    reviewed: false,
  };
  return (
    <article className="narrow section prose">
      <div className="eyebrow">Información del negocio · {p.version}</div>
      <h1>{p.title}</h1>
      {!p.reviewed && (
        <p className="notice">
          Borrador pendiente de completar y revisar. No constituye una política
          comercial definitiva.
        </p>
      )}
      <div className="policy-content">
        {String(p.content)
          .split("\n\n")
          .map((text, i) => (
            <p key={i}>{text}</p>
          ))}
      </div>
      {policies[slug].source && (
        <p className="small">
          Referencia oficial para revisión:{" "}
          <a
            className="inline-link"
            href={policies[slug].source}
            target="_blank"
            rel="noopener noreferrer"
          >
            {slug === "terminos" || slug === "reversion"
              ? "Estatuto del Consumidor"
              : "Superintendencia de Industria y Comercio"}
          </a>
          .
        </p>
      )}
      <nav className="policy-links">
        {Object.entries(policies).map(([id, policy]) => (
          <Link key={id} href={"/politicas/" + id}>
            {policy.title}
          </Link>
        ))}
      </nav>
    </article>
  );
}
