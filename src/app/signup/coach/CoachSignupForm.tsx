"use client";

import { signupCoach } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { useFormSubmit } from "@/components/useFormSubmit";
import { Field, inputClass } from "@/components/ui";
import { COACH_DIVISIONS } from "@/lib/domain";

export function CoachSignupForm() {
  const { state, onSubmit, pending } = useFormSubmit(signupCoach, {});
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
      <Field label="College / university" htmlFor="school" error={e.school}>
        <input id="school" name="school" required defaultValue={v.school} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Job title" htmlFor="title" error={e.title}>
          <input id="title" name="title" required placeholder="Assistant Coach" defaultValue={v.title} className={inputClass} />
        </Field>
        <Field label="Division" htmlFor="division" error={e.division}>
          <select id="division" name="division" required defaultValue={v.division ?? ""} className={inputClass}>
            <option value="" disabled>
              Select…
            </option>
            {COACH_DIVISIONS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Staff directory link (optional)" htmlFor="staffDirectoryUrl" error={e.staffDirectoryUrl} hint="Your bio on the athletics website speeds up approval.">
        <input id="staffDirectoryUrl" name="staffDirectoryUrl" type="url" placeholder="https://" defaultValue={v.staffDirectoryUrl} className={inputClass} />
      </Field>
      <Field label="Phone (optional)" htmlFor="phone" error={e.phone}>
        <input id="phone" name="phone" type="tel" defaultValue={v.phone} className={inputClass} />
      </Field>
      <Field label="Proof of employment" htmlFor="proof" error={e.proof} hint="PDF, PNG, JPG or WEBP, up to 8 MB.">
        <input id="proof" name="proof" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp" className="block w-full text-sm" />
      </Field>
      <Field label="Email" htmlFor="email" error={e.email} hint="Use your school email if you can.">
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={v.email} className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password" error={e.password} hint="At least 8 characters.">
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </Field>
      <SubmitButton pending={pending} pendingText="Submitting application…">Submit application</SubmitButton>
    </form>
  );
}
