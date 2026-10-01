"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EVALUATIONS_PER_SUBMISSION, SLOT_DECISION_MESSAGES, slotForCoach } from "@/lib/assignment";
import { requireApprovedCoach } from "@/lib/auth";
import { MAX_ACTIVE_CLAIMS, releaseExpiredClaims } from "@/lib/claims";
import { db } from "@/lib/db";
import { isCoachDivision, isPositionKey, type CoachDivision } from "@/lib/domain";
import { parseEvaluationForm } from "@/lib/evaluation";
import type { FormState } from "./types";

export async function claimSubmission(submissionId: string): Promise<FormState> {
  const { user, profile } = await requireApprovedCoach();
  if (!isCoachDivision(profile.division)) return { error: "Your coach profile has no valid division." };
  const division: CoachDivision = profile.division;

  await releaseExpiredClaims();
  const active = await db.evaluation.count({ where: { coachId: user.id, status: "CLAIMED" } });
  if (active >= MAX_ACTIVE_CLAIMS) {
    return { error: `Finish one of your ${active} in-progress evaluations before claiming another.` };
  }

  let evaluationId: string;
  try {
    const result = await db.$transaction(async (tx) => {
      const submission = await tx.submission.findUnique({
        where: { id: submissionId },
        select: { status: true, evaluations: { select: { slot: true, coachId: true, coachDivision: true } } },
      });
      if (!submission || submission.status !== "OPEN") return { error: "This submission is no longer available." };
      const decision = slotForCoach(user.id, division, submission.evaluations);
      if (!decision.ok) return { error: SLOT_DECISION_MESSAGES[decision.reason] };
      const evaluation = await tx.evaluation.create({
        data: { submissionId, slot: decision.slot, coachId: user.id, coachDivision: division },
      });
      return { id: evaluation.id };
    });
    if ("error" in result) return { error: result.error };
    evaluationId = result.id;
  } catch (err) {
    // Unique constraint: another coach claimed the same spot at the same moment.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Another coach just took that spot. Pick another submission." };
    }
    throw err;
  }
  redirect(`/coach/evaluations/${evaluationId}`);
}

export async function releaseClaim(evaluationId: string) {
  const { user } = await requireApprovedCoach();
  await db.evaluation.deleteMany({ where: { id: evaluationId, coachId: user.id, status: "CLAIMED" } });
  revalidatePath("/coach");
  redirect("/coach");
}

export async function saveEvaluation(evaluationId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const { user } = await requireApprovedCoach();
  const evaluation = await db.evaluation.findFirst({
    where: { id: evaluationId, coachId: user.id },
    include: { submission: { select: { position: true } } },
  });
  if (!evaluation || evaluation.status !== "CLAIMED") {
    return { error: "This evaluation is no longer open. It may have expired or already been submitted." };
  }
  const position = evaluation.submission.position;
  if (!isPositionKey(position)) return { error: "Submission has an unknown position." };

  const { data, errors } = parseEvaluationForm(fd, position);
  const fields = {
    metricGrades: JSON.stringify(data.metricGrades),
    currentLevel: data.currentLevel,
    targetLevel: data.targetLevel,
    improvements: JSON.stringify(data.improvements),
    improvementNotes: data.improvementNotes,
    overallFeedback: data.overallFeedback,
  };

  // Always keep what the coach typed, even when submitting with errors.
  await db.evaluation.update({ where: { id: evaluationId }, data: fields });
  revalidatePath(`/coach/evaluations/${evaluationId}`);

  if (fd.get("intent") !== "submit") return { success: "Draft saved." };
  if (Object.keys(errors).length) {
    return { error: "Your draft is saved, but complete every section before submitting.", fieldErrors: errors };
  }

  await db.$transaction(async (tx) => {
    await tx.evaluation.update({
      where: { id: evaluationId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    const done = await tx.evaluation.count({ where: { submissionId: evaluation.submissionId, status: "SUBMITTED" } });
    if (done >= EVALUATIONS_PER_SUBMISSION) {
      await tx.submission.update({
        where: { id: evaluation.submissionId },
        data: { status: "COMPLETE", completedAt: new Date() },
      });
    }
  });
  revalidatePath("/coach");
  redirect(`/coach/evaluations/${evaluationId}?submitted=1`);
}

