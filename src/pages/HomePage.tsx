import { Link } from 'react-router-dom'

const featureCards = [
  {
    title: 'Automated Bookkeeping',
    summary:
      'Auto-categorize transactions, apply reconciliation suggestions, and keep your books always up to date.',
  },
  {
    title: 'Invoice-to-Cash Engine',
    summary:
      'Create branded invoices, automate reminders, and track payment statuses across your receivables pipeline.',
  },
  {
    title: 'Expense + Receipt Center',
    summary:
      'Capture expenses quickly, mark billable costs, and maintain tax-ready records with category controls.',
  },
  {
    title: 'Tax and Compliance Hub',
    summary:
      'Monitor GST/VAT-like liability estimates, filing readiness, and compliance actions from a single dashboard.',
  },
  {
    title: 'Client Collaboration Portal',
    summary:
      'Share invoice timelines, payment states, and communication logs with customers and finance stakeholders.',
  },
  {
    title: 'Workflow Automation Studio',
    summary:
      'Turn on prebuilt automations for reminders, categorization, estimate conversion, and anomaly flagging.',
  },
]

export function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Built from top accounting platforms</p>
        <h1>Ledgerly: Complete Bookkeeping & Accounting Website</h1>
        <p className="hero-subtitle">
          One unified product experience inspired by best-in-class capabilities from QuickBooks,
          Xero, FreshBooks, Wave, and Zoho Books.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/app">
            Open Accounting Suite
          </Link>
          <Link className="button button-muted" to="/architecture">
            See Architecture Blueprint
          </Link>
        </div>
      </section>

      <section className="feature-grid">
        {featureCards.map((card) => (
          <article key={card.title} className="card">
            <h3>{card.title}</h3>
            <p>{card.summary}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
