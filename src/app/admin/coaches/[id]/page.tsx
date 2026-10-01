import Link from "next/link";
import { notFound } from "next/navigation";
import { reviewCoach } from "@/app/actions/admin";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, DefinitionList, Field, PageHeader, inputClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { divisionLabel } from "@/lib/domain";

export default async function AdminCoachPage({ params }: PageProps<"/admin/coaches/[id]">) {
  await requireUser("ADMIN");
  const { id } = await params;
  const coach = await db.coachProfile.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
  if (!coach) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${coach.firstName} ${coach.lastName}`}
        subtitle={`Status: ${coach.status}`}
        actions={
          <Link href="/admin" className="text-sm font-medium text-emerald-800">
            ← Admin
          </Link>
        }
      />
      <Card title="Application">
        <DefinitionList
          items={[
            ["Email", coach.user.email],
            ["School", coach.school],
            ["Title", coach.title],
            ["Division", divisionLabel(coach.division)],
            ["Phone", coach.phone || "—"],
            ["Applied", coach.createdAt.toLocaleDateString()],
            [
              "Staff directory",
              coach.staffDirectoryUrl ? (
                <a href={coach.staffDirectoryUrl} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-800 underline">
                  Open
                </a>
              ) : (
                "—"
              ),
            ],
            [
              "Proof of employment",
              coach.proofFilePath ? (
                <a href={`/api/admin/proof/${coach.id}`} target="_blank" className="text-emerald-800 underline">
                  {coach.proofFileName ?? "View file"}
                </a>
              ) : (
                "—"
              ),
            ],
          ]}
        />
      </Card>

      <Card title="Decision">
        <form action={reviewCoach.bind(null, coach.id)} className="space-y-4">
          <Field label="Note (shown to the coach if rejected)" htmlFor="reviewNote">
            <textarea id="reviewNote" name="reviewNote" rows={3} defaultValue={coach.reviewNote} className={inputClass} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <SubmitButton name="decision" value="APPROVED">
              Approve
            </SubmitButton>
            <SubmitButton name="decision" value="REJECTED" variant="danger">
              Reject
            </SubmitButton>
            {coach.status !== "PENDING" && (
              <SubmitButton name="decision" value="PENDING" variant="secondary">
                Move back to pending
              </SubmitButton>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
