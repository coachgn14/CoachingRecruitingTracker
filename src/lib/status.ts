export function submissionStatusLabel(status: string, submittedCount: number) {
  if (status === "AWAITING_PAYMENT") return "Awaiting payment";
  if (status === "COMPLETE") return "Complete";
  return `In review: ${submittedCount} of 3 coaches done`;
}

export function submissionStatusTone(status: string) {
  return status === "COMPLETE" ? "green" : status === "OPEN" ? "blue" : "amber";
}
