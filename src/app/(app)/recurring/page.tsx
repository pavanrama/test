'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatDate, todayISO, statusColor } from '@/lib/utils';
import type { RecurringTransaction } from '@/lib/types';
import clsx from 'clsx';
import {
  Plus, X, Repeat, PlayCircle, Pencil, Trash2,
  FileText, Receipt, CreditCard, BookOpen, Search, Zap,
  CalendarClock, ToggleLeft, ToggleRight,
} from 'lucide-react';

type TransactionType = RecurringTransaction['type'];
type Frequency = RecurringTransaction['frequency'];

const TYPES: { value: TransactionType; label: string }[] = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'bill', label: 'Bill' },
  { value: 'expense', label: 'Expense' },
  { value: 'journal', label: 'Journal' },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const TYPE_ICONS: Record<TransactionType, typeof FileText> = {
  invoice: FileText,
  bill: Receipt,
  expense: CreditCard,
  journal: BookOpen,
};

const TYPE_COLORS: Record<TransactionType, string> = {
  invoice: 'bg-blue-100 text-blue-700',
  bill: 'bg-orange-100 text-orange-700',
  expense: 'bg-violet-100 text-violet-700',
  journal: 'bg-teal-100 text-teal-700',
};

const emptyForm = {
  type: 'invoice' as TransactionType,
  name: '',
  frequency: 'monthly' as Frequency,
  nextDate: todayISO(),
  endDate: '',
  templateData: '{\n  "description": "",\n  "amount": 0\n}',
  isActive: true,
};

function advanceDate(dateStr: string, frequency: Frequency): string {
  const d = new Date(dateStr);
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'annually':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().split('T')[0];
}

export default function RecurringPage() {
  const { myRecurring, addRecurring, updateRecurring, deleteRecurring } = useApp();
  const recurring = myRecurring();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = recurring;
    if (typeFilter !== 'all') list = list.filter(r => r.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  }, [recurring, typeFilter, search]);

  const totalCount = recurring.length;
  const activeCount = recurring.filter(r => r.isActive).length;
  const invoiceCount = recurring.filter(r => r.type === 'invoice').length;
  const billCount = recurring.filter(r => r.type === 'bill').length;
  const expenseCount = recurring.filter(r => r.type === 'expense').length;
  const journalCount = recurring.filter(r => r.type === 'journal').length;

  const kpis = [
    { title: 'Total Recurring', value: String(totalCount), icon: Repeat, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    { title: 'Active', value: String(activeCount), icon: PlayCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { title: 'Invoices', value: String(invoiceCount), icon: FileText, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Bills', value: String(billCount), icon: Receipt, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { title: 'Expenses', value: String(expenseCount), icon: CreditCard, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { title: 'Journals', value: String(journalCount), icon: BookOpen, iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
  ];

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(r: RecurringTransaction) {
    setEditingId(r.id);
    setForm({
      type: r.type,
      name: r.name,
      frequency: r.frequency,
      nextDate: r.nextDate,
      endDate: r.endDate || '',
      templateData: r.templateData,
      isActive: r.isActive,
    });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.nextDate) return;

    const payload = {
      type: form.type,
      name: form.name.trim(),
      frequency: form.frequency,
      nextDate: form.nextDate,
      endDate: form.endDate || undefined,
      templateData: form.templateData,
      isActive: form.isActive,
    };

    if (editingId) {
      updateRecurring(editingId, payload);
    } else {
      addRecurring(payload);
    }
    setShowModal(false);
    setEditingId(null);
  }

  function handleToggle(r: RecurringTransaction) {
    updateRecurring(r.id, { isActive: !r.isActive });
  }

  function handleGenerateNow(r: RecurringTransaction) {
    updateRecurring(r.id, {
      lastGenerated: todayISO(),
      nextDate: advanceDate(r.nextDate, r.frequency),
    });
  }

  function handleDelete(id: string) {
    deleteRecurring(id);
    setDeleteConfirm(null);
  }

  const tabs: { key: TransactionType | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'invoice', label: 'Invoices' },
    { key: 'bill', label: 'Bills' },
    { key: 'expense', label: 'Expenses' },
    { key: 'journal', label: 'Journals' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recurring Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">
            Automate repeating invoices, bills, expenses, and journal entries
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Recurring
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.title} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className={clsx('p-2 rounded-lg', k.iconBg)}>
                  <Icon className={clsx('w-4 h-4', k.iconColor)} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{k.title}</p>
                  <p className="text-lg font-bold text-slate-900">{k.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                typeFilter === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full sm:w-auto sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search recurring..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {totalCount === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-100 rounded-full">
              <CalendarClock className="w-10 h-10 text-slate-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No recurring transactions yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Set up recurring transactions to automate your repeating invoices, bills, expenses, and journal entries.
            Save time by scheduling them on a weekly, monthly, or custom frequency.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Your First Recurring Transaction
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No recurring transactions match your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Frequency</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Next Due</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">End Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Generated</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const TypeIcon = TYPE_ICONS[r.type];
                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', TYPE_COLORS[r.type])}>
                          <TypeIcon className="w-3 h-3" />
                          {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{r.frequency}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(r.nextDate)}</td>
                      <td className="px-4 py-3 text-slate-500">{r.endDate ? formatDate(r.endDate) : '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{r.lastGenerated ? formatDate(r.lastGenerated) : 'Never'}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', statusColor(r.isActive ? 'active' : 'inactive'))}>
                          {r.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggle(r)}
                            title={r.isActive ? 'Pause' : 'Activate'}
                            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                          >
                            {r.isActive
                              ? <ToggleRight className="w-4 h-4 text-emerald-600" />
                              : <ToggleLeft className="w-4 h-4" />
                            }
                          </button>
                          <button
                            onClick={() => handleGenerateNow(r)}
                            title="Generate Now"
                            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-blue-600"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(r)}
                            title="Edit"
                            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {deleteConfirm === r.id ? (
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(r.id)}
                              title="Delete"
                              className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingId(null); }}
                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as TransactionType })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Name / Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name / Description</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Monthly Office Rent"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm({ ...form, frequency: e.target.value as Frequency })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {FREQUENCIES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date (Next Due)</label>
                  <input
                    type="date"
                    value={form.nextDate}
                    onChange={e => setForm({ ...form, nextDate: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              {/* Template Data */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Template Data (JSON)</label>
                <textarea
                  value={form.templateData}
                  onChange={e => setForm({ ...form, templateData: e.target.value })}
                  rows={4}
                  placeholder='{"description": "Monthly rent", "amount": 2500}'
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Store template notes and amount as JSON. Actual transaction generation requires backend processing.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Active</p>
                  <p className="text-xs text-slate-400">Enable to auto-generate on schedule</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={clsx(
                    'relative w-11 h-6 rounded-full transition-colors',
                    form.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      form.isActive && 'translate-x-5'
                    )}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingId(null); }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Create Recurring'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
