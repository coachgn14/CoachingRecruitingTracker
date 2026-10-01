import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Private file storage for coach employment proof. Files are written to
// STORAGE_DIR on local disk and only served to admins through
// /api/admin/proof/[coachId]. For production, swap this module for S3 / R2 /
// GCS — callers only use saveProofFile and readStoredFile.

export const MAX_PROOF_BYTES = 8 * 1024 * 1024;

export const PROOF_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

// Runtime-configured directory; tell the bundler not to trace it.
const root = () => path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? "./storage");

export async function saveProofFile(file: File): Promise<string> {
  const ext = PROOF_TYPES[file.type];
  if (!ext) throw new Error("Unsupported file type");
  const rel = path.join("proofs", `${randomUUID()}.${ext}`);
  const abs = path.join(root(), rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ abs, Buffer.from(await file.arrayBuffer()));
  return rel;
}

export async function readStoredFile(rel: string): Promise<Buffer> {
  const base = root();
  const abs = path.resolve(base, rel);
  if (!abs.startsWith(base + path.sep)) throw new Error("Invalid path");
  return readFile(/*turbopackIgnore: true*/ abs);
}
