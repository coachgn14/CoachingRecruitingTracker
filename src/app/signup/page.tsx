import Link from "next/link";

export default function SignupChooser() {
  const options = [
    {
      href: "/signup/player",
      title: "I'm a player",
      body: "High school or junior college player looking for a standardized evaluation from three college coaches.",
    },
    {
      href: "/signup/coach",
      title: "I'm a college coach",
      body: "Currently employed college coach who wants to evaluate players. Requires proof of employment and manual approval.",
    },
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Create an account</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((o) => (
          <Link key={o.href} href={o.href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-600">
            <h2 className="font-semibold text-slate-900">{o.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{o.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
