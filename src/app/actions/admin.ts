"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function reviewCoach(coachProfileId: string, fd: FormData) {
  await requireUser("ADMIN");
  const decision = fd.get("decision");
  if (decision !== "APPROVED" && decision !== "REJECTED" && decision !== "PENDING") throw new Error("Invalid decision");
  await db.coachProfile.update({
    where: { id: coachProfileId },
    data: {
      status: decision,
      reviewNote: String(fd.get("reviewNote") ?? "").trim().slice(0, 1000),
      reviewedAt: new Date(),
    },
  });
  // A coach who loses approval gives up any unfinished claims.
  if (decision !== "APPROVED") {
    const profile = await db.coachProfile.findUniqueOrThrow({ where: { id: coachProfileId } });
    await db.evaluation.deleteMany({ where: { coachId: profile.userId, status: "CLAIMED" } });
  }
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function adminReleaseEvaluation(evaluationId: string) {
  await requireUser("ADMIN");
  await db.evaluation.deleteMany({ where: { id: evaluationId, status: "CLAIMED" } });
  revalidatePath("/admin");
}
