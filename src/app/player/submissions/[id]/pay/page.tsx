import { notFound, redirect } from "next/navigation";
import { completeTestPayment } from "@/app/actions/player";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert, Card, PageHeader } from "@/components/ui";
import { formatPrice } from "@/config/site";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function PayPage({ params }: PageProps<"/player/submissions/[id]/pay">) {
  const { id } = await params;
  const user = await requireUser("PLAYER");
  const submission = await db.submission.findFirst({ where: { id, playerId: user.id } });
  if (!submission) notFound();
  if (submission.status !== "AWAITING_PAYMENT") redirect(`/player/submissions/${id}`);

  const pay = completeTestPayment.bind(null, id);
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Checkout" />
      <Card>
        <div className="flex items-center justify-between text-sm">
          <span>3-coach evaluation</span>
          <span className="font-semibold">{formatPrice(submission.amountCents)}</span>
        </div>
      </Card>
      <Alert tone="warning">
        Test mode: no card is charged. Real payments (Stripe) will replace this step before launch.
      </Alert>
      <form action={pay}>
        <SubmitButton pendingText="Processing…">Pay {formatPrice(submission.amountCents)} (test)</SubmitButton>
      </form>
    </div>
  );
}
