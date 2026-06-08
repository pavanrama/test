'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, CURRENCIES } from '@/lib/utils';
import type { Account } from '@/lib/types';
import {
  Landmark, TrendingUp, TrendingDown, Scale, DollarSign, Receipt,
  Plus, ChevronDown, ChevronRight, Edit2, Trash2, ToggleLeft, ToggleRight,
  X, Filter, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

type AccountType = Account['type'];
type FilterType = 'all' | AccountType;

const ACCOUNT_TYPES: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];

const TYPE_META: Record<AccountType, { label: string; icon: typeof Landmark; iconBg: string; iconColor: string }> = {
  asset:     { label: 'Assets',      icon: TrendingUp,   iconBg: 'bg-blue-50',    iconColor: 'text-blue-600' },
  liability: { label: 'Liabilities', icon: TrendingDown,  iconBg: 'bg-red-50',     iconColor: 'text-red-600' },
  equity:    { label: 'Equity',      icon: Scale,         iconBg: 'bg-violet-50',  iconColor: 'text-violet-600' },
  revenue:   { label: 'Revenue',     icon: DollarSign,    iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  expense:   { label: 'Expense',     icon: Receipt,       iconBg: 'bg-amber-50',   iconColor: 'text-amber-600' },
};

const EMPTY_FORM = {
  code: '',
  name: '',
  type: 'asset' as AccountType,
  subType: '',
  description: '',
  balance: 0,
  currency: 'USD',
  isActive: true,
};

export default function AccountsPage() {
  const { myAccounts, addAccount, updateAccount, deleteAccount, auth } = useApp();
  const accounts = myAccounts();

  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState<Record<AccountType, boolean>>({
    asset: true, liability: true, equity: true, revenue: true, expense: true,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Account | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ name: '', subType: '', description: '' });

  const defaultCurrency = auth.company?.baseCurrency || 'USD';

  const filtered = useMemo(() => {
    if (filter === 'all') return accounts;
    return accounts.filter(a => a.type === filter);
  }, [accounts, filter]);

  const grouped = useMemo(() => {
    const groups: Record<AccountType, Account[]> = {
      asset: [], liability: [], equity: [], revenue: [], expense: [],
    };
    for (const a of filtered) {
      groups[a.type].push(a);
    }
    for (const t of ACCOUNT_TYPES) {
      groups[t].sort((a, b) => a.code.localeCompare(b.code));
    }
    return groups;
  }, [filtered]);

  const totals = useMemo(() => {
    const t = { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 };
    for (const a of accounts) {
      t[a.type] += a.balance;
    }
    return t;
  }, [accounts]);

  function toggleSection(type: AccountType) {
    setExpanded(prev => ({ ...prev, [type]: !prev[type] }));
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM, currency: defaultCurrency });
    setShowAddModal(true);
  }

  function handleAdd() {
    if (!form.name.trim() || !form.code.trim()) return;
    addAccount(form);
    setShowAddModal(false);
  }

  function openEdit(a: Account) {
    setEditTarget(a);
    setEditForm({ name: a.name, subType: a.subType, description: a.description });
  }

  function handleSaveEdit() {
    if (!editTarget || !editForm.name.trim()) return;
    updateAccount(editTarget.id, editForm);
    setEditTarget(null);
  }

  function handleToggleActive(a: Account) {
    updateAccount(a.id, { isActive: !a.isActive });
  }

  function openDelete(a: Account) {
    setDeleteTarget(a);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteAccount(deleteTarget.id);
    setDeleteTarget(null);
  }

  function openAdjust(a: Account) {
    setAdjustTarget(a);
    setAdjustValue(String(a.balance));
  }

  function handleAdjust() {
    if (!adjustTarget) return;
    const val = parseFloat(adjustValue);
    if (isNaN(val)) return;
    updateAccount(adjustTarget.id, { balance: val });
    setAdjustTarget(null);
  }

  const summaryCards = [
    { title: 'Total Assets',      value: totals.asset,     icon: TYPE_META.asset.icon,     iconBg: TYPE_META.asset.iconBg,     iconColor: TYPE_META.asset.iconColor },
    { title: 'Total Liabilities', value: totals.liability, icon: TYPE_META.liability.icon, iconBg: TYPE_META.liability.iconBg, iconColor: TYPE_META.liability.iconColor },
    { title: 'Total Equity',      value: totals.equity,    icon: TYPE_META.equity.icon,    iconBg: TYPE_META.equity.iconBg,    iconColor: TYPE_META.equity.iconColor },
  ];

  const visibleTypes = filter === 'all' ? ACCOUNT_TYPES : [filter as AccountType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chart of Accounts</h1>
          <p className="text-sm text-slate-500">Manage your general ledger accounts</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatCurrency(card.value, defaultCurrency)}
                  </p>
                </div>
                <div className={clsx('p-2.5 rounded-xl', card.iconBg)}>
                  <Icon className={clsx('w-5 h-5', card.iconColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as FilterType)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          {ACCOUNT_TYPES.map(t => (
            <option key={t} value={t}>{TYPE_META[t].label}</option>
          ))}
        </select>
        <span className="text-sm text-slate-400">
          {filtered.length} account{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grouped Sections */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-12 text-center">
          <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">
            {accounts.length === 0 ? 'No accounts yet' : 'No accounts match this filter'}
          </p>
          {accounts.length === 0 && (
            <button onClick={openAdd} className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700">
              Add your first account
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleTypes.map(type => {
            const group = grouped[type];
            if (group.length === 0) return null;
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            const isOpen = expanded[type];
            const groupTotal = group.reduce((s, a) => s + a.balance, 0);

            return (
              <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Group Header */}
                <button
                  onClick={() => toggleSection(type)}
                  className="w-full px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />
                  }
                  <div className={clsx('p-2 rounded-lg', meta.iconBg)}>
                    <Icon className={clsx('w-4 h-4', meta.iconColor)} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{meta.label}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {group.length}
                  </span>
                  <span className="ml-auto text-sm font-semibold text-slate-700">
                    {formatCurrency(groupTotal, defaultCurrency)}
                  </span>
                </button>

                {/* Table */}
                {isOpen && (
                  <div className="border-t border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="text-left px-5 py-2.5 font-medium">Code</th>
                          <th className="text-left px-5 py-2.5 font-medium">Name</th>
                          <th className="text-left px-5 py-2.5 font-medium">Sub-type</th>
                          <th className="text-right px-5 py-2.5 font-medium">Balance</th>
                          <th className="text-center px-5 py-2.5 font-medium">Status</th>
                          <th className="text-right px-5 py-2.5 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.map(a => (
                          <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{a.code}</td>
                            <td className="px-5 py-3">
                              <p className="font-medium text-slate-900">{a.name}</p>
                              {a.description && (
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">{a.description}</p>
                              )}
                            </td>
                            <td className="px-5 py-3 text-slate-600">{a.subType}</td>
                            <td className="px-5 py-3 text-right font-medium text-slate-900">
                              <button
                                onClick={() => openAdjust(a)}
                                className="hover:text-blue-600 hover:underline transition-colors"
                                title="Adjust balance"
                              >
                                {formatCurrency(a.balance, a.currency)}
                              </button>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={clsx(
                                'text-xs font-medium px-2 py-0.5 rounded-full',
                                a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                              )}>
                                {a.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEdit(a)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(a)}
                                  className={clsx(
                                    'p-1.5 rounded-lg transition-colors',
                                    a.isActive
                                      ? 'text-emerald-500 hover:text-amber-600 hover:bg-amber-50'
                                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50',
                                  )}
                                  title={a.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {a.isActive
                                    ? <ToggleRight className="w-3.5 h-3.5" />
                                    : <ToggleLeft className="w-3.5 h-3.5" />
                                  }
                                </button>
                                <button
                                  onClick={() => openAdjust(a)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Adjust balance"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openDelete(a)}
                                  className={clsx(
                                    'p-1.5 rounded-lg transition-colors',
                                    a.balance === 0
                                      ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                      : 'text-slate-200 cursor-not-allowed',
                                  )}
                                  disabled={a.balance !== 0}
                                  title={a.balance !== 0 ? 'Cannot delete: balance is not zero' : 'Delete'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Add Account Modal ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-semibold text-slate-900">Add Account</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Account Code *</label>
                  <input
                    value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="e.g. 1000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Account Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Cash"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value as AccountType }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t} value={t}>{TYPE_META[t].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Sub-type</label>
                  <input
                    value={form.subType}
                    onChange={e => setForm(p => ({ ...p, subType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Current Asset"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Optional description..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={e => setForm(p => ({ ...p, balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.name.trim() || !form.code.trim()}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  form.name.trim() && form.code.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                )}
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit Account Modal ===== */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setEditTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-semibold text-slate-900">Edit Account</h2>
              <button onClick={() => setEditTarget(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sub-type</label>
                <input
                  value={editForm.subType}
                  onChange={e => setEditForm(p => ({ ...p, subType: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editForm.name.trim()}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  editForm.name.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                )}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Adjust Balance Modal ===== */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setAdjustTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-semibold text-slate-900">Adjust Balance</h2>
              <button onClick={() => setAdjustTarget(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Account</p>
                <p className="text-sm font-semibold text-slate-900">{adjustTarget.code} — {adjustTarget.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current balance: {formatCurrency(adjustTarget.balance, adjustTarget.currency)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">New Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustValue}
                  onChange={e => setAdjustValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setAdjustTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjustValue === '' || isNaN(parseFloat(adjustValue))}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  adjustValue !== '' && !isNaN(parseFloat(adjustValue))
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                )}
              >
                Update Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation ===== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Account</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            {deleteTarget.balance !== 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-amber-800">
                  Cannot delete <span className="font-semibold">{deleteTarget.name}</span> because it has a non-zero balance of{' '}
                  {formatCurrency(deleteTarget.balance, deleteTarget.currency)}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-900">{deleteTarget.code} — {deleteTarget.name}</span>?
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              {deleteTarget.balance === 0 && (
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
