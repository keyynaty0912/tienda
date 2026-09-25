"use client";
import { useEffect, useState, useRef } from "react";
import { Product, StoreConfig, Order, Coupon } from "@/lib/schema";
import { useStore } from "./store";
import { cop, date, statusLabels } from "@/lib/format";
import { Plus, Save, Upload, Download } from "lucide-react";
type Resource =
  | "products"
  | "orders"
  | "settings"
  | "coupons"
  | "policies"
  | "support"
  | "audit";
type RecordData = Record<string, unknown>;
async function save(resource: Resource, data: unknown) {
  const r = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resource, data }),
  });
  if (!r.ok) throw new Error((await r.json()).error);
}
export function Admin({ role }: { role: string }) {
  const { config: initial, demo } = useStore();
  const allowed =
    role === "admin"
      ? [
          "products",
          "orders",
          "settings",
          "coupons",
          "policies",
          "support",
          "audit",
        ]
      : role === "catalog"
        ? ["products", "coupons"]
        : role === "fulfillment"
          ? ["orders"]
          : ["orders", "support"];
  const [tab, setTab] = useState<Resource>(allowed[0] as Resource),
    [records, setRecords] = useState<RecordData[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0),
    [product, setProduct] = useState<Product | null>(null),
    [config, setConfig] = useState(initial);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    fetch("/api/admin?resource=" + tab)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (active) {
          setRecords(d);
          if (tab === "settings" && d[0]) setConfig(d[0]);
        }
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [tab, revision]);
  const reload = () => setRevision((v) => v + 1);
  async function perform(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const labels: Record<Resource, string> = {
    products: "Productos",
    orders: "Pedidos",
    settings: "Negocio y envíos",
    coupons: "Cupones",
    policies: "Políticas",
    support: "Posventa",
    audit: "Registro de cambios",
  };
  return (
    <div className="container section">
      <div className="section-head">
        <div>
          <div className="eyebrow">
            {demo ? "Administración · Demostración" : "Administración"}
          </div>
          <h1>Key & Naty</h1>
        </div>
        <span className="small">Rol: {role}</span>
      </div>
      <nav className="category-tabs" aria-label="Administración">
        {allowed.map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t as Resource);
              setProduct(null);
            }}
          >
            {labels[t as Resource]}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {busy && <p role="status">Procesando…</p>}
      {tab === "products" && (
        <>
          <div className="admin-toolbar">
            <button
              className="btn"
              onClick={() =>
                setProduct({
                  id: "prenda-" + Date.now(),
                  name: "Nueva prenda",
                  reference: "",
                  category: "Unisex",
                  age: "",
                  occasion: "Día a día",
                  price: 1000,
                  description: "",
                  images: [
                    {
                      src: "/assets/dress.webp",
                      alt: "Imagen pendiente de reemplazar",
                    },
                  ],
                  variants: [
                    {
                      id: "variante-" + Date.now(),
                      sku: "SKU-" + Date.now(),
                      size: "2",
                      color: "Marfil",
                      hex: "#e9dfd2",
                      stock: 0,
                      reserved: 0,
                    },
                  ],
                  measurements: [],
                  composition: "",
                  care: "",
                  active: false,
                  featured: false,
                  demo,
                  createdAt: 0,
                  updatedAt: 0,
                })
              }
            >
              <Plus />
              Nueva prenda
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(records, null, 2)], {
                    type: "application/json",
                  }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "catalogo-key-naty.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download />
              Exportar
            </button>
            <button
              className="btn secondary"
              onClick={() => file.current?.click()}
            >
              <Upload />
              Importar catálogo
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                perform(async () => {
                  if (f.size > 2000000) throw new Error("Archivo máximo 2 MB.");
                  const list = JSON.parse(await f.text());
                  if (!Array.isArray(list) || list.length > 100)
                    throw new Error("Máximo 100 productos por archivo.");
                  const { productSchema } = await import("@/lib/schema");
                  const valid = list.map((v) => productSchema.parse(v));
                  for (const p of valid) await save("products", p);
                });
              }}
            />
          </div>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Prenda</th>
                  <th>Precio</th>
                  <th>Disponibilidad</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {(records as unknown as Product[]).map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      <small className="muted"> {p.reference}</small>
                    </td>
                    <td>{cop(p.price)}</td>
                    <td>
                      {p.variants.reduce((a, v) => a + v.stock - v.reserved, 0)}
                      {p.variants.some((v) => v.stock - v.reserved <= 2) && (
                        <small className="error-text"> · Inventario bajo</small>
                      )}
                    </td>
                    <td>{p.active ? "Publicada" : "Borrador"}</td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => setProduct(p)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {product && (
            <ProductEditor
              value={product}
              close={() => setProduct(null)}
              submit={(p) =>
                perform(async () => {
                  await save("products", p);
                  setProduct(null);
                })
              }
            />
          )}
        </>
      )}
      {tab === "settings" && (
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            perform(() => save("settings", config));
          }}
        >
          <h2>Datos del vendedor</h2>
          <div className="form-grid">
            {(
              Object.keys(config.seller) as Array<keyof StoreConfig["seller"]>
            ).map((k) => (
              <label className="field" key={k}>
                {
                  {
                    name: "Razón social o nombre",
                    taxId: "Identificación tributaria",
                    address: "Dirección",
                    email: "Correo de atención",
                    phone: "Teléfono",
                    whatsapp: "WhatsApp (número internacional)",
                  }[k]
                }
                <input
                  value={config.seller[k]}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      seller: { ...config.seller, [k]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <h2>Contenido de inicio</h2>
          <label className="field">
            Titular
            <input
              value={config.hero.title}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hero: { ...config.hero, title: e.target.value },
                })
              }
            />
          </label>
          <label className="field">
            Descripción
            <input
              value={config.hero.subtitle}
              onChange={(e) =>
                setConfig({
                  ...config,
                  hero: { ...config.hero, subtitle: e.target.value },
                })
              }
            />
          </label>
          <h2>Cobertura y envío</h2>
          {config.shipping.map((s, i) => (
            <div className="shipping-editor" key={i}>
              {(["department", "city", "price", "eta"] as const).map((k, n) => (
                <label className="field" key={k}>
                  {
                    [
                      "Departamento",
                      "Municipio",
                      "Tarifa COP",
                      "Plazo informado",
                    ][n]
                  }
                  <input
                    type={k === "price" ? "number" : "text"}
                    min={0}
                    value={s[k]}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        shipping: config.shipping.map((v, j) =>
                          j === i
                            ? {
                                ...v,
                                [k]:
                                  k === "price"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              }
                            : v,
                        ),
                      })
                    }
                  />
                </label>
              ))}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={s.active}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      shipping: config.shipping.map((v, j) =>
                        j === i ? { ...v, active: e.target.checked } : v,
                      ),
                    })
                  }
                />
                Habilitado
              </label>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    shipping: config.shipping.filter((_, j) => i !== j),
                  })
                }
              >
                Eliminar
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              setConfig({
                ...config,
                shipping: [
                  ...config.shipping,
                  {
                    department: "",
                    city: "",
                    price: 0,
                    eta: "",
                    active: false,
                  },
                ],
              })
            }
          >
            Añadir destino
          </button>
          <h2>Revisión operativa</h2>
          <p>
            Marca solo verificaciones realizadas. Estas opciones no activan
            cobros por sí solas.
          </p>
          {(
            [
              "legalReviewed",
              "taxesConfirmed",
              "pricesIncludeTax",
              "supportReady",
            ] as const
          ).map((k, i) => (
            <label className="check-label" key={k}>
              <input
                type="checkbox"
                checked={config[k]}
                onChange={(e) =>
                  setConfig({ ...config, [k]: e.target.checked })
                }
              />
              {
                [
                  "Políticas revisadas y datos legales completos",
                  "Tratamiento tributario validado",
                  "Precios incluyen los impuestos aplicables",
                  "Atención al cliente configurada",
                ][i]
              }
            </label>
          ))}
          <label className="field">
            Versión de términos aceptada en checkout
            <input
              value={config.termsVersion}
              onChange={(e) =>
                setConfig({ ...config, termsVersion: e.target.value })
              }
            />
          </label>
          <button className="btn" disabled={busy}>
            <Save />
            Guardar configuración
          </button>
        </form>
      )}
      {tab === "orders" && (
        <>
          <div className="notice">
            Ventas confirmadas:{" "}
            {cop(
              (records as unknown as Order[])
                .filter((o) => o.paymentStatus === "APPROVED")
                .reduce(
                  (a, o) => a + o.quote.total - (o.refund?.amount || 0),
                  0,
                ),
            )}{" "}
            · Se descuentan reembolsos registrados. Hasta 300 pedidos en esta
            vista.
          </div>
          {(records as unknown as Order[]).map((o) => (
            <OrderEditor
              key={o.id}
              order={o}
              role={role}
              submit={(d) => perform(() => save("orders", d))}
            />
          ))}
        </>
      )}
      {tab === "coupons" && (
        <CouponEditor
          records={records as unknown as Coupon[]}
          submit={(d) => perform(() => save("coupons", d))}
        />
      )}{" "}
      {tab === "policies" && (
        <PolicyEditor
          records={records}
          submit={(d) => perform(() => save("policies", d))}
        />
      )}{" "}
      {tab === "support" &&
        records.map((r) => (
          <details key={String(r.id)} className="detail-accordion">
            <summary>
              {String(r.type)} · {String(r.orderId)} · {String(r.status)}
            </summary>
            <p>{String(r.reason)}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const d = Object.fromEntries(new FormData(e.currentTarget));
                perform(() => save("support", { ...d, id: r.id }));
              }}
            >
              <label className="field">
                Respuesta y resolución
                <textarea
                  name="response"
                  defaultValue={String(r.response || "")}
                  required
                />
              </label>
              <label className="field">
                Estado
                <select name="status" defaultValue={String(r.status)}>
                  <option value="open">Abierta</option>
                  <option value="in_review">En revisión</option>
                  <option value="resolved">Resuelta</option>
                </select>
              </label>
              <button className="btn">Guardar respuesta</button>
            </form>
          </details>
        ))}
      {tab === "audit" && (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Actor</th>
                <th>Acción</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={String(r.id)}>
                  <td>{date(Number(r.at))}</td>
                  <td>{String(r.actor)}</td>
                  <td>{String(r.action)}</td>
                  <td>{String(r.target || "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!records.length &&
        !busy &&
        !["settings", "coupons", "policies"].includes(tab) && (
          <p className="notice">No hay registros en esta sección.</p>
        )}
    </div>
  );
}
function ProductEditor({
  value,
  close,
  submit,
}: {
  value: Product;
  close: () => void;
  submit: (p: Product) => void;
}) {
  const [p, setP] = useState(value),
    [error, setError] = useState("");
  useEffect(() => setP(value), [value]);
  return (
    <section className="admin-editor">
      <div className="section-head">
        <h2>Editar prenda</h2>
        <button className="text-link" onClick={close}>
          Cerrar editor
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(p);
        }}
      >
        <div className="form-grid">
          {(["name", "reference", "age", "occasion", "price"] as const).map(
            (k, i) => (
              <label className="field" key={k}>
                {
                  [
                    "Nombre",
                    "Referencia",
                    "Edad orientativa",
                    "Ocasión",
                    "Precio COP",
                  ][i]
                }
                <input
                  required
                  value={p[k]}
                  type={k === "price" ? "number" : "text"}
                  min={k === "price" ? 1 : undefined}
                  onChange={(e) =>
                    setP({
                      ...p,
                      [k]:
                        k === "price" ? Number(e.target.value) : e.target.value,
                    })
                  }
                />
              </label>
            ),
          )}
          <label className="field">
            Categoría
            <select
              value={p.category}
              onChange={(e) =>
                setP({ ...p, category: e.target.value as Product["category"] })
              }
            >
              {["Bebé", "Niña", "Niño", "Unisex"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        {(["description", "composition", "care"] as const).map((k, i) => (
          <label className="field" key={k}>
            {
              ["Descripción", "Composición confirmada", "Cuidados confirmados"][
                i
              ]
            }
            <textarea
              value={p[k]}
              onChange={(e) => setP({ ...p, [k]: e.target.value })}
            />
          </label>
        ))}
        <h3>Fotografías</h3>
        {p.images.map((im, i) => (
          <div className="form-grid" key={i}>
            <label className="field">
              URL
              <input
                required
                value={im.src}
                onChange={(e) =>
                  setP({
                    ...p,
                    images: p.images.map((v, j) =>
                      j === i ? { ...v, src: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label className="field">
              Texto alternativo
              <input
                required
                value={im.alt}
                onChange={(e) =>
                  setP({
                    ...p,
                    images: p.images.map((v, j) =>
                      j === i ? { ...v, alt: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label className="field">
              Color (opcional)
              <input
                value={im.color || ""}
                onChange={(e) =>
                  setP({
                    ...p,
                    images: p.images.map((v, j) =>
                      j === i ? { ...v, color: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setP({ ...p, images: p.images.filter((_, j) => j !== i) })
              }
            >
              Eliminar imagen
            </button>
          </div>
        ))}
        <label className="field">
          Subir foto (máximo 5 MB)
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const form = new FormData();
                form.set("file", f);
                const r = await fetch("/api/admin/upload", {
                  method: "POST",
                  body: form,
                });
                const d = await r.json();
                if (!r.ok) throw new Error(d.error);
                setP({
                  ...p,
                  images: [...p.images, { src: d.url, alt: p.name }],
                });
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </label>
        <h3>Variantes e inventario</h3>
        {p.variants.map((v, i) => (
          <div className="variant-editor" key={v.id}>
            {(["sku", "size", "color", "hex", "stock"] as const).map((k, n) => (
              <label className="field" key={k}>
                {["SKU", "Talla", "Color", "Código de color", "Stock total"][n]}
                <input
                  required
                  type={
                    k === "stock" ? "number" : k === "hex" ? "color" : "text"
                  }
                  min={k === "stock" ? v.reserved : undefined}
                  value={v[k]}
                  onChange={(e) =>
                    setP({
                      ...p,
                      variants: p.variants.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              [k]:
                                k === "stock"
                                  ? Number(e.target.value)
                                  : e.target.value,
                            }
                          : x,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <span className="small">{v.reserved} reservadas</span>
            <button
              type="button"
              disabled={v.reserved > 0}
              onClick={() =>
                setP({ ...p, variants: p.variants.filter((_, j) => j !== i) })
              }
            >
              Eliminar
            </button>
          </div>
        ))}
        <button
          className="btn secondary"
          type="button"
          onClick={() =>
            setP({
              ...p,
              variants: [
                ...p.variants,
                {
                  id: crypto.randomUUID(),
                  sku: "",
                  size: "",
                  color: "",
                  hex: "#e9dfd2",
                  stock: 0,
                  reserved: 0,
                },
              ],
            })
          }
        >
          Añadir variante
        </button>
        <h3>Medidas en centímetros</h3>
        {p.measurements.map((m, i) => (
          <div className="form-grid" key={i}>
            {(["size", "length", "chest"] as const).map((k, n) => (
              <label className="field" key={k}>
                {["Talla", "Largo cm", "Pecho cm"][n]}
                <input
                  value={m[k]}
                  type={k === "size" ? "text" : "number"}
                  min={1}
                  onChange={(e) =>
                    setP({
                      ...p,
                      measurements: p.measurements.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              [k]:
                                k === "size"
                                  ? e.target.value
                                  : Number(e.target.value),
                            }
                          : x,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              type="button"
              onClick={() =>
                setP({
                  ...p,
                  measurements: p.measurements.filter((_, j) => j !== i),
                })
              }
            >
              Eliminar medida
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn secondary"
          onClick={() =>
            setP({
              ...p,
              measurements: [
                ...p.measurements,
                { size: "", length: 1, chest: 1 },
              ],
            })
          }
        >
          Añadir medidas
        </button>
        {(["active", "featured", "demo"] as const).map((k, i) => (
          <label className="check-label" key={k}>
            <input
              type="checkbox"
              checked={p[k]}
              onChange={(e) => setP({ ...p, [k]: e.target.checked })}
            />
            {
              [
                "Publicar en catálogo",
                "Destacar en inicio",
                "Producto de demostración",
              ][i]
            }
          </label>
        ))}
        {error && <p className="error-text">{error}</p>}
        <button className="btn">
          <Save />
          Guardar prenda
        </button>
      </form>
    </section>
  );
}
function OrderEditor({
  order: o,
  role,
  submit,
}: {
  order: Order;
  role: string;
  submit: (d: unknown) => void;
}) {
  return (
    <details className="detail-accordion">
      <summary>
        {o.reference} · {statusLabels[o.orderStatus]} · {cop(o.quote.total)}
      </summary>
      <p>
        Pago: {statusLabels[o.paymentStatus]} · {o.environment}
      </p>
      <p>
        {o.customer.name} · {o.customer.email}
        <br />
        {o.customer.address}, {o.customer.city}
      </p>
      {o.issue && <p className="notice error">{o.issue}</p>}
      {o.quote.lines.map((l) => (
        <p key={l.variantId}>
          {l.name} · {l.color} · {l.size} × {l.quantity}
        </p>
      ))}
      {["admin", "fulfillment"].includes(role) && (
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(e.currentTarget));
            submit({ id: o.id, ...d });
          }}
        >
          <label className="field">
            Avanzar estado
            <select name="status">
              <option value="preparing">En preparación</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
            </select>
          </label>
          <label className="field">
            Transportadora
            <input name="carrier" defaultValue={o.tracking?.carrier || ""} />
          </label>
          <label className="field">
            Número de guía
            <input name="tracking" defaultValue={o.tracking?.number || ""} />
          </label>
          <button className="btn" disabled={o.paymentStatus !== "APPROVED"}>
            Guardar avance
          </button>
        </form>
      )}
      {role === "admin" && (
        <details>
          <summary>Registrar un reembolso ya realizado</summary>
          <p>
            No ejecuta un reembolso en Wompi. Registra el comprobante del pago
            original con trazabilidad.
          </p>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              const d = Object.fromEntries(new FormData(e.currentTarget));
              submit({ id: o.id, refund: { ...d, amount: Number(d.amount) } });
            }}
          >
            <label className="field">
              Importe COP
              <input
                name="amount"
                type="number"
                min={1}
                max={o.quote.total}
                required
              />
            </label>
            <label className="field">
              Referencia del reembolso
              <input name="reference" required />
            </label>
            <label className="field full">
              Motivo
              <textarea name="reason" required minLength={10} />
            </label>
            <button className="btn" disabled={!!o.refund}>
              Registrar comprobante
            </button>
          </form>
        </details>
      )}
    </details>
  );
}
function CouponEditor({
  records,
  submit,
}: {
  records: Coupon[];
  submit: (d: unknown) => void;
}) {
  return (
    <>
      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descuento</th>
              <th>Uso</th>
              <th>Vigencia</th>
            </tr>
          </thead>
          <tbody>
            {records.map((c) => (
              <tr key={c.code}>
                <td>{c.code}</td>
                <td>{c.percent}%</td>
                <td>
                  {c.used} usados / {c.reserved} reservados / {c.limit} máximo
                </td>
                <td>{date(c.endsAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Crear o actualizar cupón</h2>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          submit({
            code: String(d.code).toUpperCase(),
            percent: Number(d.percent),
            minimum: Number(d.minimum),
            limit: Number(d.limit),
            startsAt: new Date(String(d.startsAt)).getTime(),
            endsAt: new Date(String(d.endsAt)).getTime(),
            active: d.active === "on",
            used: 0,
            reserved: 0,
          });
        }}
      >
        {[
          ["code", "Código", "text"],
          ["percent", "Descuento %", "number"],
          ["minimum", "Compra mínima COP", "number"],
          ["limit", "Máximo de usos", "number"],
          ["startsAt", "Desde (hora local del equipo)", "datetime-local"],
          ["endsAt", "Hasta (hora local del equipo)", "datetime-local"],
        ].map(([k, label, t]) => (
          <label className="field" key={k}>
            {label}
            <input required name={k} type={t} />
          </label>
        ))}
        <label className="check-label">
          <input type="checkbox" name="active" />
          Activo
        </label>
        <button className="btn">Guardar cupón</button>
      </form>
    </>
  );
}
function PolicyEditor({
  records,
  submit,
}: {
  records: RecordData[];
  submit: (d: unknown) => void;
}) {
  const [id, setId] = useState("envios");
  const p = records.find((p) => p.id === id);
  return (
    <form
      key={id + String(p?.updatedAt)}
      className="admin-form"
      onSubmit={(e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget));
        submit({ ...d, id, reviewed: d.reviewed === "on" });
      }}
    >
      <label className="field">
        Política
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {[
            "envios",
            "cambios",
            "garantias",
            "retracto",
            "reversion",
            "devoluciones",
            "privacidad",
            "terminos",
          ].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Título
        <input name="title" required defaultValue={String(p?.title || "")} />
      </label>
      <label className="field">
        Versión
        <input
          name="version"
          required
          defaultValue={String(p?.version || "1")}
        />
      </label>
      <label className="field">
        Contenido (texto, sin HTML)
        <textarea
          name="content"
          rows={16}
          minLength={20}
          required
          defaultValue={String(p?.content || "")}
        />
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          name="reviewed"
          defaultChecked={Boolean(p?.reviewed)}
        />
        Revisada para este negocio
      </label>
      <button className="btn">Guardar versión</button>
    </form>
  );
}
