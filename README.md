# BookKeeper Pro — Modern Accounting & Bookkeeping Platform

A comprehensive, modern bookkeeping and accounting web application built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Recharts**. Inspired by the best features from QuickBooks, Xero, FreshBooks, and Wave.

## Features

### Dashboard
- KPI cards with period-over-period comparisons (revenue, net income, AR, cash balance)
- Revenue vs Expenses area chart
- Expense breakdown pie chart
- Cash flow bar chart
- Bank account summaries
- Recent invoices and transactions
- Action alerts for overdue invoices and unreconciled transactions

### Invoicing (inspired by FreshBooks)
- Create, view, and send professional invoices
- Line item management with quantity, price, and tax
- Status tracking: Draft → Sent → Viewed → Paid / Overdue
- Invoice detail modal with payment history
- Outstanding, overdue, and paid summaries

### Bills & Accounts Payable
- Record and track vendor bills
- Approval workflows (Draft → Received → Approved → Paid)
- Bill detail view with line items
- Payment recording
- Category-based organization

### Expense Tracking
- Track expenses by vendor, category, and payment method
- Receipt upload support
- Expense approval workflow
- Category breakdown charts (bar + pie)
- Daily average and pending review metrics

### Bank & Reconciliation (inspired by Xero)
- Multiple bank account management
- Transaction reconciliation workflow with checkbox selection
- Reconciled vs unreconciled split view
- Reconciliation summary with statement balance matching
- Bank connection status indicators

### Chart of Accounts
- Full account hierarchy: Assets, Liabilities, Equity, Revenue, Expenses
- Expandable/collapsible account groups
- Account codes, sub-types, and descriptions
- Active/inactive status management
- Add new account modal
- Summary totals for assets, liabilities, and equity

### Journal Entries & General Ledger
- View all journal entries with expandable detail
- Double-entry format (debit/credit)
- Create new entries with multiple line items
- Transaction reference tracking
- Status management (Draft, Posted, Void)

### Financial Reports (inspired by QuickBooks depth)
- **Profit & Loss Statement** — Revenue and expense detail with net income
- **Balance Sheet** — Assets, liabilities, and equity with sub-type breakdown
- **Cash Flow Statement** — Operating, investing, and financing activities
- **Trial Balance** — All accounts with debit/credit columns
- **AR Aging Report** — Receivables by customer and age bucket
- **AP Aging Report** — Payables by vendor and age bucket
- Revenue trend charts and period selection

### Contacts / CRM
- Customer and vendor management
- Contact detail view with address, tax ID, and balance
- Filter by type (Customer / Vendor / All)
- Add new contact with full address and tax information
- Balance tracking (receivable vs payable)

### Tax Management
- Configure tax rates by type (Sales Tax, VAT, GST)
- Regional tax rate management
- Tax filing history and upcoming filings
- Tax collected vs paid summary
- Net tax liability calculation
- Tax summary report by tax type

### Multi-Currency (inspired by Xero)
- Live currency converter with swap functionality
- Exchange rate table for 8 currencies
- Unrealized gains/losses tracking
- Base currency configuration
- Rate editing support

### Settings
- **Company Profile** — Logo, name, industry, address, tax ID, base currency, fiscal year
- **Users & Roles** — Team member management with role assignment
- **Notifications** — Email and push notification preferences
- **Security** — 2FA, session timeout, login history, password change
- **Preferences** — Date format, number format, timezone, language

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Utilities**: clsx, date-fns

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Dashboard
│   ├── layout.tsx         # Root layout with sidebar
│   ├── accounts/          # Chart of Accounts
│   ├── invoices/          # Invoicing
│   ├── bills/             # Bills & AP
│   ├── expenses/          # Expense Tracking
│   ├── bank/              # Bank & Reconciliation
│   ├── reports/           # Financial Reports
│   ├── journal/           # Journal Entries
│   ├── contacts/          # Contact Management
│   ├── taxes/             # Tax Management
│   ├── currencies/        # Multi-Currency
│   └── settings/          # Settings
├── components/
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── TopBar.tsx         # Top bar with search & actions
│   ├── KPICard.tsx        # KPI metric card
│   ├── StatusBadge.tsx    # Status indicator badge
│   ├── PageHeader.tsx     # Page header component
│   └── DataTable.tsx      # Reusable data table
└── lib/
    ├── types.ts           # TypeScript type definitions
    └── data.ts            # Mock data and utilities
```

## Build

```bash
npm run build
```

All 12 pages statically generate with zero TypeScript errors.
