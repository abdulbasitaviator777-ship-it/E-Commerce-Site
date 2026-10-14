"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { updateProductAction } from "@/server/actions/admin";
import { minorToMajor, majorToMinor } from "@/lib/money";

export interface ProductRowData {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
}

export function ProductRowEditor({ product }: { product: ProductRowData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState(String(minorToMajor(product.price)));
  const [salePrice, setSalePrice] = useState(
    product.salePrice != null ? String(minorToMajor(product.salePrice)) : "",
  );
  const [stock, setStock] = useState(String(product.stock));
  const [active, setActive] = useState(product.active);
  const [featured, setFeatured] = useState(product.featured);

  async function save() {
    const priceMinor = majorToMinor(Number(price) || 0);
    const saleMinor = salePrice.trim() === "" ? null : majorToMinor(Number(salePrice) || 0);
    if (saleMinor != null && saleMinor >= priceMinor) {
      toast({
        title: "Invalid sale price",
        description: "Sale price must be below the regular price.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    const res = await updateProductAction({
      id: product.id,
      price: priceMinor,
      salePrice: saleMinor,
      stock: Math.max(0, Math.floor(Number(stock) || 0)),
      active,
      featured,
    });
    setBusy(false);
    if (res.ok) {
      toast({ title: "Product updated", variant: "success" });
      setEditing(false);
      router.refresh();
    } else {
      toast({ title: "Update failed", description: res.message, variant: "destructive" });
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${product.name}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-surface-muted"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        inputMode="decimal"
        className="h-8 w-20"
      />
      <Input
        aria-label="Sale price"
        value={salePrice}
        onChange={(e) => setSalePrice(e.target.value)}
        inputMode="decimal"
        placeholder="Sale"
        className="h-8 w-20"
      />
      <Input
        aria-label="Stock"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        inputMode="numeric"
        className="h-8 w-16"
      />
      <label className="flex items-center gap-1 text-xs">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>
      <label className="flex items-center gap-1 text-xs">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Featured
      </label>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        aria-label="Save product"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-success/50 text-success hover:bg-success-soft"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        disabled={busy}
        aria-label="Cancel editing"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-surface-muted"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
