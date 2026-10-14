import { Suspense } from "react";
import { ProfileForm } from "@/components/account/profile-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function AccountContent() {
  const user = await getCurrentUser();
  if (!user) return null; // layout redirects

  const [record, orderCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.order.count({ where: { userId: user.id } }),
  ]);

  const since = record?.createdAt
    ? record.createdAt.toLocaleDateString("en-PK", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "today";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
        <p className="mt-1 text-sm text-muted">
          {orderCount} {orderCount === 1 ? "order" : "orders"} placed · Member
          since {since}
        </p>
      </div>

      <ProfileForm initialName={record?.name ?? ""} email={record?.email ?? user.email} />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">Loading account…</div>}>
      <AccountContent />
    </Suspense>
  );
}
