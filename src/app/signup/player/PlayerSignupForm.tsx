"use client";

import { signupPlayer } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { useFormSubmit } from "@/components/useFormSubmit";
import { Field, inputClass } from "@/components/ui";
import { PLAYER_TYPES } from "@/lib/domain";

export function PlayerSignupForm() {
  const { state, onSubmit, pending } = useFormSubmit(signupPlayer, {});
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" htmlFor="firstName" error={e.firstName}>
          <input id="firstName" name="firstName" required defaultValue={v.firstName} className={inputClass} />
        </Field>
        <Field label="Last name" htmlFor="lastName" error={e.lastName}>
          <input id="lastName" name="lastName" required defaultValue={v.lastName} className={inputClass} />
        </Field>
      </div>
      <Field label="I play for a" htmlFor="playerType" error={e.playerType}>
        <select id="playerType" name="playerType" defaultValue={v.playerType ?? "HIGH_SCHOOL"} className={inputClass}>
          {PLAYER_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Email" htmlFor="email" error={e.email}>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={v.email} className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password" error={e.password} hint="At least 8 characters.">
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </Field>
      <Field label="" error={e.parentConsent}>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="parentConsent" defaultChecked={v.parentConsent === "on"} className="mt-1" />
          <span>I am 18 or older, or my parent/guardian has reviewed and agrees to the terms of this service.</span>
        </label>
      </Field>
      <SubmitButton pending={pending} pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}
