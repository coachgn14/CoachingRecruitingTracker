// State returned by form server actions to their useActionState forms.
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  // Submitted values, so the form can be re-filled after a validation error.
  values?: Record<string, string>;
  success?: string;
};

export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && k !== "password") out[k] = v;
  return out;
}
