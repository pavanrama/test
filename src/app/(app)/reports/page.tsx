'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate, calcAccumulatedDepreciation, calcBookValue } from '@/lib/utils';
import type { Account, Invoice, Bill, Expense, PayRun, FixedAsset, Contact, JournalEntry, Payment } from '@/lib/types';
import {
  BarChart3, Download, FileText, Users, Building2,
  BookOpen, Landmark, Printer, ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';

type Tab = 'pnl' | 'balance' | 'cashflow' | 'ledger' | 'customer' | 'vendor' | 'ar' | 'ap';

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'pnl', label: 'Profit & Loss', icon: BarChart3 },
  { key: 'balance', label: 'Balance Sheet', icon: Landmark },
  { key: 'cashflow', label: 'Cash Flow', icon: FileText },
  { key: 'ledger', label: 'General Ledger', icon: BookOpen },
  { key: 'customer', label: 'Customer Ledger', icon: Users },
  { key: 'vendor', label: 'Vendor Ledger', icon: Building2 },
  { key: 'ar', label: 'AR Aging', icon: FileText },
  { key: 'ap', label: 'AP Aging', icon: FileText },
];

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

function ageBucket(dueDate: string, now: Date): 'current' | '1-30' | '31-60' | '61-90' | '90+' {
  const days = daysBetween(dueDate, now);
  if (days <= 0) return 'current';
  if (days <= 30) return '1-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

function ReportHeader({ title, companyName }: { title: string; companyName: string }) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  return (
    <div className="text-center mb-6 pb-4 border-b border-slate-200">
      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{companyName}</p>
      <h2 className="text-lg font-bold text-slate-900 mt-1">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">As of {today}</p>
      <button className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
        <Download className="w-3.5 h-3.5" />
        Export Report
      </button>
    </div>
  );
}

function NoData({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ────────────────────────── 1. Profit & Loss ────────────────────────── */

function ProfitLossReport({ accounts, currency, companyName }: {
  accounts: Account[]; currency: string; companyName: string;
}) {
  const revenueAccounts = accounts.filter(a => a.type === 'revenue' && a.isActive);
  const expenseAccounts = accounts.filter(a => a.type === 'expense' && a.isActive);

  if (revenueAccounts.length === 0 && expenseAccounts.length === 0) {
    return <NoData message="No revenue or expense accounts found." />;
  }

  const totalRevenue = revenueAccounts.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = expenseAccounts.reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  const revenueBySubType = groupBy(revenueAccounts, a => a.subType);
  const expenseBySubType = groupBy(expenseAccounts, a => a.subType);

  return (
    <div>
      <ReportHeader title="Profit & Loss Statement" companyName={companyName} />
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-3">Revenue</h3>
          {Object.entries(revenueBySubType).map(([subType, accts]) => (
            <div key={subType} className="mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1 pl-2">{subType}</p>
              {accts.map(a => (
                <div key={a.id} className="flex justify-between py-1.5 px-3 hover:bg-slate-50 rounded">
                  <span className="text-sm text-slate-700">{a.code} &middot; {a.name}</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(a.balance, currency)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 px-3 text-xs text-slate-500">
                <span>Subtotal — {subType}</span>
                <span>{formatCurrency(accts.reduce((s, a) => s + a.balance, 0), currency)}</span>
              </div>
            </div>
          ))}
          <div className="flex justify-between py-2 px-3 border-t border-emerald-200 bg-emerald-50 rounded mt-1">
            <span className="text-sm font-bold text-emerald-800">Total Revenue</span>
            <span className="text-sm font-bold text-emerald-800">{formatCurrency(totalRevenue, currency)}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3">Expenses</h3>
          {Object.entries(expenseBySubType).map(([subType, accts]) => (
            <div key={subType} className="mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase mb-1 pl-2">{subType}</p>
              {accts.map(a => (
                <div key={a.id} className="flex justify-between py-1.5 px-3 hover:bg-slate-50 rounded">
                  <span className="text-sm text-slate-700">{a.code} &middot; {a.name}</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(a.balance, currency)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 px-3 text-xs text-slate-500">
                <span>Subtotal — {subType}</span>
                <span>{formatCurrency(accts.reduce((s, a) => s + a.balance, 0), currency)}</span>
              </div>
            </div>
          ))}
          <div className="flex justify-between py-2 px-3 border-t border-red-200 bg-red-50 rounded mt-1">
            <span className="text-sm font-bold text-red-800">Total Expenses</span>
            <span className="text-sm font-bold text-red-800">{formatCurrency(totalExpenses, currency)}</span>
          </div>
        </div>

        <div className={clsx(
          'flex justify-between py-3 px-4 rounded-lg border-2',
          netIncome >= 0 ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
        )}>
          <span className="text-base font-bold text-slate-900">Net Income</span>
          <span className={clsx('text-base font-bold', netIncome >= 0 ? 'text-emerald-700' : 'text-red-700')}>
            {formatCurrency(netIncome, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── 2. Balance Sheet ────────────────────────── */

function BalanceSheetReport({ accounts, currency, companyName }: {
  accounts: Account[]; currency: string; companyName: string;
}) {
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

  const sections: { title: string; items: Account[]; total: number; color: string; bg: string; border: string }[] = [
    { title: 'Assets', items: assets, total: totalAssets, color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
    { title: 'Liabilities', items: liabilities, total: totalLiabilities, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
    { title: 'Equity', items: equity, total: totalEquity, color: 'text-violet-800', bg: 'bg-violet-50', border: 'border-violet-200' },
  ];

  return (
    <div>
      <ReportHeader title="Balance Sheet" companyName={companyName} />
      <div className="space-y-6">
        {sections.map(({ title, items, total, color, bg, border }) => {
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
              <div className={clsx('flex justify-between py-2 px-3 rounded mt-1 border-t', border, bg)}>
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
          <span className={clsx('text-sm font-bold', isBalanced ? 'text-emerald-700' : 'text-red-700')}>
            {isBalanced ? 'Balance sheet is balanced (A = L + E)' : 'Balance sheet is NOT balanced'}
          </span>
          <div className="text-right text-xs text-slate-500">
            <p>Assets: {formatCurrency(totalAssets, currency)}</p>
            <p>L + E: {formatCurrency(totalLiabilities + totalEquity, currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── 3. Cash Flow Statement ────────────────────────── */

function CashFlowReport({ accounts, invoices, bills, expenses, fixedAssets, payRuns, currency, companyName }: {
  accounts: Account[]; invoices: Invoice[]; bills: Bill[]; expenses: Expense[];
  fixedAssets: FixedAsset[]; payRuns: PayRun[]; currency: string; companyName: string;
}) {
  const revenueAccounts = accounts.filter(a => a.type === 'revenue' && a.isActive);
  const expenseAccounts = accounts.filter(a => a.type === 'expense' && a.isActive);
  const totalRevenue = revenueAccounts.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = expenseAccounts.reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  const totalAR = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'draft')
    .reduce((s, i) => s + (i.total - i.amountPaid), 0);

  const totalAP = bills
    .filter(b => b.status !== 'paid' && b.status !== 'draft' && b.status !== 'rejected')
    .reduce((s, b) => s + (b.total - b.amountPaid), 0);

  const totalPayroll = payRuns
    .filter(p => p.status === 'paid' || p.status === 'processed')
    .reduce((s, p) => s + p.entries.reduce((es, e) => es + e.netPay, 0), 0);

  const totalExpensesPaid = expenses
    .filter(e => e.status === 'approved')
    .reduce((s, e) => s + e.amount, 0);

  const operatingCash = netIncome - totalAR + totalAP - totalPayroll - totalExpensesPaid;

  const investingTotal = -fixedAssets.reduce((s, a) => s + a.costBasis, 0);

  const netCashFlow = operatingCash + investingTotal;

  const hasData = accounts.length > 0;
  if (!hasData) return <NoData message="No data available for cash flow statement." />;

  const sections: { title: string; lines: { label: string; amount: number }[]; total: number; color: string }[] = [
    {
      title: 'Operating Activities',
      lines: [
        { label: 'Net Income', amount: netIncome },
        { label: 'Decrease/(Increase) in Accounts Receivable', amount: -totalAR },
        { label: 'Increase/(Decrease) in Accounts Payable', amount: totalAP },
        { label: 'Payroll Paid', amount: -totalPayroll },
        { label: 'Expenses Paid', amount: -totalExpensesPaid },
      ],
      total: operatingCash,
      color: 'text-blue-800',
    },
    {
      title: 'Investing Activities',
      lines: [
        { label: 'Fixed Asset Purchases', amount: investingTotal },
      ],
      total: investingTotal,
      color: 'text-amber-800',
    },
    {
      title: 'Financing Activities',
      lines: [],
      total: 0,
      color: 'text-violet-800',
    },
  ];

  return (
    <div>
      <ReportHeader title="Cash Flow Statement" companyName={companyName} />
      <div className="space-y-6">
        {sections.map(({ title, lines, total, color }) => (
          <div key={title}>
            <h3 className={clsx('text-sm font-bold uppercase tracking-wide mb-3', color)}>{title}</h3>
            {lines.length === 0 && (
              <p className="text-xs text-slate-400 pl-3 mb-2">No financing activity recorded.</p>
            )}
            {lines.map((l, i) => (
              <div key={i} className="flex justify-between py-1.5 px-3 hover:bg-slate-50 rounded">
                <span className="text-sm text-slate-700">{l.label}</span>
                <span className={clsx('text-sm font-medium', l.amount < 0 ? 'text-red-600' : 'text-slate-900')}>
                  {formatCurrency(l.amount, currency)}
                </span>
              </div>
            ))}
            <div className="flex justify-between py-2 px-3 border-t border-slate-200 bg-slate-50 rounded mt-1">
              <span className={clsx('text-sm font-bold', color)}>Net — {title}</span>
              <span className={clsx('text-sm font-bold', color)}>{formatCurrency(total, currency)}</span>
            </div>
          </div>
        ))}

        <div className={clsx(
          'flex justify-between py-3 px-4 rounded-lg border-2',
          netCashFlow >= 0 ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
        )}>
          <span className="text-base font-bold text-slate-900">Net Cash Flow</span>
          <span className={clsx('text-base font-bold', netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700')}>
            {formatCurrency(netCashFlow, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── 4. General Ledger Detail ────────────────────────── */

function GeneralLedgerReport({ accounts, journalEntries, currency, companyName }: {
  accounts: Account[]; journalEntries: JournalEntry[]; currency: string; companyName: string;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const activeAccounts = accounts.filter(a => a.isActive).sort((a, b) => a.code.localeCompare(b.code));

  const ledgerRows = useMemo(() => {
    if (!selectedAccountId) return [];
    const posted = journalEntries.filter(je => je.status === 'posted');
    const rows: { date: string; ref: string; description: string; debit: number; credit: number; balance: number }[] = [];
    let runningBalance = 0;

    const relevant = posted
      .filter(je => je.lines.some(l => l.accountId === selectedAccountId))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const je of relevant) {
      for (const line of je.lines) {
        if (line.accountId === selectedAccountId) {
          runningBalance += line.debit - line.credit;
          rows.push({
            date: je.date,
            ref: je.reference || je.id.slice(0, 8),
            description: line.description || je.description,
            debit: line.debit,
            credit: line.credit,
            balance: runningBalance,
          });
        }
      }
    }
    return rows;
  }, [selectedAccountId, journalEntries]);

  if (activeAccounts.length === 0) return <NoData message="No accounts available for general ledger." />;

  const selectedAccount = activeAccounts.find(a => a.id === selectedAccountId);

  return (
    <div>
      <ReportHeader title="General Ledger Detail" companyName={companyName} />

      <div className="mb-4 relative">
        <label className="block text-xs font-medium text-slate-600 mb-1">Select Account</label>
        <div className="relative">
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">— Choose an account —</option>
            {activeAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.code} · {a.name} ({a.type})</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {!selectedAccountId && (
        <p className="text-sm text-slate-400 text-center py-8">Select an account to view its ledger.</p>
      )}

      {selectedAccountId && ledgerRows.length === 0 && (
        <NoData message={`No posted journal entries found for ${selectedAccount?.name || 'this account'}.`} />
      )}

      {ledgerRows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-600">Date</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-600">Ref</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-600">Description</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Debit</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Credit</th>
                <th className="text-right py-2 px-3 font-semibold text-slate-600">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-600">{formatDate(row.date)}</td>
                  <td className="py-2 px-3 text-slate-500 font-mono text-xs">{row.ref}</td>
                  <td className="py-2 px-3 text-slate-800">{row.description}</td>
                  <td className={clsx('text-right py-2 px-3', row.debit > 0 ? 'text-slate-900' : 'text-slate-300')}>
                    {formatCurrency(row.debit, currency)}
                  </td>
                  <td className={clsx('text-right py-2 px-3', row.credit > 0 ? 'text-slate-900' : 'text-slate-300')}>
                    {formatCurrency(row.credit, currency)}
                  </td>
                  <td className={clsx('text-right py-2 px-3 font-medium', row.balance < 0 ? 'text-red-600' : 'text-slate-900')}>
                    {formatCurrency(row.balance, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50">
                <td colSpan={3} className="py-2 px-3 font-bold text-slate-900">Totals</td>
                <td className="text-right py-2 px-3 font-bold text-slate-900">
                  {formatCurrency(ledgerRows.reduce((s, r) => s + r.debit, 0), currency)}
                </td>
                <td className="text-right py-2 px-3 font-bold text-slate-900">
                  {formatCurrency(ledgerRows.reduce((s, r) => s + r.credit, 0), currency)}
                </td>
                <td className="text-right py-2 px-3 font-bold text-slate-900">
                  {formatCurrency(ledgerRows[ledgerRows.length - 1]?.balance ?? 0, currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── 5. Customer Ledger ────────────────────────── */

function CustomerLedgerReport({ contacts, invoices, currency, companyName }: {
  contacts: Contact[]; invoices: Invoice[]; currency: string; companyName: string;
}) {
  const [selectedContactId, setSelectedContactId] = useState('');

  const customers = contacts.filter(c => c.type === 'customer' || c.type === 'both').sort((a, b) => a.name.localeCompare(b.name));

  const customerInvoices = useMemo(() => {
    if (!selectedContactId) return [];
    return invoices
      .filter(i => i.contactId === selectedContactId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedContactId, invoices]);

  const totalOutstanding = customerInvoices.reduce((s, i) => {
    if (i.status === 'cancelled' || i.status === 'draft') return s;
    return s + (i.total - i.amountPaid);
  }, 0);

  const allPayments: (Payment & { invoiceNumber: string })[] = useMemo(() => {
    const result: (Payment & { invoiceNumber: string })[] = [];
    for (const inv of customerInvoices) {
      for (const p of (inv.payments || [])) {
        result.push({ ...p, invoiceNumber: inv.number });
      }
    }
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customerInvoices]);

  if (customers.length === 0) return <NoData message="No customers found." />;

  const selectedCustomer = customers.find(c => c.id === selectedContactId);

  return (
    <div>
      <ReportHeader title="Customer Ledger" companyName={companyName} />

      <div className="mb-4 relative">
        <label className="block text-xs font-medium text-slate-600 mb-1">Select Customer</label>
        <div className="relative">
          <select
            value={selectedContactId}
            onChange={e => setSelectedContactId(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">— Choose a customer —</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {!selectedContactId && (
        <p className="text-sm text-slate-400 text-center py-8">Select a customer to view their ledger.</p>
      )}

      {selectedContactId && customerInvoices.length === 0 && (
        <NoData message={`No invoices found for ${selectedCustomer?.name || 'this customer'}.`} />
      )}

      {customerInvoices.length > 0 && (
        <>
          <div className="overflow-x-auto mb-6">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Invoices</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Invoice #</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Amount</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Paid</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Balance</th>
                </tr>
              </thead>
              <tbody>
                {customerInvoices.map(inv => {
                  const balance = inv.total - inv.amountPaid;
                  return (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{formatDate(inv.date)}</td>
                      <td className="py-2 px-3 text-slate-800 font-medium">{inv.number}</td>
                      <td className="py-2 px-3">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statusBadge(inv.status))}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-right py-2 px-3 text-slate-900">{formatCurrency(inv.total, currency)}</td>
                      <td className="text-right py-2 px-3 text-emerald-700">{formatCurrency(inv.amountPaid, currency)}</td>
                      <td className={clsx('text-right py-2 px-3 font-medium', balance > 0 ? 'text-red-600' : 'text-slate-900')}>
                        {formatCurrency(balance, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td colSpan={3} className="py-2 px-3 font-bold text-slate-900">Total Outstanding</td>
                  <td className="text-right py-2 px-3 font-bold text-slate-900">
                    {formatCurrency(customerInvoices.reduce((s, i) => s + i.total, 0), currency)}
                  </td>
                  <td className="text-right py-2 px-3 font-bold text-emerald-700">
                    {formatCurrency(customerInvoices.reduce((s, i) => s + i.amountPaid, 0), currency)}
                  </td>
                  <td className="text-right py-2 px-3 font-bold text-red-700">
                    {formatCurrency(totalOutstanding, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {allPayments.length > 0 && (
            <div className="overflow-x-auto">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Payment History</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Date</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Invoice</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Method</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Reference</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{formatDate(p.date)}</td>
                      <td className="py-2 px-3 text-slate-800">{p.invoiceNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{p.method}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-xs">{p.reference || '—'}</td>
                      <td className="text-right py-2 px-3 text-emerald-700 font-medium">{formatCurrency(p.amount, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────────────── 6. Vendor Ledger ────────────────────────── */

function VendorLedgerReport({ contacts, bills, currency, companyName }: {
  contacts: Contact[]; bills: Bill[]; currency: string; companyName: string;
}) {
  const [selectedContactId, setSelectedContactId] = useState('');

  const vendors = contacts.filter(c => c.type === 'vendor' || c.type === 'both').sort((a, b) => a.name.localeCompare(b.name));

  const vendorBills = useMemo(() => {
    if (!selectedContactId) return [];
    return bills
      .filter(b => b.contactId === selectedContactId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedContactId, bills]);

  const totalOutstanding = vendorBills.reduce((s, b) => {
    if (b.status === 'paid' || b.status === 'draft' || b.status === 'rejected') return s;
    return s + (b.total - b.amountPaid);
  }, 0);

  const allPayments: (Payment & { billNumber: string })[] = useMemo(() => {
    const result: (Payment & { billNumber: string })[] = [];
    for (const bill of vendorBills) {
      for (const p of (bill.payments || [])) {
        result.push({ ...p, billNumber: bill.number });
      }
    }
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [vendorBills]);

  if (vendors.length === 0) return <NoData message="No vendors found." />;

  const selectedVendor = vendors.find(c => c.id === selectedContactId);

  return (
    <div>
      <ReportHeader title="Vendor Ledger" companyName={companyName} />

      <div className="mb-4 relative">
        <label className="block text-xs font-medium text-slate-600 mb-1">Select Vendor</label>
        <div className="relative">
          <select
            value={selectedContactId}
            onChange={e => setSelectedContactId(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">— Choose a vendor —</option>
            {vendors.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {!selectedContactId && (
        <p className="text-sm text-slate-400 text-center py-8">Select a vendor to view their ledger.</p>
      )}

      {selectedContactId && vendorBills.length === 0 && (
        <NoData message={`No bills found for ${selectedVendor?.name || 'this vendor'}.`} />
      )}

      {vendorBills.length > 0 && (
        <>
          <div className="overflow-x-auto mb-6">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Bills</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Bill #</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Status</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Amount</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Paid</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Balance</th>
                </tr>
              </thead>
              <tbody>
                {vendorBills.map(bill => {
                  const balance = bill.total - bill.amountPaid;
                  return (
                    <tr key={bill.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{formatDate(bill.date)}</td>
                      <td className="py-2 px-3 text-slate-800 font-medium">{bill.number}</td>
                      <td className="py-2 px-3">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statusBadge(bill.status))}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="text-right py-2 px-3 text-slate-900">{formatCurrency(bill.total, currency)}</td>
                      <td className="text-right py-2 px-3 text-emerald-700">{formatCurrency(bill.amountPaid, currency)}</td>
                      <td className={clsx('text-right py-2 px-3 font-medium', balance > 0 ? 'text-red-600' : 'text-slate-900')}>
                        {formatCurrency(balance, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td colSpan={3} className="py-2 px-3 font-bold text-slate-900">Total Outstanding</td>
                  <td className="text-right py-2 px-3 font-bold text-slate-900">
                    {formatCurrency(vendorBills.reduce((s, b) => s + b.total, 0), currency)}
                  </td>
                  <td className="text-right py-2 px-3 font-bold text-emerald-700">
                    {formatCurrency(vendorBills.reduce((s, b) => s + b.amountPaid, 0), currency)}
                  </td>
                  <td className="text-right py-2 px-3 font-bold text-red-700">
                    {formatCurrency(totalOutstanding, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {allPayments.length > 0 && (
            <div className="overflow-x-auto">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Payment History</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Date</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Bill</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Method</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">Reference</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{formatDate(p.date)}</td>
                      <td className="py-2 px-3 text-slate-800">{p.billNumber}</td>
                      <td className="py-2 px-3 text-slate-600">{p.method}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-xs">{p.reference || '—'}</td>
                      <td className="text-right py-2 px-3 text-emerald-700 font-medium">{formatCurrency(p.amount, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────────────── 7 & 8. AR / AP Aging ────────────────────────── */

interface AgingRow {
  name: string;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
  total: number;
}

function AgingTable({ rows, currency }: { rows: AgingRow[]; currency: string }) {
  const totals: AgingRow = {
    name: 'Total',
    current: rows.reduce((s, r) => s + r.current, 0),
    d1_30: rows.reduce((s, r) => s + r.d1_30, 0),
    d31_60: rows.reduce((s, r) => s + r.d31_60, 0),
    d61_90: rows.reduce((s, r) => s + r.d61_90, 0),
    d90plus: rows.reduce((s, r) => s + r.d90plus, 0),
    total: rows.reduce((s, r) => s + r.total, 0),
  };

  const cols: { label: string; key: keyof AgingRow }[] = [
    { label: 'Current', key: 'current' },
    { label: '1-30 Days', key: 'd1_30' },
    { label: '31-60 Days', key: 'd31_60' },
    { label: '61-90 Days', key: 'd61_90' },
    { label: '90+ Days', key: 'd90plus' },
    { label: 'Total', key: 'total' },
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
                  (row[c.key] as number) > 0 ? 'text-slate-900' : 'text-slate-300'
                )}>
                  {formatCurrency(row[c.key] as number, currency)}
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
                {formatCurrency(totals[c.key] as number, currency)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ARAgingReport({ invoices, currency, companyName }: {
  invoices: Invoice[]; currency: string; companyName: string;
}) {
  const rows = useMemo(() => {
    const now = new Date();
    const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'partial');
    if (outstanding.length === 0) return [];

    const byCustomer = groupBy(outstanding, i => i.contactName);
    return Object.entries(byCustomer).map(([name, invs]): AgingRow => {
      const row: AgingRow = { name, current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 };
      for (const inv of invs) {
        const owed = inv.total - inv.amountPaid;
        const bucket = ageBucket(inv.dueDate, now);
        if (bucket === 'current') row.current += owed;
        else if (bucket === '1-30') row.d1_30 += owed;
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

function APAgingReport({ bills, currency, companyName }: {
  bills: Bill[]; currency: string; companyName: string;
}) {
  const rows = useMemo(() => {
    const now = new Date();
    const outstanding = bills.filter(b =>
      b.status === 'submitted' || b.status === 'approved' || b.status === 'overdue' || b.status === 'partial'
    );
    if (outstanding.length === 0) return [];

    const byVendor = groupBy(outstanding, b => b.contactName);
    return Object.entries(byVendor).map(([name, bls]): AgingRow => {
      const row: AgingRow = { name, current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 };
      for (const bill of bls) {
        const owed = bill.total - bill.amountPaid;
        const bucket = ageBucket(bill.dueDate, now);
        if (bucket === 'current') row.current += owed;
        else if (bucket === '1-30') row.d1_30 += owed;
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

/* ────────────────────────── Helpers ────────────────────────── */

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    partial: 'bg-cyan-100 text-cyan-700',
    sent: 'bg-blue-100 text-blue-700',
    draft: 'bg-slate-100 text-slate-600',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
    approved: 'bg-emerald-100 text-emerald-700',
    submitted: 'bg-indigo-100 text-indigo-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
}

/* ────────────────────────── Main Page ────────────────────────── */

export default function ReportsPage() {
  const {
    myAccounts, myInvoices, myBills, myExpenses,
    myPayRuns, myFixedAssets, myContacts, myJournalEntries, auth,
  } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('pnl');

  const accounts = myAccounts();
  const invoices = myInvoices();
  const bills = myBills();
  const expenses = myExpenses();
  const payRuns = myPayRuns();
  const fixedAssets = myFixedAssets();
  const contacts = myContacts();
  const journalEntries = myJournalEntries();
  const currency = auth.company?.baseCurrency || 'USD';
  const companyName = auth.company?.name || 'My Company';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-sm text-slate-500">
            Comprehensive financial reporting for {companyName}.
          </p>
        </div>
        <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'pnl' && (
          <ProfitLossReport accounts={accounts} currency={currency} companyName={companyName} />
        )}
        {activeTab === 'balance' && (
          <BalanceSheetReport accounts={accounts} currency={currency} companyName={companyName} />
        )}
        {activeTab === 'cashflow' && (
          <CashFlowReport
            accounts={accounts} invoices={invoices} bills={bills} expenses={expenses}
            fixedAssets={fixedAssets} payRuns={payRuns} currency={currency} companyName={companyName}
          />
        )}
        {activeTab === 'ledger' && (
          <GeneralLedgerReport
            accounts={accounts} journalEntries={journalEntries}
            currency={currency} companyName={companyName}
          />
        )}
        {activeTab === 'customer' && (
          <CustomerLedgerReport
            contacts={contacts} invoices={invoices}
            currency={currency} companyName={companyName}
          />
        )}
        {activeTab === 'vendor' && (
          <VendorLedgerReport
            contacts={contacts} bills={bills}
            currency={currency} companyName={companyName}
          />
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
