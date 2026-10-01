import type { CoachDivision } from "./domain";

// Rules for which coach may take which slot on a submission:
//   slot 1     — always a Division 1 coach
//   slots 2, 3 — coaches from two different non-D1 divisions
// So the three evaluators always come from three different divisions.
// The database enforces the same rules with unique constraints.

export const D1_SLOT = 1;
export const OTHER_SLOTS = [2, 3] as const;
export const EVALUATIONS_PER_SUBMISSION = 3;

export type ExistingEval = { slot: number; coachId: string; coachDivision: string };

export type SlotDecision =
  | { ok: true; slot: number }
  | { ok: false; reason: "ALREADY_CLAIMED" | "DIVISION_TAKEN" | "D1_SLOT_TAKEN" | "OTHER_SLOTS_FULL" };

export function slotForCoach(
  coachId: string,
  division: CoachDivision,
  existing: ExistingEval[],
): SlotDecision {
  if (existing.some((e) => e.coachId === coachId)) return { ok: false, reason: "ALREADY_CLAIMED" };
  if (existing.some((e) => e.coachDivision === division)) return { ok: false, reason: "DIVISION_TAKEN" };

  const taken = new Set(existing.map((e) => e.slot));
  if (division === "D1") {
    return taken.has(D1_SLOT) ? { ok: false, reason: "D1_SLOT_TAKEN" } : { ok: true, slot: D1_SLOT };
  }
  const free = OTHER_SLOTS.find((s) => !taken.has(s));
  return free ? { ok: true, slot: free } : { ok: false, reason: "OTHER_SLOTS_FULL" };
}

export function canCoachClaim(coachId: string, division: CoachDivision, existing: ExistingEval[]): boolean {
  return slotForCoach(coachId, division, existing).ok;
}

export const SLOT_DECISION_MESSAGES: Record<Exclude<SlotDecision, { ok: true }>["reason"], string> = {
  ALREADY_CLAIMED: "You already have this evaluation.",
  DIVISION_TAKEN: "A coach from your division has already taken this evaluation.",
  D1_SLOT_TAKEN: "The Division 1 spot on this evaluation is already taken.",
  OTHER_SLOTS_FULL: "Both non-D1 spots on this evaluation are already taken.",
};
