"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/app/actions/types";

// Like useActionState, but submits through onSubmit instead of the form's
// action prop. React resets forms after an action-prop submission, which
// wipes what the user typed (and select menus) when the server returns a
// validation error. Submitting this way leaves the inputs untouched.
export function useFormSubmit(action: (prev: FormState, fd: FormData) => Promise<FormState>, initial: FormState) {
  const [state, dispatch, pending] = useActionState(action, initial);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Include the clicked button's name/value (e.g. intent=draft|submit).
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(fd));
  };
  return { state, onSubmit, pending };
}
