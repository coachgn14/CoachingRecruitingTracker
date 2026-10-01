import { IMPROVEMENTS } from "@/config/improvements";
import { POSITIONS, isLevelKey, type LevelKey, type PositionKey } from "./domain";
import type { FieldErrors } from "./profile";

// Parsing and validation for the coach evaluation form. Every field is
// required so each player gets the same complete, standardized report.

export const MIN_FEEDBACK_CHARS = 100;
export const MAX_TEXT_CHARS = 5000;

export type EvaluationInput = {
  metricGrades: Record<string, LevelKey>;
  currentLevel: LevelKey | null;
  targetLevel: LevelKey | null;
  improvements: string[];
  improvementNotes: string;
  overallFeedback: string;
};

export function parseEvaluationForm(
  fd: FormData,
  position: PositionKey,
): { data: EvaluationInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const { metrics, group } = POSITIONS[position];

  const metricGrades: Record<string, LevelKey> = {};
  for (const key of metrics) {
    const v = fd.get(`grade.${key}`);
    if (isLevelKey(v)) metricGrades[key] = v;
    else errors[`grade.${key}`] = "Pick a level for this metric.";
  }

  const current = fd.get("currentLevel");
  const target = fd.get("targetLevel");
  if (!isLevelKey(current)) errors.currentLevel = "Pick the level this player fits today.";
  if (!isLevelKey(target)) errors.targetLevel = "Pick the level this player could reach.";

  const allowed = new Set(IMPROVEMENTS[group].map((i) => i.key));
  const improvements = [...new Set(fd.getAll("improvements").map(String))].filter((k) => allowed.has(k));
  const improvementNotes = String(fd.get("improvementNotes") ?? "").trim().slice(0, MAX_TEXT_CHARS);
  if (improvements.length === 0 && !improvementNotes) {
    errors.improvements = "Select at least one area to improve or describe it in the notes.";
  }

  const overallFeedback = String(fd.get("overallFeedback") ?? "").trim().slice(0, MAX_TEXT_CHARS);
  if (overallFeedback.length < MIN_FEEDBACK_CHARS) {
    errors.overallFeedback = `Write at least ${MIN_FEEDBACK_CHARS} characters of overall feedback.`;
  }

  return {
    data: {
      metricGrades,
      currentLevel: isLevelKey(current) ? current : null,
      targetLevel: isLevelKey(target) ? target : null,
      improvements,
      improvementNotes,
      overallFeedback,
    },
    errors,
  };
}
