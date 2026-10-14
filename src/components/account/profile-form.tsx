"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  updateProfileAction,
  changePasswordAction,
} from "@/server/actions/account";

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const res = await updateProfileAction({ name });
    setSavingName(false);
    if (res.ok) {
      toast({ title: "Profile updated", description: res.message, variant: "success" });
      router.refresh();
    } else {
      toast({ title: "Update failed", description: res.message, variant: "destructive" });
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    const res = await changePasswordAction({ currentPassword, newPassword });
    setSavingPassword(false);
    if (res.ok) {
      toast({ title: "Password changed", description: res.message, variant: "success" });
      setCurrentPassword("");
      setNewPassword("");
    } else {
      toast({ title: "Change failed", description: res.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Profile</h2>
        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="pf-email" className="mb-2 block">Email</Label>
            <Input id="pf-email" value={email} disabled aria-describedby="pf-email-hint" />
            <p id="pf-email-hint" className="mt-1 text-xs text-muted">
              Your sign-in email cannot be changed.
            </p>
          </div>
          <div>
            <Label htmlFor="pf-name" className="mb-2 block">Full name</Label>
            <Input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <Button type="submit" disabled={savingName || name.trim() === initialName}>
            {savingName && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save changes
          </Button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Change password</h2>
        <form onSubmit={savePassword} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="pw-current" className="mb-2 block">Current password</Label>
            <Input
              id="pw-current"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pw-new" className="mb-2 block">New password</Label>
            <Input
              id="pw-new"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">
              At least 8 characters with a letter and a number.
            </p>
          </div>
          <Button type="submit" variant="outline" disabled={savingPassword}>
            {savingPassword && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Update password
          </Button>
        </form>
      </section>
    </div>
  );
}
