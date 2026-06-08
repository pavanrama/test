import { prisma } from "@/lib/db";
import { JournalClient } from "@/components/JournalClient";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const [org, entries, accounts] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.journalEntry.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { lines: { include: { account: { select: { code: true, name: true } } } } },
    }),
    prisma.account.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  return (
    <JournalClient
      entries={entries.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        memo: e.memo,
        reference: e.reference,
        source: e.source,
        lines: e.lines.map((l) => ({
          id: l.id,
          debit: l.debit,
          credit: l.credit,
          description: l.description,
          account: l.account,
        })),
      }))}
      accounts={accounts}
      symbol={org?.currencySymbol ?? "$"}
    />
  );
}
