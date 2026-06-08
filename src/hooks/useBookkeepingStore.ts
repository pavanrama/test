import { useMemo, useState } from 'react'
import { initialData } from '../data/benchmark'
import type { AppData, Expense, Invoice } from '../types'

const STORAGE_KEY = 'ledgerly-bookkeeping-suite'

function readStoredData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return initialData
  }

  try {
    const parsed = JSON.parse(raw) as AppData
    return parsed
  } catch {
    return initialData
  }
}

function persist(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function buildId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export function useBookkeepingStore() {
  const [data, setData] = useState<AppData>(() => readStoredData())

  const totals = useMemo(() => {
    const revenue = data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const expenseTotal = data.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const receivable = data.invoices
      .filter((invoice) => invoice.status !== 'Paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0)
    const taxEstimate = (revenue - expenseTotal) * 0.18
    const reconciledTransactions = data.bankTransactions.filter((txn) => txn.reconciled).length

    return {
      revenue,
      expenseTotal,
      receivable,
      taxEstimate: Math.max(0, taxEstimate),
      reconciledTransactions,
      totalTransactions: data.bankTransactions.length,
    }
  }, [data])

  const addInvoice = (payload: Omit<Invoice, 'id' | 'status'>) => {
    const next: Invoice = {
      ...payload,
      id: buildId('inv'),
      status: 'Draft',
    }
    setData((current) => {
      const updated = { ...current, invoices: [next, ...current.invoices] }
      persist(updated)
      return updated
    })
  }

  const setInvoiceStatus = (id: string, status: Invoice['status']) => {
    setData((current) => {
      const updated = {
        ...current,
        invoices: current.invoices.map((invoice) =>
          invoice.id === id ? { ...invoice, status } : invoice,
        ),
      }
      persist(updated)
      return updated
    })
  }

  const addExpense = (payload: Omit<Expense, 'id'>) => {
    const next: Expense = {
      ...payload,
      id: buildId('exp'),
    }
    setData((current) => {
      const updated = { ...current, expenses: [next, ...current.expenses] }
      persist(updated)
      return updated
    })
  }

  const reconcileTransaction = (id: string) => {
    setData((current) => {
      const updated = {
        ...current,
        bankTransactions: current.bankTransactions.map((txn) =>
          txn.id === id ? { ...txn, reconciled: true } : txn,
        ),
      }
      persist(updated)
      return updated
    })
  }

  const toggleAutomation = (id: string) => {
    setData((current) => {
      const updated = {
        ...current,
        automations: current.automations.map((rule) =>
          rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
        ),
      }
      persist(updated)
      return updated
    })
  }

  return {
    data,
    totals,
    addInvoice,
    setInvoiceStatus,
    addExpense,
    reconcileTransaction,
    toggleAutomation,
  }
}
