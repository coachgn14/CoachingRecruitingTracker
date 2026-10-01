import { notFound, redirect } from "next/navigation";
import { completeTestPayment } from "@/app/actions/player";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert, Card, PageHeader } from "@/components/ui";
import { formatPrice } from "@/config/site";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkoutUrl, paymentLinkUrl } from "@/lib/stripe";

export default async function PayPage({ params }: PageProps<"/player/submissions/[id]/pay">) {
  const { id } = await params;
  const user = await requireUser("PLAYER");
  const submission = await db.submission.findFirst({ where: { id, playerId: user.id } });
  if (!submission) notFound();
  if (submission.status !== "AWAITING_PAYMENT") redirect(`/player/submissions/${id}`);

  const link = paymentLinkUrl();
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Checkout" />
      <Card>
        <div className="flex items-center justify-between text-sm">
          <span>3-coach evaluation</span>
          <span className="font-semibold">{formatPrice(submission.amountCents)}</span>
        </div>
      </Card>
      {link ? (
        <>
          <p className="text-sm text-slate-600">
            You&apos;ll pay securely on Stripe. When payment goes through, your submission goes straight to our coaches and you&apos;ll be
            brought back here.
          </p>
          {/* Plain link: Stripe's hosted checkout is a full-page navigation. */}
          <a
            href={checkoutUrl(link, submission.id, user.email)}
            className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
          >
            Pay with Stripe
          </a>
        </>
      ) : (
        <>
          <Alert tone="warning">Test mode: no card is charged. Set STRIPE_PAYMENT_LINK_URL to take real payments.</Alert>
          <form action={completeTestPayment.bind(null, id)}>
            <SubmitButton pendingText="Processing…">Pay {formatPrice(submission.amountCents)} (test)</SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
