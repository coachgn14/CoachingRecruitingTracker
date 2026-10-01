"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, hashPassword, homeFor, verifyPassword, type Role } from "@/lib/auth";
import { db } from "@/lib/db";
import { isCoachDivision } from "@/lib/domain";
import { MAX_PROOF_BYTES, PROOF_TYPES, saveProofFile } from "@/lib/storage";
import { formValues, type FormState } from "./types";

const email = z.email("Enter a valid email address.").transform((e) => e.toLowerCase());
const password = z.string().min(8, "Password must be at least 8 characters.");
const name = (label: string) => z.string().trim().min(1, `${label} is required.`).max(80);

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

async function emailTaken(address: string) {
  return (await db.user.count({ where: { email: address } })) > 0;
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const address = String(fd.get("email") ?? "").trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: address } });
  if (!user || !(await verifyPassword(String(fd.get("password") ?? ""), user.passwordHash))) {
    return { error: "Incorrect email or password.", values: formValues(fd) };
  }
  await createSession(user.id);
  redirect(homeFor(user.role as Role));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const playerSchema = z.object({
  firstName: name("First name"),
  lastName: name("Last name"),
  email,
  password,
  playerType: z.enum(["HIGH_SCHOOL", "JUCO"]),
});

export async function signupPlayer(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = playerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: formValues(fd) };
  const d = parsed.data;
  if (fd.get("parentConsent") !== "on") {
    return { fieldErrors: { parentConsent: "A parent or guardian must agree if you are under 18." }, values: formValues(fd) };
  }
  if (await emailTaken(d.email)) {
    return { fieldErrors: { email: "An account with this email already exists." }, values: formValues(fd) };
  }

  const user = await db.user.create({
    data: {
      email: d.email,
      passwordHash: await hashPassword(d.password),
      role: "PLAYER",
      playerProfile: { create: { firstName: d.firstName, lastName: d.lastName, playerType: d.playerType } },
    },
  });
  await createSession(user.id);
  redirect("/player/profile");
}

const coachSchema = z.object({
  firstName: name("First name"),
  lastName: name("Last name"),
  email,
  password,
  school: z.string().trim().min(2, "School is required.").max(120),
  title: z.string().trim().min(2, "Job title is required.").max(120),
  division: z.string().refine(isCoachDivision, "Select your division."),
  phone: z.string().trim().max(40).optional().default(""),
  staffDirectoryUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Enter a full link starting with https://")
    .optional()
    .default(""),
});

export async function signupCoach(_prev: FormState, fd: FormData): Promise<FormState> {
  const fields = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = coachSchema.safeParse(fields);
  const errors = parsed.success ? {} : fieldErrors(parsed.error);

  const proof = fd.get("proof");
  const hasFile = proof instanceof File && proof.size > 0;
  if (!hasFile) errors.proof = "Upload proof of employment (PDF or image).";
  else if (!PROOF_TYPES[proof.type]) errors.proof = "Upload a PDF, PNG, JPG or WEBP file.";
  else if (proof.size > MAX_PROOF_BYTES) errors.proof = "File must be 8 MB or smaller.";

  if (!parsed.success || Object.keys(errors).length) return { fieldErrors: errors, values: formValues(fd) };
  const d = parsed.data;
  if (await emailTaken(d.email)) {
    return { fieldErrors: { email: "An account with this email already exists." }, values: formValues(fd) };
  }

  const file = proof as File;
  const proofFilePath = await saveProofFile(file);
  const user = await db.user.create({
    data: {
      email: d.email,
      passwordHash: await hashPassword(d.password),
      role: "COACH",
      coachProfile: {
        create: {
          firstName: d.firstName,
          lastName: d.lastName,
          school: d.school,
          title: d.title,
          division: d.division,
          phone: d.phone,
          staffDirectoryUrl: d.staffDirectoryUrl,
          proofFilePath,
          proofFileName: file.name.slice(0, 200),
          proofMimeType: file.type,
        },
      },
    },
  });
  await createSession(user.id);
  redirect("/coach");
}
