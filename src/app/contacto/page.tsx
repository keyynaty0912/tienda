import Link from "next/link";
import { getConfig } from "@/lib/catalog";
export const metadata = { title: "Contacto y ayuda" };
export default async function Page() {
  const { seller: s } = await getConfig();
  return (
    <article className="narrow section prose">
      <div className="eyebrow">Estamos cerca</div>
      <h1>¿Cómo podemos ayudarte?</h1>
      <p>Consulta un pedido con tu cuenta o con el código seguro de compra.</p>
      <Link className="btn" href="/pedido">
        Consultar pedido
      </Link>
      <h2>Canales de atención</h2>
      {s.email ? (
        <p>
          <a href={"mailto:" + s.email}>{s.email}</a>
        </p>
      ) : (
        <p>Correo y horarios de atención pendientes de configurar.</p>
      )}
      {s.phone && (
        <p>
          <a href={"tel:" + s.phone}>{s.phone}</a>
        </p>
      )}
      {/^\d{10,15}$/.test(s.whatsapp) && (
        <a
          className="btn secondary"
          href={"https://wa.me/" + s.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          Escribir por WhatsApp
        </a>
      )}
      <h2>Preguntas frecuentes</h2>
      {[
        [
          "¿Necesito una cuenta?",
          "No. El checkout permite comprar como invitado. La cuenta es opcional para consultar un historial y guardar direcciones.",
        ],
        [
          "¿Cómo elijo la talla?",
          "Consulta las medidas en centímetros del producto y compáralas con una prenda que le quede bien. La edad es una orientación.",
        ],
        [
          "¿Cuánto cuesta el envío?",
          "El costo depende del destino y de la cobertura configurada. Se informa antes de confirmar el pedido.",
        ],
        [
          "¿Cómo solicito un cambio o garantía?",
          "Entra a la consulta segura del pedido y selecciona el motivo de la solicitud. Las políticas distinguen cambio comercial, garantía, retracto y reversión.",
        ],
        [
          "¿Cómo sé si se aprobó el pago?",
          "La tienda verifica el estado en el servidor. Volver de la página de pagos no equivale por sí solo a una aprobación.",
        ],
      ].map(([q, a]) => (
        <details className="detail-accordion" key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <p>
        Autoridad de protección al consumidor:{" "}
        <a
          className="inline-link"
          href="https://www.sic.gov.co"
          target="_blank"
          rel="noopener noreferrer"
        >
          Superintendencia de Industria y Comercio
        </a>
        .
      </p>
    </article>
  );
}
