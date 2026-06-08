import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getTrialBalance } from "@/lib/reports";
import { Card, Table, Th, Td, Badge } from "@/components/ui";
import { ReportControls } from "@/components/ReportControls";
import { money, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string }>;
}) {
  const sp = await searchParams;
  const asOf = sp.asOf ? new Date(sp.asOf) : new Date();
  const [org, tb] = await Promise.all([
    prisma.organization.findFirst(),
    getTrialBalance(asOf),
  ]);
  const sym = org?.currencySymbol ?? "$";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 no-print">
          <ArrowLeft size={15} /> Reports
        </Link>
        <ReportControls showRange={false} showAsOf />
      </div>

      <Card className="print-full mx-auto max-w-2xl">
        <div className="border-b border-slate-100 px-5 py-4 text-center">
          <h1 className="text-lg font-bold text-slate-900">Trial Balance</h1>
          <p className="text-sm text-slate-500">{org?.name}</p>
          <p className="text-xs text-slate-400">As of {formatDate(asOf)}</p>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Account</Th>
              <Th align="right">Debit</Th>
              <Th align="right">Credit</Th>
            </tr>
          </thead>
          <tbody>
            {tb.rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <Td className="font-mono text-xs text-slate-400">{r.code}</Td>
                <Td>{r.name}</Td>
                <Td align="right">{r.debit ? money(r.debit, sym) : ""}</Td>
                <Td align="right">{r.credit ? money(r.credit, sym) : ""}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold">
              <Td></Td>
              <Td>Totals</Td>
              <Td align="right">{money(tb.totalDebit, sym)}</Td>
              <Td align="right">{money(tb.totalCredit, sym)}</Td>
            </tr>
          </tfoot>
        </Table>
        <div className="flex justify-center py-3">
          {tb.balanced ? (
            <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Debits = Credits ✓</Badge>
          ) : (
            <Badge className="bg-red-50 text-red-700 ring-red-200">Out of balance</Badge>
          )}
        </div>
      </Card>
    </div>
  );
}
