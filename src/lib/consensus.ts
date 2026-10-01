import { isLevelKey, LEVEL_KEYS, levelRank, type LevelKey } from "./domain";

// Consensus = the median level by rank. With three coaches that is the
// middle opinion: if two agree it is their answer, and one outlier (high or
// low) cannot drag the result. Requires at least one level.
export function medianLevel(levels: LevelKey[]): LevelKey | null {
  if (levels.length === 0) return null;
  const ranks = levels.map(levelRank).sort((a, b) => a - b);
  // For an even count take the lower (more conservative) of the middle two.
  const mid = Math.floor(ranks.length / 2);
  return LEVEL_KEYS[ranks[mid]];
}

export type EvalForConsensus = {
  metricGrades: Record<string, string>;
  currentLevel: string | null;
  targetLevel: string | null;
  improvements: string[];
};

export type Consensus = {
  currentLevel: LevelKey | null;
  targetLevel: LevelKey | null;
  metricGrades: Record<string, LevelKey | null>;
  // Improvement keys with how many coaches flagged each, most-flagged first.
  improvements: { key: string; count: number }[];
};

export function buildConsensus(evals: EvalForConsensus[], metricKeys: readonly string[]): Consensus {
  const levelsOf = (pick: (e: EvalForConsensus) => unknown) =>
    evals.map(pick).filter(isLevelKey);

  const metricGrades: Record<string, LevelKey | null> = {};
  for (const key of metricKeys) metricGrades[key] = medianLevel(levelsOf((e) => e.metricGrades[key]));

  const counts = new Map<string, number>();
  for (const e of evals) for (const k of new Set(e.improvements)) counts.set(k, (counts.get(k) ?? 0) + 1);
  const improvements = [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);

  return {
    currentLevel: medianLevel(levelsOf((e) => e.currentLevel)),
    targetLevel: medianLevel(levelsOf((e) => e.targetLevel)),
    metricGrades,
    improvements,
  };
}
