import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "Verify email",
  robots: { index: false },
};

type SearchParams = Promise<{ token?: string | string[] }>;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const token = Array.isArray(sp.token) ? sp.token[0] : sp.token;

  const result = token
    ? await verifyEmailAction(token)
    : { ok: false as const, message: "Missing verification token." };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <span
        className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
          result.ok ? "bg-success-soft" : "bg-danger-soft"
        }`}
      >
        {result.ok ? (
          <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
        ) : (
          <XCircle className="h-8 w-8 text-danger" aria-hidden="true" />
        )}
      </span>
      <h1 className="mt-4 text-2xl font-bold">
        {result.ok ? "Email verified!" : "Verification failed"}
      </h1>
      <p className="mt-2 text-sm text-muted">{result.message}</p>
      <div className="mt-6 flex justify-center">
        <Link href={result.ok ? "/account" : "/login"}>
          <Button>{result.ok ? "Go to my account" : "Back to sign in"}</Button>
        </Link>
      </div>
    </div>
  );
}
