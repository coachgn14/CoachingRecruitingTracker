import { CoachSignupForm } from "./CoachSignupForm";

export default function CoachSignupPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-bold">Coach evaluator application</h1>
      <p className="mb-6 text-sm text-slate-600">
        Evaluators must be currently employed by a college baseball program. Upload proof of employment (an offer letter,
        staff ID, pay stub with sensitive details blacked out, or similar). Every application is reviewed by hand before
        you can evaluate players. Players never see your name or school, only your division.
      </p>
      <CoachSignupForm />
    </div>
  );
}
