'use client';

import { useState } from 'react';
import { Receipt, Eye, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { bills, formatCurrency, formatDate } from '@/lib/data';
import type { Bill } from '@/lib/types';

export default function BillsPage() {
  const [filter, setFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const filtered = filter === 'all' ? bills : bills.filter(b => b.status === filter);

  const totalUnpaid = bills.filter(b => ['received', 'approved', 'overdue'].includes(b.status)).reduce((s, b) => s + (b.total - b.amountPaid), 0);
  const totalOverdue = bills.filter(b => b.status === 'overdue').reduce((s, b) => s + (b.total - b.amountPaid), 0);
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bills & Accounts Payable"
        description="Track and manage vendor bills and payments"
        icon={Receipt}
        actionLabel="New Bill"
        onAction={() => setShowCreate(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-slate-500">Unpaid</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalUnpaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-slate-500">Overdue</span>
          </div>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-slate-500">Paid (YTD)</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Total Bills</span>
          </div>
          <p className="text-xl font-bold text-slate-600">{bills.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-2">
            {['all', 'draft', 'received', 'approved', 'paid', 'overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Bill #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Balance</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedBill(bill)}>
                  <td className="px-4 py-3.5 text-sm font-semibold text-blue-600">{bill.number}</td>
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{bill.vendorName}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{bill.category}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(bill.date)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(bill.dueDate)}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-900 text-right">{formatCurrency(bill.total)}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-right">
                    <span className={bill.total - bill.amountPaid > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                      {formatCurrency(bill.total - bill.amountPaid)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center"><StatusBadge status={bill.status} /></td>
                  <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1.5 rounded-md hover:bg-slate-100">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedBill(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedBill.number}</h2>
                  <p className="text-sm text-slate-500">from {selectedBill.vendorName}</p>
                </div>
                <StatusBadge status={selectedBill.status} />
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Bill Date</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(selectedBill.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Due Date</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(selectedBill.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="text-sm font-medium text-slate-900">{selectedBill.category}</p>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 text-left text-xs font-semibold text-slate-500">Description</th>
                    <th className="py-2 text-right text-xs font-semibold text-slate-500">Qty</th>
                    <th className="py-2 text-right text-xs font-semibold text-slate-500">Price</th>
                    <th className="py-2 text-right text-xs font-semibold text-slate-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedBill.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-sm text-slate-900">{item.description}</td>
                      <td className="py-3 text-sm text-slate-600 text-right">{item.quantity}</td>
                      <td className="py-3 text-sm text-slate-600 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900">{formatCurrency(selectedBill.subtotal)}</span>
                </div>
                {selectedBill.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax</span>
                    <span className="text-slate-900">{formatCurrency(selectedBill.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatCurrency(selectedBill.total)}</span>
                </div>
                {selectedBill.amountPaid > 0 && (
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-amber-600">Balance Due</span>
                    <span className="text-amber-600">{formatCurrency(selectedBill.total - selectedBill.amountPaid)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setSelectedBill(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
              {selectedBill.status !== 'paid' && (
                <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Record Payment</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-slide-in p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Record New Bill</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Select vendor...</option>
                    <option>CloudHost Pro</option>
                    <option>Office Depot</option>
                    <option>LegalEase Partners</option>
                    <option>InsureAll Corp.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bill Number</label>
                  <input type="text" placeholder="Vendor bill number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Technology</option>
                    <option>Office Supplies</option>
                    <option>Professional Services</option>
                    <option>Insurance</option>
                    <option>Rent</option>
                    <option>Utilities</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input type="number" placeholder="0.00" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Bill</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
