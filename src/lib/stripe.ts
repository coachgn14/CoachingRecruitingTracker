import { createHmac, timingSafeEqual } from "node:crypto";

// Payments go through a Stripe Payment Link. We tag the link with the
// submission id (client_reference_id), and Stripe's webhook tells us when
// that submission has been paid. The redirect back to the site is never
// trusted on its own.

export function paymentLinkUrl(): string | null {
  return process.env.STRIPE_PAYMENT_LINK_URL?.trim() || null;
}

export function paymentsMode(): "stripe" | "test" {
  return paymentLinkUrl() ? "stripe" : "test";
}

export function checkoutUrl(link: string, submissionId: string, email: string): string {
  const url = new URL(link);
  url.searchParams.set("client_reference_id", submissionId);
  url.searchParams.set("prefilled_email", email);
  return url.toString();
}

// Verify the Stripe-Signature header (t=timestamp, v1=HMAC-SHA256 of
// "timestamp.body" with the endpoint's signing secret).
// See https://docs.stripe.com/webhooks#verify-manually
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
  now = Math.floor(Date.now() / 1000),
): boolean {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.split("=", 2) as [string, string]);
  const timestamp = Number(parts.find(([k]) => k === "t")?.[1]);
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(now - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest();
  return signatures.some((sig) => {
    const given = Buffer.from(sig, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
