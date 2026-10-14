"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { toggleCustomerRoleAction } from "@/server/actions/admin";

export function RoleToggleButton({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await toggleCustomerRoleAction(userId);
    setBusy(false);
    if (res.ok) {
      toast({ title: "Role updated", description: res.message, variant: "success" });
      router.refresh();
    } else {
      toast({ title: "Failed", description: res.message, variant: "destructive" });
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || disabled}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface-muted disabled:opacity-50"
    >
      {busy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
      {role === "ADMIN" ? "Demote" : "Promote"}
    </button>
  );
}
