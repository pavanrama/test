'use client';

import { useState } from 'react';
import { Calculator, Plus, Edit2, ToggleRight, ToggleLeft, FileText, Calendar } from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '@/components/PageHeader';
import { taxRates, formatCurrency, invoices, bills } from '@/lib/data';

export default function TaxManagementPage() {
  const [showCreate, setShowCreate] = useState(false);

  const totalTaxCollected = invoices.reduce((s, i) => s + i.taxAmount, 0);
  const totalTaxPaid = bills.reduce((s, b) => s + b.taxAmount, 0);
  const netTaxLiability = totalTaxCollected - totalTaxPaid;

  const filingHistory = [
    { period: 'Q2 2024', dueDate: 'Jul 31, 2024', amount: 4437.50, status: 'upcoming', type: 'Sales Tax' },
    { period: 'Q1 2024', dueDate: 'Apr 30, 2024', amount: 3850.00, status: 'filed', type: 'Sales Tax' },
    { period: 'FY 2023', dueDate: 'Apr 15, 2024', amount: 12500.00, status: 'filed', type: 'Income Tax' },
    { period: 'Q4 2023', dueDate: 'Jan 31, 2024', amount: 3200.00, status: 'filed', type: 'Sales Tax' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tax Management"
        description="Configure tax rates and manage tax filings"
        icon={Calculator}
        actionLabel="Add Tax Rate"
        onAction={() => setShowCreate(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Tax Collected</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalTaxCollected)}</p>
          <p className="text-xs text-slate-400">From invoices</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Tax Paid</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalTaxPaid)}</p>
          <p className="text-xs text-slate-400">On purchases</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Net Tax Liability</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(netTaxLiability)}</p>
          <p className="text-xs text-slate-400">Amount owed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Active Rates</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{taxRates.filter(t => t.isActive).length}</p>
          <p className="text-xs text-slate-400">Configured</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Tax Rates</h3>
            <p className="text-xs text-slate-400">Configured tax rates for different regions</p>
          </div>
          <div className="divide-y divide-slate-100">
            {taxRates.map((rate) => (
              <div key={rate.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                    rate.type === 'sales_tax' ? 'bg-blue-50 text-blue-600' :
                    rate.type === 'vat' ? 'bg-purple-50 text-purple-600' :
                    'bg-emerald-50 text-emerald-600'
                  )}>
                    {rate.rate}%
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{rate.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{rate.region}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400 uppercase">{rate.type.replace('_', ' ')}</span>
                      {rate.isDefault && (
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Default</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rate.isActive ? (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <ToggleRight className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <ToggleLeft className="w-4 h-4" /> Inactive
                    </span>
                  )}
                  <button className="p-1.5 rounded-md hover:bg-slate-100">
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Filing History</h3>
            <p className="text-xs text-slate-400">Past and upcoming tax filings</p>
          </div>
          <div className="divide-y divide-slate-100">
            {filingHistory.map((filing, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    filing.status === 'filed' ? 'bg-emerald-50' : 'bg-amber-50'
                  )}>
                    {filing.status === 'filed' ? (
                      <FileText className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Calendar className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{filing.type} - {filing.period}</p>
                    <p className="text-xs text-slate-400">Due: {filing.dueDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(filing.amount)}</p>
                  <span className={clsx(
                    'text-xs font-medium capitalize',
                    filing.status === 'filed' ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {filing.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Tax Summary Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tax Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Collected</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Paid</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Net Liability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">Sales Tax (8.5%)</td>
                <td className="px-4 py-3 text-sm text-right text-emerald-600">{formatCurrency(2337.50)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(63.75)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(2273.75)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">UK VAT (20%)</td>
                <td className="px-4 py-3 text-sm text-right text-emerald-600">{formatCurrency(2100)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(0)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(2100)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold">
                <td className="px-4 py-3 text-sm">Total</td>
                <td className="px-4 py-3 text-sm text-right text-emerald-600">{formatCurrency(totalTaxCollected)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(totalTaxPaid)}</td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(netTaxLiability)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-in p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Tax Rate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tax Name</label>
                <input type="text" placeholder="e.g., State Sales Tax" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rate (%)</label>
                  <input type="number" placeholder="0.00" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="sales_tax">Sales Tax</option>
                    <option value="vat">VAT</option>
                    <option value="gst">GST</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                <input type="text" placeholder="e.g., California" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Rate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
