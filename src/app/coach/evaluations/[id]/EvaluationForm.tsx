"use client";

import { saveEvaluation } from "@/app/actions/coach";
import { SubmitButton } from "@/components/SubmitButton";
import { useFormSubmit } from "@/components/useFormSubmit";
import { Alert, Card, Field, inputClass } from "@/components/ui";
import type { Improvement } from "@/config/improvements";
import { LEVELS, METRICS, type MetricKey } from "@/lib/domain";
import { MIN_FEEDBACK_CHARS } from "@/lib/evaluation";

type Initial = {
  metricGrades: Record<string, string>;
  currentLevel: string;
  targetLevel: string;
  improvements: string[];
  improvementNotes: string;
  overallFeedback: string;
};

function LevelSelect({ name, defaultValue, id }: { name: string; defaultValue?: string; id: string }) {
  return (
    <select id={id} name={name} defaultValue={defaultValue ?? ""} className={inputClass}>
      <option value="">Select a level…</option>
      {LEVELS.map((l) => (
        <option key={l.key} value={l.key}>
          {l.label}
        </option>
      ))}
    </select>
  );
}

export function EvaluationForm({
  evaluationId,
  metrics,
  playerValues,
  improvements,
  initial,
}: {
  evaluationId: string;
  metrics: readonly MetricKey[];
  playerValues: Record<string, string>;
  improvements: Improvement[];
  initial: Initial;
}) {
  const { state, onSubmit, pending } = useFormSubmit(saveEvaluation.bind(null, evaluationId), {});
  const e = state.fieldErrors ?? {};
  const checked = new Set(initial.improvements);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.success && <Alert tone="success">{state.success}</Alert>}

      <Card title="1. Grade each metric by level">
        <p className="mb-4 text-sm text-slate-600">For each tool, which college level does it play at today? (e.g. a D1 Power Conference arm.)</p>
        <div className="space-y-4">
          {metrics.map((k) => (
            <div key={k} className="grid items-start gap-2 sm:grid-cols-2">
              <div className="text-sm">
                <div className="font-medium text-slate-900">{METRICS[k].label}</div>
                <div className="text-slate-500">Player reported: {playerValues[k] ?? "—"}</div>
              </div>
              <Field label={<span className="sr-only">{METRICS[k].label} level</span>} htmlFor={`grade.${k}`} error={e[`grade.${k}`]}>
                <LevelSelect id={`grade.${k}`} name={`grade.${k}`} defaultValue={initial.metricGrades[k]} />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      <Card title="2. Overall level">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current fit: where this player fits today" htmlFor="currentLevel" error={e.currentLevel}>
            <LevelSelect id="currentLevel" name="currentLevel" defaultValue={initial.currentLevel} />
          </Field>
          <Field label="Target: level reachable with the improvements below" htmlFor="targetLevel" error={e.targetLevel}>
            <LevelSelect id="targetLevel" name="targetLevel" defaultValue={initial.targetLevel} />
          </Field>
        </div>
      </Card>

      <Card title="3. What to improve to reach the target level">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Areas to improve</legend>
          {improvements.map((i) => (
            <label key={i.key} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="improvements"
                value={i.key}
                defaultChecked={checked.has(i.key)}
                className="mt-1"
              />
              {i.label}
            </label>
          ))}
        </fieldset>
        {e.improvements && <p className="mt-2 text-xs font-medium text-red-700">{e.improvements}</p>}
        <div className="mt-4">
          <Field label="Specifics (targets, drills, numbers to hit)" htmlFor="improvementNotes">
            <textarea
              id="improvementNotes"
              name="improvementNotes"
              rows={4}
              defaultValue={initial.improvementNotes}
              placeholder="e.g. Needs to sit 87–89 with the fastball to be a consistent D1 mid-major arm."
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card title="4. Overall written feedback">
        <Field
          label="The player reads this as their take-home summary"
          htmlFor="overallFeedback"
          error={e.overallFeedback}
          hint={`At least ${MIN_FEEDBACK_CHARS} characters. Do not include your name, school or contact details.`}
        >
          <textarea
            id="overallFeedback"
            name="overallFeedback"
            rows={8}
            defaultValue={initial.overallFeedback}
            className={inputClass}
          />
        </Field>
      </Card>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pending={pending} name="intent" value="draft" variant="secondary">
          Save draft
        </SubmitButton>
        <SubmitButton pending={pending} name="intent" value="submit" pendingText="Submitting…">
          Submit evaluation
        </SubmitButton>
      </div>
    </form>
  );
}
