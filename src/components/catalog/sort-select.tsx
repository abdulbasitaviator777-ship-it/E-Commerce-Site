"use client";

import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/queries/products";

// Keeps the current query params and only swaps the sort key in the URL.
export function SortSelect({ value }: { value: string }) {
  const router = useRouter();

  function onChange(next: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("sort", next);
    params.delete("page"); // reset to first page on sort change
    router.push(`${window.location.pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted" aria-hidden="true" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[190px]" aria-label="Sort products">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.key} value={opt.key}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
