"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Wishlist is only for signed-in users (persisted). Guests are prompted to
// sign in; their intent can be captured after authentication in a later step.

async function getOrCreateWishlist(userId: string) {
  const existing = await prisma.wishlist.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wishlist.create({ data: { userId } });
}

export async function toggleWishlistAction(productId: string): Promise<{
  ok: boolean;
  added?: boolean;
  message: string;
}> {
  const user = await requireUser();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) {
    return { ok: false, message: "Product not available." };
  }
  const wishlist = await getOrCreateWishlist(user.id);
  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/wishlist");
    return { ok: true, added: false, message: "Removed from wishlist." };
  }
  await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
  revalidatePath("/wishlist");
  return { ok: true, added: true, message: "Saved to wishlist." };
}

export async function removeWishlistItemAction(itemId: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  // Ensure ownership before deleting.
  const item = await prisma.wishlistItem.findUnique({
    where: { id: itemId },
    include: { wishlist: true },
  });
  if (!item || item.wishlist.userId !== user.id) {
    return { ok: false, message: "Item not found." };
  }
  await prisma.wishlistItem.delete({ where: { id: itemId } });
  revalidatePath("/wishlist");
  return { ok: true, message: "Removed from wishlist." };
}

export async function getWishlistProductIds(): Promise<string[]> {
  const user = await requireUser();
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: user.id },
    include: { items: { select: { productId: true } } },
  });
  return wishlist?.items.map((i) => i.productId) ?? [];
}
