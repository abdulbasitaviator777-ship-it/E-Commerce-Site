import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOrdersContent } from "@/components/admin/admin-orders-content";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ page?: string | string[] }>;

export default function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4">Loading orders…</div>}>
      <AdminOrdersContent searchParams={searchParams} />
    </Suspense>
  );
}