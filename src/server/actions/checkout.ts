"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCartView, resolveCartId } from "@/server/queries/cart";
import { getStoreSettings, findShippingRate } from "@/lib/settings";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { emailSchema, addressSchema } from "@/lib/validation";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Stripe keys are intentionally optional: without them, card payments are
// rejected at checkout and only Cash on Delivery is available (documented in
// the README).
const STRIPE_CONFIGURED = Boolean(process.env.STRIPE_SECRET_KEY);

const checkoutSchema = z.object({
  email: emailSchema,
  paymentMethod: z.enum(["COD", "STRIPE"]),
  shippingMethodId: z.string().min(1, "Choose a delivery method."),
  address: z.object({
    fullName: addressSchema.shape.fullName,
    phone: addressSchema.shape.phone,
    line1: addressSchema.shape.line1,
    line2: addressSchema.shape.line2,
    city: addressSchema.shape.city,
    state: addressSchema.shape.state,
    postalCode: addressSchema.shape.postalCode,
    country: addressSchema.shape.country,
  }),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  // When true and the user is signed in, persist the address to their book.
  saveAddress: z.boolean().optional(),
});

export type CheckoutResult =
  | { ok: true; orderNumber: string }
  | { ok: false; message: string };

function generateOrderNumber(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NS-${time}-${rand}`;
}

export async function placeOrderAction(input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }
  const data = parsed.data;

  const user = await getCurrentUser();

  const limit = rateLimit(
    await clientKey(user ? `checkout:${user.id}` : "checkout:guest"),
    10,
    60 * 60 * 1000,
  );
  if (!limit.success) {
    return { ok: false, message: "Too many checkout attempts. Try again later." };
  }

  if (data.paymentMethod === "STRIPE" && !STRIPE_CONFIGURED) {
    return {
      ok: false,
      message:
        "Card payments are not configured yet — please choose Cash on Delivery.",
    };
  }

  const cookieStore = await cookies();
  const couponCode = cookieStore.get("ns_coupon")?.value ?? null;

  const [cart, cartId, settings] = await Promise.all([
    getCartView({ couponCode, shippingMethodId: data.shippingMethodId }),
    resolveCartId(),
    getStoreSettings(),
  ]);

  if (!settings.storeEnabled) {
    return { ok: false, message: "The store is temporarily not accepting orders." };
  }

  if (!cartId || cart.lines.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  const rate = findShippingRate(settings, data.shippingMethodId);
  if (!rate) {
    return { ok: false, message: "Invalid delivery method." };
  }

  const { totals } = cart;
  const orderNumber = generateOrderNumber();

  try {
    await prisma.$transaction(async (tx) => {
      // Re-verify and decrement stock atomically — never trust stale data.
      for (const line of cart.lines) {
        if (line.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: { id: line.variantId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(
              `Not enough stock for "${line.product.name}" (${line.variant?.value}).`,
            );
          }
        } else {
          const updated = await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`Not enough stock for "${line.product.name}".`);
          }
        }
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          email: data.email.toLowerCase(),
          status: "PENDING",
          paymentStatus: data.paymentMethod === "COD" ? "PENDING" : "PENDING",
          paymentMethod: data.paymentMethod,
          deliveryMethod: rate.id,
          deliveryLabel: rate.label,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          tax: totals.tax,
          total: totals.total,
          currency: totals.currency,
          couponCode: cart.couponValid ? cart.couponCode : null,
          shippingAddress: JSON.stringify(data.address),
          notes: data.notes || null,
        },
      });

      for (const line of cart.lines) {
        // Snapshot the SKU for historical accuracy.
        const productRow = await tx.product.findUnique({
          where: { id: line.productId },
          select: { sku: true },
        });
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: line.productId,
            variantId: line.variantId,
            name: line.product.name,
            slug: line.product.slug,
            imageUrl: line.product.imageUrl,
            variantLabel: line.variant
              ? `${line.variant.name}: ${line.variant.value}`
              : null,
            sku: productRow?.sku ?? "N/A",
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          },
        });
      }

      // Payment record (COD collects on delivery; Stripe marks pending).
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: data.paymentMethod,
          status: "PENDING",
          amount: totals.total,
          currency: totals.currency,
          reference:
            data.paymentMethod === "COD" ? null : "pi_pending_configuration",
        },
      });

      // Order lifecycle audit entry.
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "PENDING", note: "Order placed." },
      });

      // Consume coupon usage (validated earlier by evaluateCoupon).
      if (cart.couponValid && cart.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: cart.couponCode },
        });
        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
          await tx.couponRedemption.create({
            data: {
              couponId: coupon.id,
              userId: user?.id ?? null,
              orderId: order.id,
            },
          });
        }
      }

      // Empty the cart now that it became an order.
      await tx.cartItem.deleteMany({ where: { cartId } });

      // Optionally persist the address for signed-in customers.
      if (user && data.saveAddress) {
        await tx.address.create({
          data: {
            userId: user.id,
            fullName: data.address.fullName,
            phone: data.address.phone,
            line1: data.address.line1,
            line2: data.address.line2 || null,
            city: data.address.city,
            state: data.address.state || null,
            postalCode: data.address.postalCode,
            country: data.address.country,
          },
        });
      }
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not place the order.";
    return { ok: false, message };
  }

  // Clear the applied coupon now that it has been consumed.
  cookieStore.delete("ns_coupon");

  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/account");

  // Fire-and-forget confirmation (SMTP optional — logs in dev).
  sendOrderConfirmationEmail(
    data.email.toLowerCase(),
    orderNumber,
    totals.total,
    totals.currency,
  ).catch(() => {});

  return { ok: true, orderNumber };
}
