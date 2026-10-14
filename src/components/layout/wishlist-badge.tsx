"use client";

import { useEffect, useState } from "react";
import { getHeaderWishlistCount } from "@/server/actions/header";

// Client badge showing the signed-in user's wishlist count.
export function WishlistBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const doRefresh = async () => {
      try {
        const c = await getHeaderWishlistCount();
        if (mounted) setCount(c);
      } catch {
        // not signed in — no badge
      }
    };
    doRefresh();
    const handler = () => doRefresh();
    window.addEventListener("wishlist:changed", handler);
    return () => {
      mounted = false;
      window.removeEventListener("wishlist:changed", handler);
    };
  }, []);

  if (count <= 0) return null;
  return (
    <span
      className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white"
      aria-label={`${count} items in wishlist`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
