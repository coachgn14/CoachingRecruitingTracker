"use client";

import Link from "next/link";
import { useState } from "react";
import { saveProfile } from "@/app/actions/player";
import { SubmitButton } from "@/components/SubmitButton";
import { useFormSubmit } from "@/components/useFormSubmit";
import { Alert, Card, Field, inputClass } from "@/components/ui";
import { GENERAL_VIDEO_RULES, VIDEO_CLIPS } from "@/config/videoRequirements";
import { BATS, HANDS, METRIC_SOURCES, METRICS, PLAYER_TYPES, POSITIONS, isPositionKey } from "@/lib/domain";

export function ProfileForm({ initial, gradYears }: { initial: Record<string, string>; gradYears: { min: number; max: number } }) {
  const { state, onSubmit, pending } = useFormSubmit(saveProfile, {});
  const v = state.values ?? initial;
  const e = state.fieldErrors ?? {};
  const [position, setPosition] = useState(v.position ?? "");
  const pos = isPositionKey(position) ? POSITIONS[position] : null;

  const years: number[] = [];
  for (let y = gradYears.min; y <= gradYears.max; y++) years.push(y);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.success && (
        <Alert tone="success">
          {state.success}{" "}
          <Link href="/player/submit" className="font-semibold underline">
            Review and submit for evaluation →
          </Link>
        </Alert>
      )}

      <Card title="About you">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" error={e.firstName}>
            <input id="firstName" name="firstName" required defaultValue={v.firstName} className={inputClass} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={e.lastName}>
            <input id="lastName" name="lastName" required defaultValue={v.lastName} className={inputClass} />
          </Field>
          <Field label="Player type" htmlFor="playerType">
            <select id="playerType" name="playerType" defaultValue={v.playerType} className={inputClass}>
              {PLAYER_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Graduation year" htmlFor="gradYear" error={e.gradYear}>
            <select id="gradYear" name="gradYear" defaultValue={v.gradYear} className={inputClass}>
              <option value="">Select…</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
          <Field label="School" htmlFor="school">
            <input id="school" name="school" defaultValue={v.school} className={inputClass} />
          </Field>
          <Field label="State" htmlFor="state" hint="Two-letter code, e.g. TX">
            <input id="state" name="state" maxLength={2} defaultValue={v.state} className={`${inputClass} uppercase`} />
          </Field>
          <Field label="Height" error={e.height}>
            <div className="flex gap-2">
              <select name="heightFeet" aria-label="Feet" defaultValue={v.heightFeet} className={inputClass}>
                <option value="">ft</option>
                {[4, 5, 6, 7].map((f) => (
                  <option key={f} value={f}>
                    {f} ft
                  </option>
                ))}
              </select>
              <select name="heightInches" aria-label="Inches" defaultValue={v.heightInches} className={inputClass}>
                <option value="">in</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} in
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <Field label="Weight (lbs)" htmlFor="weightLbs" error={e.weightLbs}>
            <input id="weightLbs" name="weightLbs" type="number" min={90} max={350} defaultValue={v.weightLbs} className={inputClass} />
          </Field>
          <Field label="Throws" htmlFor="throws">
            <select id="throws" name="throws" defaultValue={v.throws} className={inputClass}>
              <option value="">Select…</option>
              {HANDS.map((h) => (
                <option key={h.key} value={h.key}>
                  {h.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bats" htmlFor="bats">
            <select id="bats" name="bats" defaultValue={v.bats} className={inputClass}>
              <option value="">Select…</option>
              {BATS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Position" htmlFor="position" hint="Your metrics and required videos depend on your position.">
            <select id="position" name="position" value={position} onChange={(ev) => setPosition(ev.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {Object.entries(POSITIONS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      {pos && (
        <Card title={`Required metrics: ${pos.label}`}>
          <p className="mb-4 text-sm text-slate-600">
            Tell coaches where each number came from. Velocity numbers must also be shown in your proof video.
          </p>
          <div className="space-y-5">
            {pos.metrics.map((key) => {
              const m = METRICS[key];
              return (
                <div key={key} className="grid gap-3 border-b border-slate-100 pb-4 last:border-0 sm:grid-cols-3">
                  <Field label={`${m.label} (${m.unit})`} htmlFor={`metric.${key}.value`} error={e[`metric.${key}`]}>
                    <input
                      id={`metric.${key}.value`}
                      name={`metric.${key}.value`}
                      type="number"
                      inputMode="decimal"
                      step={m.step}
                      min={m.min}
                      max={m.max}
                      defaultValue={v[`metric.${key}.value`]}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Source" htmlFor={`metric.${key}.source`}>
                    <select id={`metric.${key}.source`} name={`metric.${key}.source`} defaultValue={v[`metric.${key}.source`] ?? "SELF"} className={inputClass}>
                      {METRIC_SOURCES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Date measured" htmlFor={`metric.${key}.measuredOn`}>
                    <input
                      id={`metric.${key}.measuredOn`}
                      name={`metric.${key}.measuredOn`}
                      type="date"
                      defaultValue={v[`metric.${key}.measuredOn`]}
                      className={inputClass}
                    />
                  </Field>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {pos && (
        <Card title="Video">
          <div className="mb-5 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
            <p className="mb-2 font-semibold">Video rules: every submission must follow these</p>
            <ul className="list-disc space-y-1 pl-5">
              {GENERAL_VIDEO_RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            {VIDEO_CLIPS[pos.group].map((clip) => (
              <Field
                key={clip.key}
                label={
                  <>
                    {clip.label} {clip.required ? <span className="text-red-700">*</span> : <span className="font-normal text-slate-500">(optional)</span>}
                    {clip.isProof && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Proof</span>}
                  </>
                }
                htmlFor={`video.${clip.key}`}
                error={e[`video.${clip.key}`]}
                hint={clip.instructions}
              >
                <input
                  id={`video.${clip.key}`}
                  name={`video.${clip.key}`}
                  type="url"
                  placeholder="https://"
                  defaultValue={v[`video.${clip.key}`]}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton pending={pending}>Save profile</SubmitButton>
      </div>
    </form>
  );
}
