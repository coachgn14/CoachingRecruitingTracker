import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConsensusView, EvaluationView, PlayerSnapshotView } from "@/components/reports";
import { Alert, Badge, PageHeader } from "@/components/ui";
import { EVALUATIONS_PER_SUBMISSION } from "@/lib/assignment";
import { requireUser } from "@/lib/auth";
import { buildConsensus } from "@/lib/consensus";
import { db } from "@/lib/db";
import { POSITIONS, divisionLabel, parseJson, type SubmissionSnapshot } from "@/lib/domain";
import { submissionStatusLabel, submissionStatusTone } from "@/lib/status";

export default async function SubmissionReport({ params }: PageProps<"/player/submissions/[id]">) {
  const { id } = await params;
  const user = await requireUser("PLAYER");
  const submission = await db.submission.findFirst({
    where: { id, playerId: user.id },
    include: {
      // Only fields safe to show the player. Never select the coach relation.
      evaluations: {
        where: { status: "SUBMITTED" },
        orderBy: { slot: "asc" },
        select: {
          id: true,
          coachDivision: true,
          metricGrades: true,
          currentLevel: true,
          targetLevel: true,
          improvements: true,
          improvementNotes: true,
          overallFeedback: true,
        },
      },
    },
  });
  if (!submission) notFound();
  if (submission.status === "AWAITING_PAYMENT") redirect(`/player/submissions/${id}/pay`);

  const snapshot = JSON.parse(submission.snapshot) as SubmissionSnapshot;
  const evaluations = submission.evaluations.map((e) => ({
    ...e,
    metricGrades: parseJson<Record<string, string>>(e.metricGrades, {}),
    improvements: parseJson<string[]>(e.improvements, []),
  }));
  const complete = submission.status === "COMPLETE";
  const consensus = complete ? buildConsensus(evaluations, POSITIONS[snapshot.player.position].metrics) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your evaluation"
        subtitle={`Submitted ${submission.createdAt.toLocaleDateString()}`}
        actions={<Badge tone={submissionStatusTone(submission.status)}>{submissionStatusLabel(submission.status, evaluations.length)}</Badge>}
      />

      {!complete && (
        <Alert tone="info">
          Your submission is with our coaches. Each coach&apos;s feedback appears here as soon as they finish, and the consensus appears
          once all {EVALUATIONS_PER_SUBMISSION} are done.
          {evaluations.length > 0 && <> Received so far: {evaluations.map((e) => divisionLabel(e.coachDivision)).join(", ")}.</>}
        </Alert>
      )}

      {consensus && <ConsensusView consensus={consensus} snapshot={snapshot} evaluatorCount={evaluations.length} />}

      {evaluations.map((e) => (
        <EvaluationView key={e.id} evaluation={e} snapshot={snapshot} />
      ))}

      <details className="rounded-lg border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">What you submitted</summary>
        <div className="mt-4">
          <PlayerSnapshotView snapshot={snapshot} />
        </div>
      </details>

      <Link href="/player" className="text-sm font-medium text-emerald-800">
        ← Back to dashboard
      </Link>
    </div>
  );
}
