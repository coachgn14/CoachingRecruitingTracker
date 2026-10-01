import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

// Cookie-based sessions stored in the database. The cookie holds a random
// token; only its SHA-256 hash is stored, so a database leak does not leak
// live sessions.

export type Role = "PLAYER" | "COACH" | "ADMIN";

const COOKIE = "session";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  store.delete(COOKIE);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, email: true, role: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return { ...session.user, role: session.user.role as Role };
});

export function homeFor(role: Role) {
  return role === "ADMIN" ? "/admin" : role === "COACH" ? "/coach" : "/player";
}

// Use at the top of every page and server action that needs a signed-in user.
export async function requireUser(role: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

// A coach who has been manually approved by an admin.
export async function requireApprovedCoach() {
  const user = await requireUser("COACH");
  const profile = await db.coachProfile.findUnique({ where: { userId: user.id } });
  if (!profile || profile.status !== "APPROVED") redirect("/coach");
  return { user, profile };
}
