import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { requireApprovedCoach } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelLabel, positionLabel } from "@/lib/domain";

export default async function CompletedEvaluations() {
  const { user } = await requireApprovedCoach();
  const evaluations = await db.evaluation.findMany({
    where: { coachId: user.id, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    include: { submission: { select: { position: true, gradYear: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completed evaluations"
        subtitle={`${evaluations.length} total`}
        actions={
          <Link href="/coach" className="text-sm font-medium text-emerald-800">
            ← Dashboard
          </Link>
        }
      />
      <Card>
        {evaluations.length === 0 ? (
          <p className="text-sm text-slate-600">None yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {evaluations.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <div className="font-medium">
                    {positionLabel(e.submission.position)} · Class of {e.submission.gradYear}
                  </div>
                  <div className="text-xs text-slate-500">
                    Submitted {e.submittedAt?.toLocaleDateString()} · Current fit: {levelLabel(e.currentLevel)}
                  </div>
                </div>
                <Link href={`/coach/evaluations/${e.id}`} className="font-medium text-emerald-800">
                  View →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
