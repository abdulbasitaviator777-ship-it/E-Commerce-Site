import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { getStoreSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

export default async function AdminDashboardPage() {

  const [
    revenueAgg,
    orderCount,
    customerCount,
    pendingOrders,
    lowStockProducts,
    recentOrders,
    settings,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { stock: "asc" },
      take: 5,
      select: { id: true, name: true, slug: true, stock: true, lowStockThreshold: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        email: true,
      },
    }),
    getStoreSettings(),
  ]);

  const revenue30d = revenueAgg._sum.total ?? 0;
  const currency = settings.currency;

  const stats = [
    { label: "Revenue (30d)", value: formatMoney(revenue30d, currency) },
    { label: "Total orders", value: String(orderCount) },
    { label: "Customers", value: String(customerCount) },
    { label: "Pending orders", value: String(pendingOrders) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <section className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border text-sm">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <Link
                    href={`/admin/orders?order=${o.orderNumber}`}
                    className="block truncate font-mono font-medium hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                  <span className="block truncate text-xs text-muted">{o.email}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-medium">
                    {formatMoney(o.total, o.currency)}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      o.status === "DELIVERED" && "text-success",
                      o.status === "PENDING" && "text-warning",
                      (o.status === "CANCELLED" || o.status === "REFUNDED") &&
                        "text-danger",
                    )}
                  >
                    {o.status}
                  </span>
                </span>
              </li>
            ))}
            {recentOrders.length === 0 && (
              <li className="py-3 text-sm text-muted">No orders yet.</li>
            )}
          </ul>
        </section>

        {/* Low stock */}
        <section className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Low stock</h2>
            <Link href="/admin/products" className="text-sm text-accent hover:underline">
              Manage
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border text-sm">
            {lowStockProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link
                  href={`/products/${p.slug}`}
                  className="min-w-0 truncate hover:underline"
                >
                  {p.name}
                </Link>
                <span
                  className={cn(
                    "shrink-0 font-medium",
                    p.stock <= 0
                      ? "text-danger"
                      : p.stock <= p.lowStockThreshold
                        ? "text-warning"
                        : "text-success",
                  )}
                >
                  {p.stock} in stock
                </span>
              </li>
            ))}
            {lowStockProducts.length === 0 && (
              <li className="py-3 text-sm text-muted">All products stocked up.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
