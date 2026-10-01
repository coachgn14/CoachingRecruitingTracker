// Core baseball/recruiting vocabulary shared by the whole app.
// Everything a player enters and a coach grades is defined here so the
// forms, validation, evaluation and report pages always agree.

// ---------------------------------------------------------------------------
// College levels — used for per-metric grades, current fit and target level.
// Ordered from highest to lowest; the index is the level's rank, and
// consensus results are computed from it (see consensus.ts).
// ---------------------------------------------------------------------------
export const LEVELS = [
  { key: "D1_POWER", label: "D1 – Power Conference", short: "D1 Power" },
  { key: "D1_MID", label: "D1 – Mid-Major", short: "D1 Mid-Major" },
  { key: "D1_LOW", label: "D1 – Low-Major", short: "D1 Low-Major" },
  { key: "D2", label: "Division 2", short: "D2" },
  { key: "D3", label: "Division 3", short: "D3" },
  { key: "NAIA", label: "NAIA", short: "NAIA" },
  { key: "JUCO_D1", label: "JUCO – Division 1", short: "JUCO D1" },
  { key: "JUCO_D2", label: "JUCO – Division 2", short: "JUCO D2" },
  { key: "JUCO_D3", label: "JUCO – Division 3", short: "JUCO D3" },
  { key: "NOT_YET", label: "Not yet a college fit", short: "Not yet" },
] as const;

export type LevelKey = (typeof LEVELS)[number]["key"];

export const LEVEL_KEYS = LEVELS.map((l) => l.key) as LevelKey[];

export function isLevelKey(v: unknown): v is LevelKey {
  return typeof v === "string" && (LEVEL_KEYS as string[]).includes(v);
}

export function levelRank(key: LevelKey): number {
  return LEVEL_KEYS.indexOf(key);
}

export function levelLabel(key: string | null | undefined): string {
  return LEVELS.find((l) => l.key === key)?.label ?? "—";
}

// ---------------------------------------------------------------------------
// Coach divisions — the division a coach works in. Each submission gets one
// D1 coach plus two coaches from two *different* non-D1 divisions.
// ---------------------------------------------------------------------------
export const COACH_DIVISIONS = [
  { key: "D1", label: "Division 1" },
  { key: "D2", label: "Division 2" },
  { key: "D3", label: "Division 3" },
  { key: "NAIA", label: "NAIA" },
  { key: "JUCO", label: "Junior College" },
] as const;

export type CoachDivision = (typeof COACH_DIVISIONS)[number]["key"];

export function isCoachDivision(v: unknown): v is CoachDivision {
  return typeof v === "string" && COACH_DIVISIONS.some((d) => d.key === v);
}

export function divisionLabel(key: string): string {
  return COACH_DIVISIONS.find((d) => d.key === key)?.label ?? key;
}

// ---------------------------------------------------------------------------
// Positions and the metrics each one requires.
// ---------------------------------------------------------------------------
export const POSITION_GROUPS = ["PITCHER", "CATCHER", "INFIELD", "OUTFIELD"] as const;
export type PositionGroup = (typeof POSITION_GROUPS)[number];

export const METRICS = {
  fbVelo: { label: "Fastball velocity", unit: "mph", min: 40, max: 105, step: 0.1, lowerIsBetter: false },
  bbVelo: { label: "Breaking ball velocity", unit: "mph", min: 30, max: 100, step: 0.1, lowerIsBetter: false },
  chVelo: { label: "Changeup velocity", unit: "mph", min: 30, max: 100, step: 0.1, lowerIsBetter: false },
  popTime: { label: "Pop time to 2nd base", unit: "sec", min: 1.5, max: 3.5, step: 0.01, lowerIsBetter: true },
  catcherThrowVelo: { label: "Throwing velocity (from catcher's stance)", unit: "mph", min: 40, max: 100, step: 0.1, lowerIsBetter: false },
  sixty: { label: "60-yard dash", unit: "sec", min: 5.5, max: 10, step: 0.01, lowerIsBetter: true },
  thirty: { label: "30-yard dash", unit: "sec", min: 3, max: 6, step: 0.01, lowerIsBetter: true },
  exitVelo: { label: "Exit velocity", unit: "mph", min: 40, max: 125, step: 0.1, lowerIsBetter: false },
  infieldThrowVelo: { label: "Throwing velocity (across the infield)", unit: "mph", min: 40, max: 105, step: 0.1, lowerIsBetter: false },
} as const;

export type MetricKey = keyof typeof METRICS;

const PITCHER_METRICS: MetricKey[] = ["fbVelo", "bbVelo", "chVelo"];
const FIELDER_METRICS: MetricKey[] = ["sixty", "thirty", "exitVelo", "infieldThrowVelo"];

export const POSITIONS = {
  RHP: { label: "Right-Handed Pitcher", group: "PITCHER", metrics: PITCHER_METRICS },
  LHP: { label: "Left-Handed Pitcher", group: "PITCHER", metrics: PITCHER_METRICS },
  C: { label: "Catcher", group: "CATCHER", metrics: ["popTime", "catcherThrowVelo", "sixty", "thirty", "exitVelo"] },
  MIF: { label: "Middle Infielder (SS / 2B)", group: "INFIELD", metrics: FIELDER_METRICS },
  "1B": { label: "1st Base", group: "INFIELD", metrics: FIELDER_METRICS },
  "3B": { label: "3rd Base", group: "INFIELD", metrics: FIELDER_METRICS },
  OF: { label: "Outfielder", group: "OUTFIELD", metrics: FIELDER_METRICS },
} as const satisfies Record<string, { label: string; group: PositionGroup; metrics: readonly MetricKey[] }>;

export type PositionKey = keyof typeof POSITIONS;

export function isPositionKey(v: unknown): v is PositionKey {
  return typeof v === "string" && v in POSITIONS;
}

export function positionLabel(key: string | null | undefined): string {
  return key && isPositionKey(key) ? POSITIONS[key].label : "—";
}

export const METRIC_SOURCES = [
  { key: "SELF", label: "Self-reported" },
  { key: "TEAM", label: "Team / trainer measured" },
  { key: "RADAR", label: "Radar gun (on video)" },
  { key: "TRACKMAN", label: "TrackMan" },
  { key: "RAPSODO", label: "Rapsodo" },
  { key: "PERFECT_GAME", label: "Perfect Game event" },
  { key: "PBR", label: "Prep Baseball (PBR) event" },
  { key: "OTHER", label: "Other showcase / event" },
] as const;

export type MetricSource = (typeof METRIC_SOURCES)[number]["key"];

export function sourceLabel(key: string | undefined): string {
  return METRIC_SOURCES.find((s) => s.key === key)?.label ?? "—";
}

export const HANDS = [
  { key: "R", label: "Right" },
  { key: "L", label: "Left" },
] as const;

export const BATS = [
  { key: "R", label: "Right" },
  { key: "L", label: "Left" },
  { key: "S", label: "Switch" },
] as const;

export const PLAYER_TYPES = [
  { key: "HIGH_SCHOOL", label: "High school" },
  { key: "JUCO", label: "Junior college" },
] as const;

export function formatHeight(inches: number | null | undefined): string {
  if (!inches) return "—";
  return `${Math.floor(inches / 12)}' ${inches % 12}"`;
}

// ---------------------------------------------------------------------------
// Shapes stored as JSON on profiles, submissions and evaluations.
// ---------------------------------------------------------------------------
export type MetricEntry = { value: number; source: MetricSource; measuredOn?: string };
export type MetricMap = Partial<Record<MetricKey, MetricEntry>>;
export type VideoMap = Record<string, { url: string }>;

export type SubmissionSnapshot = {
  player: {
    firstName: string;
    lastName: string;
    playerType: string;
    school: string;
    state: string;
    gradYear: number;
    heightInches: number;
    weightLbs: number;
    position: PositionKey;
    throws: string;
    bats: string;
  };
  metrics: MetricMap;
  videos: VideoMap;
};

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
