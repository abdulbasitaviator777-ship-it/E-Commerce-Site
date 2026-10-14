"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketPercent, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { applyCouponAction, removeCouponAction } from "@/server/actions/coupon";

export function CouponForm({
  appliedCode,
  message,
  valid,
}: {
  appliedCode: string | null;
  message: string | null;
  valid: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    const res = await applyCouponAction(code.trim());
    setLoading(false);
    if (res.ok) {
      toast({ title: "Coupon applied", description: res.message, variant: "success" });
      setCode("");
      router.refresh();
    } else {
      toast({ title: "Coupon rejected", description: res.message, variant: "destructive" });
    }
  }

  async function remove() {
    setLoading(true);
    await removeCouponAction();
    setLoading(false);
    toast({ title: "Coupon removed" });
    router.refresh();
  }

  if (appliedCode && valid) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-success/40 bg-success-soft px-3 py-2 text-sm">
        <span className="flex items-center gap-2">
          <TicketPercent className="h-4 w-4 text-success" aria-hidden="true" />
          <strong>{appliedCode}</strong> applied
        </span>
        <button
          type="button"
          onClick={remove}
          disabled={loading}
          aria-label="Remove coupon"
          className="text-muted hover:text-foreground"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <X className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="coupon-code" className="sr-only">
          Coupon code
        </label>
        <Input
          id="coupon-code"
          placeholder="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" variant="outline" disabled={loading || !code.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <TicketPercent className="h-4 w-4" aria-hidden="true" />
          )}
          Apply
        </Button>
      </div>
      {message && !valid && (
        <p className="text-xs text-danger" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
