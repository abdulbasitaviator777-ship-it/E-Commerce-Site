import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { formatMoney } from "@/lib/money";
import { getCartView } from "@/server/queries/cart";
import { getStoreSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function CheckoutContent() {
  const cookieStore = await cookies();
  const couponCode = cookieStore.get("ns_coupon")?.value ?? null;

  const [cart, settings, user] = await Promise.all([
    getCartView({ couponCode }),
    getStoreSettings(),
    getCurrentUser(),
  ]);

  // Nothing to buy → back to cart.
  if (cart.lines.length === 0) {
    redirect("/cart");
  }

  const savedAddresses = user
    ? await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        take: 4,
      })
    : [];

  const { totals } = cart;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        <span className="flex items-center gap-1 text-xs text-muted">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Secure
        </span>
      </div>

      {!user && (
        <p className="mb-6 rounded-lg border border-border bg-accent-soft px-4 py-3 text-sm">
          Checking out as a guest.{" "}
          <Link href="/login?next=/checkout" className="font-medium text-accent hover:underline">
            Sign in
          </Link>{" "}
          to use saved addresses and track orders easily.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <CheckoutForm
          cart={cart}
          rates={settings.shippingRates}
          defaultEmail={user?.email ?? ""}
          savedAddresses={savedAddresses}
          taxRateBps={settings.taxRateBps}
        />

        {/* Summary */}
        <aside className="h-fit space-y-4 rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-32">
          <h2 className="text-lg font-semibold">Order summary</h2>

          <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3 text-sm">
                <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-surface-muted">
                  {line.product.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={line.product.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-muted">N/A</span>
                  )}
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                    {line.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {line.product.name}
                  </span>
                  {line.variant && (
                    <span className="block text-xs text-muted">
                      {line.variant.name}: {line.variant.value}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-medium">
                  {formatMoney(line.lineTotal, totals.currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium">
                {formatMoney(totals.subtotal, totals.currency)}
              </dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd>−{formatMoney(totals.discount, totals.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="font-medium">
                {totals.shipping === 0 ? (
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

          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Buyer protection · easy 14-day returns
          </p>
        </aside>
      </div>
    </div>
  );
}