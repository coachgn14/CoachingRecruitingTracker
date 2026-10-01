import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { EVALUATION_PRICE_CENTS, SITE_NAME, SITE_TAGLINE, formatPrice } from "@/config/site";
import { getCurrentUser, homeFor } from "@/lib/auth";

const steps = [
  {
    title: "Build your profile",
    body: "Enter your size, graduation year, position and the required metrics for that position, then add your video following our video script.",
  },
  {
    title: "Three coaches evaluate you",
    body: "One Division 1 coach plus two coaches from two other levels review your submission. You never see who they are, only their level.",
  },
  {
    title: "Get your standardized report",
    body: "Each coach grades every metric by level, tells you where you fit today and what to improve to reach the next level. You also get a consensus.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));

  return (
    <div className="space-y-12">
      <section className="rounded-xl bg-emerald-900 px-6 py-12 text-white sm:px-10">
        <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">Find out which college level you fit today, and what it takes to move up.</h1>
        <p className="mt-4 max-w-2xl text-emerald-100">{SITE_TAGLINE}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/signup/player" variant="secondary">
            I&apos;m a player: get evaluated ({formatPrice(EVALUATION_PRICE_CENTS)})
          </ButtonLink>
          <Link
            href="/signup/coach"
            className="inline-flex items-center rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            I&apos;m a college coach: become an evaluator
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-emerald-700">Step {i + 1}</div>
            <h2 className="mt-1 font-semibold text-slate-900">{s.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{s.body}</p>
          </div>
        ))}
      </section>

      <p className="text-center text-sm text-slate-500">
        Every {SITE_NAME} evaluator is a verified, currently employed college coach.
      </p>
    </div>
  );
}
