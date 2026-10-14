import { prisma } from "@/lib/prisma";
import { getCurrentUser, getGuestToken, ensureGuestToken } from "@/lib/auth";
import { computeCartView, type CartView } from "@/lib/cart";

// Resolve the active cart id (user or guest) without creating one.
export async function resolveCartId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) {
    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    return cart?.id ?? null;
  }
  const token = (await getGuestToken()) ?? null;
  if (!token) return null;
  const cart = await prisma.cart.findUnique({ where: { guestToken: token } });
  return cart?.id ?? null;
}

// Lightweight summary for the header badge (item count only).
export async function getCartSummary(): Promise<{ itemCount: number }> {
  const cartId = await resolveCartId();
  if (!cartId) return { itemCount: 0 };
  const view = await computeCartView(cartId);
  return { itemCount: view.totals.itemCount };
}

// Full cart view for cart/checkout pages. If no cart exists, return an empty
// view so pages can render empty states.
export async function getCartView(options?: {
  couponCode?: string | null;
  shippingMethodId?: string | null;
}): Promise<CartView> {
  const user = await getCurrentUser();
  const cartId =
    (await resolveCartId()) ?? (await ensureGuestToken().then(async (t) => {
      const existing = await prisma.cart.findUnique({ where: { guestToken: t } });
      return existing?.id ?? null;
    }));
  if (!cartId) {
    // Return an empty cart view.
    return computeCartView("__none__").catch(() => emptyView());
  }
  return computeCartView(cartId, {
    couponCode: options?.couponCode,
    shippingMethodId: options?.shippingMethodId,
    userId: user?.id ?? null,
  });
}

function emptyView(): CartView {
  return {
    lines: [],
    totals: {
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
      currency: "PKR",
      shippingRate: null,
      freeShippingApplied: false,
    },
    couponCode: null,
    couponValid: false,
    couponMessage: null,
  };
}
