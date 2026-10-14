import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type SortKey =
  | "featured"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "popularity";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
  { key: "popularity", label: "Most Popular" },
];

export function parseSort(value: string | undefined | null): SortKey {
  const valid: SortKey[] = [
    "featured",
    "newest",
    "price_asc",
    "price_desc",
    "rating",
    "popularity",
  ];
  return valid.includes(value as SortKey) ? (value as SortKey) : "featured";
}

function sortOrderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price_asc":
      // Prisma can't sort by the sale-aware effective price directly, so we
      // fetch a larger window and sort in memory for accuracy (see below).
      return [{ price: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ price: "desc" }, { createdAt: "desc" }];
    case "rating":
    case "popularity":
    case "featured":
    default:
      return [{ featured: "desc" }, { createdAt: "desc" }];
  }
}

// Effective (sale-aware) price used for display and sorting.
export function effectivePrice(product: {
  price: number;
  salePrice: number | null;
}): number {
  if (product.salePrice != null && product.salePrice < product.price) {
    return product.salePrice;
  }
  return product.price;
}

const productInclude = {
  images: { orderBy: { position: "asc" } },
  category: true,
  variants: true,
  reviews: {
    where: { status: "APPROVED" },
    select: { rating: true },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// Augment a product with computed rating fields.
export function withRating(p: ProductWithRelations) {
  const reviewCount = p.reviews.length;
  const ratingAvg =
    reviewCount > 0
      ? p.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 0;
  return { ...p, ratingAvg, reviewCount };
}

export type ProductQuery = {
  q?: string;
  categorySlug?: string;
  brand?: string[];
  minPrice?: number; // minor units
  maxPrice?: number; // minor units
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  featuredOnly?: boolean;
};

export async function queryProducts(
  query: ProductQuery,
): Promise<{
  items: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}> {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(48, Math.max(1, query.perPage ?? 12));
  const sort = query.sort ?? "featured";

  const where: Prisma.ProductWhereInput = { active: true };

  if (query.featuredOnly) where.featured = true;
  if (query.categorySlug) where.category = { slug: query.categorySlug };
  if (query.brand && query.brand.length > 0) {
    where.brand = { in: query.brand };
  }
  if (query.onSaleOnly) {
    where.salePrice = { not: null };
  }
  if (query.inStockOnly) {
    where.OR = [
      { stock: { gt: 0 } },
      { variants: { some: { stock: { gt: 0 } } } },
    ];
  }
  if (query.q && query.q.trim()) {
    const term = query.q.trim();
    where.OR = [
      { name: { contains: term } },
      { description: { contains: term } },
      { brand: { contains: term } },
      { sku: { contains: term } },
      { category: { name: { contains: term } } },
    ];
  }
  if (query.minPrice != null || query.maxPrice != null) {
    const range: Prisma.IntFilter = {};
    if (query.minPrice != null) range.gte = query.minPrice;
    if (query.maxPrice != null) range.lte = query.maxPrice;
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { OR: [{ price: range }, { salePrice: range }] },
    ];
  }

  const orderBy = sortOrderBy(sort);
  const needsMemorySort = sort === "price_asc" || sort === "price_desc";

  const [rawItems, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip: needsMemorySort ? 0 : (page - 1) * perPage,
      take: needsMemorySort ? perPage * 4 : perPage,
    }),
    prisma.product.count({ where }),
  ]);

  let items = rawItems.map(withRating);

  if (needsMemorySort) {
    items.sort((a, b) => {
      const pa = effectivePrice(a);
      const pb = effectivePrice(b);
      return sort === "price_asc" ? pa - pb : pb - pa;
    });
    const start = (page - 1) * perPage;
    items = items.slice(start, start + perPage);
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return { items, total, page, perPage, totalPages };
}

export type ProductCard = ReturnType<typeof withRating>;

// --- Categories ------------------------------------------------------------

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: { where: { active: true } } } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { products: { where: { active: true } } } },
    },
  });
}

// Distinct brands among active products (for the filter sidebar).
export async function getBrands(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, brand: { not: null } },
    select: { brand: true },
    distinct: ["brand"],
  });
  return rows
    .map((r) => r.brand)
    .filter((b): b is string => !!b)
    .sort((a, b) => a.localeCompare(b));
}

// --- Single product --------------------------------------------------------

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      variants: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!product) return null;
  const reviewCount = product.reviews.length;
  const ratingAvg =
    reviewCount > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 0;
  return { ...product, ratingAvg, reviewCount };
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: {
      active: true,
      categoryId,
      id: { not: productId },
    },
    include: productInclude,
    take: limit,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(withRating);
}

// --- Homepage / storefront sections ---------------------------------------

export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, featured: true },
    include: productInclude,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(withRating);
}

export async function getNewArrivals(limit = 8): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: { active: true },
    include: productInclude,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(withRating);
}

export async function getDiscountedProducts(limit = 8): Promise<ProductCard[]> {
  // Fetch a window of products with a salePrice, then keep only genuine
  // discounts (salePrice < price), sorted by biggest saving.
  const rows = await prisma.product.findMany({
    where: { active: true, salePrice: { not: null } },
    include: productInclude,
    take: limit * 3,
    orderBy: { createdAt: "desc" },
  });
  return rows
    .map(withRating)
    .filter((p) => p.salePrice != null && p.salePrice < p.price)
    .sort((a, b) => b.price - (b.salePrice ?? b.price) - (a.price - (a.salePrice ?? a.price)))
    .slice(0, limit);
}

export async function getBestSellers(limit = 8): Promise<ProductCard[]> {
  // Best sellers approximated by highest review count, then rating.
  const rows = await prisma.product.findMany({
    where: { active: true },
    include: productInclude,
    take: limit * 3,
    orderBy: { createdAt: "desc" },
  });
  return rows
    .map(withRating)
    .sort((a, b) => b.reviewCount - a.reviewCount || b.ratingAvg - a.ratingAvg)
    .slice(0, limit);
}

// --- Search suggestions ----------------------------------------------------

export async function searchSuggestions(term: string, limit = 6) {
  if (!term.trim()) return [];
  return prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: term.trim() } },
        { brand: { contains: term.trim() } },
        { category: { name: { contains: term.trim() } } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      salePrice: true,
      images: { select: { url: true }, take: 1, orderBy: { position: "asc" } },
    },
    take: limit,
  });
}

