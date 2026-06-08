'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { DollarSign, Building2, User, Mail, Lock, Phone, MapPin, Globe, ArrowRight } from 'lucide-react';
import { CURRENCIES } from '@/lib/utils';

export default function RegisterPage() {
  const { registerCompany } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const [company, setCompany] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '',
    country: '', zipCode: '', taxId: '', industry: 'Technology',
    baseCurrency: 'USD', fiscalYearStart: '01', logo: '',
  });
  const [admin, setAdmin] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = () => {
    if (!admin.name || !admin.email || !admin.password) {
      setError('Please fill in all admin fields'); return;
    }
    if (admin.password !== admin.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (admin.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    const err = registerCompany(company, { name: admin.name, email: admin.email, password: admin.password });
    if (err) { setError(err); return; }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">BookKeeper Pro</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Register Your Company</h1>
            <p className="text-sm text-slate-500 mt-1">Set up your accounting platform in minutes</p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>{s}</div>
                <span className={`text-sm font-medium ${step >= s ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s === 1 ? 'Company Info' : 'Admin Account'}
                </span>
                {s === 1 && <div className="w-12 h-px bg-slate-200 ml-2" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })}
                      placeholder="Acme Corporation" className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input type="email" value={company.email} onChange={e => setCompany({ ...company, email: e.target.value })}
                      placeholder="info@company.com" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input type="tel" value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input type="text" value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })}
                    placeholder="123 Business Ave" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input type="text" value={company.city} onChange={e => setCompany({ ...company, city: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input type="text" value={company.state} onChange={e => setCompany({ ...company, state: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                    <input type="text" value={company.country} onChange={e => setCompany({ ...company, country: e.target.value })}
                      placeholder="United States" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                    <select value={company.industry} onChange={e => setCompany({ ...company, industry: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Technology', 'Consulting', 'Retail', 'Manufacturing', 'Healthcare', 'Finance', 'Construction', 'Education', 'Other'].map(i => (
                        <option key={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                    <select value={company.baseCurrency} onChange={e => setCompany({ ...company, baseCurrency: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID</label>
                    <input type="text" value={company.taxId} onChange={e => setCompany({ ...company, taxId: e.target.value })}
                      placeholder="XX-XXXXXXX" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!company.name) { setError('Company name is required'); return; }
                    setError('');
                    setStep(2);
                  }}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Next: Admin Account <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={admin.name} onChange={e => setAdmin({ ...admin, name: e.target.value })}
                      placeholder="John Smith" className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={admin.email} onChange={e => setAdmin({ ...admin, email: e.target.value })}
                      placeholder="john@company.com" className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" value={admin.password} onChange={e => setAdmin({ ...admin, password: e.target.value })}
                      placeholder="Minimum 6 characters" className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" value={admin.confirmPassword} onChange={e => setAdmin({ ...admin, confirmPassword: e.target.value })}
                      placeholder="Re-enter password" className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                    Back
                  </button>
                  <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    Create Company Account
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account? <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">Sign In</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
