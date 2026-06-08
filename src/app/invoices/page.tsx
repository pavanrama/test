'use client';

import { useState } from 'react';
import {
  FileText, Eye, Send, Download, MoreHorizontal,
  DollarSign, Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { invoices, formatCurrency, formatDate } from '@/lib/data';
import type { Invoice } from '@/lib/types';

export default function InvoicesPage() {
  const [filter, setFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  const totalOutstanding = invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalDraft = invoices.filter(i => i.status === 'draft').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Invoices"
        description="Create and manage customer invoices"
        icon={FileText}
        actionLabel="New Invoice"
        onAction={() => setShowCreate(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-slate-500">Outstanding</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalOutstanding)}</p>
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
            <span className="text-xs font-medium text-slate-500">Paid</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Drafts</span>
          </div>
          <p className="text-xl font-bold text-slate-600">{totalDraft}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-2">
            {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status} {status !== 'all' && `(${invoices.filter(i => i.status === status).length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Balance</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-blue-600">{inv.number}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-slate-900">{inv.customerName}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-900 text-right">
                    {formatCurrency(inv.total, inv.currency)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-right">
                    <span className={inv.total - inv.amountPaid > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                      {formatCurrency(inv.total - inv.amountPaid, inv.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded-md hover:bg-slate-100" title="View">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-slate-100" title="Send">
                        <Send className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-slate-100" title="Download">
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedInvoice(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedInvoice.number}</h2>
                  <p className="text-sm text-slate-500">{selectedInvoice.customerName}</p>
                </div>
                <StatusBadge status={selectedInvoice.status} />
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Invoice Date</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(selectedInvoice.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Due Date</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(selectedInvoice.dueDate)}</p>
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
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-sm text-slate-900">{item.description}</td>
                      <td className="py-3 text-sm text-slate-600 text-right">{item.quantity}</td>
                      <td className="py-3 text-sm text-slate-600 text-right">{formatCurrency(item.unitPrice, selectedInvoice.currency)}</td>
                      <td className="py-3 text-sm font-medium text-slate-900 text-right">{formatCurrency(item.amount, selectedInvoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax ({selectedInvoice.taxRate}%)</span>
                  <span className="text-slate-900">{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total</span>
                  <span className="text-slate-900">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                </div>
                {selectedInvoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Amount Paid</span>
                      <span className="text-emerald-600">-{formatCurrency(selectedInvoice.amountPaid, selectedInvoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-amber-600">Balance Due</span>
                      <span className="text-amber-600">{formatCurrency(selectedInvoice.total - selectedInvoice.amountPaid, selectedInvoice.currency)}</span>
                    </div>
                  </>
                )}
              </div>

              {selectedInvoice.notes && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setSelectedInvoice(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
              <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Send className="w-4 h-4" /> Send Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Create New Invoice</h2>
              <p className="text-sm text-slate-500">Fill in the details to generate an invoice</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Select customer...</option>
                    <option>TechStart Inc.</option>
                    <option>Global Solutions Ltd.</option>
                    <option>Sunrise Marketing</option>
                    <option>DataFlow Analytics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
                  <input type="text" value="INV-2024-006" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Date</label>
                  <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Line Items</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Description</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 w-20">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 w-28">Price</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2"><input type="text" placeholder="Item description" className="w-full text-sm border-0 focus:outline-none" /></td>
                        <td className="px-3 py-2"><input type="number" placeholder="1" className="w-full text-sm text-right border-0 focus:outline-none" /></td>
                        <td className="px-3 py-2"><input type="number" placeholder="0.00" className="w-full text-sm text-right border-0 focus:outline-none" /></td>
                        <td className="px-3 py-2 text-sm text-right text-slate-400">$0.00</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="px-3 py-2 border-t border-slate-100">
                    <button className="text-xs text-blue-600 font-medium hover:text-blue-700">+ Add Line Item</button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea rows={2} placeholder="Additional notes..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button className="px-4 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">Save as Draft</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Create & Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
