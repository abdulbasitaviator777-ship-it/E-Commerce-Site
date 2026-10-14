"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { parseMoneyInput } from "@/lib/money";
import { cn } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface ProductFiltersProps {
  categories: CategoryOption[];
  brands: string[];
  current: {
    category?: string;
    brands?: string[];
    minPrice?: string;
    maxPrice?: string;
    inStock?: boolean;
    sale?: boolean;
  };
}

// Applies changes to the URL query string; the server page reacts via
// searchParams. Every mutation resets pagination.
export function ProductFilters({ categories, brands, current }: ProductFiltersProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(current.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(current.maxPrice ?? "");

  function apply(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(window.location.search);
    mutator(params);
    params.delete("page");
    const qs = params.toString();
    router.push(`${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }

  function toggleBrand(brand: string) {
    apply((params) => {
      const existing = params.getAll("brand");
      params.delete("brand");
      const next = existing.includes(brand)
        ? existing.filter((b) => b !== brand)
        : [...existing, brand];
      next.forEach((b) => params.append("brand", b));
    });
  }

  function toggleCategory(slug: string) {
    apply((params) => {
      if (params.get("category") === slug) params.delete("category");
      else params.set("category", slug);
    });
  }

  function toggleFlag(key: "inStock" | "sale", value: boolean) {
    apply((params) => {
      if (value) params.set(key, "1");
      else params.delete(key);
    });
  }

  function applyPrice() {
    apply((params) => {
      const min = parseMoneyInput(minPrice);
      const max = parseMoneyInput(maxPrice);
      if (min != null && min >= 0) params.set("minPrice", String(min));
      else params.delete("minPrice");
      if (max != null && max >= 0) params.set("maxPrice", String(max));
      else params.delete("maxPrice");
    });
  }

  function clearAll() {
    setMinPrice("");
    setMaxPrice("");
    router.push(window.location.pathname);
  }

  const activeCount =
    (current.category ? 1 : 0) +
    (current.brands?.length ?? 0) +
    (current.minPrice ? 1 : 0) +
    (current.maxPrice ? 1 : 0) +
    (current.inStock ? 1 : 0) +
    (current.sale ? 1 : 0);

  return (
    <div>
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
          </span>
          {activeCount > 0 && (
            <Badge variant="secondary">{activeCount} active</Badge>
          )}
        </Button>
      </div>

      <aside
        aria-label="Product filters"
        className={cn(
          "space-y-6 rounded-lg border border-border bg-surface p-4",
          open ? "mt-4 block" : "hidden lg:block",
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Filters</h2>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 text-xs font-medium text-danger hover:underline"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Clear all
            </button>
          )}
        </div>


        {/* Category */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Category</legend>
          <ul className="space-y-1.5">
            {categories.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={current.category === c.slug}
                    onChange={() => toggleCategory(c.slug)}
                    className="h-4 w-4 rounded border-border accent-[var(--color-accent,#4f46e5)]"
                  />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-muted">{c.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        {/* Brand */}
        {brands.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Brand</legend>
            <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {brands.map((b) => (
                <li key={b}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={current.brands?.includes(b) ?? false}
                      onChange={() => toggleBrand(b)}
                      className="h-4 w-4 rounded border-border accent-[var(--color-accent,#4f46e5)]"
                    />
                    {b}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        {/* Price */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Price</legend>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="min-price" className="sr-only">Minimum price</Label>
              <Input
                id="min-price"
                inputMode="decimal"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                className="h-9"
              />
            </div>
            <span className="text-muted">–</span>
            <div className="flex-1">
              <Label htmlFor="max-price" className="sr-only">Maximum price</Label>
              <Input
                id="max-price"
                inputMode="decimal"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                className="h-9"
              />
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={applyPrice} className="mt-2 w-full">
            Apply price
          </Button>
        </fieldset>

        {/* Availability */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Availability</legend>
          <div className="space-y-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={current.inStock ?? false}
                onChange={(e) => toggleFlag("inStock", e.target.checked)}
                className="h-4 w-4 rounded border-border accent-[var(--color-accent,#4f46e5)]"
              />
              In stock only
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={current.sale ?? false}
                onChange={(e) => toggleFlag("sale", e.target.checked)}
                className="h-4 w-4 rounded border-border accent-[var(--color-accent,#4f46e5)]"
              />
              On sale
            </label>
          </div>
        </fieldset>
      </aside>
    </div>
  );
}
