'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Search, Download, Filter } from 'lucide-react';
import clsx from 'clsx';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  showSearch?: boolean;
  showExport?: boolean;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  searchPlaceholder = 'Search...',
  onRowClick,
  emptyMessage = 'No data available',
  showSearch = true,
  showExport = true,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = data.filter((item) =>
    search === '' || Object.values(item).some(
      (val) => String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {(showSearch || showExport) && (
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
          {showSearch && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            {showExport && (
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-700',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={clsx('flex items-center gap-1', col.align === 'right' && 'justify-end')}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-sm text-slate-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              sorted.map((item) => (
                <tr
                  key={String(item[keyField])}
                  onClick={() => onRowClick?.(item)}
                  className={clsx(
                    'hover:bg-slate-50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-4 py-3.5 text-sm',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.className
                      )}
                    >
                      {col.render ? col.render(item) : String(item[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-500">
          Showing {sorted.length} of {data.length} entries
        </p>
        <div className="flex items-center gap-1">
          <button className="px-3 py-1 text-xs text-slate-600 border border-slate-200 rounded hover:bg-white transition-colors">
            Previous
          </button>
          <button className="px-3 py-1 text-xs text-white bg-blue-600 border border-blue-600 rounded">
            1
          </button>
          <button className="px-3 py-1 text-xs text-slate-600 border border-slate-200 rounded hover:bg-white transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
