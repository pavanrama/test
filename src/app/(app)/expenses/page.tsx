'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate, todayISO, statusColor } from '@/lib/utils';
import type { Expense } from '@/lib/types';
import clsx from 'clsx';
import {
  Plus, X, DollarSign, Clock, CheckCircle, Tag,
  Trash2, ShieldCheck, ShieldX, CreditCard, Search,
} from 'lucide-react';

const CATEGORIES = [
  'Technology', 'Marketing', 'Software', 'Meals & Entertainment',
  'Travel', 'Office Supplies', 'Rent', 'Utilities',
  'Insurance', 'Professional Services', 'Other',
] as const;

const PAYMENT_METHODS = [
  'Credit Card', 'Bank Transfer', 'Cash', 'Auto-debit',
] as const;

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const emptyForm = {
  date: todayISO(),
  amount: '',
  vendor: '',
  category: CATEGORIES[0] as string,
  paymentMethod: PAYMENT_METHODS[0] as string,
  description: '',
  taxAmount: '',
};

export default function ExpensesPage() {
  const { myExpenses, addExpense, updateExpense, deleteExpense, auth } = useApp();
  const expenses = myExpenses();
  const currency = auth.company?.baseCurrency || 'USD';

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    let list = expenses;
    if (filter !== 'all') list = list.filter(e => e.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.vendor.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filter, search]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const approvedCount = expenses.filter(e => e.status === 'approved').length;
  const uniqueCategories = new Set(expenses.map(e => e.category));

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const maxCategoryAmount = categoryBreakdown.length
    ? Math.max(...categoryBreakdown.map(([, v]) => v))
    : 0;

  const kpis = [
    { title: 'Total Expenses', value: formatCurrency(totalExpenses, currency), icon: DollarSign, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { title: 'Pending', value: String(pendingCount), icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { title: 'Approved', value: String(approvedCount), icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { title: 'Categories', value: String(uniqueCategories.size), icon: Tag, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  ];

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  function openModal() {
    setForm(emptyForm);
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    const taxAmount = parseFloat(form.taxAmount) || 0;
    if (!form.vendor.trim() || !form.date || isNaN(amount) || amount <= 0) return;
    addExpense({
      date: form.date,
      vendor: form.vendor.trim(),
      category: form.category,
      description: form.description.trim(),
      amount,
      taxAmount,
      paymentMethod: form.paymentMethod,
      status: 'pending',
      currency,
    });
    setShowModal(false);
  }

  function handleApprove(id: string) {
    updateExpense(id, { status: 'approved' });
  }

  function handleReject(id: string) {
    updateExpense(id, { status: 'rejected' });
  }

  function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500">Track and manage company expenses</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* KPI Cards */}
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

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryBreakdown.map(([cat, total]) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700 truncate">{cat}</span>
                    <span className="text-xs font-semibold text-slate-900 ml-2 shrink-0">
                      {formatCurrency(total, currency)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-slate-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${maxCategoryAmount > 0 ? (total / maxCategoryAmount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex bg-slate-100 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={clsx(
                'px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                filter === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Description</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Payment</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Amount</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    {expenses.length === 0
                      ? 'No expenses yet. Click "Add Expense" to get started.'
                      : 'No expenses match the current filter.'}
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{exp.vendor}</td>
                    <td className="px-4 py-3 text-slate-600">{exp.category}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate hidden lg:table-cell">{exp.description || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(exp.amount, exp.currency)}
                      {exp.taxAmount > 0 && (
                        <span className="block text-xs font-normal text-slate-400">
                          +{formatCurrency(exp.taxAmount, exp.currency)} tax
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={clsx('inline-block text-xs font-medium capitalize px-2.5 py-1 rounded-full', statusColor(exp.status))}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {exp.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(exp.id)}
                              title="Approve"
                              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(exp.id)}
                              title="Reject"
                              className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <ShieldX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(exp.id)}
                          title="Delete"
                          className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {filtered.length} of {expenses.length} expenses</span>
            <span className="font-medium text-slate-700">
              Total: {formatCurrency(filtered.reduce((s, e) => s + e.amount, 0), currency)}
            </span>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Amount</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services"
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the expense..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Tax Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.taxAmount}
                  onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
