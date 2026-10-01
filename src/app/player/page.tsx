import Link from "next/link";
import { Alert, Badge, ButtonLink, Card, DefinitionList, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatHeight, positionLabel } from "@/lib/domain";
import { missingForSubmission } from "@/lib/profile";
import { submissionStatusLabel, submissionStatusTone } from "@/lib/status";

export default async function PlayerDashboard() {
  const user = await requireUser("PLAYER");
  const profile = await db.playerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const submissions = await db.submission.findMany({
    where: { playerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { evaluations: { where: { status: "SUBMITTED" }, select: { id: true } } },
  });
  const missing = missingForSubmission(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile.firstName}`}
        actions={missing.length === 0 ? <ButtonLink href="/player/submit">Request an evaluation</ButtonLink> : undefined}
      />

      {missing.length > 0 && (
        <Alert tone="warning">
          <p className="font-semibold">Finish your profile to request an evaluation. Still needed:</p>
          <p className="mt-1">{missing.join(" · ")}</p>
        </Alert>
      )}

      <Card
        title="Profile"
        actions={
          <Link href="/player/profile" className="text-sm font-medium text-emerald-800">
            Edit profile →
          </Link>
        }
      >
        <DefinitionList
          items={[
            ["Position", positionLabel(profile.position)],
            ["Graduation year", profile.gradYear ?? "—"],
            ["Height", formatHeight(profile.heightInches)],
            ["Weight", profile.weightLbs ? `${profile.weightLbs} lbs` : "—"],
            ["School", profile.school || "—"],
          ]}
        />
      </Card>

      <Card title="Your evaluations">
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-600">No evaluations yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {submissions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-medium">
                    {positionLabel(s.position)} · Class of {s.gradYear}
                  </div>
                  <div className="text-xs text-slate-500">Submitted {s.createdAt.toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={submissionStatusTone(s.status)}>{submissionStatusLabel(s.status, s.evaluations.length)}</Badge>
                  <Link
                    href={s.status === "AWAITING_PAYMENT" ? `/player/submissions/${s.id}/pay` : `/player/submissions/${s.id}`}
                    className="text-sm font-medium text-emerald-800"
                  >
                    {s.status === "AWAITING_PAYMENT" ? "Pay →" : "View →"}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
