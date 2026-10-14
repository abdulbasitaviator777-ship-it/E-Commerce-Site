import { prisma } from "@/lib/prisma";
import { effectivePrice } from "@/lib/queries/products";
import {
  findShippingRate,
  getStoreSettings,
  type ShippingRate,
  type StoreSettings,
} from "@/lib/settings";

// Server-side cart engine. The browser is NEVER trusted for prices, stock,
// discounts or totals — everything is recomputed here from the database.

export type CartLine = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
    stock: number;
    price: number;
    salePrice: number | null;
  };
  variant: { id: string; name: string; value: string; stock: number } | null;
  unitPrice: number; // effective, minor units
  lineTotal: number; // minor units
  available: number; // max orderable quantity considering stock
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  currency: string;
  shippingRate: ShippingRate | null;
  freeShippingApplied: boolean;
};

export type CartView = {
  lines: CartLine[];
  totals: CartTotals;
  couponCode: string | null;
  couponValid: boolean;
  couponMessage: string | null;
};

async function loadCartItems(cartId: string) {
  return prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } },
      variant: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

// Max orderable quantity for a line. Variant stock takes precedence when a
// variant is selected; otherwise product-level stock applies.
function availableQuantity(productStock: number, variantStock: number | null): number {
  const stock = variantStock != null ? variantStock : productStock;
  return Math.max(0, stock);
}

function unitPriceFor(
  basePrice: number,
  salePrice: number | null,
  priceDelta: number,
): number {
  const effective = effectivePrice({ price: basePrice, salePrice });
  return Math.max(0, effective + priceDelta);
}

export type CouponApplication = {
  discount: number;
  valid: boolean;
  message: string | null;
  couponId: string | null;
  code: string | null;
};

// Validate a coupon against a subtotal (minor units) and compute its discount.
export async function evaluateCoupon(
  code: string | null | undefined,
  subtotal: number,
  userId: string | null,
): Promise<CouponApplication> {
  if (!code) {
    return { discount: 0, valid: false, message: null, couponId: null, code: null };
  }
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon || !coupon.active) {
    return { discount: 0, valid: false, message: "This coupon is not valid.", couponId: null, code };
  }
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { discount: 0, valid: false, message: "This coupon is not active yet.", couponId: null, code };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { discount: 0, valid: false, message: "This coupon has expired.", couponId: null, code };
  }
  if (coupon.minSubtotal != null && subtotal < coupon.minSubtotal) {
    return { discount: 0, valid: false, message: "Order does not meet the minimum for this coupon.", couponId: null, code };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { discount: 0, valid: false, message: "This coupon has reached its usage limit.", couponId: null, code };
  }
  if (userId && coupon.perUserLimit != null) {
    const used = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.perUserLimit) {
      return { discount: 0, valid: false, message: "You have already used this coupon.", couponId: null, code };
    }
  }

  let discount = 0;
  if (coupon.type === "PERCENT") {
    discount = Math.floor((subtotal * coupon.value) / 10000);
    if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === "FIXED") {
    discount = Math.min(coupon.value, subtotal);
    if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.max(0, Math.min(discount, subtotal));

  return {
    discount,
    valid: true,
    message: coupon.type === "FREE_SHIPPING" ? "Free shipping applied." : null,
    couponId: coupon.id,
    code: coupon.code,
  };
}

// Build a full cart view (lines + totals) for a given cart id. `couponCode`
// and `shippingMethodId` come from the cart/checkout and are validated
// server-side. No client-supplied amounts are trusted.
export async function computeCartView(
  cartId: string,
  options: {
    couponCode?: string | null;
    shippingMethodId?: string | null;
    userId?: string | null;
  } = {},
): Promise<CartView> {
  const settings: StoreSettings = await getStoreSettings();
  const items = await loadCartItems(cartId);

  const lines: CartLine[] = items.map((item) => {
    const basePrice = item.product.price;
    const priceDelta = item.variant?.priceDelta ?? 0;
    const unitPrice = unitPriceFor(basePrice, item.product.salePrice, priceDelta);
    const available = availableQuantity(
      item.product.stock,
      item.variant ? item.variant.stock : null,
    );
    // Clamp quantity to available stock (prevents overselling from stale carts).
    const qty = available > 0 ? Math.min(item.quantity, available) : item.quantity;
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: qty,
      product: {
        id: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        imageUrl: item.product.images[0]?.url ?? null,
        stock: item.product.stock,
        price: basePrice,
        salePrice: item.product.salePrice,
      },
      variant: item.variant
        ? {
            id: item.variant.id,
            name: item.variant.name,
            value: item.variant.value,
            stock: item.variant.stock,
          }
        : null,
      unitPrice,
      lineTotal: unitPrice * qty,
      available,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);

  const coupon = await evaluateCoupon(options.couponCode, subtotal, options.userId ?? null);
  const discount = coupon.discount;

  // Shipping: default to the first configured rate when none/invalid chosen.
  const methodId =
    options.shippingMethodId ?? settings.shippingRates[0]?.id ?? null;
  const rate =
    (methodId ? findShippingRate(settings, methodId) : undefined) ??
    settings.shippingRates[0] ??
    null;

  let shipping = 0;
  let freeShippingApplied = false;
  if (itemCount > 0 && rate) {
    const threshold = rate.freeOverSubtotal ?? settings.freeShippingThreshold;
    if (threshold != null && subtotal >= threshold) {
      freeShippingApplied = true;
      shipping = 0;
    } else {
      shipping = rate.fee;
    }
  }
  // A FREE_SHIPPING coupon overrides shipping to 0.
  if (coupon.valid && options.couponCode) {
    const c = await prisma.coupon.findUnique({
      where: { code: options.couponCode.toUpperCase() },
    });
    if (c?.type === "FREE_SHIPPING") {
      shipping = 0;
      freeShippingApplied = true;
    }
  }

  // Tax applied to discounted subtotal plus shipping.
  const taxableBase = Math.max(0, subtotal - discount) + shipping;
  const tax = Math.floor((taxableBase * settings.taxRateBps) / 10000);
  const total = Math.max(0, subtotal - discount + shipping + tax);

  return {
    lines,
    totals: {
      subtotal,
      discount,
      shipping,
      tax,
      total,
      itemCount,
      currency: settings.currency,
      shippingRate: rate,
      freeShippingApplied,
    },
    couponCode: coupon.valid ? coupon.code : options.couponCode ?? null,
    couponValid: coupon.valid,
    couponMessage: coupon.message,
  };
}

