import type { Product } from "./schema";

export const HALLOWEEN = "Halloween";
const costumes = [
  {
    id: "disfraz-dragon-bosque",
    name: "Disfraz Dragón del bosque",
    category: "Niño",
    price: 119900,
    image: "halloween-dragon.webp",
    color: "Salvia",
    hex: "#78816b",
    description:
      "Un pequeño dragón para imaginar grandes aventuras. Enterizo con capucha, alas de tela y detalles suaves en tonos salvia.",
  },
  {
    id: "disfraz-astronauta-luna",
    name: "Disfraz Astronauta Luna",
    category: "Niño",
    price: 129900,
    image: "halloween-astronauta.webp",
    color: "Marfil",
    hex: "#e7ddcc",
    description:
      "Destino: la imaginación. Un traje espacial en marfil con detalles plateados y un pequeño planeta para explorar nuevas historias.",
  },
  {
    id: "disfraz-princesa-aurora",
    name: "Disfraz Princesa Aurora",
    category: "Niña",
    price: 139900,
    image: "halloween-princesa.webp",
    color: "Rosa empolvado",
    hex: "#c99395",
    description:
      "Para inventar su propio cuento. Vestido rosa empolvado con falda de tul, mangas cortas y una corona de tela.",
  },
  {
    id: "disfraz-brujita-estela",
    name: "Disfraz Brujita Estela",
    category: "Niña",
    price: 124900,
    image: "halloween-brujita.webp",
    color: "Ciruela",
    hex: "#6c495d",
    description:
      "Un poquito de magia en cada paso. Vestido ciruela con estrellas doradas, lazo terracota y sombrero a juego.",
  },
] as const;

export const halloweenProducts: Product[] = costumes.map((p, index) => ({
  id: p.id,
  name: p.name,
  reference: `KN-H26-00${index + 1}`,
  category: p.category,
  age: "2–6 años",
  occasion: HALLOWEEN,
  price: p.price,
  description: `${p.description} Diseño ilustrativo de Halloween 2026. Precio, tallas, accesorios y disponibilidad de demostración; pendientes de confirmar para la venta.`,
  images: [
    {
      src: `/assets/${p.image}`,
      alt: `${p.name} en ${p.color}; imagen ilustrativa generada con IA`,
      color: p.color,
    },
  ],
  variants: ["2", "4", "6"].map((size) => ({
    id: `${p.id}-${size}`,
    sku: `KN-H26-${index + 1}-${size}`,
    size,
    color: p.color,
    hex: p.hex,
    stock: 3,
    reserved: 0,
  })),
  measurements: [],
  composition: "",
  care: "",
  active: true,
  featured: false,
  demo: true,
  createdAt: Date.UTC(2026, 8, 26) + index,
  updatedAt: Date.UTC(2026, 8, 26) + index,
}));
