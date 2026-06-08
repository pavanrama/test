export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue'

export interface Invoice {
  id: string
  customer: string
  amount: number
  dueDate: string
  status: InvoiceStatus
  recurring: boolean
}

export interface Expense {
  id: string
  vendor: string
  category: string
  amount: number
  date: string
  billable: boolean
}

export type BankTransactionType = 'credit' | 'debit'

export interface BankTransaction {
  id: string
  description: string
  amount: number
  date: string
  type: BankTransactionType
  reconciled: boolean
  linkedRecordId?: string
}

export interface AutomationRule {
  id: string
  name: string
  source: string
  enabled: boolean
}

export interface MonthlySnapshot {
  month: string
  income: number
  expenses: number
}

export interface AppData {
  invoices: Invoice[]
  expenses: Expense[]
  bankTransactions: BankTransaction[]
  automations: AutomationRule[]
  snapshots: MonthlySnapshot[]
}

export interface FeatureBenchmark {
  feature: string
  quickbooks: string
  xero: string
  freshbooks: string
  wave: string
  zohoBooks: string
  ourBuild: string
}
