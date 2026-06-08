import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getGeneralLedger } from "@/lib/reports";
import { Card, Table, Th, Td, Button } from "@/components/ui";
import { ReportControls } from "@/components/ReportControls";
import { money, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GeneralLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; accountId?: string }>;
}) {
  const sp = await searchParams;
  const from = sp.from ? new Date(sp.from) : undefined;
  const to = sp.to ? new Date(sp.to) : undefined;

  const [org, accounts, lines] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.account.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    getGeneralLedger({ accountId: sp.accountId, from, to }),
  ]);
  const sym = org?.currencySymbol ?? "$";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 no-print">
          <ArrowLeft size={15} /> Reports
        </Link>
        <ReportControls />
      </div>

      <Card className="mb-4 p-4 no-print">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Account</label>
            <select name="accountId" defaultValue={sp.accountId ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">All accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
            <input type="date" name="from" defaultValue={sp.from ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
            <input type="date" name="to" defaultValue={sp.to ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          </div>
          <Button type="submit" size="md">Apply</Button>
        </form>
      </Card>

      <Card className="print-full">
        <div className="border-b border-slate-100 px-5 py-4">
          <h1 className="text-lg font-bold text-slate-900">General Ledger</h1>
          <p className="text-xs text-slate-400">
            {org?.name}
            {sp.accountId ? ` · ${accounts.find((a) => a.id === sp.accountId)?.name}` : " · All accounts"}
          </p>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Account</Th>
              <Th>Memo</Th>
              <Th align="right">Debit</Th>
              <Th align="right">Credit</Th>
              <Th align="right">Balance</Th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr><Td className="text-slate-400" align="center"><span></span></Td><Td></Td><Td className="text-slate-400">No transactions for this filter.</Td><Td></Td><Td></Td><Td></Td></tr>
            )}
            {lines.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <Td className="whitespace-nowrap text-slate-500">{formatDate(l.date)}</Td>
                <Td><span className="font-mono text-xs text-slate-400">{l.account.code}</span> {l.account.name}</Td>
                <Td className="text-slate-500">{l.memo ?? l.description ?? "—"}</Td>
                <Td align="right">{l.debit ? money(l.debit, sym) : ""}</Td>
                <Td align="right">{l.credit ? money(l.credit, sym) : ""}</Td>
                <Td align="right" className="font-medium">{money(l.balance, sym)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
