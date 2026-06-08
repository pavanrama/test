import { benchmarkTable } from '../data/benchmark'

const stack = [
  {
    layer: 'Experience Layer',
    details:
      'Responsive React interface with route-based information architecture for marketing, pricing, architecture, and application suite.',
  },
  {
    layer: 'Domain Layer',
    details:
      'Strong accounting entities for invoices, expenses, bank feeds, automations, snapshots, and compliance metrics.',
  },
  {
    layer: 'Workflow Layer',
    details:
      'Rules for invoice lifecycle, payment reminders, reconciliation actions, anomaly handling, and tax readiness checks.',
  },
  {
    layer: 'Insights Layer',
    details:
      'Executive KPIs and profitability snapshots to support finance decisions and stakeholder reporting.',
  },
]

export function ArchitecturePage() {
  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Architecture-first design</p>
        <h2>Reference Architecture for a Modern Accounting Platform</h2>
        <p>
          The build combines deep accounting workflows with service-friendly invoicing, automation,
          and client collaboration patterns. This blueprint is shaped by core strengths observed
          across market-leading bookkeeping products.
        </p>
      </section>

      <section className="stack-grid">
        {stack.map((item) => (
          <article key={item.layer} className="card">
            <h3>{item.layer}</h3>
            <p>{item.details}</p>
          </article>
        ))}
      </section>

      <section className="section">
        <h2>Best-Feature Benchmark Matrix</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>QuickBooks</th>
                <th>Xero</th>
                <th>FreshBooks</th>
                <th>Wave</th>
                <th>Zoho Books</th>
                <th>Our Build</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkTable.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td>{row.quickbooks}</td>
                  <td>{row.xero}</td>
                  <td>{row.freshbooks}</td>
                  <td>{row.wave}</td>
                  <td>{row.zohoBooks}</td>
                  <td>{row.ourBuild}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
