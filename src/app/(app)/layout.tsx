'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import {
  LayoutDashboard, FileText, Receipt, CreditCard, Building2,
  BarChart3, Users, BookOpen, ArrowLeftRight, Calculator,
  Globe, Settings, ChevronLeft, ChevronRight, Menu, X,
  DollarSign, LogOut, Search, User,
  Landmark, Package, Repeat, ClipboardList
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Bills', href: '/bills', icon: Receipt },
  { name: 'Expenses', href: '/expenses', icon: CreditCard },
  { name: 'Bank', href: '/bank', icon: Building2 },
  { name: 'Accounts', href: '/accounts', icon: BookOpen },
  { name: 'Journal', href: '/journal', icon: ArrowLeftRight },
  { name: 'Payroll', href: '/payroll', icon: Landmark },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Recurring', href: '/recurring', icon: Repeat },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Tax', href: '/taxes', icon: Calculator },
  { name: 'Currency', href: '/currencies', icon: Globe },
  { name: 'Audit Trail', href: '/audit', icon: ClipboardList },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { auth, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!auth.user) router.push('/login');
    else if (auth.user.role === 'super_admin' && pathname !== '/admin') router.push('/admin');
  }, [auth.user, router, pathname]);

  if (!auth.user) return null;
  if (auth.user.role === 'super_admin' && pathname !== '/admin') return null;

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <div className="min-h-screen bg-slate-50">
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white shadow-lg">
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}

      <aside className={clsx(
        'fixed top-0 left-0 z-50 h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800',
        collapsed ? 'w-[68px]' : 'w-[250px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className={clsx('flex items-center h-16 px-4 border-b border-slate-800', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white truncate max-w-[140px]">{auth.company?.name || 'BookKeeper'}</p>
                <p className="text-[10px] text-slate-500 capitalize">{auth.user.role}</p>
              </div>
            </Link>
          )}
          {collapsed && <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-white" /></div>}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="hidden lg:flex p-1 rounded hover:bg-slate-800 text-slate-400">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  active ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                  collapsed && 'justify-center px-2'
                )} title={collapsed ? item.name : undefined}>
                <item.icon className={clsx('w-[18px] h-[18px] flex-shrink-0', active ? 'text-blue-400' : 'text-slate-500')} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={clsx('p-3 border-t border-slate-800', collapsed && 'px-2')}>
          <button onClick={handleLogout}
            className={clsx('flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors', collapsed && 'justify-center px-2')}>
            <LogOut className="w-[18px] h-[18px]" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className={clsx('min-h-screen flex flex-col transition-all duration-300', collapsed ? 'lg:pl-[68px]' : 'lg:pl-[250px]')}>
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="lg:hidden w-10" />
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">{auth.user.name}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
