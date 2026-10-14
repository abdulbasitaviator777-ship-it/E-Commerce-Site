"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Heart, Loader2, ShoppingCart, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/price";
import { toast } from "@/hooks/use-toast";
import { addToCartAction } from "@/server/actions/cart";
import { toggleWishlistAction } from "@/server/actions/wishlist";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  value: string;
  priceDelta: number;
  stock: number;
}

interface ProductPurchaseProps {
  productId: string;
  name: string;
  price: number;
  salePrice: number | null;
  currency: string;
  baseStock: number;
  lowStockThreshold: number;
  variants: Variant[];
  signedIn: boolean;
  wishlisted: boolean;
}

export function ProductPurchase({
  productId,
  price,
  salePrice,
  currency,
  baseStock,
  lowStockThreshold,
  variants,
  signedIn,
  wishlisted,
}: ProductPurchaseProps) {
  const router = useRouter();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(wishlisted);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => variants.find((v) => v.id === variantId) ?? null,
    [variants, variantId],
  );

  // When variants exist, per-variant stock is authoritative.
  const availableStock =
    variants.length > 0 ? (selected ? selected.stock : 0) : baseStock;

  const requiresSelection = variants.length > 0 && !selected;
  const outOfStock = !requiresSelection && availableStock <= 0;
  const unitPrice = price + (selected ? Math.max(0, selected.priceDelta) : 0);

  async function addToCart() {
    if (requiresSelection) {
      toast({
        title: "Select an option",
        description: `Please choose a ${variants[0]?.name.toLowerCase()} first.`,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const res = await addToCartAction({ productId, variantId, quantity });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Added to cart", description: res.message, variant: "success" });
      window.dispatchEvent(new Event("cart:changed"));
    } else {
      toast({ title: "Could not add", description: res.message, variant: "destructive" });
    }
  }

  async function toggleSave() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setSaving(true);
    const res = await toggleWishlistAction(productId);
    setSaving(false);
    if (res.ok) {
      setSaved(Boolean(res.added));
      toast({
        title: res.added ? "Saved to wishlist" : "Removed from wishlist",
        variant: "success",
      });
      window.dispatchEvent(new Event("wishlist:changed"));
    } else {
      toast({ title: "Action failed", description: res.message, variant: "destructive" });
    }
  }

  // Variant options grouped by name (e.g. Size, Color).
  const groups = useMemo(() => {
    const map = new Map<string, Variant[]>();
    for (const v of variants) {
      const list = map.get(v.name) ?? [];
      list.push(v);
      map.set(v.name, list);
    }
    return Array.from(map.entries());
  }, [variants]);

  return (
    <div className="space-y-5">
      {groups.map(([groupName, options]) => (
        <fieldset key={groupName}>
          <legend className="mb-2 text-sm font-medium">
            Select {groupName}
            {selected && groupName === selected.name && (
              <span className="ml-2 font-normal text-muted">{selected.value}</span>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const active = variantId === opt.id;
              const disabled = opt.stock <= 0;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setVariantId(opt.id);
                    setQuantity(1);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "relative min-w-12 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border hover:border-accent",
                    disabled &&
                      "cursor-not-allowed opacity-40 line-through hover:border-border",
                  )}
                >
                  {opt.value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {/* Price + stock */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Price minor={unitPrice} saleMinor={salePrice} currency={currency} size="lg" />
        <StockBadge
          stock={availableStock}
          requiresSelection={requiresSelection}
          lowStockThreshold={lowStockThreshold}
        />
      </div>

      {/* Quantity + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || loading}
            aria-label="Decrease quantity"
            className="grid h-11 w-11 place-items-center text-muted hover:text-foreground disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span
            className="min-w-10 text-center text-sm font-medium tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(availableStock || 99, q + 1))}
            disabled={quantity >= availableStock || loading}
            aria-label="Increase quantity"
            className="grid h-11 w-11 place-items-center text-muted hover:text-foreground disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <Button
          size="lg"
          onClick={addToCart}
          disabled={loading || outOfStock || requiresSelection}
          className="flex-1 sm:flex-none sm:min-w-52"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          )}
          {outOfStock
            ? "Out of stock"
            : requiresSelection
              ? `Select ${variants[0]?.name}`
              : "Add to cart"}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={toggleSave}
          disabled={saving}
          aria-pressed={saved}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Heart
              className={cn("h-4 w-4", saved && "fill-danger text-danger")}
              aria-hidden="true"
            />
          )}
          {saved ? "Saved" : "Save"}
        </Button>
      </div>

      {/* Trust row */}
      <ul className="grid gap-2 rounded-lg border border-border bg-surface-muted p-3 text-xs text-muted sm:grid-cols-2">
        <li className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-accent" aria-hidden="true" />
          Free shipping over Rs 15,000
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
          Secure checkout · 14-day returns
        </li>
      </ul>
    </div>
  );
}

function StockBadge({
  stock,
  requiresSelection,
  lowStockThreshold,
}: {
  stock: number;
  requiresSelection: boolean;
  lowStockThreshold: number;
}) {
  if (requiresSelection) {
    return (
      <span className="text-sm text-muted">Choose an option for availability</span>
    );
  }
  if (stock <= 0) {
    return <span className="text-sm font-medium text-danger">Out of stock</span>;
  }
  if (stock <= lowStockThreshold) {
    return (
      <span className="text-sm font-medium text-warning">
        Only {stock} left in stock
      </span>
    );
  }
  return <span className="text-sm text-success">In stock</span>;
}
