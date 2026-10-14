import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminProductsContent } from "@/components/admin/admin-products-content";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ page?: string | string[] }>;

export default function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4">Loading products…</div>}>
      <AdminProductsContent searchParams={searchParams} />
    </Suspense>
  );
}