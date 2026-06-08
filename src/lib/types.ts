export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType: string;
  balance: number;
  currency: string;
  description: string;
  isActive: boolean;
  parentId?: string;
  children?: Account[];
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  entries: JournalEntry[];
  status: 'draft' | 'posted' | 'void';
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
  currency: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface Bill {
  id: string;
  number: string;
  vendorId: string;
  vendorName: string;
  date: string;
  dueDate: string;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: 'draft' | 'received' | 'approved' | 'paid' | 'overdue';
  category: string;
  currency: string;
}

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: string;
  amount: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'customer' | 'vendor' | 'both';
  company: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  taxId: string;
  balance: number;
  currency: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  currency: string;
  type: 'checking' | 'savings' | 'credit_card';
  lastReconciled: string;
  isConnected: boolean;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  isReconciled: boolean;
  matchedTransactionId?: string;
}

export interface Expense {
  id: string;
  date: string;
  vendorName: string;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  accountId: string;
  paymentMethod: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  currency: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'sales_tax' | 'vat' | 'gst';
  region: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
}

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  taxId: string;
  fiscalYearStart: string;
  baseCurrency: string;
  logo?: string;
  industry: string;
}

export interface ReportData {
  title: string;
  period: string;
  sections: ReportSection[];
  total?: number;
}

export interface ReportSection {
  name: string;
  items: ReportItem[];
  total: number;
}

export interface ReportItem {
  name: string;
  amount: number;
  previousAmount?: number;
  children?: ReportItem[];
}

export type NavigationItem = {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavigationItem[];
};
