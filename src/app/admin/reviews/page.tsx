import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Stars } from "@/components/stars";
import { Badge } from "@/components/ui/badge";
import { ReviewModerationButtons } from "@/components/admin/review-moderation";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ filter?: string | string[] }>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filter = first(sp.filter);

  const reviews = await prisma.review.findMany({
    where:
      filter === "PENDING" || filter === "REJECTED" || filter === "APPROVED"
        ? { status: filter }
        : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { product: { select: { name: true, slug: true } } },
  });

  const tabs = [
    { key: "", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="mt-1 text-sm text-muted">
          {reviews.length} shown · moderate before they appear on the store
        </p>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/reviews?filter=${t.key}` : "/admin/reviews"}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium",
              (filter ?? "") === t.key
                ? "border-accent bg-accent-soft text-accent"
                : "border-border hover:bg-surface-muted",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars rating={r.rating} />
                  <Badge
                    variant={
                      r.status === "APPROVED"
                        ? "success"
                        : r.status === "PENDING"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {r.status}
                  </Badge>
                  {r.verified && <Badge variant="accent">Verified</Badge>}
                </div>
                {r.title && <p className="mt-1.5 font-medium">{r.title}</p>}
                <p className="mt-1 text-sm text-muted">{r.body}</p>
                <p className="mt-2 text-xs text-muted">
                  {r.authorName} ·{" "}
                  <Link
                    href={`/products/${r.product.slug}`}
                    className="text-accent hover:underline"
                  >
                    {r.product.name}
                  </Link>{" "}
                  · {new Date(r.createdAt).toLocaleDateString("en-PK")}
                </p>
              </div>
              <ReviewModerationButtons reviewId={r.id} />
            </div>
          </li>
        ))}
        {reviews.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
            No reviews match this filter.
          </li>
        )}
      </ul>
    </div>
  );
}
