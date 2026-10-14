import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/catalog/product-filters";
import { SortSelect } from "@/components/catalog/sort-select";
import { Pagination } from "@/components/pagination";
import {
  queryProducts,
  getCategories,
  getBrands,
  parseSort,
} from "@/lib/queries/products";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { getWishlistProductIds } from "@/server/actions/wishlist";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse the full NovaStore catalogue — clothing, footwear and accessories with fast delivery across Pakistan.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const brandParam = sp.brand;
  const brands = Array.isArray(brandParam)
    ? brandParam
    : brandParam
      ? [brandParam]
      : undefined;

  const query = {
    q: first(sp.q),
    categorySlug: first(sp.category),
    brand: brands,
    minPrice: first(sp.minPrice) ? Number(first(sp.minPrice)) : undefined,
    maxPrice: first(sp.maxPrice) ? Number(first(sp.maxPrice)) : undefined,
    inStockOnly: first(sp.inStock) === "1",
    onSaleOnly: first(sp.sale) === "1",
    sort: parseSort(first(sp.sort)),
    page: first(sp.page) ? Number(first(sp.page)) : 1,
    perPage: 12,
  };

  const [result, categories, brandsList, user, settings] = await Promise.all([
    queryProducts(query),
    getCategories(),
    getBrands(),
    getCurrentUser(),
    getStoreSettings(),
  ]);
  const wishlistedIds = user ? await getWishlistProductIds() : [];

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c._count.products,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">All products</h1>
        <p className="mt-1 text-sm text-muted">
          {result.total} {result.total === 1 ? "product" : "products"} found
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ProductFilters
          categories={categoryOptions}
          brands={brandsList}
          current={{
            category: first(sp.category),
            brands,
            minPrice: first(sp.minPrice),
            maxPrice: first(sp.maxPrice),
            inStock: first(sp.inStock) === "1",
            sale: first(sp.sale) === "1",
          }}
        />

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Page {result.page} of {result.totalPages}
            </p>
            <SortSelect value={query.sort} />
          </div>

          {result.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="mt-1 text-sm text-muted">
                Try adjusting your filters or search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
            basePath="/products"
            params={sp}
          />
        </div>
      </div>
    </div>
  );
}
