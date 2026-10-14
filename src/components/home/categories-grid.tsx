import Link from "next/link";
import { Shirt, Watch, Footprints, Baby, Smartphone, Gem } from "lucide-react";
import type { getCategories } from "@/lib/queries/products";

type Categories = Awaited<ReturnType<typeof getCategories>>;

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  apparel: Shirt,
  clothing: Shirt,
  footwear: Footprints,
  shoes: Footprints,
  watches: Watch,
  accessories: Gem,
  electronics: Smartphone,
  kids: Baby,
};

export function CategoriesGrid({ categories }: { categories: Categories }) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Shop by category</h2>
        <Link href="/products" className="text-sm font-medium text-accent hover:underline">
          Browse all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.slice(0, 6).map((c) => {
          const Icon =
            ICONS[c.slug] ?? ICONS[c.name.toLowerCase()] ?? Shirt;
          return (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-5 text-center transition-colors hover:border-accent hover:bg-accent-soft"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-sm font-medium">{c.name}</span>
              <span className="text-xs text-muted">{c._count.products} items</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
