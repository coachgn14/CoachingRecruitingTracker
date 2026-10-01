import Link from "next/link";
import { Alert, Badge, Card, PageHeader } from "@/components/ui";
import { canCoachClaim } from "@/lib/assignment";
import { requireUser } from "@/lib/auth";
import { claimDeadline, releaseExpiredClaims } from "@/lib/claims";
import { db } from "@/lib/db";
import { divisionLabel, isCoachDivision, positionLabel, parseJson, type SubmissionSnapshot } from "@/lib/domain";
import { ClaimButton } from "./ClaimButton";

export default async function CoachDashboard() {
  const user = await requireUser("COACH");
  const profile = await db.coachProfile.findUniqueOrThrow({ where: { userId: user.id } });

  if (profile.status !== "APPROVED") {
    return (
      <div className="space-y-6">
        <PageHeader title={`Coach ${profile.lastName}`} subtitle={`${profile.school} · ${divisionLabel(profile.division)}`} />
        {profile.status === "PENDING" ? (
          <Alert tone="info">
            Thanks for applying. We&apos;re verifying your employment and will approve your account by hand. You&apos;ll be able to
            evaluate players as soon as you&apos;re approved.
          </Alert>
        ) : (
          <Alert tone="error">
            We couldn&apos;t verify your application.{profile.reviewNote && <> Reason: {profile.reviewNote}</>} Contact us if you think this
            is a mistake.
          </Alert>
        )}
      </div>
    );
  }

  await releaseExpiredClaims();
  const division = isCoachDivision(profile.division) ? profile.division : null;

  const [mine, open, completedCount] = await Promise.all([
    db.evaluation.findMany({
      where: { coachId: user.id, status: "CLAIMED" },
      orderBy: { claimedAt: "asc" },
      include: { submission: { select: { position: true, gradYear: true, snapshot: true } } },
    }),
    db.submission.findMany({
      where: { status: "OPEN" },
      orderBy: { paidAt: "asc" },
      select: {
        id: true,
        position: true,
        gradYear: true,
        paidAt: true,
        snapshot: true,
        evaluations: { select: { slot: true, coachId: true, coachDivision: true } },
      },
    }),
    db.evaluation.count({ where: { coachId: user.id, status: "SUBMITTED" } }),
  ]);
  const available = division ? open.filter((s) => canCoachClaim(user.id, division, s.evaluations)) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Coach ${profile.lastName}`}
        subtitle={`${profile.school} · ${divisionLabel(profile.division)} · ${completedCount} evaluation${completedCount === 1 ? "" : "s"} completed`}
        actions={
          <Link href="/coach/completed" className="text-sm font-medium text-emerald-800">
            Completed evaluations →
          </Link>
        }
      />

      <Card title="In progress">
        {mine.length === 0 ? (
          <p className="text-sm text-slate-600">Nothing in progress. Pick a player from the queue below.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mine.map((e) => {
              const snap = parseJson<SubmissionSnapshot | null>(e.submission.snapshot, null);
              return (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <div className="font-medium">
                      {snap ? `${snap.player.firstName} ${snap.player.lastName}` : "Player"} · {positionLabel(e.submission.position)} · Class of{" "}
                      {e.submission.gradYear}
                    </div>
                    <div className="text-xs text-slate-500">Due by {claimDeadline(e.claimedAt).toLocaleString()} or it returns to the queue</div>
                  </div>
                  <Link href={`/coach/evaluations/${e.id}`} className="text-sm font-medium text-emerald-800">
                    Continue →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Available to evaluate">
        <p className="mb-3 text-sm text-slate-600">
          Each player is evaluated by one Division 1 coach and two coaches from two other divisions. You only see players who still need
          a {divisionLabel(profile.division)} evaluation.
        </p>
        {available.length === 0 ? (
          <p className="text-sm text-slate-600">No players waiting right now. Check back soon.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {available.map((s) => {
              const snap = parseJson<SubmissionSnapshot | null>(s.snapshot, null);
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium">
                      {positionLabel(s.position)} · Class of {s.gradYear}
                      {snap?.player.state ? ` · ${snap.player.state}` : ""}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                      Waiting since {s.paidAt?.toLocaleDateString()} ·
                      {s.evaluations.map((e) => (
                        <Badge key={e.slot}>{divisionLabel(e.coachDivision)} taken</Badge>
                      ))}
                    </div>
                  </div>
                  <ClaimButton submissionId={s.id} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
