'use client';

import { useState } from 'react';
import {
  BookOpen, Plus, ChevronRight, ChevronDown, Edit2, ToggleLeft,
  ToggleRight, DollarSign, TrendingUp, TrendingDown, Wallet, PiggyBank
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '@/components/PageHeader';
import { accounts, formatCurrency } from '@/lib/data';
import type { Account } from '@/lib/types';

const typeConfig: Record<string, { label: string; icon: typeof DollarSign; color: string; bg: string }> = {
  asset: { label: 'Assets', icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
  liability: { label: 'Liabilities', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
  equity: { label: 'Equity', icon: PiggyBank, color: 'text-purple-600', bg: 'bg-purple-50' },
  revenue: { label: 'Revenue', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  expense: { label: 'Expenses', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
};

export default function ChartOfAccounts() {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['asset', 'liability', 'equity', 'revenue', 'expense']));
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const toggleType = (type: string) => {
    const next = new Set(expandedTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setExpandedTypes(next);
  };

  const groupedAccounts = accounts.reduce<Record<string, Account[]>>((acc, account) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {});

  const filteredTypes = filterType === 'all'
    ? Object.keys(groupedAccounts)
    : [filterType];

  const totalAssets = accounts.filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.balance, 0);
  const totalEquity = accounts.filter(a => a.type === 'equity').reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Chart of Accounts"
        description="Manage your financial accounts structure"
        icon={BookOpen}
        actionLabel="Add Account"
        onAction={() => setShowAddModal(true)}
      >
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expenses</option>
        </select>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Assets</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalAssets)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Liabilities</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalLiabilities)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Equity</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{formatCurrency(totalEquity)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTypes.map((type) => {
          const config = typeConfig[type];
          const accts = groupedAccounts[type] || [];
          const isExpanded = expandedTypes.has(type);
          const typeTotal = accts.reduce((s, a) => s + a.balance, 0);

          return (
            <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <div className={clsx('p-2 rounded-lg', config.bg)}>
                    <config.icon className={clsx('w-4 h-4', config.color)} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-slate-900">{config.label}</h3>
                    <p className="text-xs text-slate-400">{accts.length} accounts</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(typeTotal)}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/70">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Code</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Account Name</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Sub-type</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Balance</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {accts.map((account) => (
                        <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-slate-600">{account.code}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900">{account.name}</p>
                            <p className="text-xs text-slate-400">{account.description}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{account.subType}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-right">
                            <span className={account.balance < 0 ? 'text-red-600' : 'text-slate-900'}>
                              {formatCurrency(account.balance)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {account.isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <ToggleRight className="w-4 h-4" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                <ToggleLeft className="w-4 h-4" /> Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            </button>
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-slide-in">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Account</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Code</label>
                  <input type="text" placeholder="e.g., 1050" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                <input type="text" placeholder="e.g., Business Savings" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea placeholder="Optional description..." rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Account</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
