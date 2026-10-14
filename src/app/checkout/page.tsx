import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutContent } from "@/components/checkout/checkout-content";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your NovaStore order.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 animate-pulse">Loading checkout…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}