import { useMemo, useState, type FormEvent } from 'react'
import { useBookkeepingStore } from '../hooks/useBookkeepingStore'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const filingChecklist = [
  'Reconcile all bank accounts',
  'Review unpaid invoices and overdue receivables',
  'Validate billable expenses and supporting receipts',
  'Lock period and export P&L, Balance Sheet, Cash Flow',
]

export function AccountingSuitePage() {
  const { data, totals, addInvoice, setInvoiceStatus, addExpense, reconcileTransaction, toggleAutomation } =
    useBookkeepingStore()
  const [invoiceForm, setInvoiceForm] = useState({
    customer: '',
    amount: '',
    dueDate: '',
    recurring: false,
  })
  const [expenseForm, setExpenseForm] = useState({
    vendor: '',
    category: '',
    amount: '',
    date: '',
    billable: false,
  })

  const monthlyMargin = useMemo(() => {
    return data.snapshots.map((entry) => ({
      ...entry,
      margin: entry.income - entry.expenses,
    }))
  }, [data.snapshots])

  const onInvoiceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(invoiceForm.amount)
    if (!invoiceForm.customer || !invoiceForm.dueDate || Number.isNaN(amount) || amount <= 0) {
      return
    }

    addInvoice({
      customer: invoiceForm.customer,
      amount,
      dueDate: invoiceForm.dueDate,
      recurring: invoiceForm.recurring,
    })

    setInvoiceForm({ customer: '', amount: '', dueDate: '', recurring: false })
  }

  const onExpenseSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(expenseForm.amount)
    if (!expenseForm.vendor || !expenseForm.category || !expenseForm.date || Number.isNaN(amount) || amount <= 0) {
      return
    }

    addExpense({
      vendor: expenseForm.vendor,
      category: expenseForm.category,
      amount,
      date: expenseForm.date,
      billable: expenseForm.billable,
    })
    setExpenseForm({ vendor: '', category: '', amount: '', date: '', billable: false })
  }

  const overdueInvoices = data.invoices.filter((invoice) => invoice.status === 'Overdue').length
  const unreconciledCount = data.bankTransactions.filter((txn) => !txn.reconciled).length

  return (
    <main className="page">
      <section className="kpi-grid">
        <article className="kpi-card">
          <p>Revenue</p>
          <h2>{currency.format(totals.revenue)}</h2>
        </article>
        <article className="kpi-card">
          <p>Expenses</p>
          <h2>{currency.format(totals.expenseTotal)}</h2>
        </article>
        <article className="kpi-card">
          <p>Accounts Receivable</p>
          <h2>{currency.format(totals.receivable)}</h2>
        </article>
        <article className="kpi-card">
          <p>Estimated Tax Liability</p>
          <h2>{currency.format(totals.taxEstimate)}</h2>
        </article>
      </section>

      <section className="module-grid">
        <article className="card module-card">
          <h3>Invoice Control Center</h3>
          <form className="inline-form" onSubmit={onInvoiceSubmit}>
            <input
              placeholder="Customer name"
              value={invoiceForm.customer}
              onChange={(event) => setInvoiceForm((prev) => ({ ...prev, customer: event.target.value }))}
            />
            <input
              type="number"
              placeholder="Amount"
              value={invoiceForm.amount}
              onChange={(event) => setInvoiceForm((prev) => ({ ...prev, amount: event.target.value }))}
            />
            <input
              type="date"
              value={invoiceForm.dueDate}
              onChange={(event) => setInvoiceForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
            <label className="check">
              <input
                type="checkbox"
                checked={invoiceForm.recurring}
                onChange={(event) => setInvoiceForm((prev) => ({ ...prev, recurring: event.target.checked }))}
              />
              Recurring
            </label>
            <button className="button button-primary" type="submit">
              Add invoice
            </button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.customer}</td>
                    <td>{currency.format(invoice.amount)}</td>
                    <td>{invoice.dueDate}</td>
                    <td>{invoice.status}</td>
                    <td>
                      {invoice.status !== 'Paid' ? (
                        <button
                          className="button button-tiny"
                          onClick={() => setInvoiceStatus(invoice.id, invoice.status === 'Draft' ? 'Sent' : 'Paid')}
                        >
                          {invoice.status === 'Draft' ? 'Send' : 'Mark paid'}
                        </button>
                      ) : (
                        <span className="tag tag-green">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card module-card">
          <h3>Expense + Receipt Workspace</h3>
          <form className="inline-form" onSubmit={onExpenseSubmit}>
            <input
              placeholder="Vendor"
              value={expenseForm.vendor}
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, vendor: event.target.value }))}
            />
            <input
              placeholder="Category"
              value={expenseForm.category}
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, category: event.target.value }))}
            />
            <input
              type="number"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))}
            />
            <input
              type="date"
              value={expenseForm.date}
              onChange={(event) => setExpenseForm((prev) => ({ ...prev, date: event.target.value }))}
            />
            <label className="check">
              <input
                type="checkbox"
                checked={expenseForm.billable}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, billable: event.target.checked }))}
              />
              Billable
            </label>
            <button className="button button-primary" type="submit">
              Add expense
            </button>
          </form>
          <ul className="list">
            {data.expenses.map((expense) => (
              <li key={expense.id}>
                <div>
                  <strong>{expense.vendor}</strong>
                  <p>
                    {expense.category} • {expense.date}
                  </p>
                </div>
                <div>
                  <strong>{currency.format(expense.amount)}</strong>
                  {expense.billable ? <span className="tag tag-purple">Billable</span> : <span className="tag">Ops</span>}
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="card module-card">
          <h3>Bank Feed & Reconciliation</h3>
          <p>
            Reconciled {totals.reconciledTransactions}/{totals.totalTransactions} transactions.{' '}
            <span className={unreconciledCount > 0 ? 'tag tag-orange' : 'tag tag-green'}>
              {unreconciledCount} pending
            </span>
          </p>
          <ul className="list">
            {data.bankTransactions.map((txn) => (
              <li key={txn.id}>
                <div>
                  <strong>{txn.description}</strong>
                  <p>
                    {txn.date} • {txn.type}
                  </p>
                </div>
                <div className="row-actions">
                  <strong>{currency.format(txn.amount)}</strong>
                  {txn.reconciled ? (
                    <span className="tag tag-green">Reconciled</span>
                  ) : (
                    <button className="button button-tiny" onClick={() => reconcileTransaction(txn.id)}>
                      Reconcile
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="card module-card">
          <h3>Reports & Margin Tracking</h3>
          <div className="chart">
            {monthlyMargin.map((entry) => (
              <div key={entry.month} className="bar-group">
                <div
                  className="bar bar-income"
                  style={{ height: `${Math.max(20, entry.income / 220)}px` }}
                  title={`Income ${currency.format(entry.income)}`}
                />
                <div
                  className="bar bar-expense"
                  style={{ height: `${Math.max(20, entry.expenses / 220)}px` }}
                  title={`Expenses ${currency.format(entry.expenses)}`}
                />
                <span>{entry.month}</span>
              </div>
            ))}
          </div>
          <p>
            Overdue invoices: <strong>{overdueInvoices}</strong> • Net margin trend tracked monthly.
          </p>
        </article>

        <article className="card module-card">
          <h3>Tax & Compliance Center</h3>
          <p>Estimated liability: {currency.format(totals.taxEstimate)}</p>
          <ul className="list checklist">
            {filingChecklist.map((item) => (
              <li key={item}>
                <span className="dot" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card module-card">
          <h3>Client Portal + Automation Studio</h3>
          <p>Client-facing timeline (preview):</p>
          <ul className="list compact">
            {data.invoices.slice(0, 3).map((invoice) => (
              <li key={invoice.id}>
                <span>{invoice.customer}</span>
                <span className="tag">{invoice.status}</span>
              </li>
            ))}
          </ul>
          <h4>Automation Rules</h4>
          <ul className="list compact">
            {data.automations.map((rule) => (
              <li key={rule.id}>
                <div>
                  <strong>{rule.name}</strong>
                  <p>{rule.source}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleAutomation(rule.id)}
                  />
                  <span>{rule.enabled ? 'On' : 'Off'}</span>
                </label>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}
