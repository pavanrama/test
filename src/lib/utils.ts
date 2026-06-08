import type { Currency } from './types';

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1, isBase: true },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, isBase: false },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79, isBase: false },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 1.36, isBase: false },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 1.53, isBase: false },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 157.50, isBase: false },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 83.50, isBase: false },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', exchangeRate: 0.89, isBase: false },
];

export function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const curr = CURRENCIES.find(c => c.code === currencyCode);
  const symbol = curr?.symbol || '$';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    sent: 'bg-blue-100 text-blue-700',
    draft: 'bg-gray-100 text-gray-600',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    approved: 'bg-emerald-100 text-emerald-700',
    received: 'bg-blue-100 text-blue-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
    posted: 'bg-emerald-100 text-emerald-700',
    void: 'bg-gray-100 text-gray-500',
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-500',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export const DEFAULT_ACCOUNTS = [
  { code: '1000', name: 'Cash', type: 'asset' as const, subType: 'Current Asset', description: 'Main cash account' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset' as const, subType: 'Current Asset', description: 'Trade receivables' },
  { code: '1200', name: 'Inventory', type: 'asset' as const, subType: 'Current Asset', description: 'Merchandise inventory' },
  { code: '1300', name: 'Prepaid Expenses', type: 'asset' as const, subType: 'Current Asset', description: 'Prepaid items' },
  { code: '1500', name: 'Equipment', type: 'asset' as const, subType: 'Fixed Asset', description: 'Office equipment' },
  { code: '2000', name: 'Accounts Payable', type: 'liability' as const, subType: 'Current Liability', description: 'Trade payables' },
  { code: '2100', name: 'Credit Card Payable', type: 'liability' as const, subType: 'Current Liability', description: 'Credit card balance' },
  { code: '2200', name: 'Wages Payable', type: 'liability' as const, subType: 'Current Liability', description: 'Accrued wages' },
  { code: '2300', name: 'Tax Payable', type: 'liability' as const, subType: 'Current Liability', description: 'Tax obligations' },
  { code: '2500', name: 'Bank Loan', type: 'liability' as const, subType: 'Long-term Liability', description: 'Business loan' },
  { code: '3000', name: "Owner's Equity", type: 'equity' as const, subType: 'Equity', description: 'Initial investment' },
  { code: '3100', name: 'Retained Earnings', type: 'equity' as const, subType: 'Equity', description: 'Accumulated profits' },
  { code: '4000', name: 'Sales Revenue', type: 'revenue' as const, subType: 'Operating Revenue', description: 'Product/service sales' },
  { code: '4100', name: 'Service Revenue', type: 'revenue' as const, subType: 'Operating Revenue', description: 'Consulting services' },
  { code: '4200', name: 'Interest Income', type: 'revenue' as const, subType: 'Other Revenue', description: 'Bank interest earned' },
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense' as const, subType: 'Cost of Sales', description: 'Direct product costs' },
  { code: '6000', name: 'Salaries & Wages', type: 'expense' as const, subType: 'Operating Expense', description: 'Employee compensation' },
  { code: '6100', name: 'Rent Expense', type: 'expense' as const, subType: 'Operating Expense', description: 'Office rent' },
  { code: '6200', name: 'Utilities', type: 'expense' as const, subType: 'Operating Expense', description: 'Electric, water, internet' },
  { code: '6300', name: 'Office Supplies', type: 'expense' as const, subType: 'Operating Expense', description: 'Stationery and supplies' },
  { code: '6400', name: 'Marketing', type: 'expense' as const, subType: 'Operating Expense', description: 'Advertising and promos' },
  { code: '6500', name: 'Insurance', type: 'expense' as const, subType: 'Operating Expense', description: 'Business insurance' },
  { code: '6600', name: 'Depreciation', type: 'expense' as const, subType: 'Operating Expense', description: 'Asset depreciation' },
  { code: '6700', name: 'Professional Services', type: 'expense' as const, subType: 'Operating Expense', description: 'Legal and accounting' },
  { code: '6800', name: 'Travel & Entertainment', type: 'expense' as const, subType: 'Operating Expense', description: 'Business travel' },
  { code: '7000', name: 'Interest Expense', type: 'expense' as const, subType: 'Financial Expense', description: 'Loan interest' },
];
