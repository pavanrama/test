'use client';

import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign, TrendingUp, ArrowDownLeft, CreditCard,
  FileText, AlertTriangle, ArrowUpRight, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

export default function DashboardPage() {
  const { myInvoices, myBills, myExpenses, myBankAccounts, myBankTransactions, myContacts, auth } = useApp();
  const invoices = myInvoices();
  const billsList = myBills();
  const expenses = myExpenses();
  const bankAccts = myBankAccounts();
  const txns = myBankTransactions();
  const contacts = myContacts();

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalAR = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const totalAP = billsList.filter(b => ['received', 'approved', 'overdue'].includes(b.status)).reduce((s, b) => s + (b.total - b.amountPaid), 0);
  const cashBalance = bankAccts.reduce((s, a) => s + a.balance, 0);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const unreconciledCount = txns.filter(t => !t.isReconciled).length;
  const recentInvoices = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const kpis = [
    { title: 'Total Revenue', value: formatCurrency(totalRevenue, auth.company?.baseCurrency), icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { title: 'Receivable', value: formatCurrency(totalAR, auth.company?.baseCurrency), icon: ArrowDownLeft, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Payable', value: formatCurrency(totalAP, auth.company?.baseCurrency), icon: ArrowUpRight, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { title: 'Cash Balance', value: formatCurrency(cashBalance, auth.company?.baseCurrency), icon: CreditCard, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  ];

  const isEmpty = invoices.length === 0 && expenses.length === 0 && contacts.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {auth.user?.name}. Here&apos;s {auth.company?.name}&apos;s overview.</p>
      </div>

      {isEmpty && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="text-base font-semibold text-blue-900 mb-2">Get Started with Your Books</h3>
          <p className="text-sm text-blue-700 mb-4">Start by adding contacts, then create your first invoice or record an expense.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contacts" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Contacts</Link>
            <Link href="/invoices" className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50">Create Invoice</Link>
            <Link href="/expenses" className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50">Add Expense</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{k.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{k.value}</p>
              </div>
              <div className={clsx('p-2.5 rounded-xl', k.iconBg)}>
                <k.icon className={clsx('w-5 h-5', k.iconColor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {(overdueInvoices.length > 0 || unreconciledCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Action Required</span>
          </div>
          <div className="space-y-1">
            {overdueInvoices.length > 0 && (
              <p className="text-sm text-amber-700">{overdueInvoices.length} overdue invoice(s) — {formatCurrency(overdueInvoices.reduce((s, i) => s + (i.total - i.amountPaid), 0))}</p>
            )}
            {unreconciledCount > 0 && (
              <p className="text-sm text-amber-700">{unreconciledCount} bank transaction(s) need reconciliation</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent Invoices</h2>
            <Link href="/invoices" className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No invoices yet. <Link href="/invoices" className="text-blue-600">Create one</Link></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.contactName}</p>
                    <p className="text-xs text-slate-400">{inv.number} · {formatDate(inv.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(inv.total, inv.currency)}</p>
                    <span className={clsx('text-xs font-medium capitalize px-2 py-0.5 rounded-full',
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      inv.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    )}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Recent Expenses</h2>
            <Link href="/expenses" className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No expenses yet. <Link href="/expenses" className="text-blue-600">Add one</Link></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{exp.vendor}</p>
                    <p className="text-xs text-slate-400">{exp.category} · {formatDate(exp.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(exp.amount, exp.currency)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {bankAccts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Bank Accounts</h2>
          <div className="space-y-2">
            {bankAccts.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.bankName} · {a.accountNumber}</p>
                </div>
                <span className={clsx('text-sm font-semibold', a.balance >= 0 ? 'text-slate-900' : 'text-red-600')}>
                  {formatCurrency(a.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
