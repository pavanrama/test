'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate, todayISO, uid, statusColor } from '@/lib/utils';
import type { Bill, LineItem, Contact } from '@/lib/types';
import clsx from 'clsx';
import {
  Plus, X, Trash2, Eye, FileText, CheckCircle, DollarSign,
  AlertTriangle, Clock, ChevronDown, Search,
} from 'lucide-react';

type StatusFilter = 'all' | Bill['status'];

const CATEGORIES = [
  'Technology',
  'Office Supplies',
  'Professional Services',
  'Insurance',
  'Rent',
  'Utilities',
  'Marketing',
  'Travel',
  'Other',
];

function emptyLineItem(): LineItem {
  return { id: uid(), description: '', quantity: 1, unitPrice: 0, amount: 0 };
}

export default function BillsPage() {
  const {
    myBills, myContacts, addBill, updateBill, deleteBill, auth,
  } = useApp();

  const bills = myBills();
  const contacts = myContacts();
  const currency = auth.company?.baseCurrency || 'USD';

  const vendors = useMemo<Contact[]>(
    () => contacts.filter((c) => c.type === 'vendor' || c.type === 'both'),
    [contacts],
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewBill, setViewBill] = useState<Bill | null>(null);

  // --- Form state ---
  const [formContactId, setFormContactId] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formDate, setFormDate] = useState(todayISO());
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formItems, setFormItems] = useState<LineItem[]>([emptyLineItem()]);

  // --- KPI calculations ---
  const unpaidTotal = useMemo(
    () =>
      bills
        .filter((b) => ['received', 'approved', 'draft'].includes(b.status))
        .reduce((s, b) => s + (b.total - b.amountPaid), 0),
    [bills],
  );

  const overdueTotal = useMemo(
    () =>
      bills
        .filter((b) => b.status === 'overdue')
        .reduce((s, b) => s + (b.total - b.amountPaid), 0),
    [bills],
  );

  const paidTotal = useMemo(
    () =>
      bills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.total, 0),
    [bills],
  );

  // --- Filtered bills ---
  const filteredBills = useMemo(() => {
    let result = bills;
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.number.toLowerCase().includes(q) ||
          b.contactName.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [bills, statusFilter, search]);

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'received', label: 'Received' },
    { key: 'approved', label: 'Approved' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
  ];

  // --- Line item helpers ---
  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setFormItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === 'description') {
        item.description = value as string;
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0;
        item.amount = item.quantity * item.unitPrice;
      } else if (field === 'unitPrice') {
        item.unitPrice = Number(value) || 0;
        item.amount = item.quantity * item.unitPrice;
      }
      next[index] = item;
      return next;
    });
  }

  function removeLineItem(index: number) {
    setFormItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const formSubtotal = formItems.reduce((s, i) => s + i.amount, 0);
  const formTax = Math.round(formSubtotal * 0.1 * 100) / 100;
  const formTotal = formSubtotal + formTax;

  // --- Reset form ---
  function resetForm() {
    setFormContactId('');
    setFormNumber('');
    setFormDate(todayISO());
    setFormDueDate('');
    setFormCategory(CATEGORIES[0]);
    setFormItems([emptyLineItem()]);
  }

  // --- Submit new bill ---
  function handleCreateBill() {
    const vendor = vendors.find((c) => c.id === formContactId);
    if (!vendor || !formNumber.trim() || !formDate || !formDueDate) return;

    addBill({
      number: formNumber.trim(),
      contactId: vendor.id,
      contactName: vendor.name,
      date: formDate,
      dueDate: formDueDate,
      items: formItems,
      subtotal: formSubtotal,
      taxAmount: formTax,
      total: formTotal,
      amountPaid: 0,
      status: 'draft',
      category: formCategory,
      currency,
    });

    resetForm();
    setShowCreate(false);
  }

  // --- Actions ---
  function handleApprove(bill: Bill) {
    updateBill(bill.id, { status: 'approved' });
  }

  function handleRecordPayment(bill: Bill) {
    const balance = bill.total - bill.amountPaid;
    const input = prompt(`Record payment for ${bill.number}\nBalance: ${formatCurrency(balance, bill.currency)}\n\nEnter payment amount:`);
    if (input === null) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) return;
    const newPaid = Math.min(bill.amountPaid + amount, bill.total);
    const newStatus: Bill['status'] = newPaid >= bill.total ? 'paid' : bill.status;
    updateBill(bill.id, { amountPaid: newPaid, status: newStatus });
  }

  function handleDelete(bill: Bill) {
    if (!confirm(`Delete bill ${bill.number}? This cannot be undone.`)) return;
    deleteBill(bill.id);
    if (viewBill?.id === bill.id) setViewBill(null);
  }

  // --- KPI cards data ---
  const kpis = [
    {
      title: 'Unpaid Bills',
      value: formatCurrency(unpaidTotal, currency),
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Overdue',
      value: formatCurrency(overdueTotal, currency),
      icon: AlertTriangle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Paid',
      value: formatCurrency(paidTotal, currency),
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bills</h1>
          <p className="text-sm text-slate-500">Manage accounts payable and vendor bills</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Bill
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
                  statusFilter === tab.key
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                {tab.label}
                {tab.key !== 'all' && (
                  <span className="ml-1.5 text-[10px]">
                    {bills.filter((b) => b.status === tab.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search bills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        {filteredBills.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No bills found</p>
            <p className="text-xs text-slate-400 mt-1">
              {bills.length === 0 ? 'Create your first bill to get started.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Number</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Balance</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBills.map((bill) => {
                  const balance = bill.total - bill.amountPaid;
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{bill.number}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">{bill.contactName}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{bill.category}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(bill.date)}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(bill.dueDate)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 text-right">
                        {formatCurrency(bill.total, bill.currency)}
                      </td>
                      <td className={clsx('px-5 py-3.5 text-sm font-semibold text-right', balance > 0 ? 'text-amber-600' : 'text-slate-400')}>
                        {formatCurrency(balance, bill.currency)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={clsx('inline-block text-xs font-medium capitalize px-2.5 py-1 rounded-full', statusColor(bill.status))}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setViewBill(bill)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(bill.status === 'received' || bill.status === 'draft') && (
                            <button
                              onClick={() => handleApprove(bill)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {bill.status !== 'paid' && (
                            <button
                              onClick={() => handleRecordPayment(bill)}
                              className="p-1.5 text-slate-400 hover:text-violet-600 rounded-md hover:bg-violet-50 transition-colors"
                              title="Record Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(bill)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ===== Create Bill Modal ===== */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-slate-900">New Bill</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Vendor & Bill Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Vendor</label>
                  <div className="relative">
                    <select
                      value={formContactId}
                      onChange={(e) => setFormContactId(e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select vendor…</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Bill Number</label>
                  <input
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    placeholder="BILL-001"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Bill Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
                <div className="relative">
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Line Items</label>
                  <button
                    type="button"
                    onClick={() => setFormItems((p) => [...p, emptyLineItem()])}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-xs font-medium text-slate-500">Description</th>
                        <th className="px-3 py-2 text-xs font-medium text-slate-500 w-20">Qty</th>
                        <th className="px-3 py-2 text-xs font-medium text-slate-500 w-28">Unit Price</th>
                        <th className="px-3 py-2 text-xs font-medium text-slate-500 w-24 text-right">Amount</th>
                        <th className="px-2 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                              placeholder="Item description"
                              className="w-full py-1.5 text-sm border-0 focus:outline-none focus:ring-0 bg-transparent"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                              min="0"
                              className="w-full py-1.5 text-sm border-0 focus:outline-none focus:ring-0 bg-transparent"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              value={item.unitPrice || ''}
                              onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)}
                              min="0"
                              step="0.01"
                              className="w-full py-1.5 text-sm border-0 focus:outline-none focus:ring-0 bg-transparent"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-right text-sm font-medium text-slate-700">
                            {formatCurrency(item.amount, currency)}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {formItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLineItem(idx)}
                                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-3 space-y-1.5 text-sm max-w-xs ml-auto">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(formSubtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tax (10%)</span>
                    <span>{formatCurrency(formTax, currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Total</span>
                    <span>{formatCurrency(formTotal, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBill}
                disabled={!formContactId || !formNumber.trim() || !formDate || !formDueDate}
                className={clsx(
                  'px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors',
                  !formContactId || !formNumber.trim() || !formDate || !formDueDate
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700',
                )}
              >
                Create Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== View Bill Modal ===== */}
      {viewBill && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setViewBill(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">{viewBill.number}</h2>
                <span className={clsx('text-xs font-medium capitalize px-2.5 py-1 rounded-full', statusColor(viewBill.status))}>
                  {viewBill.status}
                </span>
              </div>
              <button onClick={() => setViewBill(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Bill meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Vendor</p>
                  <p className="text-sm font-medium text-slate-900">{viewBill.contactName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Category</p>
                  <p className="text-sm font-medium text-slate-700">{viewBill.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Bill Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(viewBill.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Due Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(viewBill.dueDate)}</p>
                </div>
              </div>

              {/* Line items table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Description</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-right">Qty</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewBill.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5 text-sm text-slate-700">{item.description}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600 text-right">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600 text-right">{formatCurrency(item.unitPrice, viewBill.currency)}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-slate-900 text-right">{formatCurrency(item.amount, viewBill.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-sm max-w-xs ml-auto">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(viewBill.subtotal, viewBill.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(viewBill.taxAmount, viewBill.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatCurrency(viewBill.total, viewBill.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Amount Paid</span>
                  <span>{formatCurrency(viewBill.amountPaid, viewBill.currency)}</span>
                </div>
                <div className={clsx('flex justify-between font-bold pt-1.5 border-t border-slate-200', viewBill.total - viewBill.amountPaid > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                  <span>Balance Due</span>
                  <span>{formatCurrency(viewBill.total - viewBill.amountPaid, viewBill.currency)}</span>
                </div>
              </div>

              {/* Currency & created */}
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>Currency: {viewBill.currency}</span>
                <span>Created: {formatDate(viewBill.createdAt)}</span>
              </div>
            </div>

            {/* View modal actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
              <button
                onClick={() => { handleDelete(viewBill); }}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
              <div className="flex items-center gap-2">
                {(viewBill.status === 'received' || viewBill.status === 'draft') && (
                  <button
                    onClick={() => { handleApprove(viewBill); setViewBill({ ...viewBill, status: 'approved' }); }}
                    className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Approve
                  </button>
                )}
                {viewBill.status !== 'paid' && (
                  <button
                    onClick={() => { handleRecordPayment(viewBill); setViewBill(null); }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
