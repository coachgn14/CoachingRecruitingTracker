"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "./ui";

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  name,
  value,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: keyof typeof buttonClass;
  name?: string;
  value?: string;
  // Pass when the form submits via useFormSubmit (useFormStatus can't see it).
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={buttonClass[variant]}>
      {pending ? pendingText : children}
    </button>
  );
}
