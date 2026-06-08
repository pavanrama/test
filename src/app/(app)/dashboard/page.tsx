'use client';

import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate, statusColor, calcBookValue } from '@/lib/utils';
import type { Invoice, Bill, Expense, Account, FixedAsset, PayRun } from '@/lib/types';
import Link from 'next/link';
import clsx from 'clsx';
import {
  DollarSign, TrendingUp, TrendingDown, Landmark, Receipt,
  BarChart3, AlertTriangle, Clock, Users, CalendarCheck,
  ChevronRight, ArrowRight, CheckCircle2, Circle, FileText,
  Wallet, Scale, ShieldCheck, Activity, CreditCard, Building2,
  UserPlus, BookOpen, PiggyBank,
} from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];
const startOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; };
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

function useMetrics() {
  const {
    myInvoices, myBills, myExpenses, myBankAccounts, myBankTransactions,
    myContacts, myAccounts, myEmployees, myPayRuns, myFixedAssets,
    myJournalEntries, auth,
  } = useApp();

  return useMemo(() => {
    const invoices = myInvoices();
    const bills = myBills();
    const expenses = myExpenses();
    const bankAccounts = myBankAccounts();
    const bankTxns = myBankTransactions();
    const contacts = myContacts();
    const accounts = myAccounts();
    const employees = myEmployees();
    const payRuns = myPayRuns();
    const fixedAssets = myFixedAssets();
    const journalEntries = myJournalEntries();
    const currency = auth.company?.baseCurrency || 'USD';
    const todayStr = today();
    const monthStart = startOfMonth();
    const sevenDaysOut = daysFromNow(7);

    const cashPosition = bankAccounts.reduce((s, a) => s + a.balance, 0);

    const arStatuses = new Set<Invoice['status']>(['sent', 'overdue', 'partial']);
    const arInvoices = invoices.filter(i => arStatuses.has(i.status));
    const totalAR = arInvoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    const overdueAR = overdueInvoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);

    const paidInvoices = invoices.filter(i => i.status === 'paid' && i.payments?.length);
    const avgDaysToPay = paidInvoices.length > 0
      ? Math.round(paidInvoices.reduce((s, i) => {
          const lastPayment = i.payments[i.payments.length - 1];
          return s + Math.max(0, daysBetween(i.date, lastPayment.date));
        }, 0) / paidInvoices.length)
      : 0;

    const apStatuses = new Set<Bill['status']>(['submitted', 'approved', 'overdue', 'partial']);
    const apBills = bills.filter(b => apStatuses.has(b.status));
    const totalAP = apBills.reduce((s, b) => s + (b.total - b.amountPaid), 0);
    const overdueBills = bills.filter(b => b.status === 'overdue');
    const overdueAP = overdueBills.reduce((s, b) => s + (b.total - b.amountPaid), 0);
    const upcomingBills = apBills.filter(b => b.dueDate >= todayStr && b.dueDate <= sevenDaysOut);
    const upcomingBillsTotal = upcomingBills.reduce((s, b) => s + (b.total - b.amountPaid), 0);

    const monthlyRevenue = invoices
      .filter(i => i.status === 'paid' && i.date >= monthStart)
      .reduce((s, i) => s + i.total, 0);
    const monthlyExpenses = expenses
      .filter(e => e.status === 'approved' && e.date >= monthStart)
      .reduce((s, e) => s + e.amount, 0);

    const revenueAccounts = accounts.filter(a => a.type === 'revenue' && a.isActive);
    const expenseAccounts = accounts.filter(a => a.type === 'expense' && a.isActive);
    const totalRevenueBalance = revenueAccounts.reduce((s, a) => s + a.balance, 0);
    const totalExpenseBalance = expenseAccounts.reduce((s, a) => s + a.balance, 0);
    const netProfit = totalRevenueBalance - totalExpenseBalance;

    const currentAssets = accounts
      .filter(a => a.type === 'asset' && a.subType === 'Current Asset' && a.isActive)
      .reduce((s, a) => s + a.balance, 0);
    const currentLiabilities = accounts
      .filter(a => a.type === 'liability' && a.subType === 'Current Liability' && a.isActive)
      .reduce((s, a) => s + a.balance, 0);
    const inventory = accounts
      .filter(a => a.type === 'asset' && a.name.toLowerCase().includes('inventory') && a.isActive)
      .reduce((s, a) => s + a.balance, 0);
    const workingCapital = currentAssets - currentLiabilities;
    const currentRatio = currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities !== 0 ? (currentAssets - inventory) / currentLiabilities : 0;

    const activeEmployees = employees.filter(e => e.isActive);
    const sortedPayRuns = [...payRuns].sort((a, b) => b.payDate.localeCompare(a.payDate));
    const lastPayRun = sortedPayRuns[0] || null;
    const ytdGross = payRuns
      .filter(p => p.payDate >= new Date().getFullYear() + '-01-01' && (p.status === 'processed' || p.status === 'paid'))
      .reduce((s, pr) => s + pr.entries.reduce((es, e) => es + e.grossPay, 0), 0);

    const unreconciledTxns = bankTxns.filter(t => !t.isReconciled);

    const upcomingInvoices = arInvoices.filter(i => i.dueDate >= todayStr && i.dueDate <= sevenDaysOut);

    const recentInvoices = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    type ActivityItem = { id: string; type: 'invoice' | 'expense'; label: string; sublabel: string; amount: number; currency: string; date: string; status: string };
    const recentActivity: ActivityItem[] = [
      ...recentInvoices.map(i => ({
        id: i.id, type: 'invoice' as const, label: i.contactName, sublabel: i.number,
        amount: i.total, currency: i.currency, date: i.createdAt, status: i.status,
      })),
      ...recentExpenses.map(e => ({
        id: e.id, type: 'expense' as const, label: e.vendor, sublabel: e.category,
        amount: e.amount, currency: e.currency, date: e.date, status: e.status,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

    const isEmpty = invoices.length === 0 && bills.length === 0 && expenses.length === 0
      && bankAccounts.length === 0 && contacts.length === 0;

    const hasData = {
      contacts: contacts.length > 0,
      accounts: bankAccounts.length > 0,
      invoices: invoices.length > 0,
      bills: bills.length > 0,
      expenses: expenses.length > 0,
      employees: employees.length > 0,
    };

    let healthScore = 50;
    if (cashPosition > 0) healthScore += 15;
    if (cashPosition > totalAP) healthScore += 10;
    if (totalAR > 0 && totalAP > 0) {
      const ratio = totalAR / totalAP;
      if (ratio > 1.5) healthScore += 10;
      else if (ratio > 1) healthScore += 5;
      else healthScore -= 5;
    } else if (totalAR > 0 && totalAP === 0) {
      healthScore += 10;
    }
    if (monthlyRevenue > 0 && monthlyExpenses > 0) {
      const expenseRatio = monthlyExpenses / monthlyRevenue;
      if (expenseRatio < 0.6) healthScore += 10;
      else if (expenseRatio < 0.85) healthScore += 5;
      else healthScore -= 10;
    }
    if (overdueInvoices.length > 0) healthScore -= 5;
    if (overdueBills.length > 0) healthScore -= 5;
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      invoices, bills, expenses, bankAccounts, bankTxns, contacts, accounts,
      employees, payRuns, fixedAssets, journalEntries, currency,
      cashPosition, totalAR, overdueInvoices, overdueAR, avgDaysToPay,
      totalAP, overdueBills, overdueAP, upcomingBills, upcomingBillsTotal,
      monthlyRevenue, monthlyExpenses, netProfit,
      currentAssets, currentLiabilities, workingCapital, currentRatio, quickRatio,
      activeEmployees, lastPayRun, ytdGross,
      unreconciledTxns, upcomingInvoices,
      recentActivity, isEmpty, hasData, healthScore,
    };
  }, [myInvoices, myBills, myExpenses, myBankAccounts, myBankTransactions, myContacts, myAccounts, myEmployees, myPayRuns, myFixedAssets, myJournalEntries, auth]);
}

function HealthBanner({ score }: { score: number }) {
  const label = score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention';
  const color = score >= 70 ? 'emerald' : score >= 40 ? 'amber' : 'red';
  const colorMap = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50', border: 'border-amber-200' },
    red: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50', border: 'border-red-200' },
  };
  const c = colorMap[color];

  return (
    <div className={clsx('rounded-xl border p-5', c.light, c.border)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className={clsx('w-5 h-5', c.text)} />
          <div>
            <p className="text-sm font-semibold text-slate-900">Financial Health Score</p>
            <p className={clsx('text-xs font-medium', c.text)}>{label}</p>
          </div>
        </div>
        <span className={clsx('text-2xl font-bold tabular-nums', c.text)}>{score}</span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-500', c.bg)} style={{ width: `${score}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-400">0</span>
        <span className="text-[10px] text-slate-400">100</span>
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, href }: {
  title: string; value: string; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string; iconColor: string; href?: string;
}) {
  const inner = (
    <div className={clsx('bg-white rounded-xl border border-slate-200 p-5 transition-shadow', href && 'hover:shadow-md cursor-pointer')}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold text-slate-900 mt-1.5 truncate tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={clsx('p-2.5 rounded-xl flex-shrink-0', iconBg)}>
          <Icon className={clsx('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SectionHeader({ title, href, icon: Icon }: { title: string; href?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="text-xs text-blue-600 font-medium flex items-center gap-0.5 hover:text-blue-700">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function StatRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={clsx('text-sm font-semibold tabular-nums', muted ? 'text-slate-400' : 'text-slate-900')}>{value}</span>
    </div>
  );
}

function EmptyState({ hasData }: { hasData: Record<string, boolean> }) {
  const steps = [
    { key: 'contacts', label: 'Add your first contact', desc: 'Customers and vendors you do business with', href: '/contacts', icon: UserPlus, done: hasData.contacts },
    { key: 'accounts', label: 'Connect a bank account', desc: 'Link your business bank account', href: '/banking', icon: Building2, done: hasData.accounts },
    { key: 'invoices', label: 'Create an invoice', desc: 'Send your first invoice to a customer', href: '/invoices', icon: FileText, done: hasData.invoices },
    { key: 'expenses', label: 'Record an expense', desc: 'Track a business expense', href: '/expenses', icon: Receipt, done: hasData.expenses },
    { key: 'employees', label: 'Add employees', desc: 'Set up payroll for your team', href: '/payroll', icon: Users, done: hasData.employees },
  ];
  const completed = steps.filter(s => s.done).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Welcome to your dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Complete these steps to get your books set up.</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(completed / steps.length) * 100}%` }} />
          </div>
          <span className="text-xs text-slate-400 tabular-nums">{completed}/{steps.length}</span>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map(s => (
          <Link key={s.key} href={s.href} className={clsx(
            'flex items-center gap-4 p-3 rounded-lg border transition-colors',
            s.done ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/30',
          )}>
            <div className={clsx('p-2 rounded-lg', s.done ? 'bg-emerald-100' : 'bg-slate-100')}>
              {s.done
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                : <s.icon className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={clsx('text-sm font-medium', s.done ? 'text-emerald-700 line-through' : 'text-slate-900')}>{s.label}</p>
              <p className="text-xs text-slate-400">{s.desc}</p>
            </div>
            {!s.done && <ArrowRight className="w-4 h-4 text-slate-300" />}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { auth } = useApp();
  const m = useMetrics();
  const c = m.currency;

  if (m.isEmpty) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome, {auth.user?.name}. Let&apos;s set up {auth.company?.name}.</p>
        </div>
        <EmptyState hasData={m.hasData} />
      </div>
    );
  }

  const alerts: { id: string; severity: 'critical' | 'warning' | 'info'; text: string; href: string }[] = [];
  if (m.overdueInvoices.length > 0) {
    alerts.push({ id: 'ov-inv', severity: 'critical', text: `${m.overdueInvoices.length} overdue invoice${m.overdueInvoices.length > 1 ? 's' : ''} — ${formatCurrency(m.overdueAR, c)} outstanding`, href: '/invoices' });
  }
  if (m.overdueBills.length > 0) {
    alerts.push({ id: 'ov-bill', severity: 'critical', text: `${m.overdueBills.length} overdue bill${m.overdueBills.length > 1 ? 's' : ''} — ${formatCurrency(m.overdueAP, c)} outstanding`, href: '/bills' });
  }
  if (m.unreconciledTxns.length > 0) {
    alerts.push({ id: 'unrecon', severity: 'warning', text: `${m.unreconciledTxns.length} unreconciled bank transaction${m.unreconciledTxns.length > 1 ? 's' : ''}`, href: '/banking' });
  }
  if (m.upcomingInvoices.length > 0) {
    alerts.push({ id: 'due-inv', severity: 'info', text: `${m.upcomingInvoices.length} invoice${m.upcomingInvoices.length > 1 ? 's' : ''} due within 7 days`, href: '/invoices' });
  }
  if (m.upcomingBills.length > 0) {
    alerts.push({ id: 'due-bill', severity: 'info', text: `${m.upcomingBills.length} bill${m.upcomingBills.length > 1 ? 's' : ''} due within 7 days — ${formatCurrency(m.upcomingBillsTotal, c)}`, href: '/bills' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back, {auth.user?.name}. Here&apos;s {auth.company?.name}&apos;s financial overview.
        </p>
      </div>

      {/* 1. Financial Health Score */}
      <HealthBanner score={m.healthScore} />

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Cash Position" value={formatCurrency(m.cashPosition, c)} subtitle={`${m.bankAccounts.length} account${m.bankAccounts.length !== 1 ? 's' : ''}`} icon={Landmark} iconBg="bg-violet-50" iconColor="text-violet-600" href="/banking" />
        <KpiCard title="Receivable" value={formatCurrency(m.totalAR, c)} subtitle={`${m.overdueInvoices.length} overdue`} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" href="/invoices" />
        <KpiCard title="Payable" value={formatCurrency(m.totalAP, c)} subtitle={`${m.overdueBills.length} overdue`} icon={TrendingDown} iconBg="bg-amber-50" iconColor="text-amber-600" href="/bills" />
        <KpiCard title="Monthly Revenue" value={formatCurrency(m.monthlyRevenue, c)} subtitle="Paid this month" icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" href="/invoices" />
        <KpiCard title="Monthly Expenses" value={formatCurrency(m.monthlyExpenses, c)} subtitle="Approved this month" icon={Receipt} iconBg="bg-rose-50" iconColor="text-rose-600" href="/expenses" />
        <KpiCard title="Net Profit" value={formatCurrency(m.netProfit, c)} subtitle="Revenue − Expenses" icon={BarChart3} iconBg={m.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'} iconColor={m.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} href="/reports" />
      </div>

      {/* 8. Action Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(a => (
            <Link key={a.id} href={a.href} className={clsx(
              'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
              a.severity === 'critical' && 'bg-red-50 border-red-200 hover:bg-red-100',
              a.severity === 'warning' && 'bg-amber-50 border-amber-200 hover:bg-amber-100',
              a.severity === 'info' && 'bg-blue-50 border-blue-200 hover:bg-blue-100',
            )}>
              {a.severity === 'critical' && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
              {a.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
              {a.severity === 'info' && <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />}
              <span className={clsx('text-sm font-medium flex-1',
                a.severity === 'critical' && 'text-red-800',
                a.severity === 'warning' && 'text-amber-800',
                a.severity === 'info' && 'text-blue-800',
              )}>{a.text}</span>
              <ChevronRight className={clsx('w-4 h-4 flex-shrink-0',
                a.severity === 'critical' && 'text-red-400',
                a.severity === 'warning' && 'text-amber-400',
                a.severity === 'info' && 'text-blue-400',
              )} />
            </Link>
          ))}
        </div>
      )}

      {/* 3. Working Capital + 4. AR + 5. AP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Working Capital */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="Working Capital" icon={Scale} />
          <div className="space-y-0">
            <StatRow label="Current Assets" value={formatCurrency(m.currentAssets, c)} />
            <StatRow label="Current Liabilities" value={formatCurrency(m.currentLiabilities, c)} />
            <div className="flex items-center justify-between py-2.5 mt-1 border-t-2 border-slate-200">
              <span className="text-sm font-semibold text-slate-700">Working Capital</span>
              <span className={clsx('text-sm font-bold tabular-nums', m.workingCapital >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {formatCurrency(m.workingCapital, c)}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">Current Ratio</p>
              <p className={clsx('text-lg font-bold tabular-nums', m.currentRatio >= 1.5 ? 'text-emerald-600' : m.currentRatio >= 1 ? 'text-amber-600' : 'text-red-600')}>
                {m.currentRatio.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">Quick Ratio</p>
              <p className={clsx('text-lg font-bold tabular-nums', m.quickRatio >= 1 ? 'text-emerald-600' : m.quickRatio >= 0.5 ? 'text-amber-600' : 'text-red-600')}>
                {m.quickRatio.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* AR Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="Accounts Receivable" icon={TrendingUp} href="/invoices" />
          <div className="space-y-0">
            <StatRow label="Total Outstanding" value={formatCurrency(m.totalAR, c)} />
            <StatRow label="Overdue Amount" value={formatCurrency(m.overdueAR, c)} />
            <StatRow label="Overdue Invoices" value={String(m.overdueInvoices.length)} />
            <StatRow label="Avg Days to Pay" value={m.avgDaysToPay > 0 ? `${m.avgDaysToPay} days` : '—'} muted={m.avgDaysToPay === 0} />
          </div>
          {m.totalAR > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-1.5">Overdue Proportion</p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: `${m.totalAR > 0 ? (m.overdueAR / m.totalAR) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{m.totalAR > 0 ? Math.round((m.overdueAR / m.totalAR) * 100) : 0}% of receivables overdue</p>
            </div>
          )}
        </div>

        {/* AP Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="Accounts Payable" icon={TrendingDown} href="/bills" />
          <div className="space-y-0">
            <StatRow label="Total Outstanding" value={formatCurrency(m.totalAP, c)} />
            <StatRow label="Overdue Amount" value={formatCurrency(m.overdueAP, c)} />
            <StatRow label="Due Within 7 Days" value={formatCurrency(m.upcomingBillsTotal, c)} />
            <StatRow label="Upcoming Bills" value={String(m.upcomingBills.length)} />
          </div>
          {m.totalAP > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-1.5">Overdue Proportion</p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${m.totalAP > 0 ? (m.overdueAP / m.totalAP) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{m.totalAP > 0 ? Math.round((m.overdueAP / m.totalAP) * 100) : 0}% of payables overdue</p>
            </div>
          )}
        </div>
      </div>

      {/* 6. Payroll Summary + 7. Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payroll (conditional) */}
        {m.activeEmployees.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <SectionHeader title="Payroll Summary" icon={Users} href="/payroll" />
            <div className="space-y-0">
              <StatRow label="Active Employees" value={String(m.activeEmployees.length)} />
              <StatRow label="Last Pay Run" value={m.lastPayRun ? formatDate(m.lastPayRun.payDate) : '—'} muted={!m.lastPayRun} />
              <StatRow label="YTD Gross Paid" value={formatCurrency(m.ytdGross, c)} />
            </div>
            {m.lastPayRun && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={clsx('text-xs font-medium capitalize px-2 py-0.5 rounded-full', statusColor(m.lastPayRun.status))}>
                    {m.lastPayRun.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(m.lastPayRun.payPeriodStart)} — {formatDate(m.lastPayRun.payPeriodEnd)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <div className={clsx('bg-white rounded-xl border border-slate-200', m.activeEmployees.length === 0 && 'lg:col-span-2')}>
          <div className="p-5 pb-0">
            <SectionHeader title="Recent Activity" icon={Activity} />
          </div>
          {m.recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No recent activity.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {m.recentActivity.map(item => (
                <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={clsx('p-1.5 rounded-lg', item.type === 'invoice' ? 'bg-blue-50' : 'bg-rose-50')}>
                    {item.type === 'invoice'
                      ? <FileText className="w-3.5 h-3.5 text-blue-500" />
                      : <Receipt className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.type === 'invoice' ? 'Invoice' : 'Expense'} · {item.sublabel} · {formatDate(item.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(item.amount, item.currency)}</p>
                    <span className={clsx('text-[10px] font-medium capitalize px-1.5 py-0.5 rounded-full', statusColor(item.status))}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bank Accounts breakdown */}
      {m.bankAccounts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="Bank Accounts" icon={Wallet} href="/banking" />
          <div className="space-y-1">
            {m.bankAccounts.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={clsx('p-2 rounded-lg', a.type === 'credit_card' ? 'bg-amber-50' : 'bg-slate-50')}>
                    {a.type === 'credit_card'
                      ? <CreditCard className="w-4 h-4 text-amber-600" />
                      : <PiggyBank className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.bankName} · ····{a.accountNumber.slice(-4)}</p>
                  </div>
                </div>
                <span className={clsx('text-sm font-semibold tabular-nums', a.balance >= 0 ? 'text-slate-900' : 'text-red-600')}>
                  {formatCurrency(a.balance, a.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
