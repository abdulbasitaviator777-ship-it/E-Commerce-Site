import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { User, Package, MapPin, Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/account/logout-button";

export const metadata: Metadata = {
  title: "My account",
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const nav = [
    { href: "/account", label: "Profile", icon: User },
    { href: "/account/orders", label: "Orders", icon: Package },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="truncate text-sm font-semibold">{user.name ?? "Customer"}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
              >
                Admin dashboard →
              </Link>
            )}
          </div>

          <nav aria-label="Account" className="rounded-lg border border-border bg-surface p-2">
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

          <div className="rounded-lg border border-border bg-surface p-4">
            <LogoutButton />
          </div>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
