import type { PositionGroup } from "@/lib/domain";

// Preset "what to improve" options coaches can check on an evaluation.
// Coaches can also write their own notes. Keys are stored on evaluations,
// so add new options freely but avoid renaming existing keys.

export type Improvement = { key: string; label: string };

const strength: Improvement = { key: "strength", label: "Add strength / physical development" };
const exitVelo: Improvement = { key: "exitVelo", label: "Increase exit velocity" };
const swing: Improvement = { key: "swing", label: "Improve swing mechanics / bat path" };
const approach: Improvement = { key: "approach", label: "Improve plate approach / pitch selection" };
const speed: Improvement = { key: "speed", label: "Improve speed (60-yard time)" };
const arm: Improvement = { key: "arm", label: "Increase arm strength / throwing velocity" };
const accuracy: Improvement = { key: "throwAccuracy", label: "Improve throwing accuracy" };
const footwork: Improvement = { key: "footwork", label: "Improve defensive footwork" };

export const IMPROVEMENTS: Record<PositionGroup, Improvement[]> = {
  PITCHER: [
    { key: "fbVelo", label: "Increase fastball velocity" },
    { key: "breakingBall", label: "Improve breaking ball shape / velocity" },
    { key: "changeup", label: "Develop changeup" },
    { key: "command", label: "Improve command / strike throwing" },
    { key: "delivery", label: "Improve delivery / repeatability" },
    { key: "armAction", label: "Clean up arm action" },
    { key: "tempo", label: "Improve tempo / pace" },
    strength,
  ],
  CATCHER: [
    { key: "popTime", label: "Improve pop time (transfer / footwork)" },
    arm,
    accuracy,
    { key: "receiving", label: "Improve receiving / framing" },
    { key: "blocking", label: "Improve blocking" },
    exitVelo,
    swing,
    approach,
    speed,
    strength,
  ],
  INFIELD: [
    arm,
    accuracy,
    footwork,
    { key: "hands", label: "Improve glove work / hands" },
    { key: "range", label: "Improve range / first step" },
    exitVelo,
    swing,
    approach,
    speed,
    strength,
  ],
  OUTFIELD: [
    arm,
    accuracy,
    { key: "routes", label: "Improve routes / reads off the bat" },
    { key: "firstStep", label: "Improve first step / jumps" },
    exitVelo,
    swing,
    approach,
    speed,
    strength,
  ],
};
