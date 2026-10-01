import { db } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/stripe";

// Stripe webhook: marks a submission paid when its Payment Link checkout
// completes. In the Stripe dashboard, send these events to /api/stripe/webhook:
//   checkout.session.completed
//   checkout.session.async_payment_succeeded
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 500 });

  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type: string;
    data: { object: { id: string; client_reference_id: string | null; payment_status: string; amount_total: number | null } };
  };

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid" && session.client_reference_id) {
      // updateMany + status filter makes repeated deliveries of the same event harmless.
      await db.submission.updateMany({
        where: { id: session.client_reference_id, status: "AWAITING_PAYMENT" },
        data: {
          status: "OPEN",
          paidAt: new Date(),
          paymentRef: session.id,
          ...(session.amount_total != null ? { amountCents: session.amount_total } : {}),
        },
      });
    }
  }

  return new Response("ok");
}
