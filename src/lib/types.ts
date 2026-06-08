export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  taxId: string;
  industry: string;
  baseCurrency: string;
  fiscalYearStart: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  isActive: boolean;
  createdAt: string;
  logo?: string;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'accountant' | 'viewer';
  isActive: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType: string;
  balance: number;
  currency: string;
  description: string;
  isActive: boolean;
}

export interface Invoice {
  id: string;
  companyId: string;
  number: string;
  contactId: string;
  contactName: string;
  date: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
  currency: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  companyId: string;
  number: string;
  contactId: string;
  contactName: string;
  date: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: 'draft' | 'received' | 'approved' | 'paid' | 'overdue';
  category: string;
  currency: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  type: 'customer' | 'vendor' | 'both';
  company: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  currency: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  companyId: string;
  date: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  currency: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  companyId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  currency: string;
  type: 'checking' | 'savings' | 'credit_card';
  isConnected: boolean;
}

export interface BankTransaction {
  id: string;
  companyId: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  isReconciled: boolean;
}

export interface JournalEntry {
  id: string;
  companyId: string;
  date: string;
  description: string;
  reference: string;
  lines: JournalLine[];
  status: 'draft' | 'posted' | 'void';
  createdAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface TaxRate {
  id: string;
  companyId: string;
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

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  email: string;
  ssn: string;
  filingStatus: 'single' | 'married' | 'head_of_household';
  allowances: number;
  payType: 'salary' | 'hourly';
  payRate: number;
  state: string;
  startDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface PayRun {
  id: string;
  companyId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  status: 'draft' | 'processed' | 'paid';
  entries: PayRunEntry[];
  createdAt: string;
}

export interface PayRunEntry {
  employeeId: string;
  employeeName: string;
  hoursWorked: number;
  grossPay: number;
  federalIncomeTax: number;
  stateIncomeTax: number;
  employeeSS: number;
  employeeMedicare: number;
  employerSS: number;
  employerMedicare: number;
  futa: number;
  suta: number;
  totalEmployeeTax: number;
  totalEmployerTax: number;
  netPay: number;
  totalEmployerCost: number;
}

export interface PayrollTaxPayment {
  id: string;
  companyId: string;
  type: 'federal_941' | 'futa_940' | 'suta';
  quarter: string;
  year: number;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid';
  paidDate?: string;
  state?: string;
  createdAt: string;
}

export interface AppData {
  companies: Company[];
  users: User[];
  accounts: Account[];
  invoices: Invoice[];
  bills: Bill[];
  contacts: Contact[];
  expenses: Expense[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  journalEntries: JournalEntry[];
  taxRates: TaxRate[];
  employees: Employee[];
  payRuns: PayRun[];
  payrollTaxPayments: PayrollTaxPayment[];
}
