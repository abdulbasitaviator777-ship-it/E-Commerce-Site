"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  saveAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/server/actions/account";

interface AddressRow {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const EMPTY = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Pakistan",
};

export function AddressManager({ addresses }: { addresses: AddressRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(addresses.length === 0);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await saveAddressAction(form);
    setBusy(false);
    if (res.ok) {
      toast({ title: "Address saved", description: res.message, variant: "success" });
      setForm(EMPTY);
      setAdding(false);
      router.refresh();
    } else {
      toast({ title: "Could not save", description: res.message, variant: "destructive" });
    }
  }

  async function remove(id: string) {
    setBusy(true);
    const res = await deleteAddressAction(id);
    setBusy(false);
    if (res.ok) {
      toast({ title: "Address removed", variant: "success" });
      router.refresh();
    } else {
      toast({ title: "Could not remove", description: res.message, variant: "destructive" });
    }
  }

  async function makeDefault(id: string) {
    setBusy(true);
    const res = await setDefaultAddressAction(id);
    setBusy(false);
    if (res.ok) {
      toast({ title: "Default updated", variant: "success" });
      router.refresh();
    } else {
      toast({ title: "Could not update", description: res.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Address book</h1>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add address
          </Button>
        )}
      </div>

      {addresses.length === 0 && !adding && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <MapPin className="mx-auto h-6 w-6 text-muted" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted">No saved addresses yet.</p>
        </div>
      )}

      <ul className="space-y-3">
        {addresses.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4 text-sm"
          >
            <div>
              <p className="flex items-center gap-2 font-medium">
                {a.fullName}
                {a.isDefault && <Badge variant="accent">Default</Badge>}
              </p>
              <p className="mt-1 text-muted">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.country}
              </p>
              <p className="text-muted">{a.phone}</p>
            </div>
            <div className="flex items-center gap-3">
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => makeDefault(a.id)}
                  disabled={busy}
                  className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
                >
                  Set default
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(a.id)}
                disabled={busy}
                aria-label={`Delete address of ${a.fullName}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {adding && (
        <form onSubmit={save} className="rounded-lg border border-border bg-surface p-5">
          <h2 className="font-semibold">New address</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="am-name" className="mb-2 block">Full name</Label>
              <Input id="am-name" required value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="am-phone" className="mb-2 block">Phone</Label>
              <Input id="am-phone" required value={form.phone}
                onChange={(e) => set("phone", e.target.value)} placeholder="+92 300 0000000" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="am-line1" className="mb-2 block">Address line 1</Label>
              <Input id="am-line1" required value={form.line1}
                onChange={(e) => set("line1", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="am-line2" className="mb-2 block">Address line 2</Label>
              <Input id="am-line2" value={form.line2}
                onChange={(e) => set("line2", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="am-city" className="mb-2 block">City</Label>
              <Input id="am-city" required value={form.city}
                onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="am-postal" className="mb-2 block">Postal code</Label>
              <Input id="am-postal" required value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Save address
            </Button>
            {addresses.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAdding(false);
                  setForm(EMPTY);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
