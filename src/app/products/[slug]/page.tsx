import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck, RotateCcw, Package } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ReviewForm } from "@/components/product/review-form";
import { ProductSection } from "@/components/home/product-section";
import { Stars } from "@/components/stars";
import { Badge } from "@/components/ui/badge";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/queries/products";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { getWishlistProductIds } from "@/server/actions/wishlist";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

type SpecRow = { label: string; value: string };

function parseSpecs(raw: string | null): SpecRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is SpecRow =>
        row && typeof row.label === "string" && typeof row.value === "string",
    );
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const [related, user, settings] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId, 4),
    getCurrentUser(),
    getStoreSettings(),
  ]);
  const wishlistedIds = user ? await getWishlistProductIds() : [];
  const wishlisted = wishlistedIds.includes(product.id);

  const specs = parseSpecs(product.specs);
  const reviews = product.reviews;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href="/products" className="hover:text-foreground">Products</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="truncate text-foreground" aria-current="page">
          {product.name}
        </span>
      </nav>

      {/* Main product */}
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{product.category.name}</Badge>
            {product.salePrice != null && product.salePrice < product.price && (
              <Badge variant="danger">Sale</Badge>
            )}
            {product.brand && <Badge variant="outline">{product.brand}</Badge>}
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
            <Stars
              rating={product.ratingAvg}
              size="md"
              showValue
              count={product.reviewCount}
            />
            <span aria-hidden="true">·</span>
            <span>SKU: {product.sku}</span>
          </div>

          <div className="mt-5">
            <ProductPurchase
              productId={product.id}
              name={product.name}
              price={product.price}
              salePrice={product.salePrice}
              currency={settings.currency}
              baseStock={product.stock}
              lowStockThreshold={product.lowStockThreshold}
              variants={product.variants}
              signedIn={Boolean(user)}
              wishlisted={wishlisted}
            />
          </div>
        </div>
      </div>

      {/* Description + specs */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="description-heading">
          <h2 id="description-heading" className="text-lg font-semibold">
            Description
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
            {product.description}
          </p>

          {specs.length > 0 && (
            <table className="mt-6 w-full text-sm">
              <caption className="mb-2 text-left font-semibold">
                Specifications
              </caption>
              <tbody>
                {specs.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <th scope="row" className="w-40 py-2 text-left font-medium text-muted">
                      {row.label}
                    </th>
                    <td className="py-2">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Truck, text: "Free shipping on orders over Rs 15,000" },
              { icon: RotateCcw, text: "14-day easy returns & exchanges" },
              { icon: ShieldCheck, text: "Secure checkout, your data protected" },
              { icon: Package, text: "Carefully packed for safe delivery" },
            ].map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-xs text-muted"
              >
                <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        {/* Reviews */}
        <section aria-labelledby="reviews-heading" className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 id="reviews-heading" className="text-lg font-semibold">
              Customer reviews
            </h2>

            <div className="mt-3 flex items-center gap-3">
              <Stars rating={product.ratingAvg} size="lg" />
              <div className="text-sm">
                <span className="font-semibold">
                  {product.ratingAvg.toFixed(1)}
                </span>
                <span className="text-muted"> out of 5</span>
                <span className="block text-muted">
                  {product.reviewCount}{" "}
                  {product.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>
            </div>

            {reviews.length > 0 && (
              <ul className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-1">
                {reviews.map((review) => (
                  <li key={review.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <Stars rating={review.rating} />
                      {review.verified && (
                        <Badge variant="success" className="text-[10px]">
                          Verified purchase
                        </Badge>
                      )}
                    </div>
                    {review.title && (
                      <p className="mt-1 text-sm font-medium">{review.title}</p>
                    )}
                    <p className="mt-1 text-sm text-muted">{review.body}</p>
                    <p className="mt-2 text-xs text-muted">
                      {review.authorName} ·{" "}
                      {new Date(review.createdAt).toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="text-lg font-semibold">Write a review</h3>
            {user ? (
              <div className="mt-4">
                <ReviewForm productId={product.id} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                <Link href={`/login?next=/products/${product.slug}`} className="font-medium text-accent hover:underline">
                  Sign in
                </Link>{" "}
                to share your experience.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-14">
          <ProductSection
            title="You may also like"
            subtitle="More from this category"
            products={related}
            currency={settings.currency}
            signedIn={Boolean(user)}
            wishlistedIds={wishlistedIds}
            viewAllHref={`/categories/${product.category.slug}`}
          />
        </div>
      )}
    </div>
  );
}
