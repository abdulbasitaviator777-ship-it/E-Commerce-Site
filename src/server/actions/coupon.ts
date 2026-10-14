"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getCartView } from "@/server/queries/cart";
import { evaluateCoupon } from "@/lib/cart";

const COOKIE = "ns_coupon";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function applyCouponAction(
  code: string,
): Promise<{ ok: boolean; message: string }> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, message: "Enter a coupon code." };

  const [view, user] = await Promise.all([getCartView(), getCurrentUser()]);
  if (view.lines.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  const result = await evaluateCoupon(
    trimmed,
    view.totals.subtotal,
    user?.id ?? null,
  );
  if (!result.valid) {
    return { ok: false, message: result.message ?? "Coupon not valid." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, trimmed.toUpperCase(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { ok: true, message: `Coupon ${trimmed.toUpperCase()} applied.` };
}

export async function removeCouponAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
