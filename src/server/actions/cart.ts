"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  ensureGuestToken,
  getGuestToken,
} from "@/lib/auth";

// Resolve the current cart for the active visitor. Signed-in users get a
// user cart; guests get a cart keyed by their hashed guest token.
export async function getOrCreateCartId(): Promise<string> {
  const user = await getCurrentUser();
  if (user) {
    const existing = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (existing) return existing.id;
    const created = await prisma.cart.create({ data: { userId: user.id } });
    return created.id;
  }
  const token = (await getGuestToken()) ?? (await ensureGuestToken());
  const existing = await prisma.cart.findUnique({ where: { guestToken: token } });
  if (existing) return existing.id;
  const created = await prisma.cart.create({ data: { guestToken: token } });
  return created.id;
}

// Merge a guest cart into the signed-in user's cart (called after login).
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const token = await getGuestToken();
  if (!token) return;
  const guestCart = await prisma.cart.findUnique({
    where: { guestToken: token },
    include: { items: true },
  });
  if (!guestCart) return;

  const userCart =
    (await prisma.cart.findUnique({ where: { userId } })) ??
    (await prisma.cart.create({ data: { userId } }));

  for (const item of guestCart.items) {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: userCart.id, productId: item.productId, variantId: item.variantId },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
}

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export async function addToCartAction(input: {
  productId: string;
  variantId?: string | null;
  quantity?: number;
}): Promise<ActionResult> {
  const quantity = Math.max(1, Math.min(99, Math.floor(input.quantity ?? 1)));
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: { variants: true },
  });
  if (!product || !product.active) {
    return { ok: false, message: "Product not available." };
  }

  let variant: (typeof product.variants)[number] | null = null;
  if (input.variantId) {
    variant = product.variants.find((v) => v.id === input.variantId) ?? null;
    if (!variant) return { ok: false, message: "Invalid option selected." };
  }
  const available = variant ? variant.stock : product.stock;
  if (available <= 0) return { ok: false, message: "This item is out of stock." };

  const cartId = await getOrCreateCartId();

  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId: input.productId, variantId: input.variantId ?? null },
  });

  const desired = (existing?.quantity ?? 0) + quantity;
  const clamped = Math.min(desired, available);

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: clamped } });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId,
        productId: input.productId,
        variantId: input.variantId ?? null,
        quantity: clamped,
      },
    });
  }

  revalidatePath("/cart");
  const msg = clamped < desired ? `Only ${available} in stock — quantity adjusted.` : "Added to cart.";
  return { ok: true, message: msg };
}

export async function updateQuantityAction(input: {
  itemId: string;
  quantity: number;
}): Promise<ActionResult> {
  const item = await prisma.cartItem.findUnique({
    where: { id: input.itemId },
    include: { product: true, variant: true },
  });
  if (!item) return { ok: false, message: "Item not found." };

  if (input.quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: input.itemId } });
    revalidatePath("/cart");
    return { ok: true, message: "Item removed." };
  }

  const available = item.variant ? item.variant.stock : item.product.stock;
  const clamped = Math.min(Math.floor(input.quantity), Math.max(0, available));
  if (clamped <= 0) {
    await prisma.cartItem.delete({ where: { id: input.itemId } });
    revalidatePath("/cart");
    return { ok: true, message: "Item removed (out of stock)." };
  }

  await prisma.cartItem.update({ where: { id: input.itemId }, data: { quantity: clamped } });
  revalidatePath("/cart");
  return { ok: true };
}

export async function removeFromCartAction(itemId: string): Promise<ActionResult> {
  await prisma.cartItem.deleteMany({ where: { id: itemId } });
  revalidatePath("/cart");
  return { ok: true, message: "Item removed." };
}

export async function clearCartAction(): Promise<ActionResult> {
  const cartId = await getOrCreateCartId();
  await prisma.cartItem.deleteMany({ where: { cartId } });
  revalidatePath("/cart");
  return { ok: true };
}
