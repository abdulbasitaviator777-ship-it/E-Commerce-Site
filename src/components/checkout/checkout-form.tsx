"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, Banknote, Truck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { placeOrderAction } from "@/server/actions/checkout";
import { formatMoney } from "@/lib/money";
import type { CartView } from "@/lib/cart";
import type { ShippingRate } from "@/lib/settings";
import { cn } from "@/lib/utils";

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
}

interface CheckoutFormProps {
  cart: CartView;
  rates: ShippingRate[];
  defaultEmail: string;
  savedAddresses: SavedAddress[];
  taxRateBps: number;
}

type AddressFields = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const EMPTY: AddressFields = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Pakistan",
};

export function CheckoutForm({
  cart,
  rates,
  defaultEmail,
  savedAddresses,
  taxRateBps,
}: CheckoutFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [address, setAddress] = useState<AddressFields>(EMPTY);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    savedAddresses[0]?.id ?? null,
  );
  const [shippingId, setShippingId] = useState(rates[0]?.id ?? "");
  const [payment, setPayment] = useState<"COD" | "STRIPE">("COD");
  const [notes, setNotes] = useState("");
  const [saveAddress, setSaveAddress] = useState(savedAddresses.length === 0);
  const [loading, setLoading] = useState(false);

  function chooseAddress(id: string) {
    const found = savedAddresses.find((a) => a.id === id);
    if (!found) return;
    setSelectedAddressId(id);
    setAddress({
      fullName: found.fullName,
      phone: found.phone,
      line1: found.line1,
      line2: found.line2 ?? "",
      city: found.city,
      state: found.state ?? "",
      postalCode: found.postalCode,
      country: found.country,
    });
  }

  function set<K extends keyof AddressFields>(key: K, value: string) {
    setAddress((prev) => ({ ...prev, [key]: value }));
    // Editing manually detaches from the saved-address selection.
    if (key !== "line2") setSelectedAddressId(null);
  }

  // Live shipping recompute (client preview only — server recomputes too).
  const activeRate = rates.find((r) => r.id === shippingId) ?? rates[0];
  const preview = { ...cart.totals };
  if (activeRate) {
    const free =
      activeRate.freeOverSubtotal != null &&
      cart.totals.subtotal >= activeRate.freeOverSubtotal;
    preview.shipping = free || activeRate.fee === 0 ? 0 : activeRate.fee;
    preview.freeShippingApplied = free;
    const taxable =
      Math.max(0, preview.subtotal - preview.discount) + preview.shipping;
    preview.tax = Math.floor((taxable * taxRateBps) / 10000);
    preview.total = Math.max(
      0,
      preview.subtotal - preview.discount + preview.shipping + preview.tax,
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Enter your contact email.",
        variant: "destructive",
      });
      return;
    }
    if (!shippingId) {
      toast({ title: "Delivery method required", variant: "destructive" });
      return;
    }
    setLoading(true);
    const res = await placeOrderAction({
      email: email.trim(),
      paymentMethod: payment,
      shippingMethodId: shippingId,
      address,
      notes,
      saveAddress,
    });
    setLoading(false);
    if (res.ok) {
      toast({
        title: "Order placed!",
        description: `Order ${res.orderNumber} confirmed.`,
        variant: "success",
      });
      window.dispatchEvent(new Event("cart:changed"));
      router.push(`/checkout/success?order=${encodeURIComponent(res.orderNumber)}`);
    } else {
      toast({ title: "Checkout failed", description: res.message, variant: "destructive" });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Contact */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Contact</h2>
        <div className="mt-4">
          <Label htmlFor="co-email" className="mb-2 block">Email</Label>
          <Input
            id="co-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </section>

      {/* Shipping address */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Shipping address</h2>

        {savedAddresses.length > 0 && (
          <div className="mt-4 space-y-2">
            {savedAddresses.map((a) => (
              <label
                key={a.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                  selectedAddressId === a.id
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:border-accent",
                )}
              >
                <input
                  type="radio"
                  name="saved-address"
                  className="mt-1"
                  checked={selectedAddressId === a.id}
                  onChange={() => chooseAddress(a.id)}
                />
                <span>
                  <strong>{a.fullName}</strong>
                  <span className="block text-muted">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}
                  </span>
                  <span className="block text-muted">{a.phone}</span>
                </span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="saved-address"
                checked={selectedAddressId === null}
                onChange={() => {
                  setSelectedAddressId(null);
                  setAddress(EMPTY);
                }}
              />
              Use a different address
            </label>
          </div>
        )}

        {/* Manual fields */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ad-name" className="mb-2 block">Full name</Label>
            <Input id="ad-name" required autoComplete="name" value={address.fullName}
              onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ad-phone" className="mb-2 block">Phone</Label>
            <Input id="ad-phone" required autoComplete="tel" value={address.phone}
              onChange={(e) => set("phone", e.target.value)} placeholder="+92 300 0000000" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ad-line1" className="mb-2 block">Address line 1</Label>
            <Input id="ad-line1" required autoComplete="address-line1" value={address.line1}
              onChange={(e) => set("line1", e.target.value)} placeholder="House / street" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ad-line2" className="mb-2 block">
              Address line 2 <span className="font-normal text-muted">(optional)</span>
            </Label>
            <Input id="ad-line2" autoComplete="address-line2" value={address.line2}
              onChange={(e) => set("line2", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ad-city" className="mb-2 block">City</Label>
            <Input id="ad-city" required autoComplete="address-level2" value={address.city}
              onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ad-state" className="mb-2 block">
              Province / state <span className="font-normal text-muted">(optional)</span>
            </Label>
            <Input id="ad-state" autoComplete="address-level1" value={address.state}
              onChange={(e) => set("state", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ad-postal" className="mb-2 block">Postal code</Label>
            <Input id="ad-postal" required autoComplete="postal-code" value={address.postalCode}
              onChange={(e) => set("postalCode", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ad-country" className="mb-2 block">Country</Label>
            <Input id="ad-country" required autoComplete="country-name" value={address.country}
              onChange={(e) => set("country", e.target.value)} />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)} />
          Save this address to my account
        </label>
      </section>

      {/* Delivery method */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Delivery method</h2>
        <div className="mt-4 space-y-2">
          {rates.map((rate) => {
            const free =
              rate.freeOverSubtotal != null &&
              cart.totals.subtotal >= rate.freeOverSubtotal;
            const fee = free ? 0 : rate.fee;
            return (
              <label
                key={rate.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm",
                  shippingId === rate.id
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:border-accent",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingId === rate.id}
                    onChange={() => setShippingId(rate.id)}
                  />
                  <span>
                    <strong className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4" aria-hidden="true" />
                      {rate.label}
                    </strong>
                    <span className="block text-muted">
                      {rate.description ?? `${rate.minDays}–${rate.maxDays} days`}
                    </span>
                  </span>
                </span>
                <span className="font-medium">
                  {fee === 0 ? (
                    <span className="text-success">Free</span>
                  ) : (
                    formatMoney(fee, cart.totals.currency)
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Payment */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Payment</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm",
              payment === "COD" ? "border-accent bg-accent-soft" : "border-border hover:border-accent",
            )}
          >
            <input type="radio" name="payment" checked={payment === "COD"}
              onChange={() => setPayment("COD")} />
            <Banknote className="h-4 w-4" aria-hidden="true" />
            <span>
              <strong>Cash on delivery</strong>
              <span className="block text-muted">Pay when your order arrives</span>
            </span>
          </label>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm",
              payment === "STRIPE" ? "border-accent bg-accent-soft" : "border-border hover:border-accent",
            )}
          >
            <input type="radio" name="payment" checked={payment === "STRIPE"}
              onChange={() => setPayment("STRIPE")} />
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span>
              <strong>Card (Stripe)</strong>
              <span className="block text-muted">Requires Stripe keys (see README)</span>
            </span>
          </label>
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Order notes</h2>
        <div className="mt-3">
          <Label htmlFor="co-notes" className="sr-only">Notes</Label>
          <Textarea
            id="co-notes"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Delivery instructions, gate code, etc. (optional)"
          />
        </div>
      </section>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {loading
          ? "Placing order…"
          : `Place order · ${formatMoney(preview.total, cart.totals.currency)}`}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
        Your information is encrypted and never shared.
      </p>
    </form>
  );
}
