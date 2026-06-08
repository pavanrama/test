import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getBalanceSheet, type ReportSection } from "@/lib/reports";
import { Card, Badge } from "@/components/ui";
import { ReportControls } from "@/components/ReportControls";
import { money, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function Section({ section, sym }: { section: ReportSection; sym: string }) {
  return (
    <div className="py-2">
      <p className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{section.title}</p>
      {section.lines.length === 0 && <p className="px-5 py-1.5 text-sm text-slate-400">No balances</p>}
      {section.lines.map((l) => (
        <div key={l.id} className="flex justify-between px-5 py-1.5 text-sm hover:bg-slate-50">
          <span className="text-slate-600"><span className="font-mono text-xs text-slate-400">{l.code}</span> {l.name}</span>
          <span className="tabular text-slate-800">{money(l.amount, sym)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-slate-100 px-5 py-2 text-sm font-semibold">
        <span className="text-slate-700">Total {section.title}</span>
        <span className="tabular text-slate-900">{money(section.total, sym)}</span>
      </div>
    </div>
  );
}

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string }>;
}) {
  const sp = await searchParams;
  const asOf = sp.asOf ? new Date(sp.asOf) : new Date();
  const [org, bs] = await Promise.all([
    prisma.organization.findFirst(),
    getBalanceSheet(asOf),
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
          <h1 className="text-lg font-bold text-slate-900">Balance Sheet</h1>
          <p className="text-sm text-slate-500">{org?.name}</p>
          <p className="text-xs text-slate-400">As of {formatDate(asOf)}</p>
        </div>

        <Section section={bs.assets} sym={sym} />
        <div className="flex justify-between bg-slate-50 px-5 py-2 text-sm font-bold">
          <span>Total Assets</span><span className="tabular">{money(bs.totalAssets, sym)}</span>
        </div>

        <Section section={bs.liabilities} sym={sym} />
        <Section section={bs.equity} sym={sym} />

        <div className="flex justify-between bg-slate-900 px-5 py-3 text-base font-bold text-white">
          <span>Liabilities + Equity</span>
          <span className="tabular">{money(bs.totalLiabilitiesAndEquity, sym)}</span>
        </div>
        <div className="flex justify-center px-5 py-3">
          {bs.balanced ? (
            <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Balanced ✓</Badge>
          ) : (
            <Badge className="bg-red-50 text-red-700 ring-red-200">Out of balance</Badge>
          )}
        </div>
      </Card>
    </div>
  );
}
