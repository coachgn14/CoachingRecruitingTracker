import Link from "next/link";
import { createSubmission } from "@/app/actions/player";
import { PlayerSnapshotView } from "@/components/reports";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert, Card, PageHeader } from "@/components/ui";
import { EVALUATION_PRICE_CENTS, formatPrice } from "@/config/site";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildSnapshot, missingForSubmission } from "@/lib/profile";

export default async function SubmitPage() {
  const user = await requireUser("PLAYER");
  const profile = await db.playerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const missing = missingForSubmission(profile);

  if (missing.length) {
    return (
      <div className="space-y-4">
        <PageHeader title="Request an evaluation" />
        <Alert tone="warning">
          <p className="font-semibold">Your profile isn&apos;t complete yet. Still needed:</p>
          <ul className="mt-2 list-disc pl-5">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Alert>
        <Link href="/player/profile" className="text-sm font-medium text-emerald-800">
          ← Finish your profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review your submission"
        subtitle="This is exactly what your three coaches will see. Changes to your profile after you submit won't affect this evaluation."
      />
      <PlayerSnapshotView snapshot={buildSnapshot(profile)} />
      <Card title="What you get">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Three independent evaluations: one Division 1 coach and two coaches from two other college levels.</li>
          <li>Every metric graded by the college level it plays at.</li>
          <li>The level you fit today, the level you could reach, and exactly what to improve.</li>
          <li>Written feedback from each coach, plus a consensus across all three.</li>
          <li>Coaches stay anonymous. You see each coach&apos;s level only.</li>
        </ul>
        <form action={createSubmission} className="mt-5 flex flex-wrap items-center gap-4">
          <SubmitButton pendingText="Preparing checkout…">Continue to payment ({formatPrice(EVALUATION_PRICE_CENTS)})</SubmitButton>
          <Link href="/player/profile" className="text-sm font-medium text-slate-700">
            Edit profile
          </Link>
        </form>
      </Card>
    </div>
  );
}
