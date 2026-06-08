import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse } from "@/lib/api";
import { journalEntrySchema } from "@/lib/validators";
import { postJournalEntry } from "@/lib/accounting";

export async function GET() {
  try {
    await requireUser();
    const entries = await prisma.journalEntry.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { lines: { include: { account: true } } },
    });
    return ok(entries);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const data = journalEntrySchema.parse(await req.json());
    const entry = await prisma.$transaction((tx) =>
      postJournalEntry(tx, {
        date: new Date(data.date),
        memo: data.memo ?? null,
        reference: data.reference ?? null,
        source: "MANUAL",
        lines: data.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          description: l.description ?? null,
        })),
      }),
    );
    return ok(entry);
  } catch (err) {
    return toErrorResponse(err);
  }
}
