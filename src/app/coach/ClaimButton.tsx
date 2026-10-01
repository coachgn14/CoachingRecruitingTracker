"use client";

import { useActionState } from "react";
import { claimSubmission } from "@/app/actions/coach";
import { SubmitButton } from "@/components/SubmitButton";

export function ClaimButton({ submissionId }: { submissionId: string }) {
  const [state, action] = useActionState(claimSubmission.bind(null, submissionId), {});
  return (
    <form action={action} className="text-right">
      <SubmitButton pendingText="Claiming…">Evaluate</SubmitButton>
      {state.error && <p className="mt-1 max-w-xs text-xs font-medium text-red-700">{state.error}</p>}
    </form>
  );
}
