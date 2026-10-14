"use server";

import { getCartSummary } from "@/server/queries/cart";
import { getWishlistCount } from "@/server/queries/wishlist";

export async function getHeaderCartSummary(): Promise<{ itemCount: number }> {
  return getCartSummary();
}

export async function getHeaderWishlistCount(): Promise<number> {
  return getWishlistCount();
}