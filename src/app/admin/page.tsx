import Link from "next/link";
import { adminReleaseEvaluation } from "@/app/actions/admin";
import { Badge, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { claimDeadline, releaseExpiredClaims } from "@/lib/claims";
import { db } from "@/lib/db";
import { divisionLabel, positionLabel } from "@/lib/domain";
import { submissionStatusLabel, submissionStatusTone } from "@/lib/status";

const statusTone = { PENDING: "amber", APPROVED: "green", REJECTED: "red" } as const;

export default async function AdminDashboard() {
  await requireUser("ADMIN");
  await releaseExpiredClaims();

  const [coaches, submissions, completedByCoach] = await Promise.all([
    db.coachProfile.findMany({ orderBy: [{ status: "asc" }, { createdAt: "asc" }], include: { user: { select: { email: true } } } }),
    db.submission.findMany({
      where: { status: { in: ["OPEN", "COMPLETE"] } },
      orderBy: [{ status: "desc" }, { paidAt: "asc" }],
      take: 100,
      include: {
        player: { select: { email: true, playerProfile: { select: { firstName: true, lastName: true } } } },
        evaluations: { orderBy: { slot: "asc" }, select: { id: true, slot: true, status: true, coachDivision: true, claimedAt: true } },
      },
    }),
    db.evaluation.groupBy({ by: ["coachId"], where: { status: "SUBMITTED" }, _count: true }),
  ]);
  const completed = new Map(completedByCoach.map((c) => [c.coachId, c._count]));
  const pending = coaches.filter((c) => c.status === "PENDING");

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" subtitle={`${pending.length} coach application${pending.length === 1 ? "" : "s"} waiting for review`} />

      <Card title="Coaches">
        {coaches.length === 0 ? (
          <p className="text-sm text-slate-600">No coach applications yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Coach</th>
                <th className="pb-2 font-medium">School</th>
                <th className="pb-2 font-medium">Division</th>
                <th className="pb-2 font-medium">Completed</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coaches.map((c) => (
                <tr key={c.id}>
                  <td className="py-2">
                    <Link href={`/admin/coaches/${c.id}`} className="font-medium text-emerald-800">
                      {c.firstName} {c.lastName}
                    </Link>
                    <div className="text-xs text-slate-500">{c.user.email}</div>
                  </td>
                  <td className="py-2">{c.school}</td>
                  <td className="py-2">{divisionLabel(c.division)}</td>
                  <td className="py-2">{completed.get(c.userId) ?? 0}</td>
                  <td className="py-2">
                    <Badge tone={statusTone[c.status as keyof typeof statusTone] ?? "slate"}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Paid submissions">
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-600">No paid submissions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {submissions.map((s) => (
              <li key={s.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">
                      {s.player.playerProfile?.firstName} {s.player.playerProfile?.lastName}
                    </span>{" "}
                    · {positionLabel(s.position)} · Class of {s.gradYear}
                    <div className="text-xs text-slate-500">
                      {s.player.email} · paid {s.paidAt?.toLocaleDateString()}
                    </div>
                  </div>
                  <Badge tone={submissionStatusTone(s.status)}>
                    {submissionStatusLabel(s.status, s.evaluations.filter((e) => e.status === "SUBMITTED").length)}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3].map((slot) => {
                    const e = s.evaluations.find((x) => x.slot === slot);
                    const slotName = slot === 1 ? "D1 slot" : `Slot ${slot}`;
                    if (!e) return <Badge key={slot}>{slotName}: open</Badge>;
                    if (e.status === "SUBMITTED") return <Badge key={slot} tone="green">{divisionLabel(e.coachDivision)}: done</Badge>;
                    return (
                      <form key={slot} action={adminReleaseEvaluation.bind(null, e.id)} className="inline-flex items-center gap-1">
                        <Badge tone="blue">
                          {divisionLabel(e.coachDivision)}: due {claimDeadline(e.claimedAt).toLocaleDateString()}
                        </Badge>
                        <button className="text-xs text-red-700 underline">release</button>
                      </form>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
