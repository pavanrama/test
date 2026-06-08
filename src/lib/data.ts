import {
  Account, Invoice, Bill, Contact, BankAccount,
  BankTransaction, Expense, TaxRate, Currency,
  CompanySettings, Transaction
} from './types';

export const companySettings: CompanySettings = {
  name: 'Acme Corporation',
  email: 'admin@acmecorp.com',
  phone: '+1 (555) 123-4567',
  address: '123 Business Ave, Suite 100',
  city: 'San Francisco',
  state: 'CA',
  country: 'United States',
  zipCode: '94105',
  taxId: 'XX-XXXXXXX',
  fiscalYearStart: '01',
  baseCurrency: 'USD',
  industry: 'Technology',
};

export const accounts: Account[] = [
  { id: '1000', code: '1000', name: 'Cash', type: 'asset', subType: 'Current Asset', balance: 45230.50, currency: 'USD', description: 'Main cash account', isActive: true },
  { id: '1010', code: '1010', name: 'Petty Cash', type: 'asset', subType: 'Current Asset', balance: 500.00, currency: 'USD', description: 'Office petty cash', isActive: true },
  { id: '1100', code: '1100', name: 'Accounts Receivable', type: 'asset', subType: 'Current Asset', balance: 28750.00, currency: 'USD', description: 'Trade receivables', isActive: true },
  { id: '1200', code: '1200', name: 'Inventory', type: 'asset', subType: 'Current Asset', balance: 15600.00, currency: 'USD', description: 'Merchandise inventory', isActive: true },
  { id: '1300', code: '1300', name: 'Prepaid Expenses', type: 'asset', subType: 'Current Asset', balance: 3200.00, currency: 'USD', description: 'Prepaid insurance and rent', isActive: true },
  { id: '1500', code: '1500', name: 'Office Equipment', type: 'asset', subType: 'Fixed Asset', balance: 24000.00, currency: 'USD', description: 'Computers and furniture', isActive: true },
  { id: '1510', code: '1510', name: 'Accumulated Depreciation', type: 'asset', subType: 'Fixed Asset', balance: -8000.00, currency: 'USD', description: 'Depreciation on equipment', isActive: true },
  { id: '2000', code: '2000', name: 'Accounts Payable', type: 'liability', subType: 'Current Liability', balance: 12450.00, currency: 'USD', description: 'Trade payables', isActive: true },
  { id: '2100', code: '2100', name: 'Credit Card Payable', type: 'liability', subType: 'Current Liability', balance: 3200.00, currency: 'USD', description: 'Business credit card', isActive: true },
  { id: '2200', code: '2200', name: 'Wages Payable', type: 'liability', subType: 'Current Liability', balance: 8500.00, currency: 'USD', description: 'Accrued wages', isActive: true },
  { id: '2300', code: '2300', name: 'Tax Payable', type: 'liability', subType: 'Current Liability', balance: 4750.00, currency: 'USD', description: 'Sales and income tax', isActive: true },
  { id: '2500', code: '2500', name: 'Bank Loan', type: 'liability', subType: 'Long-term Liability', balance: 50000.00, currency: 'USD', description: 'Business bank loan', isActive: true },
  { id: '3000', code: '3000', name: 'Owner\'s Equity', type: 'equity', subType: 'Equity', balance: 25000.00, currency: 'USD', description: 'Initial investment', isActive: true },
  { id: '3100', code: '3100', name: 'Retained Earnings', type: 'equity', subType: 'Equity', balance: 18380.50, currency: 'USD', description: 'Accumulated profits', isActive: true },
  { id: '4000', code: '4000', name: 'Sales Revenue', type: 'revenue', subType: 'Operating Revenue', balance: 185400.00, currency: 'USD', description: 'Product and service sales', isActive: true },
  { id: '4100', code: '4100', name: 'Service Revenue', type: 'revenue', subType: 'Operating Revenue', balance: 62300.00, currency: 'USD', description: 'Consulting services', isActive: true },
  { id: '4200', code: '4200', name: 'Interest Income', type: 'revenue', subType: 'Other Revenue', balance: 1250.00, currency: 'USD', description: 'Bank interest earned', isActive: true },
  { id: '5000', code: '5000', name: 'Cost of Goods Sold', type: 'expense', subType: 'Cost of Sales', balance: 92700.00, currency: 'USD', description: 'Direct product costs', isActive: true },
  { id: '6000', code: '6000', name: 'Salaries & Wages', type: 'expense', subType: 'Operating Expense', balance: 78000.00, currency: 'USD', description: 'Employee compensation', isActive: true },
  { id: '6100', code: '6100', name: 'Rent Expense', type: 'expense', subType: 'Operating Expense', balance: 24000.00, currency: 'USD', description: 'Office rent', isActive: true },
  { id: '6200', code: '6200', name: 'Utilities', type: 'expense', subType: 'Operating Expense', balance: 4800.00, currency: 'USD', description: 'Electric, water, internet', isActive: true },
  { id: '6300', code: '6300', name: 'Office Supplies', type: 'expense', subType: 'Operating Expense', balance: 2400.00, currency: 'USD', description: 'Stationery and supplies', isActive: true },
  { id: '6400', code: '6400', name: 'Marketing & Advertising', type: 'expense', subType: 'Operating Expense', balance: 12000.00, currency: 'USD', description: 'Ad campaigns and promotions', isActive: true },
  { id: '6500', code: '6500', name: 'Insurance', type: 'expense', subType: 'Operating Expense', balance: 6000.00, currency: 'USD', description: 'Business insurance', isActive: true },
  { id: '6600', code: '6600', name: 'Depreciation', type: 'expense', subType: 'Operating Expense', balance: 4000.00, currency: 'USD', description: 'Equipment depreciation', isActive: true },
  { id: '6700', code: '6700', name: 'Professional Services', type: 'expense', subType: 'Operating Expense', balance: 8500.00, currency: 'USD', description: 'Legal and accounting fees', isActive: true },
  { id: '6800', code: '6800', name: 'Travel & Entertainment', type: 'expense', subType: 'Operating Expense', balance: 5200.00, currency: 'USD', description: 'Business travel expenses', isActive: true },
  { id: '7000', code: '7000', name: 'Interest Expense', type: 'expense', subType: 'Financial Expense', balance: 3600.00, currency: 'USD', description: 'Loan interest payments', isActive: true },
];

export const contacts: Contact[] = [
  { id: 'c1', name: 'TechStart Inc.', email: 'billing@techstart.com', phone: '+1 (555) 234-5678', type: 'customer', company: 'TechStart Inc.', address: '456 Innovation Blvd', city: 'Austin', state: 'TX', country: 'United States', zipCode: '73301', taxId: 'TS-12345', balance: 8500.00, currency: 'USD', notes: 'Enterprise client, net-30 terms', isActive: true, createdAt: '2024-01-15' },
  { id: 'c2', name: 'Global Solutions Ltd.', email: 'ap@globalsolutions.co.uk', phone: '+44 20 7946 0958', type: 'customer', company: 'Global Solutions Ltd.', address: '10 Downing St', city: 'London', state: '', country: 'United Kingdom', zipCode: 'SW1A 2AA', taxId: 'GB123456789', balance: 12250.00, currency: 'GBP', notes: 'International client, multi-currency', isActive: true, createdAt: '2024-02-20' },
  { id: 'c3', name: 'Sunrise Marketing', email: 'hello@sunrisemarketing.com', phone: '+1 (555) 345-6789', type: 'customer', company: 'Sunrise Marketing', address: '789 Creative Lane', city: 'Portland', state: 'OR', country: 'United States', zipCode: '97201', taxId: 'SM-67890', balance: 3200.00, currency: 'USD', notes: 'Small business client', isActive: true, createdAt: '2024-03-10' },
  { id: 'c4', name: 'DataFlow Analytics', email: 'finance@dataflow.io', phone: '+1 (555) 456-7890', type: 'customer', company: 'DataFlow Analytics', address: '321 Data Dr', city: 'Seattle', state: 'WA', country: 'United States', zipCode: '98101', taxId: 'DF-11111', balance: 4800.00, currency: 'USD', notes: 'Quarterly billing', isActive: true, createdAt: '2024-04-05' },
  { id: 'v1', name: 'CloudHost Pro', email: 'billing@cloudhost.com', phone: '+1 (555) 567-8901', type: 'vendor', company: 'CloudHost Pro', address: '100 Server Lane', city: 'Dallas', state: 'TX', country: 'United States', zipCode: '75201', taxId: 'CH-22222', balance: -2400.00, currency: 'USD', notes: 'Hosting provider, monthly billing', isActive: true, createdAt: '2024-01-10' },
  { id: 'v2', name: 'Office Depot', email: 'orders@officedepot.com', phone: '+1 (555) 678-9012', type: 'vendor', company: 'Office Depot', address: '200 Supply Rd', city: 'Chicago', state: 'IL', country: 'United States', zipCode: '60601', taxId: 'OD-33333', balance: -850.00, currency: 'USD', notes: 'Office supplies vendor', isActive: true, createdAt: '2024-02-01' },
  { id: 'v3', name: 'LegalEase Partners', email: 'info@legalease.com', phone: '+1 (555) 789-0123', type: 'vendor', company: 'LegalEase Partners', address: '300 Justice Blvd', city: 'New York', state: 'NY', country: 'United States', zipCode: '10001', taxId: 'LE-44444', balance: -5200.00, currency: 'USD', notes: 'Legal services, quarterly retainer', isActive: true, createdAt: '2024-01-20' },
  { id: 'v4', name: 'InsureAll Corp.', email: 'premiums@insureall.com', phone: '+1 (555) 890-1234', type: 'vendor', company: 'InsureAll Corp.', address: '400 Safety Ave', city: 'Hartford', state: 'CT', country: 'United States', zipCode: '06101', taxId: 'IA-55555', balance: -4000.00, currency: 'USD', notes: 'Business insurance provider', isActive: true, createdAt: '2024-03-01' },
];

export const invoices: Invoice[] = [
  { id: 'inv1', number: 'INV-2024-001', customerId: 'c1', customerName: 'TechStart Inc.', date: '2024-06-01', dueDate: '2024-07-01', items: [{ id: 'i1', description: 'Software Development Services', quantity: 40, unitPrice: 150, taxRate: 8.5, amount: 6000 }, { id: 'i2', description: 'Project Management', quantity: 10, unitPrice: 100, taxRate: 8.5, amount: 1000 }], subtotal: 7000, taxRate: 8.5, taxAmount: 595, total: 7595, amountPaid: 7595, status: 'paid', notes: 'Thank you for your business!', currency: 'USD' },
  { id: 'inv2', number: 'INV-2024-002', customerId: 'c2', customerName: 'Global Solutions Ltd.', date: '2024-06-15', dueDate: '2024-07-15', items: [{ id: 'i3', description: 'API Integration Services', quantity: 60, unitPrice: 175, taxRate: 20, amount: 10500 }], subtotal: 10500, taxRate: 20, taxAmount: 2100, total: 12600, amountPaid: 0, status: 'sent', notes: 'Payment in GBP accepted', currency: 'GBP' },
  { id: 'inv3', number: 'INV-2024-003', customerId: 'c3', customerName: 'Sunrise Marketing', date: '2024-06-20', dueDate: '2024-07-05', items: [{ id: 'i4', description: 'Website Redesign', quantity: 1, unitPrice: 4500, taxRate: 8.5, amount: 4500 }, { id: 'i5', description: 'SEO Optimization', quantity: 1, unitPrice: 1500, taxRate: 8.5, amount: 1500 }], subtotal: 6000, taxRate: 8.5, taxAmount: 510, total: 6510, amountPaid: 3255, status: 'overdue', notes: 'Partial payment received', currency: 'USD' },
  { id: 'inv4', number: 'INV-2024-004', customerId: 'c4', customerName: 'DataFlow Analytics', date: '2024-07-01', dueDate: '2024-07-31', items: [{ id: 'i6', description: 'Data Pipeline Setup', quantity: 1, unitPrice: 8000, taxRate: 8.5, amount: 8000 }, { id: 'i7', description: 'Training Sessions', quantity: 3, unitPrice: 500, taxRate: 8.5, amount: 1500 }], subtotal: 9500, taxRate: 8.5, taxAmount: 807.50, total: 10307.50, amountPaid: 0, status: 'draft', notes: '', currency: 'USD' },
  { id: 'inv5', number: 'INV-2024-005', customerId: 'c1', customerName: 'TechStart Inc.', date: '2024-07-10', dueDate: '2024-08-10', items: [{ id: 'i8', description: 'Monthly Retainer - July', quantity: 1, unitPrice: 5000, taxRate: 8.5, amount: 5000 }], subtotal: 5000, taxRate: 8.5, taxAmount: 425, total: 5425, amountPaid: 0, status: 'sent', notes: 'Monthly retainer agreement', currency: 'USD' },
];

export const bills: Bill[] = [
  { id: 'b1', number: 'BILL-001', vendorId: 'v1', vendorName: 'CloudHost Pro', date: '2024-06-01', dueDate: '2024-06-30', items: [{ id: 'bi1', description: 'Monthly Hosting - June', quantity: 1, unitPrice: 800, accountId: '6200', amount: 800 }], subtotal: 800, taxAmount: 0, total: 800, amountPaid: 800, status: 'paid', category: 'Technology', currency: 'USD' },
  { id: 'b2', number: 'BILL-002', vendorId: 'v2', vendorName: 'Office Depot', date: '2024-06-15', dueDate: '2024-07-15', items: [{ id: 'bi2', description: 'Office Supplies Q2', quantity: 1, unitPrice: 450, accountId: '6300', amount: 450 }, { id: 'bi3', description: 'Printer Cartridges', quantity: 4, unitPrice: 75, accountId: '6300', amount: 300 }], subtotal: 750, taxAmount: 63.75, total: 813.75, amountPaid: 0, status: 'approved', category: 'Office Supplies', currency: 'USD' },
  { id: 'b3', number: 'BILL-003', vendorId: 'v3', vendorName: 'LegalEase Partners', date: '2024-07-01', dueDate: '2024-07-31', items: [{ id: 'bi4', description: 'Legal Retainer - Q3', quantity: 1, unitPrice: 5200, accountId: '6700', amount: 5200 }], subtotal: 5200, taxAmount: 0, total: 5200, amountPaid: 0, status: 'received', category: 'Professional Services', currency: 'USD' },
  { id: 'b4', number: 'BILL-004', vendorId: 'v4', vendorName: 'InsureAll Corp.', date: '2024-07-01', dueDate: '2024-07-15', items: [{ id: 'bi5', description: 'Business Insurance - Annual', quantity: 1, unitPrice: 6000, accountId: '6500', amount: 6000 }], subtotal: 6000, taxAmount: 0, total: 6000, amountPaid: 2000, status: 'overdue', category: 'Insurance', currency: 'USD' },
  { id: 'b5', number: 'BILL-005', vendorId: 'v1', vendorName: 'CloudHost Pro', date: '2024-07-01', dueDate: '2024-07-30', items: [{ id: 'bi6', description: 'Monthly Hosting - July', quantity: 1, unitPrice: 800, accountId: '6200', amount: 800 }, { id: 'bi7', description: 'SSL Certificate Renewal', quantity: 1, unitPrice: 150, accountId: '6200', amount: 150 }], subtotal: 950, taxAmount: 0, total: 950, amountPaid: 0, status: 'draft', category: 'Technology', currency: 'USD' },
];

export const bankAccounts: BankAccount[] = [
  { id: 'ba1', name: 'Business Checking', accountNumber: '****4521', bankName: 'Chase Bank', balance: 45230.50, currency: 'USD', type: 'checking', lastReconciled: '2024-06-30', isConnected: true },
  { id: 'ba2', name: 'Savings Account', accountNumber: '****7832', bankName: 'Chase Bank', balance: 25000.00, currency: 'USD', type: 'savings', lastReconciled: '2024-06-30', isConnected: true },
  { id: 'ba3', name: 'Business Credit Card', accountNumber: '****9156', bankName: 'American Express', balance: -3200.00, currency: 'USD', type: 'credit_card', lastReconciled: '2024-06-15', isConnected: true },
];

export const bankTransactions: BankTransaction[] = [
  { id: 'bt1', bankAccountId: 'ba1', date: '2024-07-10', description: 'Payment from TechStart Inc.', amount: 7595, type: 'credit', category: 'Sales Revenue', isReconciled: true },
  { id: 'bt2', bankAccountId: 'ba1', date: '2024-07-09', description: 'CloudHost Pro - Hosting', amount: 800, type: 'debit', category: 'Technology', isReconciled: true },
  { id: 'bt3', bankAccountId: 'ba1', date: '2024-07-08', description: 'Payroll - July Week 1', amount: 6500, type: 'debit', category: 'Salaries & Wages', isReconciled: false },
  { id: 'bt4', bankAccountId: 'ba1', date: '2024-07-07', description: 'Transfer from Savings', amount: 10000, type: 'credit', category: 'Transfer', isReconciled: false },
  { id: 'bt5', bankAccountId: 'ba1', date: '2024-07-06', description: 'Google Ads Campaign', amount: 2500, type: 'debit', category: 'Marketing', isReconciled: false },
  { id: 'bt6', bankAccountId: 'ba1', date: '2024-07-05', description: 'Sunrise Marketing Payment', amount: 3255, type: 'credit', category: 'Sales Revenue', isReconciled: true },
  { id: 'bt7', bankAccountId: 'ba3', date: '2024-07-08', description: 'Adobe Creative Suite', amount: 54.99, type: 'debit', category: 'Software', isReconciled: false },
  { id: 'bt8', bankAccountId: 'ba3', date: '2024-07-07', description: 'Business Lunch - Client', amount: 125.00, type: 'debit', category: 'Travel & Entertainment', isReconciled: false },
  { id: 'bt9', bankAccountId: 'ba1', date: '2024-07-04', description: 'Office Depot Supplies', amount: 450, type: 'debit', category: 'Office Supplies', isReconciled: true },
  { id: 'bt10', bankAccountId: 'ba1', date: '2024-07-03', description: 'DataFlow Analytics Deposit', amount: 5000, type: 'credit', category: 'Sales Revenue', isReconciled: true },
];

export const expenses: Expense[] = [
  { id: 'e1', date: '2024-07-10', vendorName: 'CloudHost Pro', category: 'Technology', description: 'Monthly hosting services', amount: 800, taxAmount: 0, accountId: '6200', paymentMethod: 'Bank Transfer', status: 'approved', currency: 'USD' },
  { id: 'e2', date: '2024-07-09', vendorName: 'Google', category: 'Marketing', description: 'Google Ads - July Campaign', amount: 2500, taxAmount: 0, accountId: '6400', paymentMethod: 'Credit Card', status: 'approved', currency: 'USD' },
  { id: 'e3', date: '2024-07-08', vendorName: 'Adobe', category: 'Software', description: 'Creative Suite License', amount: 54.99, taxAmount: 4.67, accountId: '6200', paymentMethod: 'Credit Card', status: 'approved', currency: 'USD' },
  { id: 'e4', date: '2024-07-07', vendorName: 'The Capital Grille', category: 'Meals & Entertainment', description: 'Client dinner - DataFlow project', amount: 125, taxAmount: 10.63, accountId: '6800', paymentMethod: 'Credit Card', status: 'pending', currency: 'USD' },
  { id: 'e5', date: '2024-07-06', vendorName: 'Uber', category: 'Travel', description: 'Client site visit transportation', amount: 45.50, taxAmount: 0, accountId: '6800', paymentMethod: 'Credit Card', status: 'pending', currency: 'USD' },
  { id: 'e6', date: '2024-07-05', vendorName: 'Office Depot', category: 'Office Supplies', description: 'Quarterly office supplies', amount: 450, taxAmount: 38.25, accountId: '6300', paymentMethod: 'Bank Transfer', status: 'approved', currency: 'USD' },
  { id: 'e7', date: '2024-07-04', vendorName: 'WeWork', category: 'Rent', description: 'July coworking space', amount: 2000, taxAmount: 0, accountId: '6100', paymentMethod: 'Bank Transfer', status: 'approved', currency: 'USD' },
  { id: 'e8', date: '2024-07-03', vendorName: 'Comcast', category: 'Utilities', description: 'Internet service - July', amount: 199.99, taxAmount: 17.00, accountId: '6200', paymentMethod: 'Auto-debit', status: 'approved', currency: 'USD' },
];

export const transactions: Transaction[] = [
  { id: 't1', date: '2024-07-10', description: 'Payment received from TechStart Inc.', reference: 'INV-2024-001', entries: [{ id: 'je1', accountId: '1000', accountName: 'Cash', debit: 7595, credit: 0, description: 'Cash receipt' }, { id: 'je2', accountId: '1100', accountName: 'Accounts Receivable', debit: 0, credit: 7595, description: 'Clear AR' }], status: 'posted', createdAt: '2024-07-10' },
  { id: 't2', date: '2024-07-09', description: 'Hosting payment to CloudHost Pro', reference: 'BILL-001', entries: [{ id: 'je3', accountId: '6200', accountName: 'Utilities', debit: 800, credit: 0, description: 'Hosting expense' }, { id: 'je4', accountId: '1000', accountName: 'Cash', debit: 0, credit: 800, description: 'Cash payment' }], status: 'posted', createdAt: '2024-07-09' },
  { id: 't3', date: '2024-07-08', description: 'Payroll for July Week 1', reference: 'PAY-2024-027', entries: [{ id: 'je5', accountId: '6000', accountName: 'Salaries & Wages', debit: 6500, credit: 0, description: 'Gross wages' }, { id: 'je6', accountId: '1000', accountName: 'Cash', debit: 0, credit: 6500, description: 'Payroll disbursement' }], status: 'posted', createdAt: '2024-07-08' },
  { id: 't4', date: '2024-07-05', description: 'Partial payment from Sunrise Marketing', reference: 'INV-2024-003', entries: [{ id: 'je7', accountId: '1000', accountName: 'Cash', debit: 3255, credit: 0, description: 'Partial payment' }, { id: 'je8', accountId: '1100', accountName: 'Accounts Receivable', debit: 0, credit: 3255, description: 'Partial AR clearance' }], status: 'posted', createdAt: '2024-07-05' },
  { id: 't5', date: '2024-07-01', description: 'Revenue recognition - June services', reference: 'ADJ-001', entries: [{ id: 'je9', accountId: '1100', accountName: 'Accounts Receivable', debit: 15000, credit: 0, description: 'Service revenue' }, { id: 'je10', accountId: '4100', accountName: 'Service Revenue', debit: 0, credit: 15000, description: 'June consulting' }], status: 'posted', createdAt: '2024-07-01' },
];

export const taxRates: TaxRate[] = [
  { id: 'tr1', name: 'US Sales Tax', rate: 8.5, type: 'sales_tax', region: 'California', isDefault: true, isActive: true },
  { id: 'tr2', name: 'UK VAT Standard', rate: 20, type: 'vat', region: 'United Kingdom', isDefault: false, isActive: true },
  { id: 'tr3', name: 'UK VAT Reduced', rate: 5, type: 'vat', region: 'United Kingdom', isDefault: false, isActive: true },
  { id: 'tr4', name: 'EU VAT', rate: 21, type: 'vat', region: 'European Union', isDefault: false, isActive: true },
  { id: 'tr5', name: 'GST Australia', rate: 10, type: 'gst', region: 'Australia', isDefault: false, isActive: true },
  { id: 'tr6', name: 'Zero Rate', rate: 0, type: 'sales_tax', region: 'Exempt', isDefault: false, isActive: true },
];

export const currencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1, isBase: true },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, isBase: false },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79, isBase: false },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 1.36, isBase: false },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 1.53, isBase: false },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 157.50, isBase: false },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', exchangeRate: 0.89, isBase: false },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 83.50, isBase: false },
];

export const monthlyRevenue = [
  { month: 'Jan', revenue: 32000, expenses: 24000 },
  { month: 'Feb', revenue: 35500, expenses: 25200 },
  { month: 'Mar', revenue: 28900, expenses: 23800 },
  { month: 'Apr', revenue: 41200, expenses: 28500 },
  { month: 'May', revenue: 38700, expenses: 26900 },
  { month: 'Jun', revenue: 45300, expenses: 31200 },
  { month: 'Jul', revenue: 42100, expenses: 29800 },
];

export const expensesByCategory = [
  { name: 'Salaries', value: 78000, color: '#3b82f6' },
  { name: 'Rent', value: 24000, color: '#8b5cf6' },
  { name: 'Marketing', value: 12000, color: '#10b981' },
  { name: 'Technology', value: 9600, color: '#f59e0b' },
  { name: 'Professional', value: 8500, color: '#ef4444' },
  { name: 'Travel', value: 5200, color: '#06b6d4' },
  { name: 'Supplies', value: 2400, color: '#ec4899' },
  { name: 'Other', value: 7500, color: '#64748b' },
];

export const cashFlowData = [
  { month: 'Jan', inflow: 34000, outflow: 26000 },
  { month: 'Feb', inflow: 37500, outflow: 27200 },
  { month: 'Mar', inflow: 30900, outflow: 25800 },
  { month: 'Apr', inflow: 43200, outflow: 30500 },
  { month: 'May', inflow: 40700, outflow: 28900 },
  { month: 'Jun', inflow: 47300, outflow: 33200 },
  { month: 'Jul', inflow: 44100, outflow: 31800 },
];

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const curr = currencies.find(c => c.code === currency);
  const symbol = curr?.symbol || '$';
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    draft: 'bg-gray-100 text-gray-600',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    approved: 'bg-emerald-100 text-emerald-700',
    received: 'bg-blue-100 text-blue-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
    posted: 'bg-emerald-100 text-emerald-700',
    void: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}
