import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Wishlist count for the signed-in user (returns 0 for guests).
export async function getWishlistCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: user.id },
    include: { _count: { select: { items: true } } },
  });
  return wishlist?._count.items ?? 0;
}
