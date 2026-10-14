import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  // Existing query params to preserve (page is managed separately).
  params?: Record<string, string | string[] | undefined>;
  className?: string;
}

function buildHref(
  basePath: string,
  params: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else if (value != null && value !== "") qs.set(key, value);
  }
  if (page > 1) qs.set("page", String(page));
  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Window of page numbers around the current page.
  const window: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) window.push(i);

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-10 flex items-center justify-center gap-1", className)}
    >
      {page > 1 ? (
        <Link
          href={buildHref(basePath, params, page - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-muted"
          rel="prev"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium opacity-40">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      {window.map((p) =>
        p === page ? (
          <span
            key={p}
            aria-current="page"
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(basePath, params, p)}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-muted"
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={buildHref(basePath, params, page + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-muted"
          rel="next"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="inline-flex h-9 cursor-not-allowed items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium opacity-40">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
