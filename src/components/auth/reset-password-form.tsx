"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { resetPasswordAction } from "@/server/actions/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await resetPasswordAction({ token, password, confirmPassword: confirm });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Password updated", description: res.message, variant: "success" });
      router.push("/login");
    } else {
      setError(res.message);
    }
  }

  if (!token) {
    return (
      <p className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
        This reset link is missing its token. Request a new one.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div>
        <Label htmlFor="reset-password" className="mb-2 block">New password</Label>
        <Input
          id="reset-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">
          At least 8 characters with a letter and a number.
        </p>
      </div>
      <div>
        <Label htmlFor="reset-confirm" className="mb-2 block">Confirm new password</Label>
        <Input
          id="reset-confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Update password
      </Button>
    </form>
  );
}
