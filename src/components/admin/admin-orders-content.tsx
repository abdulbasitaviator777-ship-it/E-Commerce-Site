import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { Pagination } from "@/components/pagination";

type SearchParams = Promise<{ page?: string | string[] }>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function AdminOrdersContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(first(sp.page) ?? 1));
  const perPage = 15;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        items: { select: { name: true }, take: 2 },
        user: { select: { name: true } },
      },
    }),
    prisma.order.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted">{total} orders total</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Placed</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-surface-muted/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="font-mono font-medium text-accent hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="block max-w-40 truncate">
                    {order.user?.name ?? order.email}
                  </span>
                  <span className="block max-w-40 truncate text-xs text-muted">
                    {order.email}
                  </span>
                </td>
                <td className="max-w-48 truncate px-4 py-3 text-muted">
                  {order.items.map((i) => i.name).join(", ")}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatMoney(order.total, order.currency)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {new Date(order.createdAt).toLocaleDateString("en-PK", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusSelect orderId={order.id} value={order.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/orders" params={{}} />
    </div>
  );
}