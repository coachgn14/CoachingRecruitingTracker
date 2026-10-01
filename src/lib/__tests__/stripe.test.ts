import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { checkoutUrl, verifyStripeSignature } from "../stripe";

const secret = "whsec_test";
const sign = (payload: string, t: number, key = secret) =>
  `t=${t},v1=${createHmac("sha256", key).update(`${t}.${payload}`).digest("hex")}`;

describe("verifyStripeSignature", () => {
  const body = '{"type":"checkout.session.completed"}';
  const now = 1_800_000_000;

  it("accepts a valid signature", () => {
    expect(verifyStripeSignature(body, sign(body, now), secret, 300, now)).toBe(true);
  });

  it("rejects a tampered body, wrong secret, old timestamp or missing header", () => {
    expect(verifyStripeSignature(body + " ", sign(body, now), secret, 300, now)).toBe(false);
    expect(verifyStripeSignature(body, sign(body, now, "whsec_other"), secret, 300, now)).toBe(false);
    expect(verifyStripeSignature(body, sign(body, now - 1000), secret, 300, now)).toBe(false);
    expect(verifyStripeSignature(body, null, secret, 300, now)).toBe(false);
    expect(verifyStripeSignature(body, "t=abc,v1=zz", secret, 300, now)).toBe(false);
  });
});

describe("checkoutUrl", () => {
  it("tags the payment link with the submission and email", () => {
    const url = new URL(checkoutUrl("https://buy.stripe.com/test_abc", "sub_123", "a+b@example.com"));
    expect(url.searchParams.get("client_reference_id")).toBe("sub_123");
    expect(url.searchParams.get("prefilled_email")).toBe("a+b@example.com");
  });
});
