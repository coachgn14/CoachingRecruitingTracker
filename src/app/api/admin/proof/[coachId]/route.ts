import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readStoredFile } from "@/lib/storage";

// Serves a coach's proof-of-employment file to admins only.
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/proof/[coachId]">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Not found", { status: 404 });

  const { coachId } = await ctx.params;
  const profile = await db.coachProfile.findUnique({ where: { id: coachId } });
  if (!profile?.proofFilePath) return new Response("Not found", { status: 404 });

  const file = await readStoredFile(profile.proofFilePath);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": profile.proofMimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${(profile.proofFileName ?? "proof").replace(/[^\w.\- ]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
