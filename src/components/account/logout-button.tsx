"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/account";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await logoutAction();
    } catch (err) {
      // redirect() throws internally — rethrow NEXT_REDIRECT so it completes.
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 text-sm font-medium text-danger hover:underline disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden="true" />
      )}
      Sign out
    </button>
  );
}
