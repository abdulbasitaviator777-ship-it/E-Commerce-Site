"use client";

import { useEffect, useState } from "react";
import { getHeaderCartSummary } from "@/server/actions/header";

// Small client badge showing the live cart item count. Refetches on cart
// changes via a custom event dispatched by cart UI components.
export function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const doRefresh = async () => {
      const summary = await getHeaderCartSummary();
      if (mounted) setCount(summary.itemCount);
    };
    doRefresh();
    const handler = () => doRefresh();
    window.addEventListener("cart:changed", handler);
    window.addEventListener("focus", handler);
    return () => {
      mounted = false;
      window.removeEventListener("cart:changed", handler);
      window.removeEventListener("focus", handler);
    };
  }, []);

  if (count <= 0) return null;
  return (
    <span
      className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-foreground"
      aria-label={`${count} items in cart`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
