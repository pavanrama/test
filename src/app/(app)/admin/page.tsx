'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatDate } from '@/lib/utils';
import type { Company, User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  Building2, Users, ShieldCheck, LogOut, Copy, Check,
  ChevronDown, X, Eye, ToggleLeft, ToggleRight,
  BookOpen, Globe, Mail, Phone, MapPin, Calendar,
  CreditCard, Hash, Briefcase, Crown,
} from 'lucide-react';

const PLANS: Company['plan'][] = ['free', 'starter', 'professional', 'enterprise'];

const PLAN_COLORS: Record<Company['plan'], string> = {
  free: 'bg-slate-100 text-slate-700',
  starter: 'bg-blue-100 text-blue-700',
  professional: 'bg-violet-100 text-violet-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export default function AdminPage() {
  const { auth, allCompanies, data, updateCompany, logout } = useApp();
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [planDropdownId, setPlanDropdownId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (auth.user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center max-w-md">
          <ShieldCheck className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500">
            You do not have permission to access the Platform Admin panel.
            Only super administrators can view this page.
          </p>
        </div>
      </div>
    );
  }

  const companies = allCompanies();
  const users = data.users;
  const activeCompanies = companies.filter(c => c.isActive);
  const freeCount = companies.filter(c => c.plan === 'free').length;
  const paidCount = companies.length - freeCount;

  const getUsersForCompany = (companyId: string): User[] =>
    users.filter(u => u.companyId === companyId);

  const registrationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register`
    : '/register';

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleToggleActive = (company: Company) => {
    updateCompany(company.id, { isActive: !company.isActive });
  };

  const handleChangePlan = (companyId: string, plan: Company['plan']) => {
    updateCompany(companyId, { plan });
    setPlanDropdownId(null);
  };

  const kpis = [
    { label: 'Total Companies', value: companies.length, icon: Building2, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Active Companies', value: activeCompanies.length, icon: ToggleRight, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Total Users', value: users.filter(u => u.companyId !== '__platform__').length, icon: Users, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { label: 'Free / Paid', value: `${freeCount} / ${paidCount}`, icon: CreditCard, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">BookKeeper Pro</span>
            <span className="hidden sm:inline text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              Platform Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">{auth.user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Registration URL */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 shrink-0">
            <Globe className="w-4 h-4 text-slate-400" />
            Registration URL
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2">
              <code className="text-sm text-slate-600 truncate flex-1">{registrationUrl}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">{kpi.label}</span>
                <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', kpi.iconBg)}>
                  <kpi.icon className={clsx('w-4.5 h-4.5', kpi.iconColor)} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">All Companies</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage registered companies on the platform</p>
          </div>

          {companies.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No companies registered yet.</p>
              <p className="text-xs text-slate-400 mt-1">Share the registration URL above to onboard companies.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left font-medium text-slate-500 px-5 py-3">Name</th>
                    <th className="text-left font-medium text-slate-500 px-5 py-3 hidden md:table-cell">Email</th>
                    <th className="text-left font-medium text-slate-500 px-5 py-3 hidden lg:table-cell">Industry</th>
                    <th className="text-left font-medium text-slate-500 px-5 py-3">Plan</th>
                    <th className="text-left font-medium text-slate-500 px-5 py-3">Status</th>
                    <th className="text-center font-medium text-slate-500 px-5 py-3 hidden sm:table-cell">Users</th>
                    <th className="text-left font-medium text-slate-500 px-5 py-3 hidden lg:table-cell">Created</th>
                    <th className="text-right font-medium text-slate-500 px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => {
                    const companyUsers = getUsersForCompany(company.id);
                    return (
                      <tr
                        key={company.id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedCompany(company)}
                      >
                        <td className="px-5 py-3.5 font-medium text-slate-900">{company.name}</td>
                        <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">{company.email}</td>
                        <td className="px-5 py-3.5 text-slate-600 hidden lg:table-cell">{company.industry || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full capitalize', PLAN_COLORS[company.plan])}>
                            {company.plan}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={clsx(
                            'text-xs font-medium px-2.5 py-1 rounded-full',
                            company.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                          )}>
                            {company.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-slate-600 hidden sm:table-cell">{companyUsers.length}</td>
                        <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell">{formatDate(company.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCompany(company)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(company)}
                              className={clsx(
                                'p-1.5 rounded-lg transition-colors',
                                company.isActive
                                  ? 'text-emerald-500 hover:text-red-500 hover:bg-red-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50',
                              )}
                              title={company.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {company.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setPlanDropdownId(planDropdownId === company.id ? null : company.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                title="Change plan"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              {planDropdownId === company.id && (
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-slate-200 shadow-lg z-20 py-1">
                                  {PLANS.map((plan) => (
                                    <button
                                      key={plan}
                                      onClick={() => handleChangePlan(company.id, plan)}
                                      className={clsx(
                                        'w-full text-left px-3 py-2 text-sm capitalize hover:bg-slate-50 transition-colors',
                                        company.plan === plan ? 'font-medium text-blue-600 bg-blue-50/50' : 'text-slate-700',
                                      )}
                                    >
                                      {plan}
                                      {company.plan === plan && <span className="text-xs ml-1 text-blue-400">(current)</span>}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedCompany(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedCompany.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize', PLAN_COLORS[selectedCompany.plan])}>
                    {selectedCompany.plan}
                  </span>
                  <span className={clsx(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    selectedCompany.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                  )}>
                    {selectedCompany.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Company Details Grid */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Company Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailRow icon={Mail} label="Email" value={selectedCompany.email} />
                  <DetailRow icon={Phone} label="Phone" value={selectedCompany.phone} />
                  <DetailRow icon={MapPin} label="Address" value={[selectedCompany.address, selectedCompany.city, selectedCompany.state, selectedCompany.country, selectedCompany.zipCode].filter(Boolean).join(', ')} />
                  <DetailRow icon={Briefcase} label="Industry" value={selectedCompany.industry} />
                  <DetailRow icon={Hash} label="Tax ID" value={selectedCompany.taxId} />
                  <DetailRow icon={CreditCard} label="Currency" value={selectedCompany.baseCurrency} />
                  <DetailRow icon={Calendar} label="Fiscal Year Start" value={selectedCompany.fiscalYearStart} />
                  <DetailRow icon={Calendar} label="Created" value={formatDate(selectedCompany.createdAt)} />
                </div>
              </div>

              {/* Users in this Company */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Users ({getUsersForCompany(selectedCompany.id).length})
                </h4>
                {getUsersForCompany(selectedCompany.id).length === 0 ? (
                  <p className="text-sm text-slate-400">No users in this company.</p>
                ) : (
                  <div className="space-y-2">
                    {getUsersForCompany(selectedCompany.id).map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                            user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600',
                          )}>
                            {user.role.replace('_', ' ')}
                          </span>
                          <span className={clsx(
                            'w-2 h-2 rounded-full',
                            user.isActive ? 'bg-emerald-400' : 'bg-slate-300',
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-slate-50 rounded-lg px-3 py-2.5">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}
