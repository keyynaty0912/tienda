import Link from "next/link";
export const metadata = { title: "Nuestro universo" };
export default function Page() {
  return (
    <article className="narrow section prose">
      <div className="eyebrow">Key & Naty · Boutique infantil</div>
      <h1>
        Pequeñas prendas.
        <br />
        Grandes historias.
      </h1>
      <p>
        Una primera salida, una tarde de juegos, un abrazo antes de dormir. Key
        & Naty nace como una propuesta de boutique infantil para acompañar esos
        momentos.
      </p>
      <p>
        El proyecto está en preparación. La historia del negocio, las personas
        que lo hacen posible y los detalles de sus prendas se completarán con
        información real antes de abrir ventas.
      </p>
      <Link href="/catalogo" className="btn">
        Explora la colección
      </Link>
    </article>
  );
}
