const plans = [
  {
    name: 'Starter',
    price: '$0',
    description: 'For freelancers and early-stage businesses',
    perks: [
      'Invoicing and expense tracking',
      'Manual reconciliation workspace',
      'Basic financial reports',
      'Single business workspace',
    ],
  },
  {
    name: 'Growth',
    price: '$29',
    description: 'For scaling teams needing automation and collaboration',
    perks: [
      'All Starter features',
      'Automated reminders and categorization',
      'Client portal and shared approvals',
      'Advanced profitability snapshots',
    ],
  },
  {
    name: 'Pro Finance',
    price: '$79',
    description: 'For multi-entity operations with compliance depth',
    perks: [
      'All Growth features',
      'Advanced reconciliation controls',
      'Tax center and filing checklist workflows',
      'Audit logs and role-ready operations',
    ],
  },
]

export function PricingPage() {
  return (
    <main className="page">
      <section className="section">
        <p className="eyebrow">Transparent pricing</p>
        <h2>Flexible plans from free bookkeeping to finance operations</h2>
      </section>
      <section className="pricing-grid">
        {plans.map((plan) => (
          <article key={plan.name} className="card price-card">
            <h3>{plan.name}</h3>
            <p className="price">{plan.price}/mo</p>
            <p>{plan.description}</p>
            <ul>
              {plan.perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  )
}
