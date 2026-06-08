import Link from "next/link";
import {
  TrendingUp,
  Scale,
  ListChecks,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

const REPORTS = [
  {
    href: "/reports/profit-loss",
    title: "Profit & Loss",
    desc: "Income, cost of goods sold and expenses over a period — your bottom line.",
    icon: TrendingUp,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/reports/balance-sheet",
    title: "Balance Sheet",
    desc: "Assets, liabilities and equity at a point in time. Always balances.",
    icon: Scale,
    tone: "bg-brand-50 text-brand-600",
  },
  {
    href: "/reports/trial-balance",
    title: "Trial Balance",
    desc: "Debit and credit totals for every account — the accountant's checkpoint.",
    icon: ListChecks,
    tone: "bg-amber-50 text-amber-600",
  },
  {
    href: "/reports/general-ledger",
    title: "General Ledger",
    desc: "Every transaction line with running balances per account.",
    icon: BookOpen,
    tone: "bg-violet-50 text-violet-600",
  },
];

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Financial statements generated directly from your ledger.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.href} href={r.href}>
              <Card className="group p-6 transition hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${r.tone}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{r.title}</h3>
                      <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
