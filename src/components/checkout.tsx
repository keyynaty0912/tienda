"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  LockKeyhole,
  Trash2,
  Check,
  Clock,
  TriangleAlert,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useStore } from "./store";
import { cop, statusLabels, date } from "@/lib/format";
import type { Quote, Order } from "@/lib/schema";
async function post(url: string, data: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const value = await r.json();
  if (!r.ok)
    throw new Error(value.error || "No se pudo completar la operación.");
  return value;
}
export function Cart() {
  const s = useStore();
  if (!s.ready)
    return <p className="container section">Recuperando tu bolsa…</p>;
  if (!s.cart.length)
    return (
      <div className="container section empty">
        <h1>Tu bolsa está vacía.</h1>
        <p>Encuentra una prenda para su próxima historia.</p>
        <Link className="btn" href="/catalogo">
          Explorar colección
        </Link>
      </div>
    );
  let subtotal = 0;
  return (
    <div className="container section">
      <div className="section-head">
        <h1>Tu bolsa</h1>
        <Link className="text-link" href="/catalogo">
          Seguir explorando
        </Link>
      </div>
      <div className="checkout-layout">
        <section>
          {s.cart.map((l) => {
            const p = s.products.find((p) => p.id === l.productId),
              v = p?.variants.find((v) => v.id === l.variantId);
            if (!p || !v)
              return (
                <div className="notice" key={l.variantId}>
                  Esta variante ya no está disponible.{" "}
                  <button onClick={() => s.remove(l.productId, l.variantId)}>
                    Eliminar
                  </button>
                </div>
              );
            subtotal += p.price * l.quantity;
            const stock = v.stock - v.reserved;
            return (
              <article className="cart-line" key={l.variantId}>
                <Link href={"/producto/" + p.id}>
                  <Image
                    src={p.images[0].src}
                    alt={p.name}
                    width={110}
                    height={145}
                  />
                </Link>
                <div>
                  <h3>{p.name}</h3>
                  <p className="small muted">
                    {v.color} · Talla {v.size}
                  </p>
                  <p>{cop(p.price)}</p>
                  {l.quantity > stock && (
                    <p className="error-text">
                      Disponibilidad actual: {stock}. Ajusta la cantidad.
                    </p>
                  )}
                  <div className="cart-actions">
                    <label className="field">
                      Cantidad
                      <select
                        aria-label={"Cantidad de " + p.name}
                        value={l.quantity}
                        onChange={(e) =>
                          s.quantity(
                            l.productId,
                            l.variantId,
                            Number(e.target.value),
                          )
                        }
                      >
                        {Array.from(
                          { length: Math.max(l.quantity, Math.min(10, stock)) },
                          (_, i) => i + 1,
                        ).map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <Link className="text-link" href={"/producto/" + p.id}>
                      Cambiar talla
                    </Link>
                    <button
                      className="icon-btn"
                      aria-label={"Eliminar " + p.name}
                      onClick={() => s.remove(l.productId, l.variantId)}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
                <strong>{cop(p.price * l.quantity)}</strong>
              </article>
            );
          })}
        </section>
        <aside className="summary">
          <h2>Resumen</h2>
          <div className="cost-row">
            <span>Subtotal</span>
            <strong>{cop(subtotal)}</strong>
          </div>
          <p className="summary-note">
            En el siguiente paso podrás consultar cobertura, envío y cupones
            antes de confirmar.
          </p>
          <Link className="btn full-button" href="/checkout">
            Continuar <ArrowRight />
          </Link>
          <p className="summary-note">
            Precios e inventario se revalidan en el servidor.{" "}
            {s.demo ? "Catálogo demostrativo." : ""}
          </p>
        </aside>
      </div>
    </div>
  );
}
function Summary({ quote }: { quote: Quote | null }) {
  const { cart, products, config } = useStore();
  const subtotal = cart.reduce(
    (n, l) =>
      n + (products.find((p) => p.id === l.productId)?.price || 0) * l.quantity,
    0,
  );
  return (
    <aside className="summary">
      <h2>Tu bolsa</h2>
      {cart.map((l) => {
        const p = products.find((p) => p.id === l.productId),
          v = p?.variants.find((v) => v.id === l.variantId);
        return p && v ? (
          <div className="summary-product" key={l.variantId}>
            <Image src={p.images[0].src} alt={p.name} width={74} height={95} />
            <div>
              <p>{p.name}</p>
              <small>
                {v.color} · Talla {v.size} · Cant. {l.quantity}
              </small>
              <p className="price">{cop(p.price * l.quantity)}</p>
            </div>
          </div>
        ) : null;
      })}
      <div className="costs">
        <div className="cost-row">
          <span>Subtotal</span>
          <span>{cop(quote?.subtotal ?? subtotal)}</span>
        </div>
        <div className="cost-row">
          <span>Descuento</span>
          <span>{cop(quote?.discount || 0)}</span>
        </div>
        <div className="cost-row">
          <span>Envío</span>
          <span>{quote ? cop(quote.shipping) : "Por calcular"}</span>
        </div>
        <p className="small muted">
          {config.taxesConfirmed
            ? "Impuestos aplicables incluidos en los precios."
            : "Tratamiento tributario pendiente de confirmar."}
        </p>
      </div>
      <div className="total">
        <span>{quote ? "Total" : "Total parcial"}</span>
        <strong>{cop(quote?.total ?? subtotal)}</strong>
      </div>
      <p className="summary-note">
        {quote?.eta || "Selecciona tu destino antes de continuar al pago."}
      </p>
      <div className="payment-lock">
        <LockKeyhole />
        No guardamos números de tarjeta.
      </div>
    </aside>
  );
}
type Customer = {
  name: string;
  email: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  complement: string;
};
type PaymentResult = {
  orderId: string;
  token: string;
  expiresAt: number;
  payment: { url: string; fields: Record<string, string> };
};
export function Checkout() {
  const s = useStore();
  const [step, setStep] = useState(1),
    [customer, setCustomer] = useState<Customer>({
      name: "",
      email: "",
      phone: "",
      department: "",
      city: "",
      address: "",
      complement: "",
    }),
    [coupon, setCoupon] = useState(""),
    [quote, setQuote] = useState<Quote | null>(null),
    [terms, setTerms] = useState(false),
    [marketing, setMarketing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [payment, setPayment] = useState<PaymentResult | null>(null);
  const requestKey = useRef("");
  useEffect(() => {
    let key = sessionStorage.getItem("kn-checkout-key");
    if (!key) {
      key = crypto.randomUUID();
      sessionStorage.setItem("kn-checkout-key", key);
    }
    requestKey.current = key;
  }, []);
  const set = (k: keyof Customer, v: string) => {
    setCustomer((c) => ({
      ...c,
      [k]: v,
      ...(k === "department" ? { city: "" } : {}),
    }));
    if (["department", "city"].includes(k)) setQuote(null);
  };
  const departments = [
    ...new Set(
      s.config.shipping.filter((d) => d.active).map((d) => d.department),
    ),
  ];
  async function quoteCart() {
    setBusy(true);
    setError("");
    try {
      const q = await post("/api/quote", {
        lines: s.cart,
        department: customer.department,
        city: customer.city,
        coupon,
      });
      setQuote(q);
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (!quote || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await post("/api/checkout", {
        lines: s.cart,
        department: customer.department,
        city: customer.city,
        coupon,
        customer,
        idempotencyKey: requestKey.current,
        acceptTerms: terms,
        marketing,
        expectedTotal: quote.total,
      });
      setPayment(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!s.ready) return <p className="container section">Cargando tu bolsa…</p>;
  if (!s.cart.length) return <Cart />;
  return (
    <div className="checkout-wrap">
      <Link className="text-link" href="/carrito">
        ← Volver a la bolsa
      </Link>
      <div className="checkout-title" style={{ marginTop: 25 }}>
        <h1>Un paso más cerca.</h1>
        <p>Compra como invitado · Sin crear una cuenta</p>
      </div>
      <nav className="steps" aria-label="Checkout">
        {["Datos", "Entrega", "Pago", "Revisión"].map((n, i) => (
          <button
            key={n}
            className={"step " + (step === i + 1 ? "active" : "")}
            aria-current={step === i + 1 ? "step" : undefined}
            disabled={busy || !!payment || i + 1 > step}
            onClick={() => setStep(i + 1)}
          >
            <span className="step-num">{i + 1}</span>
            {n}
          </button>
        ))}
      </nav>
      <div className="checkout-layout">
        <section className="checkout-form">
          {payment ? (
            <>
              <h2>Tu pedido está reservado.</h2>
              <p>
                El pago aún no está confirmado. La reserva vence a las{" "}
                {new Date(payment.expiresAt).toLocaleTimeString("es-CO")}.
              </p>
              <p>
                Pedido: <strong>{payment.orderId}</strong>
              </p>
              <details>
                <summary>Código seguro de consulta</summary>
                <code className="token">{payment.token}</code>
                <p>
                  Guárdalo para consultar el pedido desde otro dispositivo. No
                  lo compartas.
                </p>
              </details>
              <form method="GET" action={payment.payment.url}>
                {Object.entries(payment.payment.fields).map(([n, v]) => (
                  <input type="hidden" key={n} name={n} value={v} />
                ))}
                <button className="btn full-button">
                  Continuar al checkout oficial de Wompi <ArrowRight />
                </button>
              </form>
              <Link
                href={"/pedido?id=" + payment.orderId}
                className="text-link"
              >
                Consultar pedido
              </Link>
            </>
          ) : (
            <>
              {step === 1 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}
                >
                  <h2>Tus datos</h2>
                  <p>Usaremos estos datos para atender tu pedido.</p>
                  {s.demo && (
                    <p className="demo-inline">
                      Estás en demostración. Usa datos ficticios.
                    </p>
                  )}
                  <div className="form-grid">
                    {(
                      [
                        [
                          "name",
                          "Nombre y apellido",
                          "text",
                          "Ej. Andrea Pérez",
                        ],
                        [
                          "email",
                          "Correo electrónico",
                          "email",
                          "nombre@ejemplo.com",
                        ],
                        ["phone", "Celular", "tel", "300 123 4567"],
                      ] as const
                    ).map(([key, label, type, placeholder]) => (
                      <label className="field full" key={key}>
                        {label}
                        <input
                          required
                          type={type}
                          autoComplete={
                            key === "name"
                              ? "name"
                              : key === "email"
                                ? "email"
                                : "tel"
                          }
                          placeholder={placeholder}
                          value={customer[key]}
                          onChange={(e) => set(key, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="checkout-actions">
                    <Link href="/carrito">Volver a la bolsa</Link>
                    <button className="btn">
                      Continuar a entrega <ArrowRight />
                    </button>
                  </div>
                </form>
              )}
              {step === 2 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    quoteCart();
                  }}
                >
                  <h2>¿A dónde lo enviamos?</h2>
                  <p>Consulta cobertura y costo antes de pagar.</p>
                  <div className="form-grid">
                    <label className="field">
                      Departamento
                      <select
                        required
                        value={customer.department}
                        onChange={(e) => set("department", e.target.value)}
                      >
                        <option value="">Selecciona</option>
                        {departments.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                        <option>Otro destino</option>
                      </select>
                    </label>
                    <label className="field">
                      Municipio
                      <select
                        required
                        value={customer.city}
                        onChange={(e) => set("city", e.target.value)}
                      >
                        <option value="">Selecciona</option>
                        {s.config.shipping
                          .filter(
                            (d) =>
                              d.active && d.department === customer.department,
                          )
                          .map((d) => (
                            <option key={d.city}>{d.city}</option>
                          ))}
                        {customer.department === "Otro destino" && (
                          <option>Sin cobertura</option>
                        )}
                      </select>
                    </label>
                    <label className="field full">
                      Dirección
                      <input
                        required
                        minLength={5}
                        autoComplete="street-address"
                        placeholder="Calle, carrera, número…"
                        value={customer.address}
                        onChange={(e) => set("address", e.target.value)}
                      />
                    </label>
                    <label className="field full">
                      Complemento (opcional)
                      <input
                        value={customer.complement}
                        onChange={(e) => set("complement", e.target.value)}
                        placeholder="Apartamento, torre, indicaciones"
                      />
                    </label>
                    <label className="field full">
                      Cupón (opcional)
                      <input
                        value={coupon}
                        onChange={(e) => {
                          setCoupon(e.target.value.toUpperCase());
                          setQuote(null);
                        }}
                        placeholder="Código de descuento"
                      />
                    </label>
                  </div>
                  {!departments.length && (
                    <p className="notice">
                      La cobertura de envíos está pendiente de configurar.
                    </p>
                  )}
                  <div className="checkout-actions">
                    <button type="button" onClick={() => setStep(1)}>
                      Volver a datos
                    </button>
                    <button className="btn" disabled={busy}>
                      {busy ? "Calculando…" : "Consultar total"} <ArrowRight />
                    </button>
                  </div>
                </form>
              )}
              {step === 3 && (
                <>
                  <h2>Forma de pago</h2>
                  <p>
                    El checkout oficial mostrará los métodos habilitados para la
                    cuenta comercial.
                  </p>
                  <div className="payment-option">
                    <LockKeyhole />
                    <div>
                      <strong>Wompi Colombia</strong>
                      <small>
                        {s.checkoutDisabled
                          ? "Pendiente de habilitar"
                          : s.demo
                            ? "Ambiente de pruebas"
                            : "Checkout alojado"}
                      </small>
                    </div>
                  </div>
                  {s.checkoutDisabled && (
                    <p className="notice">{s.checkoutDisabled}</p>
                  )}
                  <div className="checkout-actions">
                    <button onClick={() => setStep(2)}>Volver a entrega</button>
                    <button className="btn" onClick={() => setStep(4)}>
                      Revisar compra <ArrowRight />
                    </button>
                  </div>
                </>
              )}
              {step === 4 && (
                <>
                  <h2>Revisa tu compra</h2>
                  <div className="review-card">
                    <button onClick={() => setStep(1)}>Editar</button>
                    <strong>Datos</strong>
                    {customer.name}
                    <br />
                    {customer.email}
                    <br />
                    {customer.phone}
                  </div>
                  <div className="review-card">
                    <button onClick={() => setStep(2)}>Editar</button>
                    <strong>Entrega</strong>
                    {customer.address} {customer.complement}
                    <br />
                    {customer.city}, {customer.department}
                  </div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                    />
                    <span>
                      Acepto los{" "}
                      <Link
                        className="inline-link"
                        href="/politicas/terminos"
                        target="_blank"
                      >
                        términos de compra
                      </Link>{" "}
                      y he leído la{" "}
                      <Link
                        className="inline-link"
                        href="/politicas/privacidad"
                        target="_blank"
                      >
                        información de tratamiento de datos
                      </Link>
                      .
                    </span>
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                    />
                    Quiero recibir novedades y promociones. Opcional.
                  </label>
                  {s.checkoutDisabled && (
                    <p className="notice">
                      {s.checkoutDisabled} No se creará un pedido.
                    </p>
                  )}
                  <button
                    className="btn full-button"
                    disabled={!terms || busy || !!s.checkoutDisabled || !quote}
                    onClick={confirm}
                  >
                    {busy
                      ? "Reservando…"
                      : s.checkoutDisabled
                        ? "Pago deshabilitado"
                        : `Confirmar ${cop(quote?.total || 0)} e ir a Wompi`}
                  </button>
                  <p className="summary-note">
                    El servidor verifica precios, cupones e inventario antes de
                    reservar. Si hay una interrupción, reintenta con esta misma
                    página.
                  </p>
                </>
              )}
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
        </section>
        <Summary quote={quote} />
      </div>
    </div>
  );
}
type SafeOrder = Pick<
  Order,
  | "id"
  | "reference"
  | "orderStatus"
  | "paymentStatus"
  | "shipmentStatus"
  | "quote"
  | "createdAt"
  | "tracking"
  | "issue"
  | "refund"
  | "environment"
>;
export function OrderLookup({
  paymentReturn = false,
}: {
  paymentReturn?: boolean;
}) {
  const params = useSearchParams(),
    s = useStore();
  const [id, setId] = useState(params.get("pedido") || params.get("id") || ""),
    [token, setToken] = useState(""),
    [order, setOrder] = useState<SafeOrder | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function lookup() {
    setBusy(true);
    setError("");
    try {
      const data = await post("/api/orders/lookup", {
        id,
        token,
        ...(paymentReturn && params.get("id")
          ? { transactionId: params.get("id") }
          : {}),
      });
      setOrder(data);
      if (data.paymentStatus === "APPROVED") {
        s.clear();
        sessionStorage.removeItem("kn-checkout-key");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="narrow section">
      <h1>{paymentReturn ? "Estado de tu pago" : "Consulta tu pedido"}</h1>
      <p>
        Consulta con tu cuenta, desde el dispositivo de compra o con tu código
        seguro.
      </p>
      {paymentReturn && (
        <p className="notice">
          Volver de Wompi no confirma el pago. Consulta para verificarlo en el
          servidor.
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup();
        }}
        className="form-grid"
      >
        <label className="field full">
          Número de pedido
          <input required value={id} onChange={(e) => setId(e.target.value)} />
        </label>
        <label className="field full">
          Código seguro (si usas otro dispositivo)
          <input
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <button className="btn" disabled={busy || !s.firebaseReady}>
          {busy ? "Consultando…" : "Consultar estado"}
        </button>
      </form>
      {!s.firebaseReady && (
        <p className="notice">
          La consulta de pedidos requiere conectar Firebase. No hay pedidos
          reales en esta demostración.
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {order && (
        <section className="order-result">
          <div className="payment-state">
            {order.paymentStatus === "APPROVED" ? (
              <Check />
            ) : order.paymentStatus === "PENDING" ? (
              <Clock />
            ) : (
              <TriangleAlert />
            )}
            <h2>Pago {statusLabels[order.paymentStatus].toLowerCase()}</h2>
            <p>
              Pedido {statusLabels[order.orderStatus].toLowerCase()} ·{" "}
              {date(order.createdAt)}
            </p>
            {order.issue && <p>{order.issue}</p>}
          </div>
          <p className="notice">
            {order.environment === "sandbox"
              ? "Pedido del ambiente de pruebas. "
              : ""}
            Este resumen no es una factura electrónica validada por la DIAN.
          </p>
          {order.quote.lines.map((l) => (
            <div className="cost-row" key={l.variantId}>
              <span>
                {l.name} · {l.size} × {l.quantity}
              </span>
              <span>{cop(l.price * l.quantity)}</span>
            </div>
          ))}
          <div className="total">
            <span>Total</span>
            <strong>{cop(order.quote.total)}</strong>
          </div>
          {order.tracking && (
            <p>
              Transportadora: {order.tracking.carrier}
              <br />
              Guía: {order.tracking.number}
            </p>
          )}
          <SupportRequest orderId={order.id} token={token} />
        </section>
      )}
    </div>
  );
}
function SupportRequest({
  orderId,
  token,
}: {
  orderId: string;
  token: string;
}) {
  const [type, setType] = useState("cambio"),
    [reason, setReason] = useState(""),
    [result, setResult] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <details className="detail-accordion">
      <summary>Solicitar ayuda con este pedido</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await post("/api/support", { orderId, token, type, reason });
            setResult(
              "Solicitud registrada. Consulta los canales y horarios de atención del negocio.",
            );
          } catch (e) {
            setResult((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          Tipo de solicitud
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {[
              "cambio",
              "garantia",
              "retracto",
              "reversion",
              "devolucion",
              "privacidad",
              "ayuda",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Motivo
          <textarea
            required
            minLength={10}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button className="btn" disabled={busy}>
          Registrar solicitud
        </button>
        <p role="status">{result}</p>
      </form>
    </details>
  );
}
