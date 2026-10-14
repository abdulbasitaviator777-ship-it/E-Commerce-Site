import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { RoleToggleButton } from "@/components/admin/role-toggle";
import { Pagination } from "@/components/pagination";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ page?: string | string[] }>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(first(sp.page) ?? 1));
  const perPage = 20;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-muted">{total} accounts</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-muted/50">
                <td className="px-4 py-3">
                  <span className="block font-medium">{u.name ?? "—"}</span>
                  <span className="block text-xs text-muted">
                    {u.email}
                    {!u.emailVerified && " · unverified"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === "ADMIN" ? "accent" : "secondary"}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">{u._count.orders}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {new Date(u.createdAt).toLocaleDateString("en-PK", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <RoleToggleButton
                    userId={u.id}
                    role={u.role}
                    disabled={false}
                  />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/customers" params={{}} />
    </div>
  );
}
