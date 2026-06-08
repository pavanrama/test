'use client';

import { useState } from 'react';
import {
  BarChart3, Download, Calendar, FileText, TrendingUp,
  TrendingDown, DollarSign, ArrowRight, Printer
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import clsx from 'clsx';
import PageHeader from '@/components/PageHeader';
import { formatCurrency, monthlyRevenue, cashFlowData, accounts } from '@/lib/data';

type ReportType = 'pnl' | 'balance_sheet' | 'cash_flow' | 'trial_balance' | 'ar_aging' | 'ap_aging';

const reportTypes: { id: ReportType; name: string; desc: string }[] = [
  { id: 'pnl', name: 'Profit & Loss', desc: 'Revenue and expenses summary' },
  { id: 'balance_sheet', name: 'Balance Sheet', desc: 'Assets, liabilities, and equity' },
  { id: 'cash_flow', name: 'Cash Flow Statement', desc: 'Inflows and outflows analysis' },
  { id: 'trial_balance', name: 'Trial Balance', desc: 'Debit and credit balances' },
  { id: 'ar_aging', name: 'AR Aging Report', desc: 'Accounts receivable by age' },
  { id: 'ap_aging', name: 'AP Aging Report', desc: 'Accounts payable by age' },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('pnl');
  const [period, setPeriod] = useState('this_year');

  const revenue = accounts.filter(a => a.type === 'revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'expense');
  const totalRevenue = revenue.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = expenseAccounts.reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  const assets = accounts.filter(a => a.type === 'asset');
  const liabilities = accounts.filter(a => a.type === 'liability');
  const equity = accounts.filter(a => a.type === 'equity');
  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquity = equity.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Financial Reports"
        description="Generate comprehensive financial statements"
        icon={BarChart3}
      >
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_quarter">This Quarter</option>
          <option value="this_year">This Year</option>
          <option value="last_year">Last Year</option>
          <option value="custom">Custom Range</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
          <Printer className="w-4 h-4 text-slate-500" />
          Print
        </button>
        <button className="flex items-center gap-2 px-3 py-2.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
          <Download className="w-4 h-4 text-slate-500" />
          Export
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {reportTypes.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setActiveReport(rt.id)}
            className={clsx(
              'p-3 rounded-xl border-2 text-left transition-all',
              activeReport === rt.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <p className={clsx('text-xs font-semibold', activeReport === rt.id ? 'text-blue-700' : 'text-slate-900')}>{rt.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{rt.desc}</p>
          </button>
        ))}
      </div>

      {activeReport === 'pnl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500">Total Revenue</span>
              </div>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-slate-500">Total Expenses</span>
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-slate-500">Net Income</span>
              </div>
              <p className={clsx('text-xl font-bold', netIncome >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(netIncome)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Profit & Loss Statement</h3>
              <p className="text-xs text-slate-400">For the year ending December 2024</p>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Revenue</h4>
                {revenue.map((acc) => (
                  <div key={acc.id} className="flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded">
                    <span className="text-sm text-slate-700">{acc.name}</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(acc.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-2 border-t border-slate-200 mt-1 font-semibold">
                  <span className="text-sm text-emerald-700">Total Revenue</span>
                  <span className="text-sm text-emerald-700">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expenses</h4>
                {expenseAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded">
                    <span className="text-sm text-slate-700">{acc.name}</span>
                    <span className="text-sm font-medium text-slate-900">{formatCurrency(acc.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-2 border-t border-slate-200 mt-1 font-semibold">
                  <span className="text-sm text-red-700">Total Expenses</span>
                  <span className="text-sm text-red-700">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>

              <div className="flex justify-between py-3 px-2 border-t-2 border-slate-900 font-bold">
                <span className="text-base text-slate-900">Net Income</span>
                <span className={clsx('text-base', netIncome >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                  {formatCurrency(netIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'balance_sheet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-1">Total Assets</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-1">Total Liabilities</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-1">Total Equity</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(totalEquity)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Balance Sheet</h3>
              <p className="text-xs text-slate-400">As of July 2024</p>
            </div>
            <div className="p-4 space-y-6">
              {[
                { title: 'Assets', data: assets, color: 'blue' },
                { title: 'Liabilities', data: liabilities, color: 'red' },
                { title: 'Equity', data: equity, color: 'purple' },
              ].map(({ title, data, color }) => (
                <div key={title}>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</h4>
                  {data.map((acc) => (
                    <div key={acc.id} className="flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded">
                      <div>
                        <span className="text-sm text-slate-700">{acc.name}</span>
                        <span className="text-xs text-slate-400 ml-2">{acc.subType}</span>
                      </div>
                      <span className={clsx('text-sm font-medium', acc.balance < 0 ? 'text-red-600' : 'text-slate-900')}>
                        {formatCurrency(acc.balance)}
                      </span>
                    </div>
                  ))}
                  <div className={clsx('flex justify-between py-2 px-2 border-t border-slate-200 mt-1 font-semibold text-sm', `text-${color}-700`)}>
                    <span>Total {title}</span>
                    <span>{formatCurrency(data.reduce((s, a) => s + a.balance, 0))}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between py-3 px-2 border-t-2 border-slate-900 font-bold">
                <span className="text-base">Total Liabilities + Equity</span>
                <span className="text-base">{formatCurrency(totalLiabilities + totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'cash_flow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Cash Flow Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} name="Inflow" />
                <Bar dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Cash Flow Statement</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Operating Activities</h4>
                {[
                  { name: 'Net Income', amount: 7750 },
                  { name: 'Depreciation', amount: 4000 },
                  { name: 'Change in AR', amount: -3500 },
                  { name: 'Change in AP', amount: 2100 },
                  { name: 'Change in Inventory', amount: -1200 },
                ].map((item) => (
                  <div key={item.name} className="flex justify-between py-1.5 px-2">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <span className={clsx('text-sm font-medium', item.amount < 0 ? 'text-red-600' : 'text-slate-900')}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-2 border-t border-slate-200 font-semibold">
                  <span className="text-sm text-slate-900">Net Cash from Operations</span>
                  <span className="text-sm text-emerald-600">{formatCurrency(9150)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Investing Activities</h4>
                {[
                  { name: 'Equipment Purchase', amount: -3500 },
                ].map((item) => (
                  <div key={item.name} className="flex justify-between py-1.5 px-2">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-2 border-t border-slate-200 font-semibold">
                  <span className="text-sm text-slate-900">Net Cash from Investing</span>
                  <span className="text-sm text-red-600">{formatCurrency(-3500)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Financing Activities</h4>
                {[
                  { name: 'Loan Payment', amount: -2000 },
                ].map((item) => (
                  <div key={item.name} className="flex justify-between py-1.5 px-2">
                    <span className="text-sm text-slate-700">{item.name}</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-2 border-t border-slate-200 font-semibold">
                  <span className="text-sm text-slate-900">Net Cash from Financing</span>
                  <span className="text-sm text-red-600">{formatCurrency(-2000)}</span>
                </div>
              </div>

              <div className="flex justify-between py-3 px-2 border-t-2 border-slate-900 font-bold">
                <span className="text-base">Net Change in Cash</span>
                <span className="text-base text-emerald-700">{formatCurrency(3650)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'trial_balance' && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Trial Balance</h3>
            <p className="text-xs text-slate-400">As of July 31, 2024</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Account</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const isDebit = ['asset', 'expense'].includes(acc.type);
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-sm font-mono text-slate-600">{acc.code}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-900">{acc.name}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-right text-slate-900">
                        {isDebit && acc.balance > 0 ? formatCurrency(Math.abs(acc.balance)) : ''}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-right text-slate-900">
                        {!isDebit || acc.balance < 0 ? formatCurrency(Math.abs(acc.balance)) : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3" colSpan={2}>
                    <span className="text-sm text-slate-900">Total</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-900">
                    {formatCurrency(accounts.filter(a => ['asset', 'expense'].includes(a.type) && a.balance > 0).reduce((s, a) => s + Math.abs(a.balance), 0))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-900">
                    {formatCurrency(accounts.filter(a => !['asset', 'expense'].includes(a.type) || a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'ar_aging' && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Accounts Receivable Aging</h3>
            <p className="text-xs text-slate-400">Outstanding invoices by age</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Current</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">1-30 Days</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">31-60 Days</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">60+ Days</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">TechStart Inc.</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(5425)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(5425)}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">Global Solutions Ltd.</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(12600)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(12600)}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">Sunrise Marketing</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right text-amber-600">{formatCurrency(3255)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-amber-600">{formatCurrency(3255)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-sm">Total</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(18025)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(3255)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(21280)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'ap_aging' && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Accounts Payable Aging</h3>
            <p className="text-xs text-slate-400">Outstanding bills by age</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Current</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">1-30 Days</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">31-60 Days</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">60+ Days</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">Office Depot</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(813.75)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(813.75)}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">LegalEase Partners</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(5200)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(5200)}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">InsureAll Corp.</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(4000)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-red-600">{formatCurrency(4000)}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">CloudHost Pro</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(950)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(950)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-sm">Total</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(6963.75)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(4000)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(10963.75)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
