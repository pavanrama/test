'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  AppData, Company, User, Account, Invoice, Bill,
  Contact, Expense, BankAccount, BankTransaction,
  JournalEntry, TaxRate, Employee, PayRun, PayrollTaxPayment
} from '@/lib/types';
import { uid, todayISO, DEFAULT_ACCOUNTS, PAYROLL_ACCOUNTS } from '@/lib/utils';

const STORAGE_KEY = 'bookkeeper_data';

function loadData(): AppData {
  if (typeof window === 'undefined') return emptyData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return seedData();
}

function emptyData(): AppData {
  return { companies: [], users: [], accounts: [], invoices: [], bills: [], contacts: [], expenses: [], bankAccounts: [], bankTransactions: [], journalEntries: [], taxRates: [], employees: [], payRuns: [], payrollTaxPayments: [] };
}

function seedData(): AppData {
  const platformAdmin: User = {
    id: uid(), companyId: '__platform__', name: 'Platform Admin',
    email: 'admin@bookkeeper.com', password: 'admin123',
    role: 'super_admin', isActive: true, createdAt: todayISO(),
  };
  return { ...emptyData(), users: [platformAdmin] };
}

interface AuthState {
  user: User | null;
  company: Company | null;
}

interface AppContextType {
  data: AppData;
  auth: AuthState;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  registerCompany: (company: Omit<Company, 'id' | 'createdAt' | 'isActive' | 'plan'>, admin: { name: string; email: string; password: string }) => string | null;
  // Company-scoped CRUD
  addAccount: (a: Omit<Account, 'id' | 'companyId'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addInvoice: (i: Omit<Invoice, 'id' | 'companyId' | 'createdAt'>) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addBill: (b: Omit<Bill, 'id' | 'companyId' | 'createdAt'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  addContact: (c: Omit<Contact, 'id' | 'companyId' | 'createdAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addExpense: (e: Omit<Expense, 'id' | 'companyId' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addBankAccount: (b: Omit<BankAccount, 'id' | 'companyId'>) => void;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  addBankTransaction: (t: Omit<BankTransaction, 'id' | 'companyId'>) => void;
  updateBankTransaction: (id: string, updates: Partial<BankTransaction>) => void;
  addJournalEntry: (j: Omit<JournalEntry, 'id' | 'companyId' | 'createdAt'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  addTaxRate: (t: Omit<TaxRate, 'id' | 'companyId'>) => void;
  updateTaxRate: (id: string, updates: Partial<TaxRate>) => void;
  deleteTaxRate: (id: string) => void;
  addEmployee: (e: Omit<Employee, 'id' | 'companyId' | 'createdAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addPayRun: (p: Omit<PayRun, 'id' | 'companyId' | 'createdAt'>) => void;
  updatePayRun: (id: string, updates: Partial<PayRun>) => void;
  deletePayRun: (id: string) => void;
  addPayrollTaxPayment: (p: Omit<PayrollTaxPayment, 'id' | 'companyId' | 'createdAt'>) => void;
  updatePayrollTaxPayment: (id: string, updates: Partial<PayrollTaxPayment>) => void;
  deletePayrollTaxPayment: (id: string) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  // Scoped getters
  myEmployees: () => Employee[];
  myPayRuns: () => PayRun[];
  myPayrollTaxPayments: () => PayrollTaxPayment[];
  myAccounts: () => Account[];
  myInvoices: () => Invoice[];
  myBills: () => Bill[];
  myContacts: () => Contact[];
  myExpenses: () => Expense[];
  myBankAccounts: () => BankAccount[];
  myBankTransactions: () => BankTransaction[];
  myJournalEntries: () => JournalEntry[];
  myTaxRates: () => TaxRate[];
  myUsers: () => User[];
  allCompanies: () => Company[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [auth, setAuth] = useState<AuthState>({ user: null, company: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = loadData();
    setData(d);
    const savedAuth = sessionStorage.getItem('bookkeeper_auth');
    if (savedAuth) {
      try {
        const { userId } = JSON.parse(savedAuth);
        const user = d.users.find(u => u.id === userId);
        if (user) {
          const company = d.companies.find(c => c.id === user.companyId) || null;
          setAuth({ user, company });
        }
      } catch {}
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next: AppData) => {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const cid = auth.company?.id || '';

  const login = (email: string, password: string): string | null => {
    const user = data.users.find(u => u.email === email && u.password === password && u.isActive);
    if (!user) return 'Invalid email or password';
    const company = data.companies.find(c => c.id === user.companyId) || null;
    if (company && !company.isActive) return 'Company account is deactivated';
    setAuth({ user, company });
    sessionStorage.setItem('bookkeeper_auth', JSON.stringify({ userId: user.id }));
    return null;
  };

  const logout = () => {
    setAuth({ user: null, company: null });
    sessionStorage.removeItem('bookkeeper_auth');
  };

  const registerCompany = (
    companyData: Omit<Company, 'id' | 'createdAt' | 'isActive' | 'plan'>,
    admin: { name: string; email: string; password: string }
  ): string | null => {
    if (data.users.find(u => u.email === admin.email)) return 'Email already registered';
    const companyId = uid();
    const newCompany: Company = {
      ...companyData, id: companyId, plan: 'free', isActive: true, createdAt: todayISO(),
    };
    const newUser: User = {
      id: uid(), companyId, name: admin.name, email: admin.email,
      password: admin.password, role: 'admin', isActive: true, createdAt: todayISO(),
    };
    const allDefaultAccounts = [...DEFAULT_ACCOUNTS, ...PAYROLL_ACCOUNTS];
    const defaultAccounts: Account[] = allDefaultAccounts.map(a => ({
      id: uid(), companyId, code: a.code, name: a.name, type: a.type,
      subType: a.subType, balance: 0, currency: companyData.baseCurrency || 'USD',
      description: a.description, isActive: true,
    }));
    const defaultTax: TaxRate = {
      id: uid(), companyId, name: 'Standard Tax', rate: 10,
      type: 'sales_tax', region: companyData.country || 'US', isDefault: true, isActive: true,
    };
    const next = {
      ...data,
      companies: [...data.companies, newCompany],
      users: [...data.users, newUser],
      accounts: [...data.accounts, ...defaultAccounts],
      taxRates: [...data.taxRates, defaultTax],
    };
    persist(next);
    setAuth({ user: newUser, company: newCompany });
    sessionStorage.setItem('bookkeeper_auth', JSON.stringify({ userId: newUser.id }));
    return null;
  };

  // Generic helpers
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const addEntity = (key: keyof AppData, entity: any) => {
    const arr = data[key] as any[];
    persist({ ...data, [key]: [...arr, entity] });
  };
  const updateEntity = (key: keyof AppData, id: string, updates: any) => {
    const arr = data[key] as any[];
    persist({ ...data, [key]: arr.map((e: any) => e.id === id ? { ...e, ...updates } : e) });
  };
  const deleteEntity = (key: keyof AppData, id: string) => {
    const arr = data[key] as any[];
    persist({ ...data, [key]: arr.filter((e: any) => e.id !== id) });
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const ctx: AppContextType = {
    data, auth, login, logout, registerCompany,
    addAccount: (a) => addEntity('accounts', { ...a, id: uid(), companyId: cid } as Account),
    updateAccount: (id, u) => updateEntity('accounts', id, u),
    deleteAccount: (id) => deleteEntity('accounts', id),
    addInvoice: (i) => addEntity('invoices', { ...i, id: uid(), companyId: cid, createdAt: todayISO() } as Invoice),
    updateInvoice: (id, u) => updateEntity('invoices', id, u),
    deleteInvoice: (id) => deleteEntity('invoices', id),
    addBill: (b) => addEntity('bills', { ...b, id: uid(), companyId: cid, createdAt: todayISO() } as Bill),
    updateBill: (id, u) => updateEntity('bills', id, u),
    deleteBill: (id) => deleteEntity('bills', id),
    addContact: (c) => addEntity('contacts', { ...c, id: uid(), companyId: cid, createdAt: todayISO() } as Contact),
    updateContact: (id, u) => updateEntity('contacts', id, u),
    deleteContact: (id) => deleteEntity('contacts', id),
    addExpense: (e) => addEntity('expenses', { ...e, id: uid(), companyId: cid, createdAt: todayISO() } as Expense),
    updateExpense: (id, u) => updateEntity('expenses', id, u),
    deleteExpense: (id) => deleteEntity('expenses', id),
    addBankAccount: (b) => addEntity('bankAccounts', { ...b, id: uid(), companyId: cid } as BankAccount),
    updateBankAccount: (id, u) => updateEntity('bankAccounts', id, u),
    addBankTransaction: (t) => addEntity('bankTransactions', { ...t, id: uid(), companyId: cid } as BankTransaction),
    updateBankTransaction: (id, u) => updateEntity('bankTransactions', id, u),
    addJournalEntry: (j) => addEntity('journalEntries', { ...j, id: uid(), companyId: cid, createdAt: todayISO() } as JournalEntry),
    updateJournalEntry: (id, u) => updateEntity('journalEntries', id, u),
    deleteJournalEntry: (id) => deleteEntity('journalEntries', id),
    addTaxRate: (t) => addEntity('taxRates', { ...t, id: uid(), companyId: cid } as TaxRate),
    updateTaxRate: (id, u) => updateEntity('taxRates', id, u),
    deleteTaxRate: (id) => deleteEntity('taxRates', id),
    addEmployee: (e) => addEntity('employees', { ...e, id: uid(), companyId: cid, createdAt: todayISO() } as Employee),
    updateEmployee: (id, u) => updateEntity('employees', id, u),
    deleteEmployee: (id) => deleteEntity('employees', id),
    addPayRun: (p) => addEntity('payRuns', { ...p, id: uid(), companyId: cid, createdAt: todayISO() } as PayRun),
    updatePayRun: (id, u) => updateEntity('payRuns', id, u),
    deletePayRun: (id) => deleteEntity('payRuns', id),
    addPayrollTaxPayment: (p) => addEntity('payrollTaxPayments', { ...p, id: uid(), companyId: cid, createdAt: todayISO() } as PayrollTaxPayment),
    updatePayrollTaxPayment: (id, u) => updateEntity('payrollTaxPayments', id, u),
    deletePayrollTaxPayment: (id) => deleteEntity('payrollTaxPayments', id),
    updateCompany: (id, u) => updateEntity('companies', id, u),
    addUser: (u) => addEntity('users', { ...u, id: uid(), createdAt: todayISO() } as User),
    updateUser: (id, u) => updateEntity('users', id, u),
    deleteUser: (id) => deleteEntity('users', id),
    myEmployees: () => data.employees.filter(e => e.companyId === cid),
    myPayRuns: () => data.payRuns.filter(p => p.companyId === cid),
    myPayrollTaxPayments: () => data.payrollTaxPayments.filter(p => p.companyId === cid),
    myAccounts: () => data.accounts.filter(a => a.companyId === cid),
    myInvoices: () => data.invoices.filter(i => i.companyId === cid),
    myBills: () => data.bills.filter(b => b.companyId === cid),
    myContacts: () => data.contacts.filter(c => c.companyId === cid),
    myExpenses: () => data.expenses.filter(e => e.companyId === cid),
    myBankAccounts: () => data.bankAccounts.filter(b => b.companyId === cid),
    myBankTransactions: () => data.bankTransactions.filter(t => t.companyId === cid),
    myJournalEntries: () => data.journalEntries.filter(j => j.companyId === cid),
    myTaxRates: () => data.taxRates.filter(t => t.companyId === cid),
    myUsers: () => data.users.filter(u => u.companyId === cid),
    allCompanies: () => data.companies,
  };

  if (!loaded) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
