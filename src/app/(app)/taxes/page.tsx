'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';
import type { TaxRate } from '@/lib/types';
import clsx from 'clsx';
import {
  Plus, X, DollarSign, TrendingDown, Scale, Percent,
  Trash2, Pencil, ToggleLeft, ToggleRight, Check, Globe,
} from 'lucide-react';

type TaxType = TaxRate['type'];

const TAX_TYPES: { value: TaxType; label: string }[] = [
  { value: 'sales_tax', label: 'Sales Tax' },
  { value: 'vat', label: 'VAT' },
  { value: 'gst', label: 'GST' },
];

const typeLabel = (t: TaxType) => TAX_TYPES.find(x => x.value === t)?.label ?? t;

const emptyForm = {
  name: '',
  rate: '',
  type: 'sales_tax' as TaxType,
  region: '',
  isDefault: false,
};

export default function TaxesPage() {
  const {
    myTaxRates, myInvoices, myBills,
    addTaxRate, updateTaxRate, deleteTaxRate,
    auth,
  } = useApp();

  const taxRates = myTaxRates();
  const invoices = myInvoices();
  const bills = myBills();
  const currency = auth.company?.baseCurrency || 'USD';

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', rate: '', region: '' });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const taxCollected = useMemo(
    () => invoices.reduce((s, inv) => s + inv.taxAmount, 0),
    [invoices],
  );
  const taxPaid = useMemo(
    () => bills.reduce((s, b) => s + b.taxAmount, 0),
    [bills],
  );
  const netLiability = taxCollected - taxPaid;
  const activeRatesCount = taxRates.filter(r => r.isActive).length;

  const kpis = [
    { title: 'Tax Collected', value: formatCurrency(taxCollected, currency), icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { title: 'Tax Paid', value: formatCurrency(taxPaid, currency), icon: TrendingDown, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
    { title: 'Net Liability', value: formatCurrency(netLiability, currency), icon: Scale, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { title: 'Active Rates', value: String(activeRatesCount), icon: Percent, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  ];

  const taxSummary = useMemo(() => {
    const map: Record<string, { collected: number; paid: number }> = {};
    for (const t of TAX_TYPES) map[t.value] = { collected: 0, paid: 0 };

    const ratesByType = new Map<string, TaxType>();
    for (const r of taxRates) ratesByType.set(r.id, r.type);

    for (const inv of invoices) {
      if (inv.taxAmount > 0) {
        const matched = taxRates.find(r => r.rate === inv.taxRate);
        const type = matched ? matched.type : 'sales_tax';
        if (!map[type]) map[type] = { collected: 0, paid: 0 };
        map[type].collected += inv.taxAmount;
      }
    }
    for (const b of bills) {
      if (b.taxAmount > 0) {
        const firstRate = taxRates[0];
        const type = firstRate ? firstRate.type : 'sales_tax';
        if (!map[type]) map[type] = { collected: 0, paid: 0 };
        map[type].paid += b.taxAmount;
      }
    }

    return Object.entries(map)
      .map(([type, data]) => ({ type: type as TaxType, ...data, net: data.collected - data.paid }))
      .filter(row => row.collected > 0 || row.paid > 0);
  }, [invoices, bills, taxRates]);

  function openAddModal() {
    setForm(emptyForm);
    setShowAddModal(true);
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rate = parseFloat(form.rate);
    if (!form.name.trim() || isNaN(rate) || rate < 0) return;
    addTaxRate({
      name: form.name.trim(),
      rate,
      type: form.type,
      region: form.region.trim(),
      isDefault: form.isDefault,
      isActive: true,
    });
    setShowAddModal(false);
  }

  function startEdit(r: TaxRate) {
    setEditingId(r.id);
    setEditForm({ name: r.name, rate: String(r.rate), region: r.region });
  }

  function saveEdit(id: string) {
    const rate = parseFloat(editForm.rate);
    if (!editForm.name.trim() || isNaN(rate) || rate < 0) return;
    updateTaxRate(id, {
      name: editForm.name.trim(),
      rate,
      region: editForm.region.trim(),
    });
    setEditingId(null);
  }

  function toggleActive(r: TaxRate) {
    updateTaxRate(r.id, { isActive: !r.isActive });
  }

  function confirmDelete(id: string) {
    deleteTaxRate(id);
    setDeleteConfirmId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tax Management</h1>
          <p className="text-sm text-slate-500">Manage tax rates and view tax summaries</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tax Rate
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

      {/* Tax Rates List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Tax Rates</h2>
        </div>

        {taxRates.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-400">
            No tax rates configured. Click &quot;Add Tax Rate&quot; to get started.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {taxRates.map((r) => (
              <div
                key={r.id}
                className={clsx(
                  'flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 transition-colors',
                  !r.isActive && 'opacity-60',
                )}
              >
                {editingId === r.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                      placeholder="Name"
                    />
                    <input
                      type="number"
                      value={editForm.rate}
                      onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                      className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                      placeholder="Rate %"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="text"
                      value={editForm.region}
                      onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                      placeholder="Region"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => saveEdit(r.id)}
                        className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900">{r.name}</span>
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          {r.rate}%
                        </span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                          {typeLabel(r.type)}
                        </span>
                        {r.region && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Globe className="w-3 h-3" />
                            {r.region}
                          </span>
                        )}
                        {r.isDefault && (
                          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                        <span
                          className={clsx(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            r.isActive
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-slate-500 bg-slate-100',
                          )}
                        >
                          {r.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(r)}
                        title="Edit"
                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(r)}
                        title={r.isActive ? 'Deactivate' : 'Activate'}
                        className={clsx(
                          'p-1.5 rounded-md transition-colors',
                          r.isActive
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100',
                        )}
                      >
                        {r.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      {deleteConfirmId === r.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <span className="text-xs text-red-600 font-medium">Delete?</span>
                          <button
                            onClick={() => confirmDelete(r.id)}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(r.id)}
                          title="Delete"
                          className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {taxRates.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
            {taxRates.length} rate{taxRates.length !== 1 ? 's' : ''} configured &middot; {activeRatesCount} active
          </div>
        )}
      </div>

      {/* Tax Summary Table */}
      {taxSummary.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Tax Summary by Type</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Tax Type</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">Collected</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">Paid</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxSummary.map((row) => (
                  <tr key={row.type} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">{typeLabel(row.type)}</td>
                    <td className="px-5 py-3 text-right text-emerald-700 font-medium">
                      {formatCurrency(row.collected, currency)}
                    </td>
                    <td className="px-5 py-3 text-right text-red-600 font-medium">
                      {formatCurrency(row.paid, currency)}
                    </td>
                    <td
                      className={clsx(
                        'px-5 py-3 text-right font-semibold',
                        row.net >= 0 ? 'text-amber-700' : 'text-emerald-700',
                      )}
                    >
                      {formatCurrency(row.net, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60">
                  <td className="px-5 py-3 font-semibold text-slate-900">Total</td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-700">
                    {formatCurrency(taxCollected, currency)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-red-600">
                    {formatCurrency(taxPaid, currency)}
                  </td>
                  <td
                    className={clsx(
                      'px-5 py-3 text-right font-bold',
                      netLiability >= 0 ? 'text-amber-700' : 'text-emerald-700',
                    )}
                  >
                    {formatCurrency(netLiability, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add Tax Rate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Add Tax Rate</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard VAT"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Rate (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as TaxType })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  >
                    {TAX_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Region</label>
                <input
                  type="text"
                  placeholder="e.g. California, EU, National"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                />
                <span className="text-sm text-slate-700">Set as default tax rate</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Add Tax Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
