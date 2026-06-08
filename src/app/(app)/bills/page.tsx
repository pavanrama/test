'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, formatDate, todayISO, uid, statusColor } from '@/lib/utils';
import type { Bill, LineItem, Contact, Payment } from '@/lib/types';
import clsx from 'clsx';
import {
  Plus, X, Trash2, Eye, FileText, CheckCircle, DollarSign,
  AlertTriangle, Clock, ChevronDown, Search, Send, XCircle,
  CreditCard, Building2,
} from 'lucide-react';

type StatusFilter = 'all' | Bill['status'];

const CATEGORIES = [
  'Technology', 'Office Supplies', 'Professional Services', 'Insurance',
  'Rent', 'Utilities', 'Marketing', 'Travel', 'Other',
];

const PAYMENT_METHODS = [
  'Bank Transfer', 'Check', 'Credit Card', 'ACH', 'Wire Transfer', 'Cash', 'Other',
];

function emptyLineItem(): LineItem {
  return { id: uid(), description: '', quantity: 1, unitPrice: 0, amount: 0 };
}

export default function BillsPage() {
  const {
    myBills, myContacts, addBill, updateBill, deleteBill, recordBillPayment, auth,
  } = useApp();

  const bills = myBills();
  const contacts = myContacts();
  const currency = auth.company?.baseCurrency || 'USD';
  const currentYear = new Date().getFullYear();

  const vendors = useMemo<Contact[]>(
    () => contacts.filter((c) => c.type === 'vendor' || c.type === 'both'),
    [contacts],
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [payBill, setPayBill] = useState<Bill | null>(null);

  // --- Create form state ---
  const [formContactId, setFormContactId] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formDate, setFormDate] = useState(todayISO());
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formItems, setFormItems] = useState<LineItem[]>([emptyLineItem()]);
  const [formNotes, setFormNotes] = useState('');

  // --- Payment form state ---
  const [payDate, setPayDate] = useState(todayISO());
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS[0]);
  const [payReference, setPayReference] = useState('');
  const [payNote, setPayNote] = useState('');

  // --- KPI calculations ---
  const unpaidTotal = useMemo(
    () =>
      bills
        .filter((b) => !['paid', 'rejected'].includes(b.status))
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

  const approvedTotal = useMemo(
    () =>
      bills
        .filter((b) => b.status === 'approved')
        .reduce((s, b) => s + (b.total - b.amountPaid), 0),
    [bills],
  );

  const paidYTD = useMemo(
    () =>
      bills
        .filter((b) => b.status === 'paid' || b.status === 'partial')
        .reduce((s, b) => {
          const payments = b.payments || [];
          return s + payments
            .filter((p) => new Date(p.date).getFullYear() === currentYear)
            .reduce((ps, p) => ps + p.amount, 0);
        }, 0),
    [bills, currentYear],
  );

  // --- Vendor balances ---
  const vendorBalances = useMemo(() => {
    const map: Record<string, { name: string; balance: number }> = {};
    bills
      .filter((b) => !['paid', 'rejected'].includes(b.status))
      .forEach((b) => {
        const bal = b.total - b.amountPaid;
        if (bal > 0) {
          if (!map[b.contactId]) map[b.contactId] = { name: b.contactName, balance: 0 };
          map[b.contactId].balance += bal;
        }
      });
    return Object.values(map).sort((a, b) => b.balance - a.balance);
  }, [bills]);

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
    { key: 'submitted', label: 'Submitted' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'partial', label: 'Partial' },
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

  function resetForm() {
    setFormContactId('');
    setFormNumber('');
    setFormDate(todayISO());
    setFormDueDate('');
    setFormCategory(CATEGORIES[0]);
    setFormItems([emptyLineItem()]);
    setFormNotes('');
  }

  function resetPayForm(bill?: Bill) {
    setPayDate(todayISO());
    setPayAmount(bill ? String((bill.total - bill.amountPaid).toFixed(2)) : '');
    setPayMethod(PAYMENT_METHODS[0]);
    setPayReference('');
    setPayNote('');
  }

  // --- Create bill ---
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
      notes: formNotes,
    } as Omit<Bill, 'id' | 'companyId' | 'createdAt' | 'payments'>);

    resetForm();
    setShowCreate(false);
  }

  // --- Workflow actions ---
  function handleSubmit(bill: Bill) {
    updateBill(bill.id, { status: 'submitted' });
    if (viewBill?.id === bill.id) setViewBill({ ...bill, status: 'submitted' });
  }

  function handleApprove(bill: Bill) {
    updateBill(bill.id, {
      status: 'approved',
      approvedBy: auth.user?.name || 'Unknown',
      approvedAt: new Date().toISOString(),
    });
    if (viewBill?.id === bill.id) {
      setViewBill({
        ...bill,
        status: 'approved',
        approvedBy: auth.user?.name || 'Unknown',
        approvedAt: new Date().toISOString(),
      } as Bill);
    }
  }

  function handleReject(bill: Bill) {
    updateBill(bill.id, { status: 'rejected' });
    if (viewBill?.id === bill.id) setViewBill({ ...bill, status: 'rejected' });
  }

  function openPayment(bill: Bill) {
    setPayBill(bill);
    resetPayForm(bill);
  }

  function handleRecordPayment() {
    if (!payBill) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    recordBillPayment(payBill.id, {
      date: payDate,
      amount,
      method: payMethod,
      reference: payReference,
      note: payNote,
    });

    setPayBill(null);

    if (viewBill?.id === payBill.id) {
      const freshBills = myBills();
      const updated = freshBills.find((b) => b.id === payBill.id);
      if (updated) setViewBill(updated);
      else setViewBill(null);
    }
  }

  function handleDelete(bill: Bill) {
    if (!confirm(`Delete bill ${bill.number}? This cannot be undone.`)) return;
    deleteBill(bill.id);
    if (viewBill?.id === bill.id) setViewBill(null);
  }

  // --- Refresh view bill from live data ---
  function getViewBillFresh(): Bill | null {
    if (!viewBill) return null;
    return bills.find((b) => b.id === viewBill.id) || viewBill;
  }
  const liveBill = getViewBillFresh();

  // --- KPI cards data ---
  const kpis = [
    {
      title: 'Total Unpaid',
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
      title: 'Approved (Awaiting)',
      value: formatCurrency(approvedTotal, currency),
      icon: CheckCircle,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Paid YTD',
      value: formatCurrency(paidYTD, currency),
      icon: DollarSign,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white';
  const selectCls = 'w-full appearance-none pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5';

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

      {/* Vendor Balances */}
      {vendorBalances.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Outstanding by Vendor</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {vendorBalances.slice(0, 8).map((vb) => (
              <div
                key={vb.name}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100"
              >
                <span className="text-sm text-slate-700 font-medium">{vb.name}</span>
                <span className="text-sm font-bold text-amber-600">
                  {formatCurrency(vb.balance, currency)}
                </span>
              </div>
            ))}
            {vendorBalances.length > 8 && (
              <div className="flex items-center px-3 py-2 text-xs text-slate-400">
                +{vendorBalances.length - 8} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters & Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1 overflow-x-auto">
            {statusTabs.map((tab) => {
              const count = tab.key === 'all' ? bills.length : bills.filter((b) => b.status === tab.key).length;
              return (
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
                  <span className="ml-1.5 text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
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
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Paid</th>
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
                      <td className="px-5 py-3.5 text-sm text-slate-500 text-right">
                        {formatCurrency(bill.amountPaid, bill.currency)}
                      </td>
                      <td className={clsx(
                        'px-5 py-3.5 text-sm font-semibold text-right',
                        balance > 0 ? 'text-amber-600' : 'text-slate-400',
                      )}>
                        {formatCurrency(balance, bill.currency)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={clsx(
                          'inline-block text-xs font-medium capitalize px-2.5 py-1 rounded-full',
                          statusColor(bill.status),
                        )}>
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
                          {bill.status === 'draft' && (
                            <button
                              onClick={() => handleSubmit(bill)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                              title="Submit"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {bill.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => handleApprove(bill)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(bill)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {(bill.status === 'approved' || bill.status === 'partial') && (
                            <button
                              onClick={() => openPayment(bill)}
                              className="p-1.5 text-slate-400 hover:text-violet-600 rounded-md hover:bg-violet-50 transition-colors"
                              title="Record Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          {(bill.status === 'draft' || bill.status === 'rejected') && (
                            <button
                              onClick={() => handleDelete(bill)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Vendor</label>
                  <div className="relative">
                    <select value={formContactId} onChange={(e) => setFormContactId(e.target.value)} className={selectCls}>
                      <option value="">Select vendor…</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Bill Number</label>
                  <input
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    placeholder="BILL-001"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Bill Date</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <div className="relative">
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className={selectCls}>
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

              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes…"
                  className={clsx(inputCls, 'resize-none')}
                />
              </div>
            </div>

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

      {/* ===== Bill Detail Modal ===== */}
      {liveBill && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setViewBill(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">{liveBill.number}</h2>
                <span className={clsx('text-xs font-medium capitalize px-2.5 py-1 rounded-full', statusColor(liveBill.status))}>
                  {liveBill.status}
                </span>
              </div>
              <button onClick={() => setViewBill(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Vendor</p>
                  <p className="text-sm font-medium text-slate-900">{liveBill.contactName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Category</p>
                  <p className="text-sm font-medium text-slate-700">{liveBill.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Bill Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(liveBill.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Due Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(liveBill.dueDate)}</p>
                </div>
              </div>

              {/* Approval info */}
              {liveBill.approvedBy && (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium text-emerald-800">
                      Approved by {liveBill.approvedBy}
                    </span>
                    {liveBill.approvedAt && (
                      <span className="text-emerald-600 ml-1">
                        on {formatDate(liveBill.approvedAt)}
                      </span>
                    )}
                  </div>
                </div>
              )}

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
                    {liveBill.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5 text-sm text-slate-700">{item.description || '—'}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600 text-right">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600 text-right">{formatCurrency(item.unitPrice, liveBill.currency)}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-slate-900 text-right">{formatCurrency(item.amount, liveBill.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-sm max-w-xs ml-auto">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(liveBill.subtotal, liveBill.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(liveBill.taxAmount, liveBill.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatCurrency(liveBill.total, liveBill.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Amount Paid</span>
                  <span>{formatCurrency(liveBill.amountPaid, liveBill.currency)}</span>
                </div>
                <div className={clsx(
                  'flex justify-between font-bold pt-1.5 border-t border-slate-200',
                  liveBill.total - liveBill.amountPaid > 0 ? 'text-amber-600' : 'text-emerald-600',
                )}>
                  <span>Balance Due</span>
                  <span>{formatCurrency(liveBill.total - liveBill.amountPaid, liveBill.currency)}</span>
                </div>
              </div>

              {/* Notes */}
              {liveBill.notes && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Notes</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3">
                    {liveBill.notes}
                  </p>
                </div>
              )}

              {/* Payment History */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">Payment History</h3>
                </div>
                {(!liveBill.payments || liveBill.payments.length === 0) ? (
                  <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100">
                    <DollarSign className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-400">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Date</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Method</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Reference</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {liveBill.payments.map((p: Payment) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2.5 text-sm text-slate-700">{formatDate(p.date)}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-600">{p.method}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-500">{p.reference || '—'}</td>
                            <td className="px-4 py-2.5 text-sm font-semibold text-emerald-700 text-right">
                              {formatCurrency(p.amount, liveBill.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold text-slate-600 text-right">Total Paid</td>
                          <td className="px-4 py-2.5 text-sm font-bold text-slate-900 text-right">
                            {formatCurrency(liveBill.payments.reduce((s: number, p: Payment) => s + p.amount, 0), liveBill.currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    {liveBill.payments.some((p: Payment) => p.note) && (
                      <div className="px-4 py-3 border-t border-slate-100 space-y-1">
                        {liveBill.payments.filter((p: Payment) => p.note).map((p: Payment) => (
                          <p key={p.id} className="text-xs text-slate-400">
                            <span className="font-medium text-slate-500">{formatDate(p.date)}:</span> {p.note}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>Currency: {liveBill.currency}</span>
                <span>Created: {formatDate(liveBill.createdAt)}</span>
              </div>
            </div>

            {/* View modal actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
              <div>
                {(liveBill.status === 'draft' || liveBill.status === 'rejected') && (
                  <button
                    onClick={() => { handleDelete(liveBill); }}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {liveBill.status === 'draft' && (
                  <button
                    onClick={() => handleSubmit(liveBill)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit
                  </button>
                )}
                {liveBill.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => handleReject(liveBill)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(liveBill)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </>
                )}
                {(liveBill.status === 'approved' || liveBill.status === 'partial') && (
                  <button
                    onClick={() => { openPayment(liveBill); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Record Payment Modal ===== */}
      {payBill && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setPayBill(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Record Payment</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {payBill.number} — Balance: {formatCurrency(payBill.total - payBill.amountPaid, payBill.currency)}
                </p>
              </div>
              <button onClick={() => setPayBill(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelCls}>Payment Date</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Amount</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  min="0.01"
                  max={payBill.total - payBill.amountPaid}
                  step="0.01"
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Payment Method</label>
                <div className="relative">
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={selectCls}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Reference</label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="Check #, transaction ID…"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Note</label>
                <textarea
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  rows={2}
                  placeholder="Optional note…"
                  className={clsx(inputCls, 'resize-none')}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setPayBill(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!payDate || !payAmount || parseFloat(payAmount) <= 0}
                className={clsx(
                  'px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors',
                  !payDate || !payAmount || parseFloat(payAmount) <= 0
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700',
                )}
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
