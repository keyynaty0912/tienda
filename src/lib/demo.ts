import type { Product, StoreConfig } from "./schema";
import { halloweenProducts } from "./halloween";
const entries = [
  [
    "vestido-alma",
    "Vestido Alma",
    "Niña",
    89900,
    "dress.webp",
    "Marfil",
    "#e7ddcc",
  ],
  [
    "camisa-rio",
    "Camisa Río",
    "Niño",
    79900,
    "shirt.webp",
    "Salvia",
    "#78816b",
  ],
  [
    "peto-sol",
    "Peto Sol",
    "Bebé",
    74900,
    "overalls.webp",
    "Terracota",
    "#b65f42",
  ],
  [
    "cardigan-nube",
    "Cárdigan Nube",
    "Unisex",
    94900,
    "cardigan.webp",
    "Arena",
    "#c8bca7",
  ],
] as const;
export const demoProducts: Product[] = [
  ...entries.map(([id, name, category, price, image, color, hex], n) => ({
    id,
    name,
    category,
    price,
    reference: `KN-00${n + 1}`,
    age: category === "Bebé" ? "6–24 meses" : "2–6 años",
    occasion: n === 0 ? "Ocasiones especiales" : "Día a día",
    description:
      "Una silueta sencilla y detalles que acompañan sus días. Prenda ilustrativa para explorar la tienda; información del catálogo real pendiente de confirmar.",
    images: [
      {
        src: "/assets/" + image,
        alt: `${name} en ${color}; fotografía ilustrativa generada con IA`,
        color,
      },
    ],
    variants: (category === "Bebé"
      ? ["6m", "12m", "24m"]
      : ["2", "4", "6"]
    ).map((size, i) => ({
      id: `${id}-${size}`,
      sku: `KN-${n + 1}-${size}`,
      size,
      color,
      hex,
      stock: i === 2 ? 0 : 3,
      reserved: 0,
    })),
    measurements: (category === "Bebé"
      ? ["6m", "12m", "24m"]
      : ["2", "4", "6"]
    ).map((size, i) => ({ size, length: 42 + i * 6, chest: 54 + i * 4 })),
    composition: "",
    care: "",
    active: true,
    featured: true,
    demo: true,
    createdAt: 1720000000000 + n,
    updatedAt: 1720000000000 + n,
  })),
  ...halloweenProducts,
];
export const defaultConfig: StoreConfig = {
  seller: {
    name: "",
    taxId: "",
    address: "",
    email: "",
    phone: "",
    whatsapp: "",
  },
  hero: {
    title: "Pequeñas prendas. Grandes historias.",
    subtitle: "Para sus primeros pasos. Y todo lo que viene después.",
  },
  shipping: [],
  termsVersion: "borrador-1",
  legalReviewed: false,
  taxesConfirmed: false,
  pricesIncludeTax: true,
  supportReady: false,
  updatedAt: 0,
};
export const demoConfig: StoreConfig = {
  ...defaultConfig,
  shipping: [
    {
      department: "Antioquia",
      city: "Medellín",
      price: 12900,
      eta: "Tarifa ilustrativa; plazo por configurar",
      active: true,
    },
    {
      department: "Bogotá D. C.",
      city: "Bogotá D. C.",
      price: 12900,
      eta: "Tarifa ilustrativa; plazo por configurar",
      active: true,
    },
  ],
};
