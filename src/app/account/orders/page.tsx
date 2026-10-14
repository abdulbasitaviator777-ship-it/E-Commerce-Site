import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Suspense } from "react";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My orders",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning-soft text-warning",
  CONFIRMED: "bg-accent-soft text-accent",
  PROCESSING: "bg-accent-soft text-accent",
  SHIPPED: "bg-accent-soft text-accent",
  DELIVERED: "bg-success-soft text-success",
  CANCELLED: "bg-danger-soft text-danger",
  REFUNDED: "bg-surface-muted text-muted",
};

async function OrdersContent() {
  const user = await getCurrentUser();
  if (!user) return null; // layout redirects

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { take: 3 } },
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-muted">
          <Package className="h-6 w-6 text-muted" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-bold">No orders yet</h1>
        <p className="mt-1 text-sm text-muted">
          When you place an order it will show up here.
        </p>
        <Link href="/products" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Start shopping →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My orders</h1>
        <p className="mt-1 text-sm text-muted">
          {orders.length} {orders.length === 1 ? "order" : "orders"} total
        </p>
      </div>

      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/account/orders/${order.orderNumber}`}
              className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold">
                  {order.orderNumber}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    STATUS_STYLES[order.status] ?? "bg-surface-muted text-muted",
                  )}
                >
                  {order.status}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <span>
                  {new Date(order.createdAt).toLocaleDateString("en-PK", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "item" : "items"}
                  {" · "}
                  {order.deliveryLabel}
                </span>
                <span className="font-semibold text-foreground">
                  {formatMoney(order.total, order.currency)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">Loading orders…</div>}>
      <OrdersContent />
    </Suspense>
  );
}
