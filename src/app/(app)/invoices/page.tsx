'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate, todayISO, uid, statusColor } from '@/lib/utils';
import type { Invoice, LineItem, Contact, TaxRate, Payment } from '@/lib/types';
import {
  FileText, Eye, Send, Download, Plus, DollarSign, Clock,
  AlertCircle, CheckCircle, Trash2, X, CreditCard, ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';

type FilterTab = 'all' | 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';

const PAYMENT_METHODS = ['Bank Transfer', 'Check', 'Credit Card', 'Cash', 'Online'];

const EMPTY_LINE_ITEM = (): LineItem => ({
  id: uid(),
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
});

export default function InvoicesPage() {
  const {
    myInvoices, myContacts, myTaxRates,
    addInvoice, updateInvoice, deleteInvoice,
    recordInvoicePayment, auth, hasPermission,
  } = useApp();

  const invoices = myInvoices();
  const contacts = myContacts();
  const taxRates = myTaxRates();
  const currency = auth.company?.baseCurrency || 'USD';
  const customers = contacts.filter((c: Contact) => c.type === 'customer' || c.type === 'both');

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [statementContactId, setStatementContactId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const outstanding = invoices
    .filter((i: Invoice) => i.status === 'sent' || i.status === 'overdue' || i.status === 'partial')
    .reduce((s: number, i: Invoice) => s + (i.total - i.amountPaid), 0);
  const overdue = invoices
    .filter((i: Invoice) => i.status === 'overdue')
    .reduce((s: number, i: Invoice) => s + (i.total - i.amountPaid), 0);
  const paid = invoices
    .filter((i: Invoice) => i.status === 'paid')
    .reduce((s: number, i: Invoice) => s + i.total, 0);
  const draftCount = invoices.filter((i: Invoice) => i.status === 'draft').length;

  const kpis = [
    { title: 'Outstanding', value: formatCurrency(outstanding, currency), icon: Clock, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Overdue', value: formatCurrency(overdue, currency), icon: AlertCircle, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
    { title: 'Paid', value: formatCurrency(paid, currency), icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { title: 'Drafts', value: String(draftCount), icon: FileText, iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
  ];

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (activeTab !== 'all') list = list.filter((i: Invoice) => i.status === activeTab);
    return list.sort((a: Invoice, b: Invoice) => b.createdAt.localeCompare(a.createdAt));
  }, [invoices, activeTab]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: invoices.length },
    { key: 'draft', label: 'Draft', count: invoices.filter((i: Invoice) => i.status === 'draft').length },
    { key: 'sent', label: 'Sent', count: invoices.filter((i: Invoice) => i.status === 'sent').length },
    { key: 'partial', label: 'Partial', count: invoices.filter((i: Invoice) => i.status === 'partial').length },
    { key: 'paid', label: 'Paid', count: invoices.filter((i: Invoice) => i.status === 'paid').length },
    { key: 'overdue', label: 'Overdue', count: invoices.filter((i: Invoice) => i.status === 'overdue').length },
    { key: 'cancelled', label: 'Cancelled', count: invoices.filter((i: Invoice) => i.status === 'cancelled').length },
  ];

  function handleMarkSent(id: string) {
    updateInvoice(id, { status: 'sent' });
  }

  function handleMarkCancelled(id: string) {
    updateInvoice(id, { status: 'cancelled' });
  }

  function handleDelete(id: string) {
    deleteInvoice(id);
    setDeleteConfirmId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">Manage accounts receivable and track payments.</p>
        </div>
        {hasPermission('invoices.create') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{k.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{k.value}</p>
              </div>
              <div className={clsx('p-2.5 rounded-xl', k.iconBg)}>
                <k.icon className={clsx('w-5 h-5', k.iconColor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                  activeTab === t.key
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                {t.label}
                <span className={clsx(
                  'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500',
                )}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No invoices found</p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab !== 'all' ? 'Try a different filter or ' : ''}Create a new invoice to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Number</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Customer</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Date</th>
                  <th className="text-left font-medium text-slate-500 px-4 py-3">Due Date</th>
                  <th className="text-right font-medium text-slate-500 px-4 py-3">Amount</th>
                  <th className="text-right font-medium text-slate-500 px-4 py-3">Paid</th>
                  <th className="text-right font-medium text-slate-500 px-4 py-3">Balance</th>
                  <th className="text-center font-medium text-slate-500 px-4 py-3">Status</th>
                  <th className="text-right font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.map((inv: Invoice) => {
                  const balance = inv.total - inv.amountPaid;
                  const cur = inv.currency || currency;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{inv.number}</td>
                      <td className="px-4 py-3 text-slate-700">{inv.contactName}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.date)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(inv.total, cur)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        {formatCurrency(inv.amountPaid, cur)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(balance, cur)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('text-xs font-medium capitalize px-2.5 py-1 rounded-full', statusColor(inv.status))}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(inv.status === 'sent' || inv.status === 'partial' || inv.status === 'overdue') && (
                            <button
                              onClick={() => setPaymentInvoice(inv)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Record Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          {inv.status === 'draft' && (
                            <button
                              onClick={() => handleMarkSent(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as Sent"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setStatementContactId(inv.contactId)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Statement"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkCancelled(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('invoices.delete') && (
                            <button
                              onClick={() => setDeleteConfirmId(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {deleteConfirmId && (
        <ModalBackdrop onClose={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Delete Invoice</h3>
            <p className="text-sm text-slate-500 mb-5">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {viewInvoice && (
        <ViewInvoiceModal
          invoice={viewInvoice}
          currency={currency}
          onClose={() => setViewInvoice(null)}
          onRecordPayment={(inv) => { setViewInvoice(null); setPaymentInvoice(inv); }}
        />
      )}

      {paymentInvoice && (
        <RecordPaymentModal
          invoice={paymentInvoice}
          currency={currency}
          onSubmit={(invoiceId, payment) => {
            recordInvoicePayment(invoiceId, payment);
            setPaymentInvoice(null);
          }}
          onClose={() => setPaymentInvoice(null)}
        />
      )}

      {statementContactId && (
        <CustomerStatementModal
          contactId={statementContactId}
          contacts={contacts}
          invoices={invoices}
          currency={currency}
          onClose={() => setStatementContactId(null)}
        />
      )}

      {showCreateModal && (
        <CreateInvoiceModal
          customers={customers}
          taxRates={taxRates}
          currency={currency}
          existingInvoices={invoices}
          onSave={(data, status) => {
            addInvoice({ ...data, status });
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

/* ========== Shared Modal Backdrop ========== */

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

/* ========== View Invoice Modal ========== */

function ViewInvoiceModal({
  invoice,
  currency,
  onClose,
  onRecordPayment,
}: {
  invoice: Invoice;
  currency: string;
  onClose: () => void;
  onRecordPayment: (inv: Invoice) => void;
}) {
  const cur = invoice.currency || currency;
  const payments = invoice.payments || [];
  const balance = invoice.total - invoice.amountPaid;
  const canPay = invoice.status === 'sent' || invoice.status === 'partial' || invoice.status === 'overdue';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-8 overflow-y-auto pb-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Invoice {invoice.number}</h2>
              <span className={clsx('text-xs font-medium capitalize px-2.5 py-1 rounded-full mt-1 inline-block', statusColor(invoice.status))}>
                {invoice.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Customer</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{invoice.contactName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Currency</p>
              <p className="text-sm text-slate-700 mt-1">{cur}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Invoice Date</p>
              <p className="text-sm text-slate-700 mt-1">{formatDate(invoice.date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Due Date</p>
              <p className="text-sm text-slate-700 mt-1">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Line Items</p>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left font-medium text-slate-500 px-4 py-2">Description</th>
                    <th className="text-right font-medium text-slate-500 px-4 py-2 w-20">Qty</th>
                    <th className="text-right font-medium text-slate-500 px-4 py-2 w-28">Unit Price</th>
                    <th className="text-right font-medium text-slate-500 px-4 py-2 w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item: LineItem) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-slate-700">{item.description}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(item.unitPrice, cur)}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">{formatCurrency(item.amount, cur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal, cur)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax ({invoice.taxRate}%)</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.taxAmount, cur)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-slate-900">{formatCurrency(invoice.total, cur)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-medium text-emerald-600">{formatCurrency(invoice.amountPaid, cur)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">Balance Due</span>
                <span className="font-bold text-slate-900">{formatCurrency(balance, cur)}</span>
              </div>
            </div>
          </div>

          {payments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Payment History</p>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left font-medium text-slate-500 px-4 py-2">Date</th>
                      <th className="text-right font-medium text-slate-500 px-4 py-2">Amount</th>
                      <th className="text-left font-medium text-slate-500 px-4 py-2">Method</th>
                      <th className="text-left font-medium text-slate-500 px-4 py-2">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p: Payment) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2 text-slate-700">{formatDate(p.date)}</td>
                        <td className="px-4 py-2 text-right font-medium text-emerald-600">{formatCurrency(p.amount, cur)}</td>
                        <td className="px-4 py-2 text-slate-600">{p.method}</td>
                        <td className="px-4 py-2 text-slate-500">{p.reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {invoice.notes && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Notes</p>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          {canPay && (
            <button
              onClick={() => onRecordPayment(invoice)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== Record Payment Modal ========== */

function RecordPaymentModal({
  invoice,
  currency,
  onSubmit,
  onClose,
}: {
  invoice: Invoice;
  currency: string;
  onSubmit: (invoiceId: string, payment: Omit<Payment, 'id'>) => void;
  onClose: () => void;
}) {
  const cur = invoice.currency || currency;
  const remainingBalance = invoice.total - invoice.amountPaid;

  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState(String(Math.round(remainingBalance * 100) / 100));
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= remainingBalance && date;

  function handleSubmit() {
    if (!isValid) return;
    onSubmit(invoice.id, { date, amount: numAmount, method, reference, note });
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Record Payment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Invoice {invoice.number} — Balance: {formatCurrency(remainingBalance, cur)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <input
              type="number"
              min="0.01"
              max={remainingBalance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {numAmount > remainingBalance && (
              <p className="text-xs text-red-500 mt-1">Amount cannot exceed remaining balance of {formatCurrency(remainingBalance, cur)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
            <div className="relative">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reference Number</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. CHK-1234, TXN-5678"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional payment note..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              isValid
                ? 'text-white bg-emerald-600 hover:bg-emerald-700'
                : 'text-white bg-emerald-300 cursor-not-allowed',
            )}
          >
            <CheckCircle className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ========== Customer Statement Modal ========== */

function CustomerStatementModal({
  contactId,
  contacts,
  invoices,
  currency,
  onClose,
}: {
  contactId: string;
  contacts: Contact[];
  invoices: Invoice[];
  currency: string;
  onClose: () => void;
}) {
  const contact = contacts.find((c: Contact) => c.id === contactId);
  const customerInvoices = invoices
    .filter((i: Invoice) => i.contactId === contactId && i.status !== 'draft' && i.status !== 'cancelled')
    .sort((a: Invoice, b: Invoice) => a.date.localeCompare(b.date));

  const totalOutstanding = customerInvoices.reduce((s: number, i: Invoice) => s + (i.total - i.amountPaid), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-8 overflow-y-auto pb-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Customer Statement</h2>
            <p className="text-xs text-slate-500 mt-0.5">{contact?.name || 'Unknown'} — {formatDate(todayISO())}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {customerInvoices.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No invoices found for this customer.</p>
            </div>
          ) : (
            <>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left font-medium text-slate-500 px-4 py-2">Date</th>
                      <th className="text-left font-medium text-slate-500 px-4 py-2">Invoice #</th>
                      <th className="text-right font-medium text-slate-500 px-4 py-2">Amount</th>
                      <th className="text-right font-medium text-slate-500 px-4 py-2">Paid</th>
                      <th className="text-right font-medium text-slate-500 px-4 py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerInvoices.map((inv: Invoice) => {
                      const bal = inv.total - inv.amountPaid;
                      const cur = inv.currency || currency;
                      return (
                        <tr key={inv.id}>
                          <td className="px-4 py-2 text-slate-700">{formatDate(inv.date)}</td>
                          <td className="px-4 py-2 font-medium text-slate-900">{inv.number}</td>
                          <td className="px-4 py-2 text-right text-slate-700">{formatCurrency(inv.total, cur)}</td>
                          <td className="px-4 py-2 text-right text-emerald-600">{formatCurrency(inv.amountPaid, cur)}</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatCurrency(bal, cur)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-900">Total Outstanding</td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-slate-900">{formatCurrency(totalOutstanding, currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== Create Invoice Modal ========== */

function CreateInvoiceModal({
  customers,
  taxRates,
  currency,
  existingInvoices,
  onSave,
  onClose,
}: {
  customers: Contact[];
  taxRates: TaxRate[];
  currency: string;
  existingInvoices: Invoice[];
  onSave: (data: Omit<Invoice, 'id' | 'companyId' | 'createdAt' | 'payments'>, status: Invoice['status']) => void;
  onClose: () => void;
}) {
  const nextNumber = useMemo(() => {
    const nums = existingInvoices
      .map((i: Invoice) => { const m = i.number.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 0; })
      .filter((n: number) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `INV-${String(max + 1).padStart(4, '0')}`;
  }, [existingInvoices]);

  const [invNumber, setInvNumber] = useState(nextNumber);
  const [contactId, setContactId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [items, setItems] = useState<LineItem[]>([EMPTY_LINE_ITEM()]);
  const [selectedTaxRateId, setSelectedTaxRateId] = useState(() => {
    const def = taxRates.find((t: TaxRate) => t.isDefault && t.isActive);
    return def?.id || '';
  });
  const [notes, setNotes] = useState('');
  const [showDuplicateWarn, setShowDuplicateWarn] = useState(false);

  const isDuplicate = existingInvoices.some((i: Invoice) => i.number === invNumber);
  const selectedContact = customers.find((c: Contact) => c.id === contactId);
  const selectedTax = taxRates.find((t: TaxRate) => t.id === selectedTaxRateId);
  const taxRatePercent = selectedTax?.rate || 0;

  const subtotal = items.reduce((s: number, it: LineItem) => s + it.amount, 0);
  const taxAmount = Math.round(subtotal * taxRatePercent) / 100;
  const total = subtotal + taxAmount;

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === 'description') {
        item.description = value as string;
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0;
        item.amount = Math.round(item.quantity * item.unitPrice * 100) / 100;
      } else if (field === 'unitPrice') {
        item.unitPrice = Number(value) || 0;
        item.amount = Math.round(item.quantity * item.unitPrice * 100) / 100;
      }
      next[index] = item;
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, EMPTY_LINE_ITEM()]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function buildInvoiceData(): Omit<Invoice, 'id' | 'companyId' | 'createdAt' | 'payments'> {
    return {
      number: invNumber,
      contactId,
      contactName: selectedContact?.name || '',
      date,
      dueDate,
      items,
      subtotal,
      taxRate: taxRatePercent,
      taxAmount,
      total,
      amountPaid: 0,
      status: 'draft',
      notes,
      currency,
    };
  }

  const isValid = contactId && invNumber.trim() && items.some((it: LineItem) => it.description.trim() && it.amount > 0);

  function handleSave(status: Invoice['status']) {
    if (!isValid) return;
    if (isDuplicate && !showDuplicateWarn) {
      setShowDuplicateWarn(true);
      return;
    }
    onSave(buildInvoiceData(), status);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-6 overflow-y-auto pb-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Create Invoice</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {showDuplicateWarn && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Duplicate invoice number detected</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  An invoice with number &ldquo;{invNumber}&rdquo; already exists. Click Save again to proceed anyway, or change the number.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
              <input
                type="text"
                value={invNumber}
                onChange={(e) => { setInvNumber(e.target.value); setShowDuplicateWarn(false); }}
                className={clsx(
                  'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  isDuplicate && !showDuplicateWarn ? 'border-amber-300 bg-amber-50' : 'border-slate-200',
                )}
              />
              {isDuplicate && !showDuplicateWarn && (
                <p className="text-xs text-amber-600 mt-1">This number already exists</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
              <div className="relative">
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a customer</option>
                  {customers.map((c: Contact) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.company ? ` (${c.company})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Line Items</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left font-medium text-slate-500 px-3 py-2">Description</th>
                    <th className="text-right font-medium text-slate-500 px-3 py-2 w-24">Qty</th>
                    <th className="text-right font-medium text-slate-500 px-3 py-2 w-28">Unit Price</th>
                    <th className="text-right font-medium text-slate-500 px-3 py-2 w-28">Amount</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-right border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm text-right border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900">
                        {formatCurrency(item.amount, currency)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className={clsx(
                            'p-1 rounded transition-colors',
                            items.length <= 1
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50',
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addItem}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="sm:w-56">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate</label>
              <div className="relative">
                <select
                  value={selectedTaxRateId}
                  onChange={(e) => setSelectedTaxRateId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Tax</option>
                  {taxRates.filter((t: TaxRate) => t.isActive).map((t: TaxRate) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.rate}%)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax ({taxRatePercent}%)</span>
                <span className="font-medium text-slate-900">{formatCurrency(taxAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Payment terms, thank you message, etc."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={!isValid}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
              isValid
                ? 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                : 'text-slate-400 bg-slate-100 cursor-not-allowed',
            )}
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave('sent')}
            disabled={!isValid}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
              isValid
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-white bg-blue-300 cursor-not-allowed',
            )}
          >
            <Send className="w-4 h-4" />
            Create &amp; Send
          </button>
        </div>
      </div>
    </div>
  );
}
