"use client";

import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { useFormSubmit } from "@/components/useFormSubmit";
import { Alert, Field, inputClass } from "@/components/ui";

export function LoginForm() {
  const { state, onSubmit, pending } = useFormSubmit(login, {});
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={state.values?.email} className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password">
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      <SubmitButton pending={pending} pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}
