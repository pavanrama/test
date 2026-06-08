'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency, CURRENCIES } from '@/lib/utils';
import {
  ArrowRightLeft, ArrowDownUp, Globe, BadgeDollarSign, Star,
  CheckCircle2, CircleDot,
} from 'lucide-react';
import clsx from 'clsx';

export default function CurrenciesPage() {
  const { auth } = useApp();
  const baseCurrency = auth.company?.baseCurrency || 'USD';

  const [fromAmount, setFromAmount] = useState('1');
  const [fromCode, setFromCode] = useState(baseCurrency);
  const [toCode, setToCode] = useState(
    CURRENCIES.find(c => c.code !== baseCurrency)?.code || 'EUR'
  );

  const fromCurrency = CURRENCIES.find(c => c.code === fromCode)!;
  const toCurrency = CURRENCIES.find(c => c.code === toCode)!;

  const convertedAmount = useMemo(() => {
    const amt = parseFloat(fromAmount);
    if (isNaN(amt)) return 0;
    const usdValue = amt / fromCurrency.exchangeRate;
    return usdValue * toCurrency.exchangeRate;
  }, [fromAmount, fromCurrency, toCurrency]);

  const rate = useMemo(() => {
    return toCurrency.exchangeRate / fromCurrency.exchangeRate;
  }, [fromCurrency, toCurrency]);

  function handleSwap() {
    setFromCode(toCode);
    setToCode(fromCode);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-100 rounded-xl">
          <Globe className="w-6 h-6 text-slate-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Currencies</h1>
          <p className="text-sm text-slate-500">
            Exchange rates and currency converter &middot; Base: {baseCurrency}
          </p>
        </div>
      </div>

      {/* Converter Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Currency Converter</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* From */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">From</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={fromAmount}
                  onChange={e => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 min-w-0 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={fromCode}
                  onChange={e => setFromCode(e.target.value)}
                  className="w-28 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              className="mt-5 sm:mt-0 p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              title="Swap currencies"
            >
              <ArrowDownUp className="w-4 h-4 text-slate-500" />
            </button>

            {/* To */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">To</label>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0 px-3 py-2.5 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-900 font-medium">
                  {convertedAmount === 0 && fromAmount === ''
                    ? '—'
                    : formatCurrency(convertedAmount, toCode)}
                </div>
                <select
                  value={toCode}
                  onChange={e => setToCode(e.target.value)}
                  className="w-28 px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rate summary */}
          <p className="mt-4 text-xs text-slate-400 text-center">
            1 {fromCode} = {rate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {toCode}
            &nbsp;&middot;&nbsp;
            1 {toCode} = {(1 / rate).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {fromCode}
          </p>
        </div>
      </div>

      {/* Exchange Rate Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Exchange Rates</h2>
          </div>
          <span className="text-xs text-slate-400">{CURRENCIES.length} currencies</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-medium text-slate-500">Code</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Name</th>
                <th className="text-center px-6 py-3 font-medium text-slate-500">Symbol</th>
                <th className="text-right px-6 py-3 font-medium text-slate-500">Rate vs USD</th>
                <th className="text-center px-6 py-3 font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {CURRENCIES.map(c => {
                const isCompanyBase = c.code === baseCurrency;
                return (
                  <tr
                    key={c.code}
                    className={clsx(
                      'border-b border-slate-50 transition-colors hover:bg-slate-50/80',
                      isCompanyBase && 'bg-blue-50/40'
                    )}
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-mono font-semibold text-slate-900">{c.code}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{c.name}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-medium text-sm">
                        {c.symbol}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-800">
                      {c.exchangeRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {c.isBase ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Star className="w-3 h-3" />
                          Base
                        </span>
                      ) : isCompanyBase ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <CircleDot className="w-3 h-3" />
                          Company
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
