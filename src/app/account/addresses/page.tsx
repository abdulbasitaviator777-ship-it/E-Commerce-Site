import { Suspense } from "react";
import { AddressManager } from "@/components/account/address-manager";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function AddressesContent() {
  const user = await getCurrentUser();
  if (!user) return null; // layout redirects

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return <AddressManager addresses={addresses} />;
}

export default function AddressesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 animate-pulse">Loading addresses…</div>}>
      <AddressesContent />
    </Suspense>
  );
}
