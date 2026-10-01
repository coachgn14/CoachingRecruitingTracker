import { describe, expect, it } from "vitest";
import { buildConsensus, medianLevel } from "../consensus";

describe("medianLevel", () => {
  it("returns the middle opinion of three", () => {
    expect(medianLevel(["D1_MID", "D2", "D3"])).toBe("D2");
    expect(medianLevel(["D3", "D1_POWER", "D2"])).toBe("D2");
  });

  it("returns the majority when two agree", () => {
    expect(medianLevel(["D2", "D2", "D1_POWER"])).toBe("D2");
  });

  it("is conservative with an even count", () => {
    expect(medianLevel(["D1_MID", "D2"])).toBe("D2");
  });

  it("returns null with no levels", () => {
    expect(medianLevel([])).toBeNull();
  });
});

describe("buildConsensus", () => {
  it("combines metric grades, levels and improvement counts", () => {
    const c = buildConsensus(
      [
        { metricGrades: { fbVelo: "D1_LOW" }, currentLevel: "D2", targetLevel: "D1_LOW", improvements: ["command", "fbVelo"] },
        { metricGrades: { fbVelo: "D2" }, currentLevel: "D2", targetLevel: "D1_MID", improvements: ["fbVelo"] },
        { metricGrades: { fbVelo: "D3" }, currentLevel: "D3", targetLevel: "D2", improvements: ["fbVelo", "strength"] },
      ],
      ["fbVelo"],
    );
    expect(c.currentLevel).toBe("D2");
    expect(c.targetLevel).toBe("D1_LOW");
    expect(c.metricGrades.fbVelo).toBe("D2");
    expect(c.improvements[0]).toEqual({ key: "fbVelo", count: 3 });
    expect(c.improvements).toHaveLength(3);
  });
});
