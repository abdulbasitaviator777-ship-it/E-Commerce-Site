import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User, Heart } from "lucide-react";
import { getCategories } from "@/lib/queries/products";
import { getCurrentUser } from "@/lib/auth";
import { HeaderSearch } from "@/components/layout/header-search";
import { HeaderNav } from "@/components/layout/header-nav";
import { CartBadge } from "@/components/layout/cart-badge";
import { WishlistBadge } from "@/components/layout/wishlist-badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getStoreSettings } from "@/lib/settings";

export async function SiteHeader() {
  const [categories, user, settings] = await Promise.all([
    getCategories(),
    getCurrentUser(),
    getStoreSettings(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {/* Announcement bar */}
      <div className="bg-accent text-accent-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center text-xs font-medium sm:text-sm">
          Free shipping on orders over{" "}
          {settings.freeShippingThreshold != null
            ? `${settings.currency} ${(settings.freeShippingThreshold / 100).toLocaleString()}`
            : "selected items"}{" "}
          · Easy 14-day returns
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label={`${settings.storeName} home`}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">{settings.storeName}</span>
        </Link>

        <HeaderNav categories={categories} />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <HeaderSearch />
          <ThemeToggle />
          <Link href="/wishlist" aria-label="Wishlist">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" aria-hidden="true" />
              <WishlistBadge />
            </Button>
          </Link>
          <Link href={user ? "/account" : "/login"} aria-label={user ? "Account" : "Sign in"}>
            <Button variant="ghost" size="icon" className="relative">
              <User className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/cart" aria-label="Cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              <CartBadge />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
