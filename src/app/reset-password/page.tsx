import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted">
          Your new password will sign you out of all devices.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Need a new link?{" "}
          <Link href="/forgot-password" className="font-medium text-accent hover:underline">
            Request another
          </Link>
        </p>
      </div>
    </div>
  );
}
