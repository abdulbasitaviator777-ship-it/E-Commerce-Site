import { prisma } from "@/lib/prisma";

// Store-wide configuration persisted in the StoreSetting singleton as JSON.
// All money fields are integer minor units.

export type ShippingRate = {
  id: string;
  label: string;
  description?: string;
  // Flat fee in minor units.
  fee: number;
  // Estimated delivery window in days (informational).
  minDays: number;
  maxDays: number;
  freeOverSubtotal?: number | null;
};

export type StoreSettings = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  addressLine: string;
  currency: string;
  locale: string;
  // Tax rate in basis points applied to (subtotal - discount + shipping) by
  // default. 500 = 5%.
  taxRateBps: number;
  // Default shipping used if a chosen rate is missing.
  defaultShippingFee: number;
  shippingRates: ShippingRate[];
  // Free shipping threshold (minor units) applied to standard shipping.
  freeShippingThreshold: number | null;
  storeEnabled: boolean;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME ?? "NovaStore",
  supportEmail: "support@novastore.test",
  supportPhone: "+92 300 0000000",
  addressLine: "Shop 12, Main Boulevard, Lahore, Pakistan",
  currency: "PKR",
  locale: "en-PK",
  taxRateBps: 0, // No sales tax by default; configurable in admin.
  defaultShippingFee: 25000, // Rs 250.00 in paisa
  freeShippingThreshold: 1500000, // Rs 15,000.00 in paisa
  shippingRates: [
    {
      id: "standard",
      label: "Standard Delivery",
      description: "Delivered in 3–5 business days",
      fee: 25000,
      minDays: 3,
      maxDays: 5,
      freeOverSubtotal: 1500000,
    },
    {
      id: "express",
      label: "Express Delivery",
      description: "Delivered in 1–2 business days",
      fee: 50000,
      minDays: 1,
      maxDays: 2,
      freeOverSubtotal: null,
    },
  ],
  storeEnabled: true,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const row = await prisma.storeSetting.findUnique({
    where: { id: "singleton" },
  });
  if (!row) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(row.data) as Partial<StoreSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  await prisma.storeSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", data: JSON.stringify(settings) },
    update: { data: JSON.stringify(settings) },
  });
}

export function findShippingRate(
  settings: StoreSettings,
  id: string,
): ShippingRate | undefined {
  return settings.shippingRates.find((r) => r.id === id);
}
