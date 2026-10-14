"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Price } from "@/components/price";
import { toast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import {
  updateQuantityAction,
  removeFromCartAction,
} from "@/server/actions/cart";
import type { CartLine } from "@/lib/cart";

export function CartLines({ lines, currency }: { lines: CartLine[]; currency: string }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {lines.map((line) => (
        <CartRow key={line.id} line={line} currency={currency} />
      ))}
    </ul>
  );
}

function CartRow({ line, currency }: { line: CartLine; currency: string }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(line.quantity);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function changeQty(next: number) {
    const clamped = Math.max(1, Math.min(line.available || 1, next));
    if (clamped === quantity) return;
    const prev = quantity;
    setQuantity(clamped);
    setLoading(true);
    const res = await updateQuantityAction({ itemId: line.id, quantity: clamped });
    setLoading(false);
    if (!res.ok) {
      setQuantity(prev);
      toast({ title: "Could not update", description: res.message, variant: "destructive" });
      return;
    }
    if (res.message) {
      toast({ title: "Quantity adjusted", description: res.message });
    }
    window.dispatchEvent(new Event("cart:changed"));
    router.refresh(); // re-render server totals without a full reload
  }

  async function remove() {
    setRemoving(true);
    const res = await removeFromCartAction(line.id);
    if (res.ok) {
      toast({ title: "Removed from cart", variant: "success" });
      window.dispatchEvent(new Event("cart:changed"));
      router.refresh();
    } else {
      setRemoving(false);
      toast({ title: "Could not remove", description: res.message, variant: "destructive" });
    }
  }

  return (
    <li className="flex flex-wrap gap-4 p-4 sm:flex-nowrap">
      <Link
        href={`/products/${line.product.slug}`}
        className="h-24 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted"
      >
        {line.product.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={line.product.imageUrl}
            alt={line.product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted">
            No image
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${line.product.slug}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {line.product.name}
        </Link>
        {line.variant && (
          <p className="mt-0.5 text-xs text-muted">
            {line.variant.name}: {line.variant.value}
          </p>
        )}
        <p className="mt-1 text-xs text-muted">
          {line.available > 0
            ? `In stock: ${line.available}`
            : "Out of stock"}
        </p>

        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center rounded-lg border border-border">
            <button
              type="button"
              onClick={() => changeQty(quantity - 1)}
              disabled={loading || removing || quantity <= 1}
              aria-label={`Decrease quantity of ${line.product.name}`}
              className="grid h-9 w-9 place-items-center text-muted hover:text-foreground disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="min-w-8 text-center text-sm font-medium tabular-nums">
              {loading ? (
                <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                quantity
              )}
            </span>
            <button
              type="button"
              onClick={() => changeQty(quantity + 1)}
              disabled={loading || removing || quantity >= line.available}
              aria-label={`Increase quantity of ${line.product.name}`}
              className="grid h-9 w-9 place-items-center text-muted hover:text-foreground disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={remove}
            disabled={removing}
            aria-label={`Remove ${line.product.name} from cart`}
            className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline disabled:opacity-50"
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Remove
          </button>
        </div>
      </div>

      <div className="text-right">
        <Price
          minor={line.unitPrice}
          saleMinor={line.unitPrice < line.product.price ? line.product.price : null}
          currency={currency}
          size="sm"
        />
        {quantity > 1 && (
          <p className="mt-1 text-xs text-muted">
            {quantity} × {formatMoney(line.unitPrice, currency)}
          </p>
        )}
      </div>
    </li>
  );
}
