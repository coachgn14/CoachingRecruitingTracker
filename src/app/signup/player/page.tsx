import { PlayerSignupForm } from "./PlayerSignupForm";

export default function PlayerSignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold">Player sign up</h1>
      <p className="mb-6 text-sm text-slate-600">Next you&apos;ll fill in your profile, metrics and video links.</p>
      <PlayerSignupForm />
    </div>
  );
}
