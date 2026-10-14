import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products you've saved for later.",
};

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/wishlist");

  const [wishlist, settings] = await Promise.all([
    prisma.wishlist.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              include: {
                images: { orderBy: { position: "asc" } },
                category: true,
                variants: true,
                reviews: {
                  where: { status: "APPROVED" },
                  select: { rating: true },
                },
              },
            },
          },
        },
      },
    }),
    getStoreSettings(),
  ]);

  const items = (wishlist?.items ?? []).filter((i) => i.product.active);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-muted">
          <Heart className="h-7 w-7 text-muted" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Your wishlist is empty</h1>
        <p className="mt-2 text-sm text-muted">
          Tap the heart on any product to save it here for later.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/products">
            <Button size="lg">
              Browse products
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const products = items.map((item) => {
    const p = item.product;
    const reviewCount = p.reviews.length;
    const ratingAvg =
      reviewCount > 0
        ? p.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
        : 0;
    return { ...p, ratingAvg, reviewCount };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Your wishlist{" "}
        <span className="text-base font-normal text-muted">
          ({products.length} {products.length === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            currency={settings.currency}
            signedIn
            wishlisted
          />
        ))}
      </div>
    </div>
  );
}
