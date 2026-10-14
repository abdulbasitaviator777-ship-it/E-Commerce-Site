"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  createCouponAction,
  toggleCouponAction,
} from "@/server/actions/admin";
import { majorToMinor } from "@/lib/money";

export function CouponCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED" | "FREE_SHIPPING">("PERCENT");
  const [value, setValue] = useState("10");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // PERCENT value entered as percent → basis points; FIXED as currency → minor.
    const numeric = Number(value) || 0;
    const normalized =
      type === "PERCENT" ? Math.round(numeric * 100) : majorToMinor(numeric);
    const res = await createCouponAction({
      code,
      type,
      value: normalized,
      minSubtotal: minSubtotal.trim() ? majorToMinor(Number(minSubtotal) || 0) : null,
      usageLimit: null,
      expiresAt,
    });
    setBusy(false);
    if (res.ok) {
      toast({ title: "Coupon created", description: res.message, variant: "success" });
      setCode("");
      setValue(type === "PERCENT" ? "10" : "500");
      setMinSubtotal("");
      setExpiresAt("");
      setOpen(false);
      router.refresh();
    } else {
      toast({ title: "Could not create", description: res.message, variant: "destructive" });
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        New coupon
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-surface p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="cp-code" className="mb-2 block">Code</Label>
          <Input
            id="cp-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME10"
          />
        </div>
        <div>
          <Label htmlFor="cp-type" className="mb-2 block">Type</Label>
          <select
            id="cp-type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="PERCENT">Percent off</option>
            <option value="FIXED">Fixed amount</option>
            <option value="FREE_SHIPPING">Free shipping</option>
          </select>
        </div>
        <div>
          <Label htmlFor="cp-value" className="mb-2 block">
            {type === "PERCENT" ? "Percent" : type === "FIXED" ? "Amount" : "Value"}
          </Label>
          <Input
            id="cp-value"
            required={type !== "FREE_SHIPPING"}
            disabled={type === "FREE_SHIPPING"}
            value={type === "FREE_SHIPPING" ? "0" : value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div>
          <Label htmlFor="cp-min" className="mb-2 block">Min subtotal</Label>
          <Input
            id="cp-min"
            value={minSubtotal}
            onChange={(e) => setMinSubtotal(e.target.value)}
            inputMode="decimal"
            placeholder="Optional"
          />
        </div>
        <div>
          <Label htmlFor="cp-exp" className="mb-2 block">Expires</Label>
          <Input
            id="cp-exp"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Create coupon
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function CouponToggleButton({
  couponId,
  active,
}: {
  couponId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await toggleCouponAction(couponId);
    setBusy(false);
    if (res.ok) {
      toast({ title: "Coupon updated", description: res.message, variant: "success" });
      router.refresh();
    } else {
      toast({ title: "Failed", description: res.message, variant: "destructive" });
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={active ? "Disable coupon" : "Enable coupon"}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${
        active
          ? "border-success/50 text-success hover:bg-success-soft"
          : "border-border text-muted hover:bg-surface-muted"
      }`}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Power className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
