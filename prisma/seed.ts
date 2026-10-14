import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

// Development seed script. Creates categories and sample products with
// variants, images and reviews. NEVER creates an admin account (see
// scripts/create-admin.ts). Safe to run repeatedly (idempotent upserts).

const prisma = new PrismaClient();

// Deterministic SVG data-URI placeholder image so the app has real,
// non-broken imagery without external assets. Color derived from a hash.
function placeholderImage(seed: string, label: string, w = 800, h = 800): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const bg = `hsl(${hue}, 70%, 92%)`;
  const fg = `hsl(${hue}, 55%, 35%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${bg}"/><circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.28}" fill="${fg}" opacity="0.12"/><text x="50%" y="50%" fill="${fg}" font-family="system-ui, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.13)}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${escapeXml(label)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[
        c
      ] as string,
  );
}

type VariantValue = { value: string; stock: number; delta?: number };
type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  salePrice?: number;
  stock: number;
  description: string;
  specs: { label: string; value: string }[];
  featured?: boolean;
  variants?: { name: string; values: VariantValue[] };
  colorLabel: string;
};

const categories = [
  { name: "T-Shirts", slug: "t-shirts", description: "Everyday essentials in premium cotton." },
  { name: "Shirts", slug: "shirts", description: "Smart to casual shirts for any occasion." },
  { name: "Jeans", slug: "jeans", description: "Denim built to last." },
  { name: "Dresses", slug: "dresses", description: "Effortless styles for every season." },
  { name: "Outerwear", slug: "outerwear", description: "Jackets and coats for cooler days." },
  { name: "Footwear", slug: "footwear", description: "Sneakers, boots and more." },
  { name: "Accessories", slug: "accessories", description: "Finish every look." },
];

const products: SeedProduct[] = [
  {
    slug: "classic-white-tee",
    name: "Classic White Tee",
    category: "t-shirts",
    brand: "Nova Basics",
    price: 19.99,
    stock: 120,
    colorLabel: "White Tee",
    featured: true,
    description:
      "A wardrobe staple cut from soft, breathable combed cotton. Pre-shrunk and built to keep its shape wash after wash.",
    specs: [
      { label: "Material", value: "100% combed cotton" },
      { label: "Fit", value: "Regular" },
      { label: "Care", value: "Machine wash cold" },
    ],
    variants: {
      name: "Size",
      values: [
        { value: "S", stock: 30 },
        { value: "M", stock: 40 },
        { value: "L", stock: 35 },
        { value: "XL", stock: 15 },
      ],
    },
  },
  {
    slug: "striped-long-sleeve",
    name: "Striped Long Sleeve",
    category: "t-shirts",
    brand: "Nova Basics",
    price: 29.5,
    salePrice: 24.99,
    stock: 80,
    colorLabel: "Striped Top",
    description:
      "A timeless Breton stripe in a soft cotton-blend jersey. Perfect on its own or layered under a jacket.",
    specs: [
      { label: "Material", value: "Cotton / elastane blend" },
      { label: "Fit", value: "Slim" },
      { label: "Care", value: "Machine wash cold" },
    ],
    variants: {
      name: "Size",
      values: [
        { value: "S", stock: 20 },
        { value: "M", stock: 35 },
        { value: "L", stock: 25 },
      ],
    },
  },
  {
    slug: "slim-fit-jeans",
    name: "Slim Fit Jeans",
    category: "jeans",
    brand: "Urban Thread",
    price: 49.0,
    stock: 60,
    colorLabel: "Blue Jeans",
    featured: true,
    description:
      "Modern slim-fit denim with just the right amount of stretch for all-day comfort.",
    specs: [
      { label: "Material", value: "98% cotton, 2% elastane" },
      { label: "Fit", value: "Slim" },
      { label: "Rise", value: "Mid" },
    ],
    variants: {
      name: "Waist",
      values: [
        { value: "30", stock: 15 },
        { value: "32", stock: 20 },
        { value: "34", stock: 15 },
        { value: "36", stock: 10 },
      ],
    },
  },
  {
    slug: "floral-summer-dress",
    name: "Floral Summer Dress",
    category: "dresses",
    brand: "Bloom & Co",
    price: 59.0,
    salePrice: 44.5,
    stock: 45,
    colorLabel: "Floral Dress",
    description:
      "A flowing midi dress in a breezy viscose, finished with a flattering tie waist.",
    specs: [
      { label: "Material", value: "100% viscose" },
      { label: "Length", value: "Midi" },
      { label: "Care", value: "Hand wash cold" },
    ],
    variants: {
      name: "Size",
      values: [
        { value: "XS", stock: 8 },
        { value: "S", stock: 12 },
        { value: "M", stock: 15 },
        { value: "L", stock: 10 },
      ],
    },
  },
  {
    slug: "cozy-hoodie",
    name: "Cozy Fleece Hoodie",
    category: "outerwear",
    brand: "Urban Thread",
    price: 44.99,
    stock: 90,
    colorLabel: "Hoodie",
    featured: true,
    description:
      "Brushed-back fleece hoodie with a roomy hood and kangaroo pocket. Your go-to for cool mornings.",
    specs: [
      { label: "Material", value: "Cotton / polyester fleece" },
      { label: "Fit", value: "Relaxed" },
      { label: "Care", value: "Machine wash cold" },
    ],
    variants: {
      name: "Size",
      values: [
        { value: "S", stock: 20 },
        { value: "M", stock: 30 },
        { value: "L", stock: 28 },
        { value: "XL", stock: 12 },
      ],
    },
  },
  {
    slug: "denim-jacket",
    name: "Classic Denim Jacket",
    category: "outerwear",
    brand: "Urban Thread",
    price: 64.0,
    stock: 40,
    colorLabel: "Denim Jacket",
    description:
      "A versatile trucker jacket in mid-wash denim that only gets better with age.",
    specs: [
      { label: "Material", value: "100% cotton denim" },
      { label: "Fit", value: "Regular" },
      { label: "Care", value: "Machine wash cold" },
    ],
    variants: {
      name: "Size",
      values: [
        { value: "S", stock: 8 },
        { value: "M", stock: 14 },
        { value: "L", stock: 12 },
        { value: "XL", stock: 6 },
      ],
    },
  },
  {
    slug: "running-sneakers",
    name: "Cloud Runner Sneakers",
    category: "footwear",
    brand: "Stride",
    price: 69.99,
    salePrice: 54.99,
    stock: 55,
    colorLabel: "Sneakers",
    featured: true,
    description:
      "Lightweight everyday trainers with a responsive foam midsole and breathable knit upper.",
    specs: [
      { label: "Upper", value: "Engineered knit" },
      { label: "Sole", value: "EVA foam" },
      { label: "Use", value: "Running / casual" },
    ],
    variants: {
      name: "Size",
      values: [
        { value: "38", stock: 10 },
        { value: "40", stock: 15 },
        { value: "42", stock: 18 },
        { value: "44", stock: 12 },
      ],
    },
  },
  {
    slug: "leather-chelsea-boots",
    name: "Leather Chelsea Boots",
    category: "footwear",
    brand: "Stride",
    price: 89.0,
    stock: 30,
    colorLabel: "Boots",
    description:
      "Smart-casual Chelsea boots in genuine leather with elastic side panels and a durable sole.",
    specs: [
      { label: "Material", value: "Genuine leather" },
      { label: "Sole", value: "Rubber" },
      { label: "Care", value: "Polish regularly" },
    ],
    variants: {
      name: "Size",
      values: [
        { value: "38", stock: 5 },
        { value: "40", stock: 10 },
        { value: "42", stock: 10 },
        { value: "44", stock: 5 },
      ],
    },
  },
  {
    slug: "linen-shirt",
    name: "Relaxed Linen Shirt",
    category: "shirts",
    brand: "Bloom & Co",
    price: 39.99,
    stock: 70,
    colorLabel: "Linen Shirt",
    description:
      "Breathable European linen shirt with a relaxed drape — ideal for warm weather.",
    specs: [
      { label: "Material", value: "100% linen" },
      { label: "Fit", value: "Relaxed" },
      { label: "Care", value: "Machine wash cold" },
    ],
    variants: {
      name: "Size",
      values: [
        { value: "S", stock: 15 },
        { value: "M", stock: 25 },
        { value: "L", stock: 20 },
        { value: "XL", stock: 10 },
      ],
    },
  },
  {
    slug: "oxford-button-down",
    name: "Oxford Button-Down Shirt",
    category: "shirts",
    brand: "Nova Basics",
    price: 34.5,
    stock: 65,
    colorLabel: "Oxford Shirt",
    description:
      "A crisp oxford cotton shirt that transitions easily from office to weekend.",
    specs: [
      { label: "Material", value: "100% cotton oxford" },
      { label: "Fit", value: "Regular" },
      { label: "Care", value: "Machine wash warm" },
    ],
    variants: {
      name: "Size",
      values: [
        { value: "S", stock: 12 },
        { value: "M", stock: 23 },
        { value: "L", stock: 20 },
        { value: "XL", stock: 10 },
      ],
    },
  },
  {
    slug: "wool-blend-scarf",
    name: "Wool Blend Scarf",
    category: "accessories",
    brand: "Bloom & Co",
    price: 15.0,
    stock: 100,
    colorLabel: "Scarf",
    description: "A soft wool-blend scarf with a subtle herringbone weave.",
    specs: [
      { label: "Material", value: "Wool / acrylic blend" },
      { label: "Size", value: "180 x 30 cm" },
      { label: "Care", value: "Dry clean" },
    ],
  },
  {
    slug: "ribbed-beanie",
    name: "Ribbed Knit Beanie",
    category: "accessories",
    brand: "Urban Thread",
    price: 12.5,
    salePrice: 9.99,
    stock: 120,
    colorLabel: "Beanie",
    description: "A classic ribbed beanie in a warm acrylic knit.",
    specs: [
      { label: "Material", value: "100% acrylic" },
      { label: "Size", value: "One size" },
      { label: "Care", value: "Hand wash" },
    ],
  },
  {
    slug: "canvas-tote",
    name: "Everyday Canvas Tote",
    category: "accessories",
    brand: "Nova Basics",
    price: 22.0,
    stock: 3,
    colorLabel: "Tote Bag",
    description: "A sturdy cotton canvas tote with reinforced straps.",
    specs: [
      { label: "Material", value: "12oz cotton canvas" },
      { label: "Size", value: "38 x 42 cm" },
      { label: "Care", value: "Machine wash cold" },
    ],
  },
];

async function main() {
  console.log("Seeding database…");

  // Store settings singleton.
  await prisma.storeSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", data: JSON.stringify(DEFAULT_SETTINGS) },
    update: {},
  });

  // Categories.
  const catMap = new Map<string, string>();
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const rec = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        position: i,
        imageUrl: placeholderImage(c.slug, c.name),
      },
      update: { name: c.name, description: c.description, position: i },
    });
    catMap.set(c.slug, rec.id);
  }

  // Products.
  for (const p of products) {
    const categoryId = catMap.get(p.category);
    if (!categoryId) throw new Error(`Missing category ${p.category}`);

    const img1 = placeholderImage(p.slug + "-1", p.colorLabel, 800, 1000);
    const img2 = placeholderImage(p.slug + "-2", p.colorLabel + " detail", 800, 800);
    const img3 = placeholderImage(p.slug + "-3", p.name, 800, 800);

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        specs: JSON.stringify(p.specs),
        sku: `NS-${p.slug.toUpperCase().replace(/-/g, "")}`,
        brand: p.brand,
        price: Math.round(p.price * 100),
        salePrice: p.salePrice ? Math.round(p.salePrice * 100) : null,
        categoryId,
        featured: p.featured ?? false,
        active: true,
        stock: p.variants
          ? p.variants.values.reduce((s, v) => s + v.stock, 0)
          : p.stock,
        images: {
          create: [
            { url: img1, alt: `${p.name} — front view`, position: 0 },
            { url: img2, alt: `${p.name} — detail`, position: 1 },
            { url: img3, alt: `${p.name} — lifestyle`, position: 2 },
          ],
        },
        variants: p.variants
          ? {
              create: p.variants.values.map((v) => ({
                name: p.variants!.name,
                value: v.value,
                stock: v.stock,
                priceDelta: v.delta ? Math.round(v.delta * 100) : 0,
              })),
            }
          : undefined,
      },
      update: {
        name: p.name,
        description: p.description,
        price: Math.round(p.price * 100),
        salePrice: p.salePrice ? Math.round(p.salePrice * 100) : null,
        featured: p.featured ?? false,
      },
    });

    // Seed approved reviews for a few products (no linked user account).
    if (
      p.slug === "classic-white-tee" ||
      p.slug === "running-sneakers" ||
      p.slug === "cozy-hoodie"
    ) {
      const existing = await prisma.review.count({
        where: { productId: product.id },
      });
      if (existing === 0) {
        await prisma.review.createMany({
          data: [
            {
              productId: product.id,
              authorName: "Ayesha K.",
              rating: 5,
              title: "Love it!",
              body: "Great quality and fits perfectly. Would buy again.",
              verified: true,
              status: "APPROVED",
            },
            {
              productId: product.id,
              authorName: "Bilal A.",
              rating: 4,
              title: "Good value",
              body: "Nice material for the price. Shipping was quick.",
              verified: false,
              status: "APPROVED",
            },
          ],
        });
      }
    }
  }

  // Sample public promo coupon (not admin credentials).
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    create: {
      code: "WELCOME10",
      description: "10% off your first order",
      type: "PERCENT",
      value: 1000, // 10%
      active: true,
    },
    update: {},
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

