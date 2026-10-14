"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { searchSuggestions } from "@/lib/queries/products";
import { formatMoney } from "@/lib/money";
import { effectivePrice } from "@/lib/queries/products";

export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<
    Awaited<ReturnType<typeof searchSuggestions>>
  >([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (term.trim().length < 2) {
        setResults([]);
        return;
      }
      const data = await searchSuggestions(term, 6);
      if (active) setResults(data);
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [term]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    if (term.trim()) {
      router.push(`/search?q=${encodeURIComponent(term.trim())}`);
    }
  }

  return (
    <div ref={boxRef} className="relative hidden md:block">
      <form onSubmit={onSubmit} role="search" className="relative">
        <label htmlFor="header-search" className="sr-only">
          Search products
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          id="header-search"
          type="search"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products…"
          autoComplete="off"
          className="h-10 w-48 rounded-lg border border-border bg-surface pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-64"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {open && results.length > 0 && (
        <div className="absolute left-0 top-12 z-50 w-72 overflow-hidden rounded-lg border border-border bg-surface shadow-lg lg:w-80">
          <ul className="divide-y divide-border">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/products/${r.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-2 hover:bg-surface-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.images[0]?.url ?? ""}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                  <span className="flex-1 truncate text-sm">{r.name}</span>
                  <span className="text-sm font-medium">
                    {formatMoney(effectivePrice(r), "PKR")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/search?q=${encodeURIComponent(term.trim())}`}
            onClick={() => setOpen(false)}
            className="block border-t border-border p-2 text-center text-sm font-medium text-accent hover:bg-surface-muted"
          >
            View all results
          </Link>
        </div>
      )}
    </div>
  );
}
