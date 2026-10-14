import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

type SearchParams = Promise<{ order?: string | string[] }>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const orderNumber = first(sp.order);

  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      })
    : null;

  const user = await getCurrentUser();
  // Guests can always view their own confirmation; signed-in orders are
  // restricted to the owning account.
  const visible = order && (!order.userId || !user || user.id === order.userId);

  if (!visible || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Order confirmation</h1>
        <p className="mt-2 text-sm text-muted">
          We could not find that order. Check your email for your order number.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/">
            <Button>Back to home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const shipping = JSON.parse(order.shippingAddress) as {
    fullName: string;
    city: string;
    line1: string;
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-soft">
          <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Thank you — your order is confirmed!
        </h1>
        <p className="mt-2 text-sm text-muted">
          Order <strong>{order.orderNumber}</strong> · A confirmation email was
          sent to {order.email}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-accent" aria-hidden="true" />
            <h2 className="font-semibold">Order details</h2>
          </div>

          <ul className="mt-4 space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
                  {item.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`/products/${item.slug}`} className="block truncate font-medium hover:underline">
                    {item.name}
                  </Link>
                  <span className="block text-xs text-muted">
                    {item.variantLabel ?? "Single variant"} · Qty {item.quantity}
                  </span>
                </span>
                <span className="font-medium">
                  {formatMoney(item.lineTotal, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatMoney(order.subtotal, order.currency)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd>−{formatMoney(order.discount, order.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping · {order.deliveryLabel}</dt>
              <dd>
                {order.shipping === 0 ? "Free" : formatMoney(order.shipping, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between pt-1 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatMoney(order.total, order.currency)}</dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5 text-sm">
            <h3 className="font-semibold">Shipping to</h3>
            <p className="mt-1 text-muted">
              {shipping.fullName}
              <br />
              {shipping.line1}
              <br />
              {shipping.city}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 text-sm">
            <h3 className="font-semibold">Payment</h3>
            <p className="mt-1 text-muted">
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Card payment"}
              <br />
              Status: {order.paymentStatus}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {user && (
          <Link href="/account/orders">
            <Button size="lg">
              Track your order
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        )}
        <Link href="/products">
          <Button size="lg" variant="outline">
            Continue shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
