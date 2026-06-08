'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils';
import type { BankAccount, BankTransaction } from '@/lib/types';
import clsx from 'clsx';
import {
  Plus, X, Landmark, CreditCard, PiggyBank, CheckSquare,
  Square, ArrowDownLeft, ArrowUpRight, Building2, Hash,
  DollarSign, ListChecks, AlertCircle,
} from 'lucide-react';

const ACCOUNT_TYPES: BankAccount['type'][] = ['checking', 'savings', 'credit_card'];

const CATEGORIES = [
  'Revenue', 'Payroll', 'Rent', 'Utilities',
  'Supplies', 'Marketing', 'Transfer', 'Other',
] as const;

const ACCOUNT_TYPE_LABELS: Record<BankAccount['type'], string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
};

const ACCOUNT_TYPE_ICONS: Record<BankAccount['type'], typeof Landmark> = {
  checking: Landmark,
  savings: PiggyBank,
  credit_card: CreditCard,
};

const emptyAccountForm = {
  name: '',
  accountNumber: '',
  bankName: '',
  type: 'checking' as BankAccount['type'],
  balance: '',
  currency: 'USD',
};

const emptyTxForm = {
  date: todayISO(),
  description: '',
  amount: '',
  type: 'debit' as BankTransaction['type'],
  category: CATEGORIES[0] as string,
};

export default function BankPage() {
  const {
    myBankAccounts, myBankTransactions,
    addBankAccount, updateBankAccount,
    addBankTransaction, updateBankTransaction,
    auth,
  } = useApp();

  const accounts = myBankAccounts();
  const allTransactions = myBankTransactions();
  const currency = auth.company?.baseCurrency || 'USD';

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [txForm, setTxForm] = useState(emptyTxForm);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  const transactions = useMemo(() => {
    if (!selectedAccountId) return [];
    return allTransactions
      .filter(t => t.bankAccountId === selectedAccountId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allTransactions, selectedAccountId]);

  const unreconciled = useMemo(() => transactions.filter(t => !t.isReconciled), [transactions]);
  const reconciled = useMemo(() => transactions.filter(t => t.isReconciled), [transactions]);

  const statementBalance = selectedAccount?.balance ?? 0;
  const reconciledTotal = useMemo(
    () => reconciled.reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0),
    [reconciled],
  );
  const unreconciledTotal = useMemo(
    () => unreconciled.reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0),
    [unreconciled],
  );

  function toggleCheck(id: string) {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllUnreconciled() {
    if (checkedIds.size === unreconciled.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(unreconciled.map(t => t.id)));
    }
  }

  function reconcileSelected() {
    checkedIds.forEach(id => {
      updateBankTransaction(id, { isReconciled: true });
    });
    setCheckedIds(new Set());
  }

  function openAccountModal() {
    setAccountForm(emptyAccountForm);
    setShowAccountModal(true);
  }

  function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    const balance = parseFloat(accountForm.balance) || 0;
    if (!accountForm.name.trim() || !accountForm.bankName.trim()) return;
    addBankAccount({
      name: accountForm.name.trim(),
      accountNumber: accountForm.accountNumber.trim(),
      bankName: accountForm.bankName.trim(),
      type: accountForm.type,
      balance,
      currency: accountForm.currency,
      isConnected: false,
    });
    setShowAccountModal(false);
  }

  function openTxModal() {
    setTxForm({ ...emptyTxForm, date: todayISO() });
    setShowTxModal(true);
  }

  function handleTxSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAccountId) return;
    const amount = parseFloat(txForm.amount);
    if (!txForm.description.trim() || !txForm.date || isNaN(amount) || amount <= 0) return;
    addBankTransaction({
      bankAccountId: selectedAccountId,
      date: txForm.date,
      description: txForm.description.trim(),
      amount,
      type: txForm.type,
      category: txForm.category,
      isReconciled: false,
    });

    const delta = txForm.type === 'credit' ? amount : -amount;
    updateBankAccount(selectedAccountId, { balance: statementBalance + delta });

    setShowTxModal(false);
  }

  const acctCurrency = selectedAccount?.currency || currency;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bank &amp; Reconciliation</h1>
          <p className="text-sm text-slate-500">Manage bank accounts and reconcile transactions</p>
        </div>
        <button
          onClick={openAccountModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Bank Account
        </button>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No bank accounts yet. Click &quot;Add Bank Account&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map(acct => {
            const Icon = ACCOUNT_TYPE_ICONS[acct.type];
            const isSelected = acct.id === selectedAccountId;
            return (
              <button
                key={acct.id}
                onClick={() => {
                  setSelectedAccountId(acct.id);
                  setCheckedIds(new Set());
                }}
                className={clsx(
                  'text-left bg-white rounded-xl border p-5 transition-all hover:shadow-md',
                  isSelected
                    ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md'
                    : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={clsx(
                    'p-2 rounded-lg',
                    isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600',
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={clsx(
                    'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                    acct.type === 'checking' && 'bg-blue-50 text-blue-600',
                    acct.type === 'savings' && 'bg-emerald-50 text-emerald-600',
                    acct.type === 'credit_card' && 'bg-violet-50 text-violet-600',
                  )}>
                    {ACCOUNT_TYPE_LABELS[acct.type]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 truncate">{acct.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{acct.bankName}</p>
                {acct.accountNumber && (
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    ••••{acct.accountNumber}
                  </p>
                )}
                <p className="text-lg font-bold text-slate-900 mt-3">
                  {formatCurrency(acct.balance, acct.currency)}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Transactions Area (only when an account is selected) */}
      {selectedAccount && (
        <>
          {/* Sub-header with account name & add transaction */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {selectedAccount.name}
                <span className="text-slate-400 font-normal ml-2 text-sm">— Transactions</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {checkedIds.size > 0 && (
                <button
                  onClick={reconcileSelected}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <ListChecks className="w-4 h-4" />
                  Reconcile Selected ({checkedIds.size})
                </button>
              )}
              <button
                onClick={openTxModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Statement Balance</p>
                  <p className="text-xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(statementBalance, acctCurrency)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50">
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Reconciled Total</p>
                  <p className="text-xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(reconciledTotal, acctCurrency)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Unreconciled Total</p>
                  <p className="text-xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(unreconciledTotal, acctCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Split view: Unreconciled / Reconciled */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unreconciled */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAllUnreconciled}
                    className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title={checkedIds.size === unreconciled.length ? 'Deselect all' : 'Select all'}
                  >
                    {unreconciled.length > 0 && checkedIds.size === unreconciled.length ? (
                      <CheckSquare className="w-4 h-4 text-slate-700" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <h3 className="text-sm font-semibold text-slate-700">Unreconciled</h3>
                  <span className="text-xs text-slate-400">({unreconciled.length})</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[28rem] overflow-y-auto">
                {unreconciled.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-400">
                    No unreconciled transactions
                  </div>
                ) : (
                  unreconciled.map(tx => (
                    <div
                      key={tx.id}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 transition-colors',
                        checkedIds.has(tx.id) ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50',
                      )}
                    >
                      <button
                        onClick={() => toggleCheck(tx.id)}
                        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {checkedIds.has(tx.id) ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className={clsx(
                        'shrink-0 p-1.5 rounded-lg',
                        tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500',
                      )}>
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{tx.description}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(tx.date)}
                          <span className="mx-1.5">·</span>
                          {tx.category}
                        </p>
                      </div>
                      <span className={clsx(
                        'text-sm font-semibold whitespace-nowrap',
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600',
                      )}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, acctCurrency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reconciled */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Reconciled</h3>
                  <span className="text-xs text-slate-400">({reconciled.length})</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[28rem] overflow-y-auto">
                {reconciled.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-400">
                    No reconciled transactions yet
                  </div>
                ) : (
                  reconciled.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                      <div className={clsx(
                        'shrink-0 p-1.5 rounded-lg',
                        tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500',
                      )}>
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{tx.description}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(tx.date)}
                          <span className="mx-1.5">·</span>
                          {tx.category}
                        </p>
                      </div>
                      <span className={clsx(
                        'text-sm font-semibold whitespace-nowrap',
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600',
                      )}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, acctCurrency)}
                      </span>
                      <span className="shrink-0 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Reconciled
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Bank Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAccountModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Add Bank Account</h2>
              <button onClick={() => setShowAccountModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAccountSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Business Checking"
                  value={accountForm.name}
                  onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Account Number (last 4)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={accountForm.accountNumber}
                    onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chase"
                    value={accountForm.bankName}
                    onChange={e => setAccountForm({ ...accountForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Account Type</label>
                  <select
                    value={accountForm.type}
                    onChange={e => setAccountForm({ ...accountForm, type: e.target.value as BankAccount['type'] })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  >
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Currency</label>
                  <select
                    value={accountForm.currency}
                    onChange={e => setAccountForm({ ...accountForm, currency: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  >
                    {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CHF'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={accountForm.balance}
                  onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTxModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTxModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Add Transaction</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAccount.name}</p>
              </div>
              <button onClick={() => setShowTxModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleTxSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={e => setTxForm({ ...txForm, date: e.target.value })}
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
                    value={txForm.amount}
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office rent payment"
                  value={txForm.description}
                  onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Type</label>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setTxForm({ ...txForm, type: 'debit' })}
                      className={clsx(
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                        txForm.type === 'debit'
                          ? 'bg-red-50 text-red-700 border-r border-slate-200'
                          : 'bg-white text-slate-500 hover:bg-slate-50 border-r border-slate-200',
                      )}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Debit
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxForm({ ...txForm, type: 'credit' })}
                      className={clsx(
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                        txForm.type === 'credit'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-white text-slate-500 hover:bg-slate-50',
                      )}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      Credit
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
                  <select
                    value={txForm.category}
                    onChange={e => setTxForm({ ...txForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
