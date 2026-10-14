"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { updateOrderStatusAction } from "@/server/actions/admin";
import { ORDER_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OrderStatusSelect({
  orderId,
  value,
}: {
  orderId: string;
  value: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(value);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    if (next === status) return;
    const prev = status;
    setStatus(next);
    setBusy(true);
    const res = await updateOrderStatusAction(orderId, next);
    setBusy(false);
    if (res.ok) {
      toast({ title: "Status updated", description: res.message, variant: "success" });
      router.refresh();
    } else {
      setStatus(prev);
      toast({ title: "Update failed", description: res.message, variant: "destructive" });
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => change(e.target.value)}
      disabled={busy}
      aria-label="Order status"
      className={cn(
        "h-9 rounded-lg border border-border bg-surface px-2 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        busy && "opacity-60",
      )}
    >
      {busy && <Loader2 className="hidden" aria-hidden="true" />}
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
