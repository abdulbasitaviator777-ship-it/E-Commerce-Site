"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { getCategories } from "@/lib/queries/products";

type Categories = Awaited<ReturnType<typeof getCategories>>;

export function HeaderNav({ categories }: { categories: Categories }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav aria-label="Primary" className="hidden lg:block">
        <ul className="flex items-center gap-1">
          <li>
            <Link
              href="/products"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              All Products
            </Link>
          </li>
          {categories.slice(0, 6).map((c) => (
            <li key={c.id}>
              <Link
                href={`/categories/${c.slug}`}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile toggle */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[104px] z-40 max-h-[70vh] overflow-y-auto border-b border-border bg-surface p-4 shadow-lg lg:hidden">
          <ul className="grid gap-1">
            <li>
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                All Products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categories/${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-surface-muted"
                >
                  {c.name}
                  <span className="text-xs text-muted">{c._count.products}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

