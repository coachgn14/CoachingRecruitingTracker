import Link from "next/link";
import { notFound } from "next/navigation";
import { releaseClaim } from "@/app/actions/coach";
import { EvaluationView, PlayerSnapshotView } from "@/components/reports";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert, PageHeader } from "@/components/ui";
import { IMPROVEMENTS } from "@/config/improvements";
import { requireApprovedCoach } from "@/lib/auth";
import { claimDeadline } from "@/lib/claims";
import { db } from "@/lib/db";
import { METRICS, POSITIONS, parseJson, type SubmissionSnapshot } from "@/lib/domain";
import { EvaluationForm } from "./EvaluationForm";

export default async function CoachEvaluationPage({ params, searchParams }: PageProps<"/coach/evaluations/[id]">) {
  const { id } = await params;
  const { submitted } = await searchParams;
  const { user } = await requireApprovedCoach();
  const evaluation = await db.evaluation.findFirst({
    where: { id, coachId: user.id },
    include: { submission: { select: { snapshot: true } } },
  });
  if (!evaluation) notFound();

  const snapshot = JSON.parse(evaluation.submission.snapshot) as SubmissionSnapshot;
  const pos = POSITIONS[snapshot.player.position];
  const metricGrades = parseJson<Record<string, string>>(evaluation.metricGrades, {});
  const improvements = parseJson<string[]>(evaluation.improvements, []);
  const playerValues = Object.fromEntries(
    pos.metrics.map((k) => [k, snapshot.metrics[k] ? `${snapshot.metrics[k]!.value} ${METRICS[k].unit}` : "—"]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Evaluate: ${snapshot.player.firstName} ${snapshot.player.lastName}`}
        subtitle={`${pos.label} · Class of ${snapshot.player.gradYear}`}
        actions={
          <Link href="/coach" className="text-sm font-medium text-emerald-800">
            ← Dashboard
          </Link>
        }
      />

      {evaluation.status === "SUBMITTED" ? (
        <>
          {submitted && <Alert tone="success">Evaluation submitted. Thank you!</Alert>}
          <EvaluationView
            evaluation={{ ...evaluation, metricGrades, improvements }}
            snapshot={snapshot}
          />
          <details className="rounded-lg border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer font-semibold">Player submission</summary>
            <div className="mt-4">
              <PlayerSnapshotView snapshot={snapshot} />
            </div>
          </details>
        </>
      ) : (
        <>
          <Alert tone="info">
            Watch every clip and check the proof videos against the reported numbers before grading. Your name and school are never shown
            to the player. Due by <strong>{claimDeadline(evaluation.claimedAt).toLocaleString()}</strong>, or this player returns to the
            queue.
          </Alert>
          <PlayerSnapshotView snapshot={snapshot} />
          <EvaluationForm
            evaluationId={evaluation.id}
            metrics={pos.metrics}
            playerValues={playerValues}
            improvements={IMPROVEMENTS[pos.group]}
            initial={{
              metricGrades,
              currentLevel: evaluation.currentLevel ?? "",
              targetLevel: evaluation.targetLevel ?? "",
              improvements,
              improvementNotes: evaluation.improvementNotes,
              overallFeedback: evaluation.overallFeedback,
            }}
          />
          <form action={releaseClaim.bind(null, evaluation.id)} className="border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm text-slate-600">Can&apos;t finish this one? Release it so another coach can pick it up.</p>
            <SubmitButton variant="secondary" pendingText="Releasing…">
              Release back to queue
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
