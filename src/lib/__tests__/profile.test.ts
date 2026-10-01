import { describe, expect, it } from "vitest";
import { buildSnapshot, missingForSubmission, parseProfileForm, type StoredProfile } from "../profile";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const base = {
  firstName: "Jake",
  lastName: "Miller",
  playerType: "HIGH_SCHOOL",
  school: "Central HS",
  state: "tx",
  gradYear: String(new Date().getFullYear() + 1),
  heightFeet: "6",
  heightInches: "2",
  weightLbs: "190",
  position: "RHP",
  throws: "R",
  bats: "R",
};

describe("parseProfileForm", () => {
  it("parses a pitcher with only pitcher metrics", () => {
    const { data, errors } = parseProfileForm(
      form({ ...base, "metric.fbVelo.value": "88.5", "metric.fbVelo.source": "TRACKMAN", "metric.sixty.value": "6.8" }),
    );
    expect(errors).toEqual({});
    expect(data.heightInches).toBe(74);
    expect(data.state).toBe("TX");
    expect(data.metrics).toEqual({ fbVelo: { value: 88.5, source: "TRACKMAN" } });
  });

  it("rejects out-of-range metrics and bad links", () => {
    const { errors } = parseProfileForm(
      form({ ...base, "metric.fbVelo.value": "150", "video.bullpenSide": "not a link" }),
    );
    expect(errors["metric.fbVelo"]).toBeDefined();
    expect(errors["video.bullpenSide"]).toBeDefined();
  });

  it("uses the catcher metric set for catchers", () => {
    const { data } = parseProfileForm(form({ ...base, position: "C", "metric.popTime.value": "1.98", "metric.fbVelo.value": "88" }));
    expect(Object.keys(data.metrics)).toEqual(["popTime"]);
  });
});

describe("missingForSubmission / buildSnapshot", () => {
  const stored: StoredProfile = {
    firstName: "Jake",
    lastName: "Miller",
    playerType: "HIGH_SCHOOL",
    school: "Central HS",
    state: "TX",
    gradYear: 2027,
    heightInches: 74,
    weightLbs: 190,
    position: "LHP",
    throws: "L",
    bats: "L",
    metrics: JSON.stringify({
      fbVelo: { value: 86, source: "RADAR" },
      bbVelo: { value: 72, source: "RADAR" },
      sixty: { value: 7.1, source: "SELF" },
    }),
    videos: JSON.stringify({ velocityProof: { url: "https://youtu.be/a" }, bullpenSide: { url: "https://youtu.be/b" } }),
  };

  it("lists missing metrics and required videos", () => {
    expect(missingForSubmission(stored)).toEqual(["Changeup velocity", "Video: Bullpen – behind the mound"]);
  });

  it("snapshots only the current position's data", () => {
    const snap = buildSnapshot(stored);
    expect(Object.keys(snap.metrics)).toEqual(["fbVelo", "bbVelo"]);
    expect(snap.player.position).toBe("LHP");
  });
});
