import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AutoRefresh } from "./AutoRefresh";

// Where Stripe sends the player after paying. Set the Payment Link's
// "After payment" redirect to:
//   https://<your-site>/player/payment-complete?session_id={CHECKOUT_SESSION_ID}
// The webhook, not this page, marks the submission paid; this page waits for it.
export default async function PaymentComplete({ searchParams }: PageProps<"/player/payment-complete">) {
  const user = await requireUser("PLAYER");
  const { session_id } = await searchParams;

  if (typeof session_id === "string" && session_id) {
    const paid = await db.submission.findFirst({ where: { playerId: user.id, paymentRef: session_id }, select: { id: true } });
    if (paid) redirect(`/player/submissions/${paid.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Thanks for your payment" />
      <Alert tone="info">
        We&apos;re confirming your payment with Stripe. This usually takes a few seconds and the page will update on its own.
      </Alert>
      <AutoRefresh />
      <Link href="/player" className="text-sm font-medium text-emerald-800">
        Go to your dashboard →
      </Link>
    </div>
  );
}
