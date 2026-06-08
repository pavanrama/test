'use client';

import { useState } from 'react';
import { Search, Bell, Plus, ChevronDown, User } from 'lucide-react';
import clsx from 'clsx';

export default function TopBar() {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: 'Invoice INV-2024-003 is overdue', time: '2 hours ago', type: 'warning' },
    { id: 2, text: 'Payment of $7,595.00 received from TechStart', time: '5 hours ago', type: 'success' },
    { id: 3, text: 'Bill BILL-004 due in 3 days', time: '1 day ago', type: 'info' },
    { id: 4, text: '3 bank transactions need reconciliation', time: '1 day ago', type: 'warning' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions, invoices, contacts..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => { setShowQuickActions(!showQuickActions); setShowNotifications(false); }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Create</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showQuickActions && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-slide-in z-50">
              {[
                { label: 'New Invoice', desc: 'Bill a customer' },
                { label: 'New Bill', desc: 'Record a vendor bill' },
                { label: 'New Expense', desc: 'Track a payment' },
                { label: 'New Contact', desc: 'Add customer or vendor' },
                { label: 'Journal Entry', desc: 'Manual transaction' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setShowQuickActions(false)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="text-sm font-medium text-slate-900">{action.label}</div>
                  <div className="text-xs text-slate-500">{action.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowQuickActions(false); }}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-slide-in z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      n.type === 'warning' && 'bg-amber-400',
                      n.type === 'success' && 'bg-emerald-400',
                      n.type === 'info' && 'bg-blue-400',
                    )} />
                    <div>
                      <p className="text-sm text-slate-700">{n.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-900">Admin</p>
            <p className="text-[10px] text-slate-500">Acme Corp</p>
          </div>
        </button>
      </div>
    </header>
  );
}
