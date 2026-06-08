'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate, todayISO, uid } from '@/lib/utils';
import type { JournalEntry, JournalLine, Account } from '@/lib/types';
import {
  Plus, Trash2, X, ChevronDown, ChevronRight,
  BookOpen, CheckCircle, Ban, Search, FileText,
  DollarSign, Hash,
} from 'lucide-react';
import clsx from 'clsx';

type FilterTab = 'all' | 'draft' | 'posted' | 'void';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  posted: 'bg-emerald-100 text-emerald-700',
  void: 'bg-red-100 text-red-500',
};

function emptyLine(): JournalLine {
  return { id: uid(), accountId: '', accountName: '', debit: 0, credit: 0, description: '' };
}

export default function JournalEntriesPage() {
  const {
    myJournalEntries, myAccounts,
    addJournalEntry, updateJournalEntry, deleteJournalEntry,
    auth,
  } = useApp();

  const entries = myJournalEntries();
  const accounts = myAccounts().filter((a: Account) => a.isActive);
  const currency = auth.company?.baseCurrency || 'USD';

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const totalDebitsPosted = entries
    .filter((e: JournalEntry) => e.status === 'posted')
    .reduce((sum: number, e: JournalEntry) => sum + e.lines.reduce((s: number, l: JournalLine) => s + l.debit, 0), 0);
  const postedCount = entries.filter((e: JournalEntry) => e.status === 'posted').length;

  const kpis = [
    { title: 'Total Entries', value: String(entries.length), icon: Hash, iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    { title: 'Total Debits Posted', value: formatCurrency(totalDebitsPosted, currency), icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { title: 'Posted', value: String(postedCount), icon: CheckCircle, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  ];

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (activeTab !== 'all') list = list.filter((e: JournalEntry) => e.status === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e: JournalEntry) =>
          e.description.toLowerCase().includes(q) ||
          e.reference.toLowerCase().includes(q),
      );
    }
    return list.sort((a: JournalEntry, b: JournalEntry) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, activeTab, searchQuery]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: entries.length },
    { key: 'draft', label: 'Draft', count: entries.filter((e: JournalEntry) => e.status === 'draft').length },
    { key: 'posted', label: 'Posted', count: entries.filter((e: JournalEntry) => e.status === 'posted').length },
    { key: 'void', label: 'Void', count: entries.filter((e: JournalEntry) => e.status === 'void').length },
  ];

  function handlePost(id: string) {
    updateJournalEntry(id, { status: 'posted' });
  }

  function handleVoid(id: string) {
    updateJournalEntry(id, { status: 'void' });
  }

  function handleDelete(id: string) {
    deleteJournalEntry(id);
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Journal Entries</h1>
          <p className="text-sm text-slate-500">Record and manage double-entry journal transactions.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Journal Entry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Tabs + Search */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                  activeTab === t.key
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                {t.label}
                <span className={clsx(
                  'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500',
                )}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        {filteredEntries.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No journal entries found</p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab !== 'all' ? 'Try a different filter or ' : ''}Create a new entry to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-10" />
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Date</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Description</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Reference</th>
                  <th className="text-center font-medium text-slate-500 px-4 py-3">Lines</th>
                  <th className="text-right font-medium text-slate-500 px-4 py-3">Total Debit</th>
                  <th className="text-center font-medium text-slate-500 px-4 py-3">Status</th>
                  <th className="text-right font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEntries.map((entry: JournalEntry) => {
                  const totalDebit = entry.lines.reduce((s: number, l: JournalLine) => s + l.debit, 0);
                  const isExpanded = expandedId === entry.id;
                  return (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      totalDebit={totalDebit}
                      currency={currency}
                      isExpanded={isExpanded}
                      onToggle={() => toggleExpand(entry.id)}
                      onPost={() => handlePost(entry.id)}
                      onVoid={() => handleVoid(entry.id)}
                      onDelete={() => setDeleteConfirmId(entry.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Delete Journal Entry</h3>
            <p className="text-sm text-slate-500 mb-5">
              Are you sure you want to delete this draft entry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Journal Entry Modal */}
      {showCreateModal && (
        <CreateJournalEntryModal
          accounts={accounts}
          currency={currency}
          onSave={(data, status) => {
            addJournalEntry({ ...data, status });
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

/* ========== Expandable Entry Row ========== */

function EntryRow({
  entry,
  totalDebit,
  currency,
  isExpanded,
  onToggle,
  onPost,
  onVoid,
  onDelete,
}: {
  entry: JournalEntry;
  totalDebit: number;
  currency: string;
  isExpanded: boolean;
  onToggle: () => void;
  onPost: () => void;
  onVoid: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr
        className={clsx('hover:bg-slate-50 transition-colors cursor-pointer', isExpanded && 'bg-slate-50')}
        onClick={onToggle}
      >
        <td className="pl-4 py-3">
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </td>
        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(entry.date)}</td>
        <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">{entry.description || '—'}</td>
        <td className="px-4 py-3 text-slate-500">{entry.reference || '—'}</td>
        <td className="px-4 py-3 text-center text-slate-500">{entry.lines.length}</td>
        <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(totalDebit, currency)}</td>
        <td className="px-4 py-3 text-center">
          <span className={clsx('text-xs font-medium capitalize px-2.5 py-1 rounded-full', STATUS_COLORS[entry.status] || 'bg-slate-100 text-slate-600')}>
            {entry.status}
          </span>
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {entry.status === 'draft' && (
              <button
                onClick={onPost}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Post Entry"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            {entry.status === 'posted' && (
              <button
                onClick={onVoid}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Void Entry"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
            {entry.status === 'draft' && (
              <button
                onClick={onDelete}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="px-4 pb-4 pt-0 bg-slate-50">
            <div className="ml-8 border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left font-medium text-slate-500 px-4 py-2">Account</th>
                    <th className="text-left font-medium text-slate-500 px-4 py-2">Description</th>
                    <th className="text-right font-medium text-slate-500 px-4 py-2 w-32">Debit</th>
                    <th className="text-right font-medium text-slate-500 px-4 py-2 w-32">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entry.lines.map((line: JournalLine) => (
                    <tr key={line.id}>
                      <td className="px-4 py-2 font-medium text-slate-800">{line.accountName}</td>
                      <td className="px-4 py-2 text-slate-500">{line.description || '—'}</td>
                      <td className="px-4 py-2 text-right text-slate-900">
                        {line.debit > 0 ? formatCurrency(line.debit, currency) : ''}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-900">
                        {line.credit > 0 ? formatCurrency(line.credit, currency) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={2} className="px-4 py-2 text-right font-semibold text-slate-700">Totals</td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900">
                      {formatCurrency(entry.lines.reduce((s: number, l: JournalLine) => s + l.debit, 0), currency)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900">
                      {formatCurrency(entry.lines.reduce((s: number, l: JournalLine) => s + l.credit, 0), currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ========== Create Journal Entry Modal ========== */

function CreateJournalEntryModal({
  accounts,
  currency,
  onSave,
  onClose,
}: {
  accounts: Account[];
  currency: string;
  onSave: (data: Omit<JournalEntry, 'id' | 'companyId' | 'createdAt' | 'status'>, status: JournalEntry['status']) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);

  const totalDebits = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredits = lines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = totalDebits > 0 && Math.abs(totalDebits - totalCredits) < 0.005;
  const hasValidLines = lines.some(l => l.accountId && (l.debit > 0 || l.credit > 0));
  const isValid = isBalanced && hasValidLines && description.trim().length > 0;

  function updateLine(index: number, field: keyof JournalLine, value: string | number) {
    setLines(prev => {
      const next = [...prev];
      const line = { ...next[index] };

      if (field === 'accountId') {
        const acct = accounts.find(a => a.id === value);
        line.accountId = value as string;
        line.accountName = acct?.name || '';
      } else if (field === 'description') {
        line.description = value as string;
      } else if (field === 'debit') {
        line.debit = Math.max(0, Number(value) || 0);
        if (line.debit > 0) line.credit = 0;
      } else if (field === 'credit') {
        line.credit = Math.max(0, Number(value) || 0);
        if (line.credit > 0) line.debit = 0;
      }

      next[index] = line;
      return next;
    });
  }

  function addLine() {
    setLines(prev => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    if (lines.length <= 2) return;
    setLines(prev => prev.filter((_, i) => i !== index));
  }

  function buildData(): Omit<JournalEntry, 'id' | 'companyId' | 'createdAt' | 'status'> {
    return {
      date,
      reference,
      description,
      lines: lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0)),
    };
  }

  const diff = totalDebits - totalCredits;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-6 overflow-y-auto pb-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Create Journal Entry</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Header Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. JE-001"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Entry description"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Lines Table */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Journal Lines</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left font-medium text-slate-500 px-3 py-2">Account *</th>
                    <th className="text-left font-medium text-slate-500 px-3 py-2">Description</th>
                    <th className="text-right font-medium text-slate-500 px-3 py-2 w-28">Debit</th>
                    <th className="text-right font-medium text-slate-500 px-3 py-2 w-28">Credit</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, index) => (
                    <tr key={line.id}>
                      <td className="px-3 py-2">
                        <div className="relative">
                          <select
                            value={line.accountId}
                            onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select account</option>
                            {accounts.map((a: Account) => (
                              <option key={a.id} value={a.id}>
                                {a.code} — {a.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="Line description"
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit || ''}
                          onChange={(e) => updateLine(index, 'debit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 text-sm text-right border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit || ''}
                          onChange={(e) => updateLine(index, 'credit', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 text-sm text-right border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeLine(index)}
                          disabled={lines.length <= 2}
                          className={clsx(
                            'p-1 rounded transition-colors',
                            lines.length <= 2
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50',
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={2} className="px-3 py-2 text-right font-semibold text-slate-700">Totals</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900">{formatCurrency(totalDebits, currency)}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900">{formatCurrency(totalCredits, currency)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-between mt-2">
              <button
                onClick={addLine}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Line
              </button>
              {totalDebits > 0 || totalCredits > 0 ? (
                <span className={clsx(
                  'text-xs font-medium px-2.5 py-1 rounded-full',
                  isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
                )}>
                  {isBalanced
                    ? 'Balanced'
                    : `Off by ${formatCurrency(Math.abs(diff), currency)} (${diff > 0 ? 'debits exceed' : 'credits exceed'})`}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => isValid && onSave(buildData(), 'draft')}
            disabled={!isValid}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
              isValid
                ? 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                : 'text-slate-400 bg-slate-100 cursor-not-allowed',
            )}
          >
            Save as Draft
          </button>
          <button
            onClick={() => isValid && onSave(buildData(), 'posted')}
            disabled={!isValid}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
              isValid
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-white bg-blue-300 cursor-not-allowed',
            )}
          >
            Post Entry
          </button>
        </div>
      </div>
    </div>
  );
}
