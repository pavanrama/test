'use client';

import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, icon: Icon, actionLabel, onAction, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-xl">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
