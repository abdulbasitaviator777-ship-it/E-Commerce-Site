"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { toggleWishlistAction } from "@/server/actions/wishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  initialActive?: boolean;
  signedIn: boolean;
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function WishlistButton({
  productId,
  initialActive = false,
  signedIn,
  size = "icon",
  className,
}: WishlistButtonProps) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    const res = await toggleWishlistAction(productId);
    setLoading(false);
    if (res.ok) {
      setActive(Boolean(res.added));
      toast({ title: res.added ? "Saved to wishlist" : "Removed from wishlist", variant: "success" });
      window.dispatchEvent(new Event("wishlist:changed"));
    } else {
      toast({ title: "Action failed", description: res.message, variant: "destructive" });
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50",
        size === "icon" ? "h-10 w-10" : size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Heart
          className={cn("h-4 w-4", active && "fill-danger text-danger")}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
