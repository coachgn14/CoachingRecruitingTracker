import { describe, expect, it } from "vitest";
import { slotForCoach, type ExistingEval } from "../assignment";

const ev = (slot: number, coachId: string, coachDivision: string): ExistingEval => ({ slot, coachId, coachDivision });

describe("slotForCoach", () => {
  it("gives a D1 coach slot 1 on an empty submission", () => {
    expect(slotForCoach("c1", "D1", [])).toEqual({ ok: true, slot: 1 });
  });

  it("gives non-D1 coaches slots 2 and 3, never slot 1", () => {
    expect(slotForCoach("c2", "D2", [])).toEqual({ ok: true, slot: 2 });
    expect(slotForCoach("c3", "NAIA", [ev(2, "c2", "D2")])).toEqual({ ok: true, slot: 3 });
  });

  it("allows only one D1 coach", () => {
    expect(slotForCoach("c9", "D1", [ev(1, "c1", "D1")])).toEqual({ ok: false, reason: "DIVISION_TAKEN" });
  });

  it("requires the two non-D1 coaches to be from different divisions", () => {
    expect(slotForCoach("c3", "D2", [ev(2, "c2", "D2")])).toEqual({ ok: false, reason: "DIVISION_TAKEN" });
  });

  it("refuses a third non-D1 coach, keeping slot 1 for D1", () => {
    const existing = [ev(2, "c2", "D2"), ev(3, "c3", "D3")];
    expect(slotForCoach("c4", "JUCO", existing)).toEqual({ ok: false, reason: "OTHER_SLOTS_FULL" });
    expect(slotForCoach("c1", "D1", existing)).toEqual({ ok: true, slot: 1 });
  });

  it("refuses a coach who already claimed", () => {
    expect(slotForCoach("c1", "D1", [ev(1, "c1", "D1")])).toEqual({ ok: false, reason: "ALREADY_CLAIMED" });
  });

  it("reuses a released slot", () => {
    expect(slotForCoach("c5", "JUCO", [ev(3, "c3", "D3")])).toEqual({ ok: true, slot: 2 });
  });
});
