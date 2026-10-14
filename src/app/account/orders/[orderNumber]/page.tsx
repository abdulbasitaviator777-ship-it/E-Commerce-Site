import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

type Params = Promise<{ orderNumber: string }>;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning-soft text-warning",
  CONFIRMED: "bg-accent-soft text-accent",
  PROCESSING: "bg-accent-soft text-accent",
  SHIPPED: "bg-accent-soft text-accent",
  DELIVERED: "bg-success-soft text-success",
  CANCELLED: "bg-danger-soft text-danger",
  REFUNDED: "bg-surface-muted text-muted",
};

async function OrderDetailContent({ params }: { params: Params }) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: true,
      coupon: true,
    },
  });
  if (!order || order.userId !== user.id) notFound();

  const address = JSON.parse(order.shippingAddress) as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-PK", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium",
            STATUS_STYLES[order.status] ?? "bg-surface-muted text-muted",
          )}
        >
          {order.status}
        </span>
      </div>

      {/* Items */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold">Items</h2>
        <ul className="mt-3 divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 text-sm first:pt-0 last:pb-0">
              <span className="h-14 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
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
                  {item.variantLabel ?? "Single variant"} · {item.sku}
                </span>
              </span>
              <span className="shrink-0 text-muted">× {item.quantity}</span>
              <span className="shrink-0 font-medium">
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
              <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
              <dd>−{formatMoney(order.discount, order.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Shipping · {order.deliveryLabel}</dt>
            <dd>
              {order.shipping === 0 ? "Free" : formatMoney(order.shipping, order.currency)}
            </dd>
          </div>
          {order.tax > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Tax</dt>
              <dd>{formatMoney(order.tax, order.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatMoney(order.total, order.currency)}</dd>
          </div>
        </dl>
      </section>

      {/* Shipping + payment */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-5 text-sm">
          <h2 className="font-semibold">Shipping address</h2>
          <p className="mt-2 text-muted">
            {address.fullName}
            <br />
            {address.line1}
            {address.line2 ? <><br />{address.line2}</> : null}
            <br />
            {address.city}
            {address.postalCode ? `, ${address.postalCode}` : ""}
            <br />
            {address.country}
            <br />
            {address.phone}
          </p>
        </section>

        <section className="rounded-lg border border-border bg-surface p-5 text-sm">
          <h2 className="font-semibold">Payment</h2>
          <p className="mt-2 text-muted">
            Method: {order.paymentMethod === "COD" ? "Cash on delivery" : "Card"}
            <br />
            Status: {order.paymentStatus}
            {order.payments[0]?.reference && (
              <>
                <br />
                Ref: {order.payments[0].reference}
              </>
            )}
          </p>
        </section>
      </div>

      {/* Timeline */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold">Status history</h2>
        <ol className="mt-3 space-y-3">
          {order.statusHistory.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>
                <strong>{entry.status}</strong>
                {entry.note && <span className="text-muted"> — {entry.note}</span>}
                <span className="block text-xs text-muted">
                  {new Date(entry.createdAt).toLocaleString("en-PK")}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Link href="/account/orders" className="inline-block text-sm text-accent hover:underline">
        ← Back to orders
      </Link>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">Loading order…</div>}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
