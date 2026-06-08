'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatDate } from '@/lib/utils';
import type { AuditEntry, AuditAction } from '@/lib/types';
import {
  Search, Shield, CalendarDays, Users, Activity,
  ClipboardList, ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';

const ALL_ACTIONS: AuditAction[] = [
  'create', 'edit', 'delete', 'approve', 'reject', 'post', 'void', 'payment', 'submit',
];

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-blue-100 text-blue-700',
  edit: 'bg-amber-100 text-amber-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-red-100 text-red-700',
  post: 'bg-emerald-100 text-emerald-700',
  void: 'bg-gray-100 text-gray-600',
  payment: 'bg-cyan-100 text-cyan-700',
  submit: 'bg-indigo-100 text-indigo-700',
};

const ENTITY_LABELS: Record<string, string> = {
  invoices: 'Invoice',
  bills: 'Bill',
  expenses: 'Expense',
  accounts: 'Account',
  journalEntries: 'Journal Entry',
  contacts: 'Contact',
  employees: 'Employee',
  payRuns: 'Pay Run',
  fixedAssets: 'Fixed Asset',
  recurringTransactions: 'Recurring Transaction',
  bankAccounts: 'Bank Account',
  bankTransactions: 'Bank Transaction',
  taxRates: 'Tax Rate',
  companies: 'Company',
  users: 'User',
  payrollTaxPayments: 'Payroll Tax Payment',
};

const ENTITY_OPTIONS = [
  'invoices', 'bills', 'expenses', 'accounts', 'journalEntries',
  'contacts', 'employees', 'payRuns', 'fixedAssets', 'recurringTransactions',
] as const;

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AuditTrailPage() {
  const { myAuditLog, auth } = useApp();
  const auditLog = myAuditLog();

  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const uniqueUsers = useMemo(() => {
    const names = new Set(auditLog.map((e: AuditEntry) => e.userName));
    return Array.from(names).sort();
  }, [auditLog]);

  const today = todayDate();

  const todaysEvents = useMemo(
    () => auditLog.filter((e: AuditEntry) => e.timestamp.startsWith(today)).length,
    [auditLog, today],
  );

  const mostCommonAction = useMemo(() => {
    if (auditLog.length === 0) return '—';
    const counts: Record<string, number> = {};
    for (const e of auditLog) {
      counts[e.action] = (counts[e.action] || 0) + 1;
    }
    let best = '';
    let max = 0;
    for (const [action, count] of Object.entries(counts)) {
      if (count > max) { best = action; max = count; }
    }
    return best;
  }, [auditLog]);

  const filteredLog = useMemo(() => {
    let list = [...auditLog];

    if (filterAction !== 'all') {
      list = list.filter((e: AuditEntry) => e.action === filterAction);
    }
    if (filterEntity !== 'all') {
      list = list.filter((e: AuditEntry) => e.entity === filterEntity);
    }
    if (filterUser !== 'all') {
      list = list.filter((e: AuditEntry) => e.userName === filterUser);
    }
    if (dateFrom) {
      list = list.filter((e: AuditEntry) => e.timestamp >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = dateTo + 'T23:59:59.999Z';
      list = list.filter((e: AuditEntry) => e.timestamp <= endOfDay);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e: AuditEntry) => e.entityLabel.toLowerCase().includes(q));
    }

    return list.sort(
      (a: AuditEntry, b: AuditEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [auditLog, filterAction, filterEntity, filterUser, dateFrom, dateTo, searchQuery]);

  const summaryCards = [
    { title: 'Total Events', value: auditLog.length, icon: ClipboardList, iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    { title: "Today's Events", value: todaysEvents, icon: CalendarDays, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Unique Users', value: uniqueUsers.length, icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { title: 'Most Common Action', value: mostCommonAction, icon: Activity, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Audit Trail</h1>
        <p className="text-sm text-slate-500">Complete history of all actions in your organization</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight capitalize">
                  {card.value}
                </p>
              </div>
              <div className={clsx('p-2.5 rounded-xl', card.iconBg)}>
                <card.icon className={clsx('w-5 h-5', card.iconColor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Action filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a} className="capitalize">{a}</option>
              ))}
            </select>
          </div>

          {/* Entity filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Entity</label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Entities</option>
              {ENTITY_OPTIONS.map((entity) => (
                <option key={entity} value={entity}>{ENTITY_LABELS[entity] || entity}</option>
              ))}
            </select>
          </div>

          {/* User filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">User</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {filteredLog.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No audit events recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Actions will be tracked automatically as you use the system.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left font-medium text-slate-500 px-4 py-3">Timestamp</th>
                    <th className="text-left font-medium text-slate-500 px-4 py-3">User</th>
                    <th className="text-left font-medium text-slate-500 px-4 py-3">Action</th>
                    <th className="text-left font-medium text-slate-500 px-4 py-3">Entity</th>
                    <th className="text-left font-medium text-slate-500 px-4 py-3">Label</th>
                    <th className="text-left font-medium text-slate-500 px-4 py-3">Changes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLog.map((entry: AuditEntry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {entry.userName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'text-xs font-medium capitalize px-2.5 py-1 rounded-full',
                          ACTION_COLORS[entry.action] || 'bg-slate-100 text-slate-600',
                        )}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {ENTITY_LABELS[entry.entity] || entry.entity}
                      </td>
                      <td className="px-4 py-3 text-slate-900 max-w-[200px] truncate">
                        {entry.entityLabel}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[250px]">
                        {entry.oldValue || entry.newValue ? (
                          <span className="inline-flex items-center gap-1.5">
                            {entry.oldValue && (
                              <span className="text-slate-400">{entry.oldValue}</span>
                            )}
                            {entry.oldValue && entry.newValue && (
                              <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            )}
                            {entry.newValue && (
                              <span className="text-slate-700 font-medium">{entry.newValue}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination indicator */}
            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
              Showing {filteredLog.length} of {auditLog.length} events
            </div>
          </>
        )}
      </div>
    </div>
  );
}
