import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { FeatureStrip } from "@/components/home/feature-strip";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { ProductSection } from "@/components/home/product-section";
import { Testimonials } from "@/components/home/testimonials";
import { NewsletterSection } from "@/components/home/newsletter-section";
import {
  getCategories,
  getFeaturedProducts,
  getNewArrivals,
  getDiscountedProducts,
  getBestSellers,
} from "@/lib/queries/products";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/settings";
import { getWishlistProductIds } from "@/server/actions/wishlist";

export const metadata: Metadata = {
  title: "NovaStore — Modern Online Shopping",
  description:
    "Discover premium clothing, footwear and accessories at NovaStore. Secure checkout, fast delivery and easy returns.",
};

export default async function HomePage() {
  const [categories, featured, newArrivals, deals, bestSellers, user, settings] =
    await Promise.all([
      getCategories(),
      getFeaturedProducts(8),
      getNewArrivals(8),
      getDiscountedProducts(8),
      getBestSellers(8),
      getCurrentUser(),
      getStoreSettings(),
    ]);

  const wishlistedIds = user ? await getWishlistProductIds() : [];
  const currency = settings.currency;

  return (
    <div>
      <Hero />
      <FeatureStrip />
      <CategoriesGrid categories={categories} />
      <ProductSection
        title="Featured picks"
        subtitle="Handpicked favourites our customers love"
        products={featured}
        currency={currency}
        signedIn={Boolean(user)}
        wishlistedIds={wishlistedIds}
        viewAllHref="/products?sort=featured"
      />
      <Testimonials />
      <ProductSection
        title="New arrivals"
        subtitle="Fresh drops added this week"
        products={newArrivals}
        currency={currency}
        signedIn={Boolean(user)}
        wishlistedIds={wishlistedIds}
        viewAllHref="/products?sort=newest"
      />
      {deals.length > 0 && (
        <ProductSection
          title="On sale"
          subtitle="Limited-time savings — while stocks last"
          products={deals}
          currency={currency}
          signedIn={Boolean(user)}
          wishlistedIds={wishlistedIds}
          viewAllHref="/products?sale=1"
        />
      )}
      <ProductSection
        title="Best sellers"
        subtitle="Top-rated by the NovaStore community"
        products={bestSellers}
        currency={currency}
        signedIn={Boolean(user)}
        wishlistedIds={wishlistedIds}
        viewAllHref="/products?sort=popularity"
      />
      <NewsletterSection />
    </div>
  );
}
