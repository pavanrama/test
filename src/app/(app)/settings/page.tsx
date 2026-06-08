'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { CURRENCIES, uid } from '@/lib/utils';
import type { User, Company } from '@/lib/types';
import {
  Settings, Building2, Users, Link2, Save, Plus, X,
  Mail, Shield, UserCheck, UserX, Trash2,
  Copy, Check, ExternalLink, Calendar,
} from 'lucide-react';
import clsx from 'clsx';

type Tab = 'company' | 'team' | 'invite';

const ROLES = ['admin', 'accountant', 'viewer'] as const;

const FISCAL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function roleBadge(role: User['role']) {
  const styles: Record<User['role'], string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    accountant: 'bg-amber-100 text-amber-700',
    viewer: 'bg-slate-100 text-slate-600',
  };
  const labels: Record<User['role'], string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    accountant: 'Accountant',
    viewer: 'Viewer',
  };
  return (
    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', styles[role])}>
      {labels[role]}
    </span>
  );
}

function planBadge(plan: Company['plan']) {
  const styles: Record<Company['plan'], string> = {
    free: 'bg-slate-100 text-slate-600',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-emerald-100 text-emerald-700',
    enterprise: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={clsx('text-xs font-semibold capitalize px-2.5 py-1 rounded-full', styles[plan])}>
      {plan}
    </span>
  );
}

function avatar(name: string) {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  ];
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm', colors[idx])}>
      {initial}
    </div>
  );
}

const EMPTY_INVITE = { name: '', email: '', password: '', role: 'accountant' as User['role'] };

export default function SettingsPage() {
  const { auth, updateCompany, myUsers, addUser, updateUser, deleteUser } = useApp();
  const company = auth.company;
  const currentUser = auth.user;
  const users = myUsers();

  const [tab, setTab] = useState<Tab>('company');
  const [saved, setSaved] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    address: company?.address || '',
    city: company?.city || '',
    state: company?.state || '',
    country: company?.country || '',
    zipCode: company?.zipCode || '',
    taxId: company?.taxId || '',
    industry: company?.industry || '',
    baseCurrency: company?.baseCurrency || 'USD',
    fiscalYearStart: company?.fiscalYearStart || 'January',
  });

  function handleSaveCompany() {
    if (!company) return;
    updateCompany(company.id, companyForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleInvite() {
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.password.trim() || !company) return;
    addUser({
      companyId: company.id,
      name: inviteForm.name,
      email: inviteForm.email,
      password: inviteForm.password,
      role: inviteForm.role,
      isActive: true,
    });
    setInviteForm(EMPTY_INVITE);
    setShowInviteModal(false);
  }

  function handleRoleChange(userId: string, newRole: User['role']) {
    updateUser(userId, { role: newRole });
  }

  function handleToggleActive(user: User) {
    updateUser(user.id, { isActive: !user.isActive });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.id);
    setDeleteTarget(null);
  }

  function handleCopyLink() {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/register`
      : '/register';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs: { key: Tab; label: string; icon: typeof Settings }[] = [
    { key: 'company', label: 'Company Profile', icon: Building2 },
    { key: 'team', label: 'Team Members', icon: Users },
    { key: 'invite', label: 'Invite Link', icon: Link2 },
  ];

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const selectClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your company, team, and preferences</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-slate-200 pb-px">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              tab === t.key
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Company Profile Tab */}
      {tab === 'company' && company && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <Building2 className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Company Information</h2>
                  <p className="text-sm text-slate-500">Update your company profile and settings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {planBadge(company.plan)}
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Since {new Date(company.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Company Name</label>
                <input
                  value={companyForm.name}
                  onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={e => setCompanyForm(p => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                  placeholder="company@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input
                  value={companyForm.phone}
                  onChange={e => setCompanyForm(p => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                <input
                  value={companyForm.address}
                  onChange={e => setCompanyForm(p => ({ ...p, address: e.target.value }))}
                  className={inputClass}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                <input
                  value={companyForm.city}
                  onChange={e => setCompanyForm(p => ({ ...p, city: e.target.value }))}
                  className={inputClass}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">State / Province</label>
                <input
                  value={companyForm.state}
                  onChange={e => setCompanyForm(p => ({ ...p, state: e.target.value }))}
                  className={inputClass}
                  placeholder="State or province"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Country</label>
                <input
                  value={companyForm.country}
                  onChange={e => setCompanyForm(p => ({ ...p, country: e.target.value }))}
                  className={inputClass}
                  placeholder="Country"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ZIP / Postal Code</label>
                <input
                  value={companyForm.zipCode}
                  onChange={e => setCompanyForm(p => ({ ...p, zipCode: e.target.value }))}
                  className={inputClass}
                  placeholder="12345"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID</label>
                <input
                  value={companyForm.taxId}
                  onChange={e => setCompanyForm(p => ({ ...p, taxId: e.target.value }))}
                  className={inputClass}
                  placeholder="Tax identification number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Industry</label>
                <input
                  value={companyForm.industry}
                  onChange={e => setCompanyForm(p => ({ ...p, industry: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. Technology, Retail"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Base Currency</label>
                <select
                  value={companyForm.baseCurrency}
                  onChange={e => setCompanyForm(p => ({ ...p, baseCurrency: e.target.value }))}
                  className={selectClass}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fiscal Year Start</label>
                <select
                  value={companyForm.fiscalYearStart}
                  onChange={e => setCompanyForm(p => ({ ...p, fiscalYearStart: e.target.value }))}
                  className={selectClass}
                >
                  {FISCAL_MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveCompany}
                className={clsx(
                  'flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-colors',
                  saved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Tab */}
      {tab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
            <button
              onClick={() => { setInviteForm(EMPTY_INVITE); setShowInviteModal(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Invite User
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            {users.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No team members yet</p>
                <button
                  onClick={() => { setInviteForm(EMPTY_INVITE); setShowInviteModal(true); }}
                  className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                  Invite your first team member
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users.map(u => (
                  <div key={u.id} className="px-5 py-4 flex items-center gap-4">
                    {avatar(u.name)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                        {u.id === currentUser?.id && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">You</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {u.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Role selector */}
                      {u.id === currentUser?.id || u.role === 'super_admin' ? (
                        roleBadge(u.role)
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value as User['role'])}
                          className="text-xs font-medium px-2 py-1 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="admin">Admin</option>
                          <option value="accountant">Accountant</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      )}

                      {/* Active/Inactive toggle */}
                      {u.id !== currentUser?.id && u.role !== 'super_admin' && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={clsx(
                            'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors',
                            u.isActive
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                              : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
                          )}
                        >
                          {u.isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          {u.isActive ? 'Active' : 'Inactive'}
                        </button>
                      )}

                      {/* Remove user */}
                      {u.id !== currentUser?.id && u.role !== 'super_admin' && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Link Tab */}
      {tab === 'invite' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Shareable Registration Link</h2>
              <p className="text-sm text-slate-500">Share this link so new companies can register on the platform</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-slate-700 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/register` : '/register'}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0',
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Public Registration</p>
                <p className="text-sm text-blue-700">
                  Anyone with this link can create a new company account and get started. Each registration creates an independent company with its own data.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <Shield className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900">Data Isolation</p>
                <p className="text-sm text-slate-600">
                  Registered companies are fully isolated. Each company manages its own users, accounts, and financial data independently.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-semibold text-slate-900">Invite Team Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                <input
                  value={inviteForm.name}
                  onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password *</label>
                <input
                  type="password"
                  value={inviteForm.password}
                  onChange={e => setInviteForm(p => ({ ...p, password: e.target.value }))}
                  className={inputClass}
                  placeholder="Initial password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm(p => ({ ...p, role: e.target.value as User['role'] }))}
                  className={selectClass}
                >
                  <option value="admin">Admin</option>
                  <option value="accountant">Accountant</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.password.trim()}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  inviteForm.name.trim() && inviteForm.email.trim() && inviteForm.password.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                Invite User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Remove Team Member</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-900">{deleteTarget.name}</span> from the team?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
