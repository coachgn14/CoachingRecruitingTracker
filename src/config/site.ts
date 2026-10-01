// Product-level settings. Rename the product here.
export const SITE_NAME = "ScoutFit";
export const SITE_TAGLINE =
  "Standardized, anonymous evaluations from three college coaches — so you know where you fit and what to work on.";

export const EVALUATION_PRICE_CENTS = Number(process.env.EVALUATION_PRICE_CENTS ?? 29900);
export const CLAIM_HOURS = Number(process.env.CLAIM_HOURS ?? 72);

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
