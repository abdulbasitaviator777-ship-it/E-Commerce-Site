// Money is stored and handled as integer minor units (e.g. paisa) to avoid
// floating point errors. 1 PKR = 100 paisa. All prices in the database are
// minor units.

export type CurrencyCode = string;

export function minorToMajor(minor: number): number {
  return minor / 100;
}

export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}

export function formatMoney(
  minor: number,
  currency: CurrencyCode = "PKR",
  locale: string = "en-PK",
): string {
  const major = minorToMajor(minor);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    // Fallback if the runtime lacks full ICU data for the locale.
    const symbol = currencySymbol(currency);
    return `${symbol}${major.toFixed(2)}`;
  }
}

export function currencySymbol(currency: CurrencyCode): string {
  const map: Record<string, string> = {
    PKR: "Rs",
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AED: "د.إ",
  };
  return map[currency.toUpperCase()] ?? `${currency} `;
}

// Parse a user-entered amount string (major units) into integer minor units.
export function parseMoneyInput(input: string): number | null {
  const cleaned = input.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return majorToMinor(value);
}

// Compute a percentage of an amount using integer math with basis points.
// 1500 basis points = 15%.
export function percentBasisPoints(amount: number, basisPoints: number): number {
  return Math.floor((amount * basisPoints) / 10000);
}
