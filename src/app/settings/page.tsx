'use client';

import { useState } from 'react';
import {
  Settings, Building2, User, Bell, Shield, Globe, Palette,
  Save, Mail, Phone, MapPin, Hash
} from 'lucide-react';
import clsx from 'clsx';
import { companySettings, currencies } from '@/lib/data';

type Tab = 'company' | 'users' | 'notifications' | 'security' | 'preferences';

const tabs: { id: Tab; name: string; icon: typeof Building2 }[] = [
  { id: 'company', name: 'Company', icon: Building2 },
  { id: 'users', name: 'Users & Roles', icon: User },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'preferences', name: 'Preferences', icon: Palette },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-50 rounded-xl">
          <Settings className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your organization settings</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-2 space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <tab.icon className={clsx('w-4 h-4', activeTab === tab.id ? 'text-blue-600' : 'text-slate-400')} />
                {tab.name}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1">
          {activeTab === 'company' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Company Profile</h2>
              <p className="text-sm text-slate-500 mb-6">Update your company information</p>

              <div className="space-y-5">
                <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                  <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">A</span>
                  </div>
                  <div>
                    <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Upload Logo</button>
                    <p className="text-xs text-slate-400 mt-0.5">PNG, JPG up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                    <input type="text" defaultValue={companySettings.name} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                    <select defaultValue={companySettings.industry} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Technology</option>
                      <option>Consulting</option>
                      <option>Retail</option>
                      <option>Manufacturing</option>
                      <option>Healthcare</option>
                      <option>Finance</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" defaultValue={companySettings.email} className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" defaultValue={companySettings.phone} className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input type="text" defaultValue={companySettings.address} className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input type="text" defaultValue={companySettings.city} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input type="text" defaultValue={companySettings.state} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                    <input type="text" defaultValue={companySettings.country} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Zip Code</label>
                    <input type="text" defaultValue={companySettings.zipCode} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" defaultValue={companySettings.taxId} className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Currency</label>
                    <select defaultValue={companySettings.baseCurrency} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {currencies.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fiscal Year Start</label>
                    <select defaultValue={companySettings.fiscalYearStart} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="01">January</option>
                      <option value="04">April</option>
                      <option value="07">July</option>
                      <option value="10">October</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Users & Roles</h2>
              <p className="text-sm text-slate-500 mb-6">Manage team access and permissions</p>

              <div className="space-y-4">
                {[
                  { name: 'Admin User', email: 'admin@acmecorp.com', role: 'Admin', status: 'Active' },
                  { name: 'Sarah Johnson', email: 'sarah@acmecorp.com', role: 'Accountant', status: 'Active' },
                  { name: 'Mike Chen', email: 'mike@acmecorp.com', role: 'Viewer', status: 'Active' },
                  { name: 'Lisa Park', email: 'lisa@acmecorp.com', role: 'Bookkeeper', status: 'Invited' },
                ].map((user, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">{user.role}</span>
                      <span className={clsx(
                        'text-xs font-medium',
                        user.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'
                      )}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-4 px-4 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                + Invite User
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Notification Preferences</h2>
              <p className="text-sm text-slate-500 mb-6">Choose how you want to be notified</p>

              <div className="space-y-4">
                {[
                  { label: 'Invoice sent', desc: 'When an invoice is sent to a customer', email: true, push: true },
                  { label: 'Payment received', desc: 'When a payment is received', email: true, push: true },
                  { label: 'Invoice overdue', desc: 'When an invoice becomes overdue', email: true, push: true },
                  { label: 'Bill due soon', desc: 'Reminder before a bill is due', email: true, push: false },
                  { label: 'Bank transaction imported', desc: 'When new bank transactions are imported', email: false, push: true },
                  { label: 'Monthly summary', desc: 'Monthly financial summary report', email: true, push: false },
                  { label: 'Low cash alert', desc: 'When cash drops below threshold', email: true, push: true },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{notif.label}</p>
                      <p className="text-xs text-slate-400">{notif.desc}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked={notif.email} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                        <span className="text-xs text-slate-500">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked={notif.push} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                        <span className="text-xs text-slate-500">Push</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Security Settings</h2>
              <p className="text-sm text-slate-500 mb-6">Manage authentication and access controls</p>

              <div className="space-y-6">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-400">Add an extra layer of security</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg">Enabled</button>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Session Timeout</p>
                      <p className="text-xs text-slate-400">Auto-logout after inactivity</p>
                    </div>
                    <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Login History</p>
                      <p className="text-xs text-slate-400">Recent sign-in activity</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { time: '2 minutes ago', location: 'San Francisco, CA', device: 'Chrome on macOS' },
                      { time: '1 day ago', location: 'San Francisco, CA', device: 'Safari on iPhone' },
                      { time: '3 days ago', location: 'Austin, TX', device: 'Chrome on Windows' },
                    ].map((login, i) => (
                      <div key={i} className="flex justify-between text-xs py-1.5">
                        <span className="text-slate-500">{login.time}</span>
                        <span className="text-slate-400">{login.device} · {login.location}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Change Password</h3>
                  <div className="space-y-3 max-w-sm">
                    <input type="password" placeholder="Current password" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="password" placeholder="New password" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="password" placeholder="Confirm new password" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Update Password</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Display Preferences</h2>
              <p className="text-sm text-slate-500 mb-6">Customize the application appearance</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date Format</label>
                  <select className="w-full max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                    <option>MMM DD, YYYY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Number Format</label>
                  <select className="w-full max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>1,234.56 (US)</option>
                    <option>1.234,56 (EU)</option>
                    <option>1 234.56 (FR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                  <select className="w-full max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Pacific Time (PT)</option>
                    <option>Mountain Time (MT)</option>
                    <option>Central Time (CT)</option>
                    <option>Eastern Time (ET)</option>
                    <option>UTC</option>
                    <option>GMT (London)</option>
                    <option>CET (Central Europe)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                  <select className="w-full max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Japanese</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Default Dashboard Period</label>
                  <select className="w-full max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>This Month</option>
                    <option>This Quarter</option>
                    <option>This Year</option>
                    <option>Last 30 Days</option>
                  </select>
                </div>

                <div className="flex justify-end pt-4">
                  <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    <Save className="w-4 h-4" /> Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
