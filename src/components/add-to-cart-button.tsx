"use client";

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { addToCartAction } from "@/server/actions/cart";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
  onAdded?: () => void;
}

export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  label = "Add to cart",
  size = "default",
  variant = "default",
  className,
  disabled,
  onAdded,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const res = await addToCartAction({ productId, variantId, quantity });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Added to cart", description: res.message, variant: "success" });
      window.dispatchEvent(new Event("cart:changed"));
      onAdded?.();
    } else {
      toast({ title: "Could not add to cart", description: res.message, variant: "destructive" });
    }
  }

  return (
    <Button
      onClick={onClick}
      size={size}
      variant={variant}
      disabled={disabled || loading}
      className={className}
      aria-label={label}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      )}
      {size !== "icon" && <span>{label}</span>}
    </Button>
  );
}
