'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export default function KPICard({ title, value, change, changeLabel, icon: Icon, iconColor, iconBg }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            )}
            <span className={clsx('text-xs font-semibold', isPositive ? 'text-emerald-600' : 'text-red-600')}>
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-slate-400">{changeLabel}</span>
          </div>
        </div>
        <div className={clsx('p-3 rounded-xl', iconBg)}>
          <Icon className={clsx('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  );
}
