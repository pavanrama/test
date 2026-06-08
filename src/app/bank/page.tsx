'use client';

import { useState } from 'react';
import {
  Building2, Link, CheckCircle2, XCircle, ArrowRightLeft,
  RefreshCw, Check, X, AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '@/components/PageHeader';
import { bankAccounts, bankTransactions, formatCurrency, formatDate } from '@/lib/data';
import type { BankTransaction } from '@/lib/types';

export default function BankReconciliationPage() {
  const [selectedAccount, setSelectedAccount] = useState(bankAccounts[0].id);
  const [reconcilingTxns, setReconcilingTxns] = useState<Set<string>>(new Set());

  const accountTxns = bankTransactions.filter(t => t.bankAccountId === selectedAccount);
  const unreconciledTxns = accountTxns.filter(t => !t.isReconciled);
  const reconciledTxns = accountTxns.filter(t => t.isReconciled);
  const currentAccount = bankAccounts.find(a => a.id === selectedAccount)!;

  const toggleReconcile = (id: string) => {
    const next = new Set(reconcilingTxns);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReconcilingTxns(next);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bank & Reconciliation"
        description="Connect accounts and reconcile transactions"
        icon={Building2}
        actionLabel="Connect Bank"
        onAction={() => {}}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {bankAccounts.map((account) => (
          <button
            key={account.id}
            onClick={() => setSelectedAccount(account.id)}
            className={clsx(
              'bg-white rounded-xl border-2 p-4 text-left transition-all',
              selectedAccount === account.id
                ? 'border-blue-500 shadow-md shadow-blue-500/10'
                : 'border-slate-200 hover:border-slate-300'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">{account.bankName}</span>
              </div>
              {account.isConnected ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <Link className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <XCircle className="w-3 h-3" /> Disconnected
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-900">{account.name}</p>
            <p className="text-xs text-slate-400">{account.accountNumber}</p>
            <p className={clsx(
              'text-xl font-bold mt-2',
              account.balance >= 0 ? 'text-slate-900' : 'text-red-600'
            )}>
              {formatCurrency(account.balance)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Last reconciled: {formatDate(account.lastReconciled)}</p>
          </button>
        ))}
      </div>

      {unreconciledTxns.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              {unreconciledTxns.length} unreconciled transaction{unreconciledTxns.length > 1 ? 's' : ''} for {currentAccount.name}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Unreconciled Transactions</h3>
              <p className="text-xs text-slate-400">{unreconciledTxns.length} transactions to review</p>
            </div>
            {reconcilingTxns.size > 0 && (
              <button className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Reconcile ({reconcilingTxns.size})
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {unreconciledTxns.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">All transactions reconciled!</p>
              </div>
            ) : (
              unreconciledTxns.map((txn) => (
                <div
                  key={txn.id}
                  className={clsx(
                    'p-4 flex items-center gap-3 transition-colors cursor-pointer',
                    reconcilingTxns.has(txn.id) ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  )}
                  onClick={() => toggleReconcile(txn.id)}
                >
                  <div className={clsx(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                    reconcilingTxns.has(txn.id)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-300'
                  )}>
                    {reconcilingTxns.has(txn.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{txn.description}</p>
                    <p className="text-xs text-slate-400">{formatDate(txn.date)} · {txn.category}</p>
                  </div>
                  <span className={clsx(
                    'text-sm font-semibold flex-shrink-0',
                    txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                  )}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Reconciled Transactions</h3>
            <p className="text-xs text-slate-400">{reconciledTxns.length} matched transactions</p>
          </div>
          <div className="divide-y divide-slate-100">
            {reconciledTxns.map((txn) => (
              <div key={txn.id} className="p-4 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{txn.description}</p>
                  <p className="text-xs text-slate-400">{formatDate(txn.date)} · {txn.category}</p>
                </div>
                <span className={clsx(
                  'text-sm font-semibold flex-shrink-0',
                  txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-700'
                )}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Reconciliation Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">Statement Balance</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(currentAccount.balance)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Reconciled</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(reconciledTxns.reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Unreconciled</p>
            <p className="text-lg font-bold text-amber-600">
              {formatCurrency(unreconciledTxns.reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Difference</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
