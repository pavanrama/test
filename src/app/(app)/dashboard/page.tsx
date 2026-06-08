import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getDashboardMetrics } from "@/lib/reports";
import { Card, CardHeader, Badge, LinkButton } from "@/components/ui";
import { TrendChart, ExpensePie } from "@/components/charts";
import { money, formatDate, displayStatus, INVOICE_STATUS_STYLES } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  icon,
  tone = "brand",
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "brand" | "emerald" | "amber" | "red";
  sub?: string;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const [org, metrics, recentInvoices, recentBills] = await Promise.all([
    prisma.organization.findFirst(),
    getDashboardMetrics(),
    prisma.invoice.findMany({
      where: { status: { not: "VOID" } },
      orderBy: { issueDate: "desc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.bill.findMany({
      where: { status: { not: "VOID" } },
      orderBy: { issueDate: "desc" },
      take: 5,
      include: { vendor: true },
    }),
  ]);
  const sym = org?.currencySymbol ?? "$";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Financial overview for {org?.name ?? "your company"} · year to date
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/invoices/new" variant="primary" size="md">
            New invoice
          </LinkButton>
          <LinkButton href="/bills/new" variant="outline" size="md">
            New bill
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cash & Bank" value={money(metrics.cash, sym)} icon={<Wallet size={18} />} tone="brand" />
        <Stat label="Net Income (YTD)" value={money(metrics.netIncome, sym)} tone={metrics.netIncome >= 0 ? "emerald" : "red"} icon={<CircleDollarSign size={18} />} sub={`${money(metrics.income, sym)} income · ${money(metrics.expense, sym)} expenses`} />
        <Stat label="Accounts Receivable" value={money(metrics.receivables, sym)} icon={<ArrowDownLeft size={18} />} tone="amber" sub={`${metrics.openInvoices} open invoices`} />
        <Stat label="Accounts Payable" value={money(metrics.payables, sym)} icon={<ArrowUpRight size={18} />} tone="red" sub={`${metrics.openBills} open bills`} />
      </div>

      {metrics.overdueAmount > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={18} />
          <span>
            <strong>{money(metrics.overdueAmount, sym)}</strong> across{" "}
            {metrics.overdueCount} invoice(s) is overdue.
          </span>
          <Link href="/invoices" className="ml-auto font-medium underline">
            Review
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Income vs Expenses" subtitle="Last 6 months" />
          <div className="p-4">
            <TrendChart data={metrics.trend} symbol={sym} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Expense Breakdown" subtitle="Year to date" />
          <div className="p-4">
            <ExpensePie
              data={metrics.expenseBreakdown.map((e) => ({ name: e.name, amount: e.amount }))}
              symbol={sym}
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent invoices"
            action={<Link href="/invoices" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>}
          />
          <div className="divide-y divide-slate-100">
            {recentInvoices.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">No invoices yet.</p>
            )}
            {recentInvoices.map((inv) => {
              const st = displayStatus(inv.status, inv.dueDate, inv.amountPaid, inv.total);
              return (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.number}</p>
                    <p className="text-xs text-slate-500">{inv.customer.name} · {formatDate(inv.issueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 tabular">{money(inv.total, sym)}</span>
                    <Badge className={INVOICE_STATUS_STYLES[st]}>{st}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent bills"
            action={<Link href="/bills" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>}
          />
          <div className="divide-y divide-slate-100">
            {recentBills.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400">No bills yet.</p>
            )}
            {recentBills.map((bill) => {
              const st = displayStatus(bill.status, bill.dueDate, bill.amountPaid, bill.total);
              return (
                <Link
                  key={bill.id}
                  href={`/bills/${bill.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{bill.number}</p>
                    <p className="text-xs text-slate-500">{bill.vendor.name} · {formatDate(bill.issueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 tabular">{money(bill.total, sym)}</span>
                    <Badge className={INVOICE_STATUS_STYLES[st]}>{st}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
