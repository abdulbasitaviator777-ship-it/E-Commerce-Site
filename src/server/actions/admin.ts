"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isAdmin, ORDER_STATUSES } from "@/lib/constants";
import { saveStoreSettings, type StoreSettings } from "@/lib/settings";

async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user.role)) throw new Error("Forbidden");
  return user;
}

function ok(message: string) {
  return { ok: true as const, message };
}
function fail(message: string, fieldErrors?: Record<string, string>) {
  return { ok: false as const, message, fieldErrors };
}

// --- Orders ----------------------------------------------------------------

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  note?: string,
) {
  await requireAdmin();
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return fail("Invalid status.");
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return fail("Order not found.");

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.orderStatusHistory.create({
      data: { orderId, status, note: note ?? null },
    }),
  ]);

  // Delivered orders also mark their payment as paid (COD flow).
  if (status === "DELIVERED" && order.paymentMethod === "COD") {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    });
    await prisma.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "PAID" },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  return ok(`Order marked ${status}.`);
}

// --- Products --------------------------------------------------------------

const productEditSchema = z.object({
  id: z.string().min(1),
  price: z.coerce.number().int().min(0),
  salePrice: z.coerce.number().int().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0),
  active: z.boolean(),
  featured: z.boolean(),
});

export async function updateProductAction(input: unknown) {
  await requireAdmin();
  const parsed = productEditSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Check the product fields.");
  }
  const { id, ...data } = parsed.data;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return fail("Product not found.");

  await prisma.product.update({
    where: { id },
    data: {
      price: data.price,
      salePrice: data.salePrice && data.salePrice > 0 ? data.salePrice : null,
      stock: data.stock,
      active: data.active,
      featured: data.featured,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return ok("Product updated.");
}

// --- Reviews ---------------------------------------------------------------

export async function moderateReviewAction(
  reviewId: string,
  status: "APPROVED" | "REJECTED" | "PENDING",
) {
  await requireAdmin();
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return fail("Review not found.");
  await prisma.review.update({ where: { id: reviewId }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  revalidatePath("/products");
  return ok(`Review ${status.toLowerCase()}.`);
}

export async function deleteReviewAction(reviewId: string) {
  await requireAdmin();
  await prisma.review.deleteMany({ where: { id: reviewId } });
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  return ok("Review deleted.");
}

// --- Coupons ---------------------------------------------------------------

const couponSchema = z.object({
  code: z.string().trim().min(3).max(30).transform((v) => v.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.coerce.number().int().min(0),
  minSubtotal: z.coerce.number().int().min(0).nullable().optional(),
  maxDiscount: z.coerce.number().int().min(0).nullable().optional(),
  usageLimit: z.coerce.number().int().min(1).nullable().optional(),
  expiresAt: z.string().optional().or(z.literal("")),
});

export async function createCouponAction(input: unknown) {
  await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Check the coupon form.",
    );
  }
  const d = parsed.data;
  if (d.type === "PERCENT" && d.value > 10000) {
    return fail("Percentage cannot exceed 100% (10000 bps).");
  }
  const exists = await prisma.coupon.findUnique({ where: { code: d.code } });
  if (exists) return fail("A coupon with this code already exists.");

  await prisma.coupon.create({
    data: {
      code: d.code,
      type: d.type,
      value: d.value,
      minSubtotal: d.minSubtotal ?? null,
      maxDiscount: d.maxDiscount ?? null,
      usageLimit: d.usageLimit ?? null,
      expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      active: true,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/coupons");
  return ok(`Coupon ${d.code} created.`);
}

export async function toggleCouponAction(couponId: string) {
  await requireAdmin();
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) return fail("Coupon not found.");
  await prisma.coupon.update({
    where: { id: couponId },
    data: { active: !coupon.active },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/coupons");
  return ok(`Coupon ${coupon.code} ${coupon.active ? "disabled" : "enabled"}.`);
}

// --- Settings --------------------------------------------------------------

export async function saveSettingsAction(settings: StoreSettings) {
  await requireAdmin();
  // Only allow known scalar fields; keep shipping rates as provided (validated
  // shape by the caller form).
  if (!settings || typeof settings.storeName !== "string") {
    return fail("Invalid settings payload.");
  }
  if (settings.taxRateBps < 0 || settings.taxRateBps > 10000) {
    return fail("Tax rate must be between 0 and 100%.");
  }
  await saveStoreSettings(settings);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  return ok("Settings saved.");
}

// --- Customers -------------------------------------------------------------

export async function toggleCustomerRoleAction(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return fail("You cannot change your own role.");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return fail("User not found.");
  await prisma.user.update({
    where: { id: userId },
    data: { role: user.role === "ADMIN" ? "CUSTOMER" : "ADMIN" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  return ok(`Role updated for ${user.email}.`);
}
