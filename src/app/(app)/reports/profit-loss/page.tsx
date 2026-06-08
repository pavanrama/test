import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getProfitAndLoss, type ReportSection } from "@/lib/reports";
import { Card } from "@/components/ui";
import { ReportControls } from "@/components/ReportControls";
import { money, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function Section({ section, sym }: { section: ReportSection; sym: string }) {
  if (section.lines.length === 0) return null;
  return (
    <div className="py-2">
      <p className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{section.title}</p>
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

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const from = sp.from ? new Date(sp.from) : new Date(now.getFullYear(), 0, 1);
  const to = sp.to ? new Date(sp.to) : now;

  const [org, pl] = await Promise.all([
    prisma.organization.findFirst(),
    getProfitAndLoss(from, to),
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

      <Card className="print-full mx-auto max-w-2xl">
        <div className="border-b border-slate-100 px-5 py-4 text-center">
          <h1 className="text-lg font-bold text-slate-900">Profit &amp; Loss</h1>
          <p className="text-sm text-slate-500">{org?.name}</p>
          <p className="text-xs text-slate-400">{formatDate(from)} — {formatDate(to)}</p>
        </div>

        <Section section={pl.income} sym={sym} />
        <div className="flex justify-between bg-slate-50 px-5 py-2 text-sm font-semibold">
          <span>Total Income</span><span className="tabular">{money(pl.totalIncome, sym)}</span>
        </div>

        <Section section={pl.cogs} sym={sym} />
        {pl.cogs.lines.length > 0 && (
          <div className="flex justify-between border-t border-slate-100 px-5 py-2 text-sm font-semibold text-slate-700">
            <span>Gross Profit</span><span className="tabular">{money(pl.grossProfit, sym)}</span>
          </div>
        )}

        <Section section={pl.expenses} sym={sym} />

        <div className="flex justify-between border-t-2 border-slate-200 bg-slate-900 px-5 py-3 text-base font-bold text-white">
          <span>Net Income</span>
          <span className="tabular">{money(pl.netIncome, sym)}</span>
        </div>
      </Card>
    </div>
  );
}
