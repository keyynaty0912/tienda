"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Search, ShoppingBag, Package, X } from "lucide-react";
import type { Product } from "@/lib/schema";
import { cop } from "@/lib/format";
import { useStore } from "./store";
import { ProductCard } from "./catalog";
export function ProductDetail({ product: p }: { product: Product }) {
  const { products, add } = useStore();
  const [color, setColor] = useState(p.variants[0].color),
    [size, setSize] = useState(""),
    [quantity, setQuantity] = useState(1),
    [error, setError] = useState(""),
    [photo, setPhoto] = useState(0);
  const zoom = useRef<HTMLDialogElement>(null),
    guide = useRef<HTMLDialogElement>(null),
    sizePicker = useRef<HTMLDivElement>(null);
  const variant = p.variants.find((v) => v.color === color && v.size === size),
    stock = variant ? variant.stock - variant.reserved : 0;
  const images = p.images.filter((i) => !i.color || i.color === color),
    shown = images[photo] || p.images[0];
  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">Inicio</Link>
        <ChevronRight />
        <Link href="/catalogo">Colección</Link>
        <ChevronRight />
        <span>{p.name}</span>
      </nav>
      <div className="detail-layout">
        <div>
          <button
            className="main-product-photo"
            aria-label={"Ampliar " + p.name}
            onClick={() => zoom.current?.showModal()}
          >
            <Image
              src={shown.src}
              alt={shown.alt}
              fill
              priority
              sizes="(max-width:760px) 90vw, 50vw"
            />
            <span className="zoom-label">
              <Search />
              Ampliar
            </span>
          </button>
          <div className="thumbs">
            {images.map((img, i) => (
              <button
                key={img.src}
                aria-label={"Fotografía " + (i + 1)}
                aria-pressed={photo === i}
                onClick={() => setPhoto(i)}
              >
                <Image src={img.src} alt={img.alt} width={64} height={76} />
              </button>
            ))}
          </div>
          {p.demo && (
            <p className="small muted">
              Fotografía ilustrativa generada con IA.
            </p>
          )}
        </div>
        <section className="detail-info">
          <div className="eyebrow">
            {p.category} · {p.age}
          </div>
          <h1>{p.name}</h1>
          <p className="ref">Referencia {p.reference}</p>
          <p className="detail-price">{cop(p.price)}</p>
          <p className="detail-description">{p.description}</p>
          <p className="choice-label">Color: {color}</p>
          <div className="colors">
            {[...new Set(p.variants.map((v) => v.color))].map((c) => (
              <button
                className="color-btn"
                key={c}
                aria-label={c}
                aria-pressed={color === c}
                onClick={() => {
                  setColor(c);
                  setSize("");
                  setPhoto(0);
                  setQuantity(1);
                }}
              >
                <span
                  style={{
                    background: p.variants.find((v) => v.color === c)?.hex,
                  }}
                />
              </button>
            ))}
          </div>
          <div className="size-header">
            <p className="choice-label">Selecciona la talla</p>
            <button onClick={() => guide.current?.showModal()}>
              Guía de medidas en cm
            </button>
          </div>
          <div className="sizes" ref={sizePicker}>
            {p.variants
              .filter((v) => v.color === color)
              .map((v) => (
                <button
                  key={v.id}
                  className="size-btn"
                  disabled={v.stock <= v.reserved}
                  aria-label={`Talla ${v.size}${v.stock <= v.reserved ? ", agotada" : ""}`}
                  aria-pressed={size === v.size}
                  onClick={() => {
                    setSize(v.size);
                    setQuantity(1);
                    setError("");
                  }}
                >
                  {v.size}
                  {v.stock <= v.reserved ? " ×" : ""}
                </button>
              ))}
          </div>
          <p className="size-help">Las tallas marcadas con × están agotadas.</p>
          <p className="stock">
            {variant
              ? `${stock} unidades disponibles${p.demo ? " de ejemplo" : ""}`
              : "Elige una talla para ver la disponibilidad."}
          </p>
          <div className="buy-row">
            <div className="quantity">
              <button
                aria-label="Reducir cantidad"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <output>{quantity}</output>
              <button
                aria-label="Aumentar cantidad"
                disabled={!variant || quantity >= Math.min(10, stock)}
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
            <button
              className="btn"
              disabled={!p.variants.some((v) => v.stock > v.reserved)}
              onClick={() => {
                if (!variant) {
                  setError("Selecciona una talla disponible.");
                  return;
                }
                setError(
                  add({ productId: p.id, variantId: variant.id, quantity }) ||
                    "",
                );
              }}
            >
              Añadir a la bolsa <ShoppingBag />
            </button>
          </div>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <div className="delivery-note">
            <Package />
            <span>
              Envío según tu destino.
              <br />
              <Link className="text-link" href="/carrito">
                Consultar desde la bolsa
              </Link>
            </span>
          </div>
          <details className="detail-accordion">
            <summary>Composición y cuidados</summary>
            <p>
              {p.composition || "Composición pendiente de confirmar."}
              <br />
              {p.care || "Cuidados pendientes de confirmar."}
            </p>
          </details>
          <details className="detail-accordion">
            <summary>Cambios y garantías</summary>
            <p>
              <Link href="/politicas/cambios">Cambio por talla</Link> ·{" "}
              <Link href="/politicas/garantias">Garantía</Link> ·{" "}
              <Link href="/politicas/retracto">Retracto</Link>
            </p>
          </details>
          {p.demo && (
            <p className="demo-inline">
              Producto, precio, medidas y stock demostrativos.
            </p>
          )}
        </section>
      </div>
      <section className="section">
        <div className="section-head">
          <h2>También puede gustarte</h2>
          <Link href="/carrito" className="text-link">
            Ver mi bolsa
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter(
              (x) =>
                x.id !== p.id &&
                (x.category === p.category || x.category === "Unisex"),
            )
            .slice(0, 4)
            .map((x) => (
              <ProductCard product={x} key={x.id} />
            ))}
        </div>
      </section>
      <div className="mobile-buy" aria-label="Compra de la prenda">
        <div>
          <strong>{cop(p.price)}</strong>
          <small>
            {size ? `Talla ${size} · ${color}` : "Selecciona una talla"}
          </small>
        </div>
        <button
          className="btn"
          disabled={!p.variants.some((v) => v.stock > v.reserved)}
          onClick={() => {
            if (!variant) {
              sizePicker.current?.scrollIntoView({
                block: "center",
                behavior: "smooth",
              });
              sizePicker.current
                ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
                ?.focus({ preventScroll: true });
              return;
            }
            setError(
              add({ productId: p.id, variantId: variant.id, quantity }) || "",
            );
          }}
        >
          {variant ? "Añadir a la bolsa" : "Elegir talla"}
        </button>
      </div>
      <dialog ref={zoom}>
        <div className="dialog-head">
          <h2>{p.name}</h2>
          <button
            className="icon-btn"
            aria-label="Cerrar imagen"
            onClick={() => zoom.current?.close()}
          >
            <X />
          </button>
        </div>
        <Image
          src={shown.src}
          alt={shown.alt}
          width={800}
          height={1000}
          style={{ maxHeight: "65vh", objectFit: "contain" }}
        />
      </dialog>
      <dialog ref={guide}>
        <div className="dialog-head">
          <h2>Guía de medidas</h2>
          <button
            className="icon-btn"
            aria-label="Cerrar guía"
            onClick={() => guide.current?.close()}
          >
            <X />
          </button>
        </div>
        {p.demo && (
          <p className="notice">
            Medidas ficticias. No usar para una compra real.
          </p>
        )}
        {p.measurements.length ? (
          <table>
            <thead>
              <tr>
                <th>Talla</th>
                <th>Largo (cm)</th>
                <th>Pecho (cm)</th>
              </tr>
            </thead>
            <tbody>
              {p.measurements.map((m) => (
                <tr key={m.size}>
                  <td>{m.size}</td>
                  <td>{m.length}</td>
                  <td>{m.chest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Medidas pendientes de confirmar.</p>
        )}
        <p>
          Compara con una prenda que le quede bien. La edad es solo orientativa.
        </p>
      </dialog>
    </div>
  );
}
