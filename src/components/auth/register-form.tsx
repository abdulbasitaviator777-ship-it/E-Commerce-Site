"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/server/actions/auth";

type FieldErrors = Record<string, string>;

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFields({});
    try {
      const res = await registerAction({ name, email, password, confirmPassword: confirm });
      if (res && res.ok === false) {
        setError(res.message);
        setFields(res.fieldErrors ?? {});
      }
      // On success the server action redirects to /account.
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div>
        <Label htmlFor="reg-name" className="mb-2 block">Full name</Label>
        <Input id="reg-name" required autoComplete="name" value={name}
          onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(fields.name)} />
        {fields.name && <p className="mt-1 text-xs text-danger">{fields.name}</p>}
      </div>

      <div>
        <Label htmlFor="reg-email" className="mb-2 block">Email</Label>
        <Input id="reg-email" type="email" required autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(fields.email)} />
        {fields.email && <p className="mt-1 text-xs text-danger">{fields.email}</p>}
      </div>

      <div>
        <Label htmlFor="reg-password" className="mb-2 block">Password</Label>
        <Input id="reg-password" type="password" required autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(fields.password)} />
        <p className="mt-1 text-xs text-muted">
          At least 8 characters with a letter and a number.
        </p>
        {fields.password && <p className="mt-1 text-xs text-danger">{fields.password}</p>}
      </div>

      <div>
        <Label htmlFor="reg-confirm" className="mb-2 block">Confirm password</Label>
        <Input id="reg-confirm" type="password" required autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={Boolean(fields.confirmPassword)} />
        {fields.confirmPassword && (
          <p className="mt-1 text-xs text-danger">{fields.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Create account
      </Button>
    </form>
  );
}
