"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  moderateReviewAction,
  deleteReviewAction,
} from "@/server/actions/admin";

export function ReviewModerationButtons({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(kind: "approve" | "reject" | "delete") {
    setBusy(true);
    const res =
      kind === "delete"
        ? await deleteReviewAction(reviewId)
        : await moderateReviewAction(
            reviewId,
            kind === "approve" ? "APPROVED" : "REJECTED",
          );
    setBusy(false);
    if (res.ok) {
      toast({ title: "Review updated", description: res.message, variant: "success" });
      router.refresh();
    } else {
      toast({ title: "Failed", description: res.message, variant: "destructive" });
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => act("approve")}
        disabled={busy}
        aria-label="Approve review"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-success/50 text-success hover:bg-success-soft disabled:opacity-50"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => act("reject")}
        disabled={busy}
        aria-label="Reject review"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-warning/50 text-warning hover:bg-warning-soft disabled:opacity-50"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => act("delete")}
        disabled={busy}
        aria-label="Delete review"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-danger/50 text-danger hover:bg-danger-soft disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
