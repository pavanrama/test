'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  formatCurrency,
  formatDate,
  todayISO,
  statusColor,
  calcStraightLineDepreciation,
  calcAccumulatedDepreciation,
  calcBookValue,
} from '@/lib/utils';
import type { FixedAsset, Account } from '@/lib/types';
import clsx from 'clsx';
import {
  Plus, X, Search, Trash2, Edit3, Eye, Package,
  DollarSign, TrendingDown, BarChart3, Ban, Filter,
} from 'lucide-react';

const CATEGORIES = [
  'Buildings',
  'Vehicles',
  'Equipment',
  'Furniture',
  'Computer Hardware',
  'Computer Software',
  'Leasehold Improvements',
  'Other',
] as const;

type StatusFilter = 'all' | 'active' | 'disposed' | 'fully_depreciated';
type ModalMode = 'add' | 'edit';

const emptyForm = {
  name: '',
  assetNumber: '',
  category: CATEGORIES[0] as string,
  purchaseDate: todayISO(),
  costBasis: '',
  salvageValue: '',
  usefulLifeYears: '',
  depreciationMethod: 'straight_line' as 'straight_line' | 'declining_balance',
  description: '',
  accountId: '',
  depExpenseAccountId: '',
  accumDepAccountId: '',
};

function generateAssetNumber(existing: FixedAsset[]): string {
  const nums = existing
    .map((a) => {
      const m = a.assetNumber.match(/^AST-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(Boolean);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `AST-${String(next).padStart(3, '0')}`;
}

export default function AssetsPage() {
  const {
    myFixedAssets,
    myAccounts,
    addFixedAsset,
    updateFixedAsset,
    deleteFixedAsset,
    auth,
  } = useApp();

  const assets = myFixedAssets();
  const accounts = myAccounts();
  const currency = auth.company?.baseCurrency || 'USD';

  const assetAccounts = useMemo(() => accounts.filter((a: Account) => a.type === 'asset' && a.isActive), [accounts]);
  const expenseAccounts = useMemo(() => accounts.filter((a: Account) => a.type === 'expense' && a.isActive), [accounts]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailAsset, setDetailAsset] = useState<FixedAsset | null>(null);

  const filtered = useMemo(() => {
    let list = assets;
    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter);
    if (categoryFilter !== 'all') list = list.filter((a) => a.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.assetNumber.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
  }, [assets, statusFilter, categoryFilter, search]);

  const totalAssets = assets.length;
  const totalCostBasis = assets.reduce((s, a) => s + a.costBasis, 0);
  const totalBookValue = assets.reduce(
    (s, a) => s + calcBookValue(a.costBasis, a.salvageValue, a.usefulLifeYears, a.purchaseDate),
    0,
  );
  const totalAccumDep = assets.reduce(
    (s, a) => s + calcAccumulatedDepreciation(a.costBasis, a.salvageValue, a.usefulLifeYears, a.purchaseDate),
    0,
  );

  const usedCategories = useMemo(() => [...new Set(assets.map((a) => a.category))].sort(), [assets]);

  const kpis = [
    { title: 'Total Assets', value: String(totalAssets), icon: Package, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Total Cost Basis', value: formatCurrency(totalCostBasis, currency), icon: DollarSign, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { title: 'Total Book Value', value: formatCurrency(totalBookValue, currency), icon: BarChart3, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { title: 'Accumulated Depreciation', value: formatCurrency(totalAccumDep, currency), icon: TrendingDown, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'disposed', label: 'Disposed' },
    { key: 'fully_depreciated', label: 'Fully Depreciated' },
  ];

  function openAddModal() {
    setModalMode('add');
    setEditingId(null);
    setForm({ ...emptyForm, assetNumber: generateAssetNumber(assets) });
    setShowFormModal(true);
  }

  function openEditModal(asset: FixedAsset) {
    setModalMode('edit');
    setEditingId(asset.id);
    setForm({
      name: asset.name,
      assetNumber: asset.assetNumber,
      category: asset.category,
      purchaseDate: asset.purchaseDate,
      costBasis: String(asset.costBasis),
      salvageValue: String(asset.salvageValue),
      usefulLifeYears: String(asset.usefulLifeYears),
      depreciationMethod: asset.depreciationMethod,
      description: asset.description,
      accountId: asset.accountId,
      depExpenseAccountId: asset.depExpenseAccountId,
      accumDepAccountId: asset.accumDepAccountId,
    });
    setShowFormModal(true);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const costBasis = parseFloat(form.costBasis);
    const salvageValue = parseFloat(form.salvageValue);
    const usefulLifeYears = parseInt(form.usefulLifeYears, 10);
    if (!form.name.trim() || isNaN(costBasis) || costBasis <= 0 || isNaN(usefulLifeYears) || usefulLifeYears <= 0) return;

    const payload = {
      name: form.name.trim(),
      assetNumber: form.assetNumber.trim(),
      category: form.category,
      purchaseDate: form.purchaseDate,
      costBasis,
      salvageValue: isNaN(salvageValue) ? 0 : salvageValue,
      usefulLifeYears,
      depreciationMethod: form.depreciationMethod,
      description: form.description.trim(),
      accountId: form.accountId,
      depExpenseAccountId: form.depExpenseAccountId,
      accumDepAccountId: form.accumDepAccountId,
      status: 'active' as const,
    };

    if (modalMode === 'add') {
      addFixedAsset(payload);
    } else if (editingId) {
      updateFixedAsset(editingId, payload);
    }
    setShowFormModal(false);
  }

  function handleDispose(id: string) {
    if (confirm('Are you sure you want to dispose of this asset?')) {
      updateFixedAsset(id, { status: 'disposed' });
    }
  }

  function handleDelete(id: string) {
    if (confirm('Are you sure you want to permanently delete this asset?')) {
      deleteFixedAsset(id);
    }
  }

  function buildDepreciationSchedule(asset: FixedAsset) {
    const rows: { year: number; beginBV: number; annualDep: number; accumDep: number; endBV: number }[] = [];
    const annualDep = calcStraightLineDepreciation(asset.costBasis, asset.salvageValue, asset.usefulLifeYears);
    let accumDep = 0;
    let beginBV = asset.costBasis;
    for (let y = 1; y <= asset.usefulLifeYears; y++) {
      const depThisYear = y === asset.usefulLifeYears ? beginBV - asset.salvageValue : Math.min(annualDep, beginBV - asset.salvageValue);
      accumDep += depThisYear;
      const endBV = asset.costBasis - accumDep;
      rows.push({ year: y, beginBV, annualDep: depThisYear, accumDep, endBV });
      beginBV = endBV;
    }
    return rows;
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300';
  const labelCls = 'block text-xs font-medium text-slate-700 mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fixed Assets</h1>
          <p className="text-sm text-slate-500">Manage fixed assets, depreciation, and disposals</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Asset
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex bg-slate-100 rounded-lg p-1">
          {statusTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={clsx(
                'px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                statusFilter === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
          >
            <option value="all">All Categories</option>
            {usedCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
          />
        </div>
      </div>

      {/* Asset Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Asset #</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Purchase Date</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Cost</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 hidden xl:table-cell">Salvage</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 hidden xl:table-cell">Life (yrs)</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Annual Dep.</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Accum. Dep.</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Book Value</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                    {assets.length === 0
                      ? 'No fixed assets yet. Click "Add Asset" to get started.'
                      : 'No assets match the current filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((asset) => {
                  const annualDep = calcStraightLineDepreciation(asset.costBasis, asset.salvageValue, asset.usefulLifeYears);
                  const accumDep = calcAccumulatedDepreciation(asset.costBasis, asset.salvageValue, asset.usefulLifeYears, asset.purchaseDate);
                  const bookVal = calcBookValue(asset.costBasis, asset.salvageValue, asset.usefulLifeYears, asset.purchaseDate);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{asset.assetNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{asset.name}</td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{asset.category}</td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell whitespace-nowrap">{formatDate(asset.purchaseDate)}</td>
                      <td className="px-4 py-3 text-right text-slate-900 whitespace-nowrap">{formatCurrency(asset.costBasis, currency)}</td>
                      <td className="px-4 py-3 text-right text-slate-600 hidden xl:table-cell whitespace-nowrap">{formatCurrency(asset.salvageValue, currency)}</td>
                      <td className="px-4 py-3 text-right text-slate-600 hidden xl:table-cell">{asset.usefulLifeYears}</td>
                      <td className="px-4 py-3 text-right text-slate-600 hidden lg:table-cell whitespace-nowrap">{formatCurrency(annualDep, currency)}</td>
                      <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell whitespace-nowrap">{formatCurrency(accumDep, currency)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(bookVal, currency)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize', statusColor(asset.status))}>
                          {asset.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setDetailAsset(asset)}
                            title="View Details"
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(asset)}
                            title="Edit"
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {asset.status === 'active' && (
                            <button
                              onClick={() => handleDispose(asset.id)}
                              title="Dispose"
                              className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(asset.id)}
                            title="Delete"
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {filtered.length} of {assets.length} assets</span>
            <span className="font-medium text-slate-700">
              Total Book Value: {formatCurrency(filtered.reduce((s, a) => s + calcBookValue(a.costBasis, a.salvageValue, a.usefulLifeYears, a.purchaseDate), 0), currency)}
            </span>
          </div>
        )}
      </div>

      {/* Add / Edit Asset Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFormModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                {modalMode === 'add' ? 'Add Fixed Asset' : 'Edit Fixed Asset'}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Asset Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Building"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Asset Number</label>
                  <input
                    type="text"
                    required
                    value={form.assetNumber}
                    onChange={(e) => setForm({ ...form, assetNumber: e.target.value })}
                    className={clsx(inputCls, 'font-mono')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Cost Basis</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.costBasis}
                    onChange={(e) => setForm({ ...form, costBasis: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Salvage Value</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.salvageValue}
                    onChange={(e) => setForm({ ...form, salvageValue: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Useful Life (years)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="5"
                    value={form.usefulLifeYears}
                    onChange={(e) => setForm({ ...form, usefulLifeYears: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Depreciation Method</label>
                <select
                  value={form.depreciationMethod}
                  onChange={(e) => setForm({ ...form, depreciationMethod: e.target.value as 'straight_line' | 'declining_balance' })}
                  className={inputCls}
                >
                  <option value="straight_line">Straight-Line</option>
                  <option value="declining_balance">Declining Balance</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the asset..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={clsx(inputCls, 'resize-none')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Asset Account</label>
                  <select
                    value={form.accountId}
                    onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select account...</option>
                    {assetAccounts.map((a: Account) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Dep. Expense Account</label>
                  <select
                    value={form.depExpenseAccountId}
                    onChange={(e) => setForm({ ...form, depExpenseAccountId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select account...</option>
                    {expenseAccounts.map((a: Account) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Accum. Dep. Account</label>
                  <select
                    value={form.accumDepAccountId}
                    onChange={(e) => setForm({ ...form, accumDepAccountId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Select account...</option>
                    {assetAccounts.map((a: Account) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {modalMode === 'add' ? 'Add Asset' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {detailAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailAsset(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{detailAsset.name}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{detailAsset.assetNumber}</p>
              </div>
              <button
                onClick={() => setDetailAsset(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              {/* Detail Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Category', value: detailAsset.category },
                  { label: 'Purchase Date', value: formatDate(detailAsset.purchaseDate) },
                  { label: 'Cost Basis', value: formatCurrency(detailAsset.costBasis, currency) },
                  { label: 'Salvage Value', value: formatCurrency(detailAsset.salvageValue, currency) },
                  { label: 'Useful Life', value: `${detailAsset.usefulLifeYears} years` },
                  { label: 'Depreciation Method', value: detailAsset.depreciationMethod === 'straight_line' ? 'Straight-Line' : 'Declining Balance' },
                  { label: 'Annual Depreciation', value: formatCurrency(calcStraightLineDepreciation(detailAsset.costBasis, detailAsset.salvageValue, detailAsset.usefulLifeYears), currency) },
                  { label: 'Accum. Depreciation', value: formatCurrency(calcAccumulatedDepreciation(detailAsset.costBasis, detailAsset.salvageValue, detailAsset.usefulLifeYears, detailAsset.purchaseDate), currency) },
                  { label: 'Book Value', value: formatCurrency(calcBookValue(detailAsset.costBasis, detailAsset.salvageValue, detailAsset.usefulLifeYears, detailAsset.purchaseDate), currency) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-medium text-slate-500">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Status</p>
                  <span className={clsx('inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize mt-1', statusColor(detailAsset.status))}>
                    {detailAsset.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Asset Account</p>
                  <p className="text-sm text-slate-900 mt-0.5">
                    {accounts.find((a: Account) => a.id === detailAsset.accountId)?.name || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Dep. Expense Account</p>
                  <p className="text-sm text-slate-900 mt-0.5">
                    {accounts.find((a: Account) => a.id === detailAsset.depExpenseAccountId)?.name || '—'}
                  </p>
                </div>
              </div>

              {detailAsset.description && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-700">{detailAsset.description}</p>
                </div>
              )}

              {/* Depreciation Schedule */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Depreciation Schedule</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-200">
                        <th className="text-left px-4 py-2.5 font-medium text-slate-500">Year</th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">Beginning Book Value</th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">Annual Depreciation</th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">Accum. Depreciation</th>
                        <th className="text-right px-4 py-2.5 font-medium text-slate-500">Ending Book Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {buildDepreciationSchedule(detailAsset).map((row) => (
                        <tr key={row.year} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 text-slate-700 font-medium">Year {row.year}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(row.beginBV, currency)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(row.annualDep, currency)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(row.accumDep, currency)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(row.endBV, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
