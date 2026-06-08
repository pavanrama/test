'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';
import type { Account, Invoice, Bill } from '@/lib/types';
import {
  BarChart3, Scale, Clock, FileText,
  TrendingUp, TrendingDown, CheckCircle2, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

type Tab = 'pnl' | 'balance' | 'ar' | 'ap';

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'pnl', label: 'Profit & Loss', icon: BarChart3 },
  { key: 'balance', label: 'Balance Sheet', icon: Scale },
  { key: 'ar', label: 'AR Aging', icon: Clock },
  { key: 'ap', label: 'AP Aging', icon: FileText },
];

function ReportHeader({ title, companyName }: { title: string; companyName: string }) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <div className="text-center mb-6 pb-4 border-b border-slate-200">
      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{companyName}</p>
      <h2 className="text-lg font-bold text-slate-900 mt-1">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">As of {today}</p>
    </div>
  );
}

function NoData({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ||= []).push(item);
  }
  return result;
}

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function ageBucket(dueDate: string, now: Date): 'current' | '31-60' | '61-90' | '90+' {
  const days = daysBetween(dueDate, now);
  if (days <= 30) return 'current';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

// --- Profit & Loss ---

function ProfitLossReport({ accounts, currency, companyName }: { accounts: Account[]; currency: string; companyName: string }) {
  const revenueAccounts = accounts.filter(a => a.type === 'revenue' && a.isActive);
  const expenseAccounts = accounts.filter(a => a.type === 'expense' && a.isActive);
  const totalRevenue = revenueAccounts.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = expenseAccounts.reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  if (revenueAccounts.length === 0 && expenseAccounts.length === 0) {
    return <NoData message="No revenue or expense accounts found." />;
  }

  const revenueBySubType = groupBy(revenueAccounts, a => a.subType);
  const expenseBySubType = groupBy(expenseAccounts, a => a.subType);

  return (
    <div>
      <ReportHeader title="Profit & Loss Statement" companyName={companyName} />

      <div className="space-y-6">
        {/* Revenue */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Revenue</h3>
          </div>
          {Object.entries(revenueBySubType).map(([subType, accts]) => (
            <div key={subType} className="mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1 pl-2">{subType}</p>
              {accts.map(a => (
                <div key={a.id} className="flex justify-between py-1.5 px-3 hover:bg-slate-50 rounded">
                  <span className="text-sm text-slate-700">{a.code} &middot; {a.name}</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(a.balance, currency)}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="flex justify-between py-2 px-3 border-t border-emerald-200 bg-emerald-50 rounded mt-1">
            <span className="text-sm font-bold text-emerald-800">Total Revenue</span>
            <span className="text-sm font-bold text-emerald-800">{formatCurrency(totalRevenue, currency)}</span>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide">Expenses</h3>
          </div>
          {Object.entries(expenseBySubType).map(([subType, accts]) => (
            <div key={subType} className="mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1 pl-2">{subType}</p>
              {accts.map(a => (
                <div key={a.id} className="flex justify-between py-1.5 px-3 hover:bg-slate-50 rounded">
                  <span className="text-sm text-slate-700">{a.code} &middot; {a.name}</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(a.balance, currency)}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="flex justify-between py-2 px-3 border-t border-red-200 bg-red-50 rounded mt-1">
            <span className="text-sm font-bold text-red-800">Total Expenses</span>
            <span className="text-sm font-bold text-red-800">{formatCurrency(totalExpenses, currency)}</span>
          </div>
        </div>

        {/* Net Income */}
        <div className={clsx(
          'flex justify-between py-3 px-4 rounded-lg border-2',
          netIncome >= 0
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-red-300 bg-red-50'
        )}>
          <span className="text-base font-bold text-slate-900">Net Income</span>
          <span className={clsx(
            'text-base font-bold',
            netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'
          )}>
            {formatCurrency(netIncome, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Balance Sheet ---

function BalanceSheetReport({ accounts, currency, companyName }: { accounts: Account[]; currency: string; companyName: string }) {
  const assets = accounts.filter(a => a.type === 'asset' && a.isActive);
  const liabilities = accounts.filter(a => a.type === 'liability' && a.isActive);
  const equity = accounts.filter(a => a.type === 'equity' && a.isActive);

  if (assets.length === 0 && liabilities.length === 0 && equity.length === 0) {
    return <NoData message="No balance sheet accounts found." />;
  }

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquity = equity.reduce((s, a) => s + a.balance, 0);
  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

  const sections: {
    title: string;
    items: Account[];
    total: number;
    color: string;
    bgColor: string;
    borderColor: string;
  }[] = [
    { title: 'Assets', items: assets, total: totalAssets, color: 'text-blue-800', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { title: 'Liabilities', items: liabilities, total: totalLiabilities, color: 'text-amber-800', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { title: 'Equity', items: equity, total: totalEquity, color: 'text-violet-800', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  ];

  return (
    <div>
      <ReportHeader title="Balance Sheet" companyName={companyName} />

      <div className="space-y-6">
        {sections.map(({ title, items, total, color, bgColor, borderColor }) => {
          const bySubType = groupBy(items, a => a.subType);
          return (
            <div key={title}>
              <h3 className={clsx('text-sm font-bold uppercase tracking-wide mb-3', color)}>{title}</h3>
              {Object.entries(bySubType).map(([subType, accts]) => (
                <div key={subType} className="mb-3">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1 pl-2">{subType}</p>
                  {accts.map(a => (
                    <div key={a.id} className="flex justify-between py-1.5 px-3 hover:bg-slate-50 rounded">
                      <span className="text-sm text-slate-700">{a.code} &middot; {a.name}</span>
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(a.balance, currency)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className={clsx('flex justify-between py-2 px-3 rounded mt-1 border-t', borderColor, bgColor)}>
                <span className={clsx('text-sm font-bold', color)}>Total {title}</span>
                <span className={clsx('text-sm font-bold', color)}>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          );
        })}

        <div className={clsx(
          'flex items-center justify-between py-3 px-4 rounded-lg border-2',
          isBalanced ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
        )}>
          <div className="flex items-center gap-2">
            {isBalanced
              ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className={clsx('text-sm font-bold', isBalanced ? 'text-emerald-700' : 'text-red-700')}>
              {isBalanced ? 'Balance sheet is balanced' : 'Balance sheet is not balanced'}
            </span>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Assets: {formatCurrency(totalAssets, currency)}</p>
            <p>L + E: {formatCurrency(totalLiabilities + totalEquity, currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Aging Report (shared for AR and AP) ---

interface AgingRow {
  name: string;
  current: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
  total: number;
}

function AgingTable({ rows, currency }: { rows: AgingRow[]; currency: string }) {
  const totals: AgingRow = {
    name: 'Total',
    current: rows.reduce((s, r) => s + r.current, 0),
    d31_60: rows.reduce((s, r) => s + r.d31_60, 0),
    d61_90: rows.reduce((s, r) => s + r.d61_90, 0),
    d90plus: rows.reduce((s, r) => s + r.d90plus, 0),
    total: rows.reduce((s, r) => s + r.total, 0),
  };

  const cols = [
    { label: 'Current (0-30)', key: 'current' as const },
    { label: '31-60 Days', key: 'd31_60' as const },
    { label: '61-90 Days', key: 'd61_90' as const },
    { label: '90+ Days', key: 'd90plus' as const },
    { label: 'Total', key: 'total' as const },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 font-semibold text-slate-600">Name</th>
            {cols.map(c => (
              <th key={c.key} className="text-right py-2 px-3 font-semibold text-slate-600">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-3 text-slate-800 font-medium">{row.name}</td>
              {cols.map(c => (
                <td key={c.key} className={clsx(
                  'text-right py-2 px-3',
                  row[c.key] > 0 ? 'text-slate-900' : 'text-slate-300'
                )}>
                  {formatCurrency(row[c.key], currency)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 bg-slate-50">
            <td className="py-2 px-3 font-bold text-slate-900">Total</td>
            {cols.map(c => (
              <td key={c.key} className="text-right py-2 px-3 font-bold text-slate-900">
                {formatCurrency(totals[c.key], currency)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ARAgingReport({ invoices, currency, companyName }: { invoices: Invoice[]; currency: string; companyName: string }) {
  const rows = useMemo(() => {
    const now = new Date();
    const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
    if (outstanding.length === 0) return [];

    const byCustomer = groupBy(outstanding, i => i.contactName);
    return Object.entries(byCustomer).map(([name, invs]): AgingRow => {
      const row: AgingRow = { name, current: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 };
      for (const inv of invs) {
        const owed = inv.total - inv.amountPaid;
        const bucket = ageBucket(inv.dueDate, now);
        if (bucket === 'current') row.current += owed;
        else if (bucket === '31-60') row.d31_60 += owed;
        else if (bucket === '61-90') row.d61_90 += owed;
        else row.d90plus += owed;
        row.total += owed;
      }
      return row;
    }).sort((a, b) => b.total - a.total);
  }, [invoices]);

  return (
    <div>
      <ReportHeader title="Accounts Receivable Aging" companyName={companyName} />
      {rows.length === 0
        ? <NoData message="No outstanding invoices found." />
        : <AgingTable rows={rows} currency={currency} />}
    </div>
  );
}

function APAgingReport({ bills, currency, companyName }: { bills: Bill[]; currency: string; companyName: string }) {
  const rows = useMemo(() => {
    const now = new Date();
    const outstanding = bills.filter(b => b.status === 'received' || b.status === 'approved' || b.status === 'overdue');
    if (outstanding.length === 0) return [];

    const byVendor = groupBy(outstanding, b => b.contactName);
    return Object.entries(byVendor).map(([name, bls]): AgingRow => {
      const row: AgingRow = { name, current: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 };
      for (const bill of bls) {
        const owed = bill.total - bill.amountPaid;
        const bucket = ageBucket(bill.dueDate, now);
        if (bucket === 'current') row.current += owed;
        else if (bucket === '31-60') row.d31_60 += owed;
        else if (bucket === '61-90') row.d61_90 += owed;
        else row.d90plus += owed;
        row.total += owed;
      }
      return row;
    }).sort((a, b) => b.total - a.total);
  }, [bills]);

  return (
    <div>
      <ReportHeader title="Accounts Payable Aging" companyName={companyName} />
      {rows.length === 0
        ? <NoData message="No outstanding bills found." />
        : <AgingTable rows={rows} currency={currency} />}
    </div>
  );
}

// --- Main Page ---

export default function ReportsPage() {
  const { myAccounts, myInvoices, myBills, myExpenses, auth } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('pnl');

  const accounts = myAccounts();
  const invoices = myInvoices();
  const bills = myBills();
  const currency = auth.company?.baseCurrency || 'USD';
  const companyName = auth.company?.name || 'My Company';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Financial Reports</h1>
        <p className="text-sm text-slate-500">
          View profit &amp; loss, balance sheet, and aging reports for {companyName}.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Report content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'pnl' && (
          <ProfitLossReport accounts={accounts} currency={currency} companyName={companyName} />
        )}
        {activeTab === 'balance' && (
          <BalanceSheetReport accounts={accounts} currency={currency} companyName={companyName} />
        )}
        {activeTab === 'ar' && (
          <ARAgingReport invoices={invoices} currency={currency} companyName={companyName} />
        )}
        {activeTab === 'ap' && (
          <APAgingReport bills={bills} currency={currency} companyName={companyName} />
        )}
      </div>
    </div>
  );
}
