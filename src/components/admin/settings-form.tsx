"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { saveSettingsAction } from "@/server/actions/admin";
import type { StoreSettings } from "@/lib/settings";
import { majorToMinor, minorToMajor } from "@/lib/money";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const [storeName, setStoreName] = useState(settings.storeName);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [addressLine, setAddressLine] = useState(settings.addressLine);
  const [currency, setCurrency] = useState(settings.currency);
  const [taxPercent, setTaxPercent] = useState(String(settings.taxRateBps / 100));
  const [freeShipping, setFreeShipping] = useState(
    settings.freeShippingThreshold != null
      ? String(minorToMajor(settings.freeShippingThreshold))
      : "",
  );
  const [storeEnabled, setStoreEnabled] = useState(settings.storeEnabled);

  // Keep existing rate ids/labels/windows; only edit fees.
  const [rates, setRates] = useState(
    settings.shippingRates.map((r) => ({
      ...r,
      feeInput: String(minorToMajor(r.fee)),
    })),
  );

  function setRateFee(index: number, value: string) {
    setRates((prev) =>
      prev.map((r, i) => (i === index ? { ...r, feeInput: value } : r)),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const next: StoreSettings = {
      ...settings,
      storeName: storeName.trim() || settings.storeName,
      supportEmail: supportEmail.trim(),
      supportPhone: supportPhone.trim(),
      addressLine: addressLine.trim(),
      currency: currency.trim() || "PKR",
      taxRateBps: Math.round((Number(taxPercent) || 0) * 100),
      freeShippingThreshold:
        freeShipping.trim() === ""
          ? null
          : majorToMinor(Number(freeShipping) || 0),
      storeEnabled,
      shippingRates: rates.map((r) => ({
        id: r.id,
        label: r.label,
        description: r.description,
        fee: majorToMinor(Number(r.feeInput) || 0),
        minDays: r.minDays,
        maxDays: r.maxDays,
        freeOverSubtotal: r.freeOverSubtotal,
      })),
    };

    const res = await saveSettingsAction(next);
    setBusy(false);
    if (res.ok) {
      toast({ title: "Settings saved", description: res.message, variant: "success" });
      router.refresh();
    } else {
      toast({ title: "Save failed", description: res.message, variant: "destructive" });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold">Store identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="st-name" className="mb-2 block">Store name</Label>
            <Input id="st-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="st-currency" className="mb-2 block">Currency</Label>
            <Input id="st-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="st-email" className="mb-2 block">Support email</Label>
            <Input id="st-email" type="email" value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="st-phone" className="mb-2 block">Support phone</Label>
            <Input id="st-phone" value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="st-address" className="mb-2 block">Store address</Label>
            <Input id="st-address" value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold">Taxes &amp; shipping</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="st-tax" className="mb-2 block">Tax rate (%)</Label>
            <Input id="st-tax" inputMode="decimal" value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="st-free" className="mb-2 block">Free shipping over</Label>
            <Input id="st-free" inputMode="decimal" placeholder="Empty = never"
              value={freeShipping} onChange={(e) => setFreeShipping(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {rates.map((r, i) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-xs text-muted">
                {r.minDays}–{r.maxDays} days
              </p>
              <div className="mt-2">
                <Label htmlFor={`rate-${r.id}`} className="mb-1 block text-xs">
                  Fee
                </Label>
                <Input
                  id={`rate-${r.id}`}
                  inputMode="decimal"
                  value={r.feeInput}
                  onChange={(e) => setRateFee(i, e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold">Availability</h2>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={storeEnabled}
            onChange={(e) => setStoreEnabled(e.target.checked)}
          />
          Store accepting orders
        </label>
      </section>

      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Save settings
      </Button>
    </form>
  );
}
