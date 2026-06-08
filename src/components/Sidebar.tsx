'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Receipt, CreditCard, Building2,
  BarChart3, Users, BookOpen, Calculator, Globe, Settings,
  ChevronLeft, ChevronRight, TrendingUp, ArrowLeftRight,
  Menu, X, DollarSign
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Invoices', href: '/invoices', icon: FileText, badge: 3 },
  { name: 'Bills', href: '/bills', icon: Receipt, badge: 2 },
  { name: 'Expenses', href: '/expenses', icon: CreditCard },
  { name: 'Bank & Reconciliation', href: '/bank', icon: Building2 },
  { name: 'Chart of Accounts', href: '/accounts', icon: BookOpen },
  { name: 'Journal Entries', href: '/journal', icon: ArrowLeftRight },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Tax Management', href: '/taxes', icon: Calculator },
  { name: 'Multi-Currency', href: '/currencies', icon: Globe },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800',
          collapsed ? 'w-[70px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={clsx('flex items-center h-16 px-4 border-b border-slate-800', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">BookKeeper</h1>
                <p className="text-[10px] text-slate-500 -mt-0.5">Pro Accounting</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={clsx('flex-shrink-0', isActive ? 'text-blue-400' : 'text-slate-500', collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]')} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={clsx('p-4 border-t border-slate-800', collapsed && 'px-2')}>
          {!collapsed ? (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Healthy</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">All accounts reconciled</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400" title="All accounts reconciled" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
