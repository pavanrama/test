import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const entry = await prisma.journalEntry.findUnique({ where: { id } });
    if (!entry) return fail("Journal entry not found.", 404);
    if (entry.source !== "MANUAL")
      return fail(
        "Automated entries are managed by their source document and cannot be deleted here.",
        422,
      );
    await prisma.journalEntry.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
