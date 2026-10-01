import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJson, type MetricMap, type VideoMap } from "@/lib/domain";
import { gradYearRange } from "@/lib/profile";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const user = await requireUser("PLAYER");
  const p = await db.playerProfile.findUniqueOrThrow({ where: { userId: user.id } });

  // Flatten the stored profile into form field names.
  const initial: Record<string, string> = {
    firstName: p.firstName,
    lastName: p.lastName,
    playerType: p.playerType,
    school: p.school,
    state: p.state,
    gradYear: p.gradYear?.toString() ?? "",
    heightFeet: p.heightInches ? String(Math.floor(p.heightInches / 12)) : "",
    heightInches: p.heightInches ? String(p.heightInches % 12) : "",
    weightLbs: p.weightLbs?.toString() ?? "",
    position: p.position ?? "",
    throws: p.throws ?? "",
    bats: p.bats ?? "",
  };
  for (const [key, m] of Object.entries(parseJson<MetricMap>(p.metrics, {}))) {
    if (!m) continue;
    initial[`metric.${key}.value`] = String(m.value);
    initial[`metric.${key}.source`] = m.source;
    initial[`metric.${key}.measuredOn`] = m.measuredOn ?? "";
  }
  for (const [key, v] of Object.entries(parseJson<VideoMap>(p.videos, {}))) initial[`video.${key}`] = v.url;

  return (
    <div>
      <PageHeader
        title="Your profile"
        subtitle="Save as you go. Everything here is frozen into your submission when you request an evaluation."
        actions={
          <Link href="/player" className="text-sm font-medium text-emerald-800">
            ← Back to dashboard
          </Link>
        }
      />
      <ProfileForm initial={initial} gradYears={gradYearRange()} />
    </div>
  );
}
