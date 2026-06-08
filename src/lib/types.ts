export type UserRole = 'super_admin' | 'admin' | 'accountant' | 'payroll_manager' | 'ap_clerk' | 'ar_clerk' | 'viewer';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin', admin: 'Admin', accountant: 'Accountant',
  payroll_manager: 'Payroll Manager', ap_clerk: 'AP Clerk', ar_clerk: 'AR Clerk', viewer: 'Viewer',
};

export type Permission =
  | 'invoices.view' | 'invoices.create' | 'invoices.edit' | 'invoices.delete' | 'invoices.approve'
  | 'bills.view' | 'bills.create' | 'bills.edit' | 'bills.delete' | 'bills.approve'
  | 'expenses.view' | 'expenses.create' | 'expenses.edit' | 'expenses.approve'
  | 'bank.view' | 'bank.reconcile'
  | 'accounts.view' | 'accounts.edit'
  | 'journal.view' | 'journal.create' | 'journal.post'
  | 'contacts.view' | 'contacts.edit'
  | 'payroll.view' | 'payroll.run' | 'payroll.approve'
  | 'reports.view'
  | 'assets.view' | 'assets.edit'
  | 'settings.view' | 'settings.edit'
  | 'audit.view'
  | 'recurring.view' | 'recurring.edit'
  | 'periods.close';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [],
  admin: [
    'invoices.view','invoices.create','invoices.edit','invoices.delete','invoices.approve',
    'bills.view','bills.create','bills.edit','bills.delete','bills.approve',
    'expenses.view','expenses.create','expenses.edit','expenses.approve',
    'bank.view','bank.reconcile',
    'accounts.view','accounts.edit',
    'journal.view','journal.create','journal.post',
    'contacts.view','contacts.edit',
    'payroll.view','payroll.run','payroll.approve',
    'reports.view','assets.view','assets.edit',
    'settings.view','settings.edit','audit.view',
    'recurring.view','recurring.edit','periods.close',
  ],
  accountant: [
    'invoices.view','invoices.create','invoices.edit','invoices.approve',
    'bills.view','bills.create','bills.edit','bills.approve',
    'expenses.view','expenses.create','expenses.edit','expenses.approve',
    'bank.view','bank.reconcile',
    'accounts.view','accounts.edit',
    'journal.view','journal.create','journal.post',
    'contacts.view','contacts.edit',
    'payroll.view','reports.view','assets.view','assets.edit',
    'audit.view','recurring.view','recurring.edit','periods.close',
  ],
  payroll_manager: [
    'payroll.view','payroll.run','payroll.approve',
    'reports.view','contacts.view',
  ],
  ap_clerk: [
    'bills.view','bills.create','bills.edit',
    'expenses.view','expenses.create','expenses.edit',
    'contacts.view','contacts.edit','reports.view',
  ],
  ar_clerk: [
    'invoices.view','invoices.create','invoices.edit',
    'contacts.view','contacts.edit','reports.view',
  ],
  viewer: [
    'invoices.view','bills.view','expenses.view','bank.view','accounts.view',
    'journal.view','contacts.view','reports.view','assets.view','audit.view',
  ],
};

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
  lockedPeriodEnd?: string;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
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
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  notes: string;
  currency: string;
  createdAt: string;
  payments: Payment[];
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
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'partial' | 'overdue';
  category: string;
  currency: string;
  createdAt: string;
  payments: Payment[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
  note: string;
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
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending';
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
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'posted' | 'void';
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

export interface FixedAsset {
  id: string;
  companyId: string;
  name: string;
  assetNumber: string;
  category: string;
  purchaseDate: string;
  costBasis: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: 'straight_line' | 'declining_balance';
  accountId: string;
  depExpenseAccountId: string;
  accumDepAccountId: string;
  status: 'active' | 'disposed' | 'fully_depreciated';
  description: string;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  companyId: string;
  type: 'invoice' | 'bill' | 'expense' | 'journal';
  name: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  nextDate: string;
  endDate?: string;
  isActive: boolean;
  templateData: string;
  lastGenerated?: string;
  createdAt: string;
}

export type AuditAction = 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'post' | 'void' | 'payment' | 'submit';

export interface AuditEntry {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  entityLabel: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
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
  fixedAssets: FixedAsset[];
  recurringTransactions: RecurringTransaction[];
  auditLog: AuditEntry[];
}
