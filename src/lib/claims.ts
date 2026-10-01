import "server-only";
import { CLAIM_HOURS } from "@/config/site";
import { db } from "./db";

export const MAX_ACTIVE_CLAIMS = 5;

export function claimDeadline(claimedAt: Date) {
  return new Date(claimedAt.getTime() + CLAIM_HOURS * 60 * 60 * 1000);
}

// Claims a coach has not finished within CLAIM_HOURS go back to the queue so
// a player is never stuck waiting on one coach.
export async function releaseExpiredClaims() {
  const cutoff = new Date(Date.now() - CLAIM_HOURS * 60 * 60 * 1000);
  await db.evaluation.deleteMany({ where: { status: "CLAIMED", claimedAt: { lt: cutoff } } });
}
