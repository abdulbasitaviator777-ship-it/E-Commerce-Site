import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { Pagination } from "@/components/pagination";
import {
  queryProducts,
  getCategoryBySlug,
  parseSort,
} from "@/lib/queries/products";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { getWishlistProductIds } from "@/server/actions/wishlist";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} at NovaStore.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const brandParam = sp.brand;
  const brands = Array.isArray(brandParam)
    ? brandParam
    : brandParam
      ? [brandParam]
      : undefined;

  const [result, user, settings] = await Promise.all([
    queryProducts({
      categorySlug: slug,
      brand: brands,
      minPrice: first(sp.minPrice) ? Number(first(sp.minPrice)) : undefined,
      maxPrice: first(sp.maxPrice) ? Number(first(sp.maxPrice)) : undefined,
      inStockOnly: first(sp.inStock) === "1",
      onSaleOnly: first(sp.sale) === "1",
      sort: parseSort(first(sp.sort)),
      page: first(sp.page) ? Number(first(sp.page)) : 1,
      perPage: 12,
    }),
    getCurrentUser(),
    getStoreSettings(),
  ]);
  const wishlistedIds = user ? await getWishlistProductIds() : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-1 max-w-2xl text-sm text-muted">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-muted">
          {result.total} {result.total === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="mb-4 flex items-center justify-end">
        <SortSelect value={first(sp.sort) ?? "featured"} />
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-lg font-medium">No products in this category yet</p>
          <p className="mt-1 text-sm text-muted">
            Check back soon — new stock arrives weekly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {result.items.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              currency={settings.currency}
              signedIn={Boolean(user)}
              wishlisted={wishlistedIds.includes(p.id)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath={`/categories/${slug}`}
        params={sp}
      />
    </div>
  );
}
