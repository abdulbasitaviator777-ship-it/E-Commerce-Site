import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { CartLines } from "@/components/cart/cart-lines";
import { CouponForm } from "@/components/cart/coupon-form";
import { Button } from "@/components/ui/button";
import { getCartView } from "@/server/queries/cart";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the items in your shopping cart.",
};

export default async function CartPage() {
  const cookieStore = await cookies();
  const couponCode = cookieStore.get("ns_coupon")?.value ?? null;

  const cart = await getCartView({ couponCode });
  const { totals } = cart;

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-muted">
          <ShoppingBag className="h-7 w-7 text-muted" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted">
          Browse the catalogue and add something you love.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/products">
            <Button size="lg">
              Start shopping
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Your cart{" "}
        <span className="text-base font-normal text-muted">
          ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <CartLines lines={cart.lines} currency={totals.currency} />

        {/* Order summary */}
        <aside className="h-fit space-y-4 rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-32">
          <h2 className="text-lg font-semibold">Order summary</h2>

          <CouponForm
            appliedCode={cart.couponCode}
            message={cart.couponMessage}
            valid={cart.couponValid}
          />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium">
                {formatMoney(totals.subtotal, totals.currency)}
              </dd>
            </div>

            {totals.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount{cart.couponCode ? ` (${cart.couponCode})` : ""}</dt>
                <dd>−{formatMoney(totals.discount, totals.currency)}</dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-muted">
                Shipping
                {totals.shippingRate ? ` · ${totals.shippingRate.label}` : ""}
              </dt>
              <dd className="font-medium">
                {totals.freeShippingApplied || totals.shipping === 0 ? (
                  <span className="text-success">Free</span>
                ) : (
                  formatMoney(totals.shipping, totals.currency)
                )}
              </dd>
            </div>

            {totals.tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd className="font-medium">
                  {formatMoney(totals.tax, totals.currency)}
                </dd>
              </div>
            )}

            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatMoney(totals.total, totals.currency)}</dd>
            </div>
          </dl>

          {!totals.freeShippingApplied &&
            totals.shippingRate?.freeOverSubtotal != null && (
              <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent">
                Add{" "}
                {formatMoney(
                  Math.max(
                    0,
                    totals.shippingRate.freeOverSubtotal - totals.subtotal,
                  ),
                  totals.currency,
                )}{" "}
                more for free shipping.
              </p>
            )}

          <Link href="/checkout" className="block">
            <Button size="lg" className="w-full">
              Proceed to checkout
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>

          <Link href="/products" className="block text-center text-sm text-accent hover:underline">
            Continue shopping
          </Link>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Secure checkout · easy 14-day returns
          </p>
        </aside>
      </div>
    </div>
  );
}
