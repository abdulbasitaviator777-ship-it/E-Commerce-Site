import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import {
  CouponCreateForm,
  CouponToggleButton,
} from "@/components/admin/coupon-forms";

export const metadata: Metadata = {
  title: "Coupons",
  robots: { index: false, follow: false },
};

function describeCoupon(c: {
  type: string;
  value: number;
  minSubtotal: number | null;
}): string {
  if (c.type === "PERCENT") return `${c.value / 100}% off`;
  if (c.type === "FIXED") return `${formatMoney(c.value, "PKR")} off`;
  return "Free shipping";
}

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true, orders: true } } },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
        <p className="mt-1 text-sm text-muted">
          {coupons.length} coupon{coupons.length === 1 ? "" : "s"}
        </p>
      </div>

      <CouponCreateForm />

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Min spend</th>
              <th className="px-4 py-3 font-medium">Used</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c) => {
              const expired = c.expiresAt != null && c.expiresAt < new Date();
              return (
                <tr key={c.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">{describeCoupon(c)}</td>
                  <td className="px-4 py-3 text-muted">
                    {c.minSubtotal != null
                      ? formatMoney(c.minSubtotal, "PKR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.usedCount}
                    {c.usageLimit != null && ` / ${c.usageLimit}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {c.expiresAt
                      ? c.expiresAt.toLocaleDateString("en-PK")
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        !c.active
                          ? "danger"
                          : expired
                            ? "warning"
                            : "success"
                      }
                    >
                      {!c.active ? "Disabled" : expired ? "Expired" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <CouponToggleButton couponId={c.id} active={c.active} />
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No coupons yet — create your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
