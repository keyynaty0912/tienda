import Link from "next/link";
export const metadata = { title: "Guía de tallas" };
export default function Page() {
  return (
    <article className="narrow section prose">
      <h1>Una talla que le acompañe.</h1>
      <p>
        Consulta la tabla de medidas de cada prenda. Las edades orientativas no
        sustituyen sus dimensiones reales.
      </p>
      <ol>
        <li>Elige una prenda similar que le quede bien.</li>
        <li>Colócala extendida, sin estirarla.</li>
        <li>Compara largo y contorno de pecho con la tabla específica.</li>
        <li>Si una medida no está confirmada, consulta antes de comprar.</li>
      </ol>
      <p className="notice">
        Las tablas del catálogo demostrativo son ficticias.
      </p>
      <Link className="btn" href="/catalogo">
        Buscar una prenda
      </Link>
    </article>
  );
}
