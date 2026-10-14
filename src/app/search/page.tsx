import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { Pagination } from "@/components/pagination";
import { queryProducts, parseSort } from "@/lib/queries/products";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { getWishlistProductIds } from "@/server/actions/wishlist";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the NovaStore catalogue.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = first(sp.q) ?? "";

  const [result, user, settings] = await Promise.all([
    queryProducts({
      q: q || undefined,
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
        <h1 className="text-2xl font-bold tracking-tight">
          {q ? `Search results for “${q}”` : "Search"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {result.total} {result.total === 1 ? "product" : "products"} found
        </p>
      </div>

      <div className="mb-4 flex items-center justify-end">
        <SortSelect value={first(sp.sort) ?? "featured"} />
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-lg font-medium">
            {q ? `No results for “${q}”` : "Start typing to search"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Try a different keyword or browse our categories.
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

      <Pagination page={result.page} totalPages={result.totalPages} basePath="/search" params={sp} />
    </div>
  );
}
