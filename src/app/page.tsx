'use client';

import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import {
  DollarSign, BarChart3, FileText, Users, Building2,
  Globe, Shield, ArrowRight, CheckCircle, Zap
} from 'lucide-react';

export default function LandingPage() {
  const { auth } = useApp();
  const router = useRouter();

  if (auth.user) {
    if (auth.user.role === 'super_admin') router.push('/admin');
    else router.push('/dashboard');
    return null;
  }

  const features = [
    { icon: FileText, title: 'Invoicing & Bills', desc: 'Create professional invoices, track bills, manage payments with full lifecycle' },
    { icon: BarChart3, title: 'Financial Reports', desc: 'P&L, Balance Sheet, Cash Flow, Trial Balance, AR/AP Aging reports' },
    { icon: Building2, title: 'Bank Reconciliation', desc: 'Connect bank accounts and reconcile transactions with one-click matching' },
    { icon: Users, title: 'Multi-Company', desc: 'Each company gets isolated data, their own admin, and team management' },
    { icon: Globe, title: 'Multi-Currency', desc: 'Automatic exchange rates, foreign invoicing, and gain/loss tracking' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Admin, Accountant, Viewer roles with granular permissions per company' },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">BookKeeper Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              Register Company
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-white to-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700 font-medium mb-6">
            <Zap className="w-4 h-4" /> Multi-Company Accounting Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Professional Bookkeeping<br />for Every Company
          </h1>
          <p className="mt-5 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Register your company, invite your team, and start managing your books. 
            Full double-entry accounting with invoicing, expense tracking, bank reconciliation, 
            and financial reporting — all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              Register Your Company <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
            >
              Sign In to Existing Account
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Platform Admin: admin@bookkeeper.com / admin123
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-slate-900">Everything Your Company Needs</h2>
            <p className="mt-2 text-slate-500">Best features from QuickBooks, Xero, FreshBooks, and Wave — built into one platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Register Company', desc: 'Create your company account with basic details and an admin user.' },
              { step: '2', title: 'Set Up Your Books', desc: 'Chart of Accounts is auto-created. Add your contacts, bank accounts, and tax rates.' },
              { step: '3', title: 'Start Managing', desc: 'Create invoices, track expenses, reconcile bank transactions, and generate reports.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white">Ready to Get Started?</h2>
          <p className="mt-2 text-blue-100">Register your company today and take control of your finances.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-semibold text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition-colors"
          >
            Register Now — It&apos;s Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-400">
          BookKeeper Pro — Multi-Company Accounting Platform
        </div>
      </footer>
    </div>
  );
}
