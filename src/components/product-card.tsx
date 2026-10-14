import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/price";
import { Stars } from "@/components/stars";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { WishlistButton } from "@/components/wishlist-button";
import { type ProductCard as ProductCardType } from "@/lib/queries/products";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ProductCardType;
  currency?: string;
  signedIn?: boolean;
  wishlisted?: boolean;
  priority?: boolean;
  className?: string;
}

function stockBadge(product: ProductCardType) {
  const totalStock = product.variants.length
    ? product.variants.reduce((s, v) => s + v.stock, 0)
    : product.stock;
  if (totalStock <= 0) {
    return <Badge variant="secondary">Out of stock</Badge>;
  }
  if (totalStock <= product.lowStockThreshold) {
    return <Badge variant="warning">Only {totalStock} left</Badge>;
  }
  return null;
}

export function ProductCard({
  product,
  currency = "PKR",
  signedIn = false,
  wishlisted = false,
  className,
}: ProductCardProps) {
  const image = product.images[0]?.url;
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const outOfStock =
    (product.variants.length
      ? product.variants.reduce((s, v) => s + v.stock, 0)
      : product.stock) <= 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link href={`/products/${product.slug}`} className="relative block">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.images[0]?.alt ?? product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted">
              No image
            </div>
          )}
          {onSale && (
            <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">
              Sale
            </span>
          )}
          {product.featured && !onSale && (
            <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
              Featured
            </span>
          )}
        </div>
      </Link>

      <div className="absolute right-2 top-2">
        <WishlistButton
          productId={product.id}
          signedIn={signedIn}
          initialActive={wishlisted}
          className="bg-surface/90 backdrop-blur"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.category && (
          <span className="text-xs uppercase tracking-wide text-muted">
            {product.category.name}
          </span>
        )}
        <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-accent">
          {product.name}
        </Link>

        {product.reviewCount > 0 && (
          <Stars rating={product.ratingAvg} count={product.reviewCount} showValue />
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Price
            minor={product.price}
            saleMinor={product.salePrice}
            currency={currency}
            size="sm"
          />
          {stockBadge(product)}
        </div>

        <AddToCartButton
          productId={product.id}
          size="sm"
          variant="outline"
          disabled={outOfStock}
          label={outOfStock ? "Out of stock" : "Add to cart"}
          className="mt-1 w-full"
        />
      </div>
    </div>
  );
}
