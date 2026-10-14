import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";
import { Badge } from "@/components/ui/badge";
import { ProductRowEditor, type ProductRowData } from "@/components/admin/product-row-editor";
import { Pagination } from "@/components/pagination";

type SearchParams = Promise<{ page?: string | string[] }>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function AdminProductsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(first(sp.page) ?? 1));
  const perPage = 20;

  const [products, total, settings] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { category: { select: { name: true } } },
    }),
    prisma.product.count(),
    getStoreSettings(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="mt-1 text-sm text-muted">
          {total} products · prices in {settings.currency}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => {
              const row: ProductRowData = {
                id: p.id,
                name: p.name,
                price: p.price,
                salePrice: p.salePrice,
                stock: p.stock,
                active: p.active,
                featured: p.featured,
              };
              return (
                <tr key={p.id} className="align-top hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${p.slug}`}
                      className="block max-w-56 truncate font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span className="block text-xs text-muted">{p.sku}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category.name}</td>
                  <td className="px-4 py-3">
                    <span className="block font-medium">
                      {formatMoney(p.salePrice ?? p.price, settings.currency)}
                    </span>
                    {p.salePrice != null && (
                      <span className="block text-xs text-muted line-through">
                        {formatMoney(p.price, settings.currency)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stock <= 0
                          ? "font-medium text-danger"
                          : p.stock <= p.lowStockThreshold
                            ? "font-medium text-warning"
                            : ""
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      <Badge variant={p.active ? "success" : "danger"}>
                        {p.active ? "Active" : "Hidden"}
                      </Badge>
                      {p.featured && <Badge variant="accent">Featured</Badge>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowEditor product={row} />
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/products" params={{}} />
    </div>
  );
}