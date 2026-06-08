'use client';

import { useState } from 'react';
import {
  CreditCard, Upload, Tag, DollarSign, TrendingUp, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { expenses, formatCurrency, formatDate, expensesByCategory } from '@/lib/data';

export default function ExpensesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.status === filter);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const avgPerDay = totalExpenses / 30;

  const byCategoryData = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const categoryChartData = Object.entries(byCategoryData).map(([name, value]) => ({
    name, value
  }));

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#64748b'];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Expense Tracking"
        description="Track and categorize all business expenses"
        icon={CreditCard}
        actionLabel="Add Expense"
        onAction={() => setShowCreate(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-slate-500">Total Expenses</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-slate-400 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-medium text-slate-500">Daily Average</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(avgPerDay)}</p>
          <p className="text-xs text-slate-400 mt-1">Based on 30 days</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-slate-500">Categories</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{Object.keys(byCategoryData).length}</p>
          <p className="text-xs text-slate-400 mt-1">Active categories</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-slate-500">Pending Review</span>
          </div>
          <p className="text-xl font-bold text-amber-600">{expenses.filter(e => e.status === 'pending').length}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                {categoryChartData.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {categoryChartData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="text-slate-600">{cat.name}</span>
                </div>
                <span className="font-medium text-slate-900">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                  filter === status ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(exp.date)}</td>
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{exp.vendorName}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{exp.description}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{exp.paymentMethod}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-900 text-right">{formatCurrency(exp.amount)}</td>
                  <td className="px-4 py-3.5 text-center"><StatusBadge status={exp.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-in p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Expense</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input type="number" placeholder="0.00" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                <input type="text" placeholder="Vendor name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Technology</option>
                    <option>Marketing</option>
                    <option>Software</option>
                    <option>Meals & Entertainment</option>
                    <option>Travel</option>
                    <option>Office Supplies</option>
                    <option>Rent</option>
                    <option>Utilities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Credit Card</option>
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Auto-debit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input type="text" placeholder="What was this expense for?" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Upload receipt</p>
                <p className="text-xs text-slate-400 mt-1">Drag & drop or click to browse</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Expense</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
