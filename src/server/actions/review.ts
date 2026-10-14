"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export type ReviewResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function submitReviewAction(input: unknown): Promise<ReviewResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid review.",
    };
  }

  // Reviews require an account — anonymous reviews are rejected.
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to leave a review." };
  }

  const key = await clientKey(`review:${user.id}`);
  const limited = rateLimit(key, 5, 10 * 60 * 1000); // 5 reviews / 10 min
  if (!limited.success) {
    return { ok: false, message: "Too many reviews — try again shortly." };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, active: true },
  });
  if (!product || !product.active) {
    return { ok: false, message: "Product not available." };
  }

  // One review per user per product: update existing instead of duplicating.
  const existing = await prisma.review.findFirst({
    where: { productId: product.id, userId: user.id },
  });

  // Verified purchase if the user has a delivered order containing this item.
  const deliveredOrder = await prisma.orderItem.findFirst({
    where: {
      productId: product.id,
      order: { userId: user.id, status: "DELIVERED" },
    },
    select: { id: true },
  });
  const verified = Boolean(deliveredOrder);

  const data = {
    authorName: user.name ?? user.email,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body,
    verified,
    status: "APPROVED",
  };

  if (existing) {
    await prisma.review.update({ where: { id: existing.id }, data });
  } else {
    await prisma.review.create({
      data: { ...data, productId: product.id, userId: user.id },
    });
  }

  revalidatePath(`/products/[slug]`);
  revalidatePath("/products");
  return {
    ok: true,
    message: existing
      ? "Your review has been updated."
      : "Thanks! Your review is now live.",
  };
}
