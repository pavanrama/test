'use client';

import { useState } from 'react';
import {
  DollarSign, TrendingUp, ArrowDownLeft, ArrowUpRight,
  FileText, Receipt, AlertTriangle, CreditCard, ChevronRight,
  Calendar, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import KPICard from '@/components/KPICard';
import StatusBadge from '@/components/StatusBadge';
import {
  formatCurrency, formatDate, monthlyRevenue,
  expensesByCategory, cashFlowData, invoices, bills,
  bankTransactions, bankAccounts
} from '@/lib/data';

export default function Dashboard() {
  const [period, setPeriod] = useState('this_month');

  const totalRevenue = 248950;
  const totalExpenses = 241200;
  const netIncome = totalRevenue - totalExpenses;
  const totalAR = 28750;
  const totalAP = 12450;
  const cashBalance = bankAccounts.reduce((sum, a) => sum + (a.type !== 'credit_card' ? a.balance : 0), 0);

  const recentInvoices = invoices.slice(0, 4);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const unreconciledTxns = bankTransactions.filter(t => !t.isReconciled);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here&apos;s your financial overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={12.5}
          changeLabel="vs last month"
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <KPICard
          title="Net Income"
          value={formatCurrency(netIncome)}
          change={8.3}
          changeLabel="vs last month"
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KPICard
          title="Accounts Receivable"
          value={formatCurrency(totalAR)}
          change={-5.2}
          changeLabel="vs last month"
          icon={ArrowDownLeft}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <KPICard
          title="Cash Balance"
          value={formatCurrency(cashBalance)}
          change={15.1}
          changeLabel="vs last month"
          icon={CreditCard}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      {(overdueInvoices.length > 0 || unreconciledTxns.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Action Required</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {overdueInvoices.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <FileText className="w-4 h-4" />
                <span>{overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''} totaling {formatCurrency(overdueInvoices.reduce((s, i) => s + (i.total - i.amountPaid), 0))}</span>
              </div>
            )}
            {unreconciledTxns.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Receipt className="w-4 h-4" />
                <span>{unreconciledTxns.length} transactions need reconciliation</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Revenue vs Expenses</h2>
              <p className="text-xs text-slate-500">Monthly comparison for current year</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-slate-600">Expenses</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(value) => [formatCurrency(Number(value)), '']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" />
              <Area type="monotone" dataKey="expenses" stroke="#94a3b8" strokeWidth={2} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Expense Breakdown</h2>
              <p className="text-xs text-slate-500">By category</p>
            </div>
            <PieChartIcon className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {expensesByCategory.slice(0, 6).map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-slate-600 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Cash Flow</h2>
              <p className="text-xs text-slate-500">Inflows and outflows by month</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cashFlowData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(value) => [formatCurrency(Number(value)), '']}
              />
              <Bar dataKey="inflow" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Inflow" />
              <Bar dataKey="outflow" fill="#f97316" radius={[4, 4, 0, 0]} name="Outflow" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Bank Accounts</h3>
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{account.name}</p>
                    <p className="text-xs text-slate-400">{account.bankName} · {account.accountNumber}</p>
                  </div>
                  <span className={`text-sm font-semibold ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(bankAccounts.reduce((s, a) => s + a.balance, 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Quick Summary</h3>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Receivable</span>
                <span className="font-medium text-slate-900">{formatCurrency(totalAR)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payable</span>
                <span className="font-medium text-red-600">-{formatCurrency(totalAP)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Net Position</span>
                <span className="font-bold text-emerald-600">{formatCurrency(totalAR - totalAP)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Recent Invoices</h2>
            <a href="/invoices" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.customerName}</p>
                    <p className="text-xs text-slate-400">{inv.number} · {formatDate(inv.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(inv.total, inv.currency)}</p>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
            <a href="/bank" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {bankTransactions.slice(0, 6).map((txn) => (
              <div key={txn.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${txn.type === 'credit' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {txn.type === 'credit' ? (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{txn.description}</p>
                    <p className="text-xs text-slate-400">{formatDate(txn.date)} · {txn.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </p>
                  {txn.isReconciled ? (
                    <span className="text-xs text-emerald-500">Reconciled</span>
                  ) : (
                    <span className="text-xs text-amber-500">Unreconciled</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
