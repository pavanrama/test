'use client';

import { useState } from 'react';
import { Globe, RefreshCw, ArrowRightLeft, TrendingUp, Edit2 } from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '@/components/PageHeader';
import { currencies, formatCurrency } from '@/lib/data';

export default function CurrenciesPage() {
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');

  const from = currencies.find(c => c.code === fromCurrency)!;
  const to = currencies.find(c => c.code === toCurrency)!;
  const converted = (parseFloat(amount || '0') / from.exchangeRate) * to.exchangeRate;

  const unrealizedGains = [
    { customer: 'Global Solutions Ltd.', currency: 'GBP', originalRate: 0.78, currentRate: 0.79, amount: 12600, gain: -152.40 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Multi-Currency"
        description="Manage exchange rates and foreign currency transactions"
        icon={Globe}
        actionLabel="Add Currency"
        onAction={() => {}}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Currency Converter</h3>
              <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <RefreshCw className="w-3 h-3" /> Update Rates
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="block text-xs text-slate-500 mb-1">From</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-lg font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); }}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-500" />
              </button>

              <div className="flex-1 w-full">
                <label className="block text-xs text-slate-500 mb-1">To</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2.5 text-lg font-semibold bg-slate-50 border border-slate-200 rounded-lg text-blue-600">
                    {converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              1 {fromCurrency} = {(to.exchangeRate / from.exchangeRate).toFixed(4)} {toCurrency}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Unrealized Gains/Losses</h3>
          <p className="text-xs text-slate-400 mb-4">Due to exchange rate fluctuations</p>
          {unrealizedGains.map((item, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-900">{item.customer}</p>
              <p className="text-xs text-slate-400">{item.currency} {item.amount.toLocaleString()}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">
                  Rate: {item.originalRate} → {item.currentRate}
                </span>
                <span className={clsx(
                  'text-sm font-semibold',
                  item.gain >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {item.gain >= 0 ? '+' : ''}{formatCurrency(item.gain)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Exchange Rates</h3>
          <p className="text-xs text-slate-400">Base currency: USD (US Dollar)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Currency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Symbol</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Rate (vs USD)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">1 USD =</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currencies.map((curr) => (
                <tr key={curr.code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{curr.name}</td>
                  <td className="px-4 py-3.5 text-sm font-mono text-slate-600">{curr.code}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{curr.symbol}</td>
                  <td className="px-4 py-3.5 text-sm font-medium text-right text-slate-900">{curr.exchangeRate.toFixed(4)}</td>
                  <td className="px-4 py-3.5 text-sm text-right text-slate-600">
                    {curr.isBase ? '—' : `${curr.symbol}${curr.exchangeRate.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {curr.isBase ? (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Base</span>
                    ) : (
                      <span className="text-xs text-emerald-600">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {!curr.isBase && (
                      <button className="p-1.5 rounded-md hover:bg-slate-100">
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
