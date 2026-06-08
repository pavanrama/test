'use client';

import { useState } from 'react';
import { ArrowLeftRight, Plus, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { transactions, accounts, formatCurrency, formatDate } from '@/lib/data';
import type { Transaction } from '@/lib/types';

export default function JournalEntriesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newEntryRows, setNewEntryRows] = useState([
    { account: '', debit: '', credit: '', desc: '' },
    { account: '', debit: '', credit: '', desc: '' },
  ]);

  const totalDebits = transactions
    .filter(t => t.status === 'posted')
    .reduce((s, t) => s + t.entries.reduce((es, e) => es + e.debit, 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Journal Entries"
        description="Record and manage manual journal entries"
        icon={ArrowLeftRight}
        actionLabel="New Entry"
        onAction={() => setShowCreate(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Entries</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Debits</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalDebits)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Posted</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{transactions.filter(t => t.status === 'posted').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">General Ledger</h3>
          <p className="text-xs text-slate-400">All journal entries and transactions</p>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.map((txn) => {
            const isExpanded = expandedId === txn.id;
            const totalDebit = txn.entries.reduce((s, e) => s + e.debit, 0);
            const totalCredit = txn.entries.reduce((s, e) => s + e.credit, 0);

            return (
              <div key={txn.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-medium text-slate-900">{txn.description}</p>
                      <StatusBadge status={txn.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(txn.date)} · Ref: {txn.reference} · {txn.entries.length} lines
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(totalDebit)}</p>
                    <p className="text-xs text-slate-400">balanced</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 animate-slide-in">
                    <table className="w-full ml-8">
                      <thead>
                        <tr className="text-xs text-slate-500">
                          <th className="py-2 text-left font-semibold">Account</th>
                          <th className="py-2 text-left font-semibold">Description</th>
                          <th className="py-2 text-right font-semibold">Debit</th>
                          <th className="py-2 text-right font-semibold">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {txn.entries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="py-2 text-sm font-medium text-slate-700">{entry.accountName}</td>
                            <td className="py-2 text-sm text-slate-500">{entry.description}</td>
                            <td className="py-2 text-sm font-medium text-right">
                              {entry.debit > 0 ? formatCurrency(entry.debit) : ''}
                            </td>
                            <td className="py-2 text-sm font-medium text-right">
                              {entry.credit > 0 ? formatCurrency(entry.credit) : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200 font-semibold">
                          <td colSpan={2} className="py-2 text-xs text-slate-500">Total</td>
                          <td className="py-2 text-sm text-right text-slate-900">{formatCurrency(totalDebit)}</td>
                          <td className="py-2 text-sm text-right text-slate-900">{formatCurrency(totalCredit)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">New Journal Entry</h2>
              <p className="text-sm text-slate-500">Debits must equal credits</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
                  <input type="text" placeholder="e.g., ADJ-002" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input type="text" placeholder="What is this entry for?" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Account</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Description</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 w-32">Debit</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 w-32">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newEntryRows.map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">
                          <select className="w-full text-sm border-0 focus:outline-none bg-transparent">
                            <option value="">Select account...</option>
                            {accounts.map(a => (
                              <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="text" placeholder="Line description" className="w-full text-sm border-0 focus:outline-none" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" placeholder="0.00" className="w-full text-sm text-right border-0 focus:outline-none" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" placeholder="0.00" className="w-full text-sm text-right border-0 focus:outline-none" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50">
                      <td colSpan={2} className="px-3 py-2">
                        <button
                          onClick={() => setNewEntryRows([...newEntryRows, { account: '', debit: '', credit: '', desc: '' }])}
                          className="text-xs text-blue-600 font-medium hover:text-blue-700"
                        >
                          + Add Line
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-semibold text-slate-900">$0.00</td>
                      <td className="px-3 py-2 text-right text-sm font-semibold text-slate-900">$0.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button className="px-4 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">Save as Draft</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Post Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
