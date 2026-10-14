import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TicketPercent,
  Star,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { LogoutButton } from "@/components/account/logout-button";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin · NovaStore" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin(user.role)) redirect("/account");

  const nav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-3">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-semibold">Admin panel</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>

          <nav aria-label="Admin" className="rounded-lg border border-border bg-surface p-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                <item.icon className="h-4 w-4 text-muted" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              View store
            </Link>
            <LogoutButton />
          </div>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
