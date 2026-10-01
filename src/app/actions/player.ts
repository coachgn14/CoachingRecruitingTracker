"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { VIDEO_CLIPS } from "@/config/videoRequirements";
import { EVALUATION_PRICE_CENTS } from "@/config/site";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { METRICS, POSITIONS, parseJson, type MetricMap, type VideoMap } from "@/lib/domain";
import { buildSnapshot, missingForSubmission, parseProfileForm } from "@/lib/profile";
import { formValues, type FormState } from "./types";

export async function saveProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("PLAYER");
  const { data, errors } = parseProfileForm(fd);
  if (Object.keys(errors).length) {
    return { error: "Please fix the highlighted fields.", fieldErrors: errors, values: formValues(fd) };
  }

  const existing = await db.playerProfile.findUniqueOrThrow({ where: { userId: user.id } });

  // Replace the metrics/videos for the selected position and keep the rest,
  // so switching position back and forth does not lose earlier entries.
  const metrics = parseJson<MetricMap>(existing.metrics, {});
  const videos = parseJson<VideoMap>(existing.videos, {});
  if (data.position) {
    for (const key of POSITIONS[data.position].metrics) delete metrics[key];
    for (const clip of VIDEO_CLIPS[POSITIONS[data.position].group]) delete videos[clip.key];
  }
  for (const key of Object.keys(metrics)) if (!(key in METRICS)) delete metrics[key as keyof MetricMap];

  await db.playerProfile.update({
    where: { userId: user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      playerType: data.playerType,
      school: data.school,
      state: data.state,
      gradYear: data.gradYear,
      heightInches: data.heightInches,
      weightLbs: data.weightLbs,
      position: data.position,
      throws: data.throws,
      bats: data.bats,
      metrics: JSON.stringify({ ...metrics, ...data.metrics }),
      videos: JSON.stringify({ ...videos, ...data.videos }),
    },
  });
  revalidatePath("/player", "layout");
  return { success: "Profile saved." };
}

export async function createSubmission() {
  const user = await requireUser("PLAYER");
  const profile = await db.playerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  if (missingForSubmission(profile).length) redirect("/player/submit");

  const snapshot = buildSnapshot(profile);
  const data = {
    position: snapshot.player.position,
    gradYear: snapshot.player.gradYear,
    snapshot: JSON.stringify(snapshot),
    amountCents: EVALUATION_PRICE_CENTS,
  };

  // Reuse an unpaid submission rather than piling up abandoned checkouts.
  const unpaid = await db.submission.findFirst({ where: { playerId: user.id, status: "AWAITING_PAYMENT" } });
  const submission = unpaid
    ? await db.submission.update({ where: { id: unpaid.id }, data })
    : await db.submission.create({ data: { ...data, playerId: user.id } });

  redirect(`/player/submissions/${submission.id}/pay`);
}

// Test-mode checkout. Replace with a Stripe Checkout session + webhook that
// performs this same update once payment succeeds.
export async function completeTestPayment(submissionId: string) {
  const user = await requireUser("PLAYER");
  if (process.env.PAYMENTS_MODE && process.env.PAYMENTS_MODE !== "test") {
    throw new Error("Test payments are disabled.");
  }
  const result = await db.submission.updateMany({
    where: { id: submissionId, playerId: user.id, status: "AWAITING_PAYMENT" },
    data: { status: "OPEN", paidAt: new Date(), paymentRef: `TEST-${randomUUID()}` },
  });
  if (result.count === 0) redirect("/player");
  revalidatePath("/player", "layout");
  redirect(`/player/submissions/${submissionId}`);
}
