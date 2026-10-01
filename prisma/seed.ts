// Creates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
// With --demo, also creates sample coaches and a player for local testing
// (all demo passwords are "password123").
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function upsertUser(email: string, password: string, role: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return db.user.upsert({ where: { email }, update: {}, create: { email, passwordHash, role } });
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  await upsertUser(adminEmail, adminPassword, "ADMIN");
  console.log(`Admin ready: ${adminEmail}`);

  if (!process.argv.includes("--demo")) return;

  const coaches = [
    { email: "d1coach@example.com", firstName: "Dana", lastName: "Reyes", school: "State University", division: "D1", status: "APPROVED" },
    { email: "d2coach@example.com", firstName: "Sam", lastName: "Ortiz", school: "Valley College", division: "D2", status: "APPROVED" },
    { email: "jucocoach@example.com", firstName: "Pat", lastName: "Kim", school: "County CC", division: "JUCO", status: "APPROVED" },
    { email: "d3coach@example.com", firstName: "Alex", lastName: "Shaw", school: "Lakeside College", division: "D3", status: "PENDING" },
  ];
  for (const c of coaches) {
    const user = await upsertUser(c.email, "password123", "COACH");
    await db.coachProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        firstName: c.firstName,
        lastName: c.lastName,
        school: c.school,
        title: "Assistant Coach",
        division: c.division,
        status: c.status,
      },
    });
  }

  const player = await upsertUser("player@example.com", "password123", "PLAYER");
  await db.playerProfile.upsert({
    where: { userId: player.id },
    update: {},
    create: {
      userId: player.id,
      firstName: "Jake",
      lastName: "Miller",
      playerType: "HIGH_SCHOOL",
      school: "Central High School",
      state: "TX",
      gradYear: new Date().getFullYear() + 1,
      heightInches: 74,
      weightLbs: 190,
      position: "RHP",
      throws: "R",
      bats: "R",
      metrics: JSON.stringify({
        fbVelo: { value: 87.5, source: "TRACKMAN", measuredOn: "2026-07-15" },
        bbVelo: { value: 74, source: "TRACKMAN", measuredOn: "2026-07-15" },
        chVelo: { value: 79, source: "RADAR" },
      }),
      videos: JSON.stringify({
        velocityProof: { url: "https://www.youtube.com/watch?v=example1" },
        bullpenSide: { url: "https://www.youtube.com/watch?v=example2" },
        bullpenBehind: { url: "https://www.youtube.com/watch?v=example3" },
      }),
    },
  });
  console.log("Demo users ready: player@example.com, d1coach@example.com, d2coach@example.com, jucocoach@example.com, d3coach@example.com (pending)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
