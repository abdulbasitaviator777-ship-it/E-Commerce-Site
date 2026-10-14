import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { ProductCard as ProductCardType } from "@/lib/queries/products";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: ProductCardType[];
  currency?: string;
  signedIn?: boolean;
  wishlistedIds?: string[];
  viewAllHref?: string;
  columns?: 2 | 3 | 4;
}

export function ProductSection({
  title,
  subtitle,
  products,
  currency = "PKR",
  signedIn = false,
  wishlistedIds = [],
  viewAllHref,
  columns = 4,
}: ProductSectionProps) {
  if (products.length === 0) return null;
  const colsClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-2 lg:grid-cols-3"
        : "grid-cols-2 lg:grid-cols-4";

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className={`grid gap-4 ${colsClass}`}>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            currency={currency}
            signedIn={signedIn}
            wishlisted={wishlistedIds.includes(p.id)}
          />
        ))}
      </div>
    </section>
  );
}
