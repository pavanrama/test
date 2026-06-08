# BookKeeper Pro — Multi-Company Accounting Platform

A fully functional, multi-tenant bookkeeping and accounting SaaS platform. Multiple companies can register, each with their own isolated data, admin controls, team management, and full accounting capabilities.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Platform Admin
- Email: `admin@bookkeeper.com`
- Password: `admin123`

### Register a New Company
1. Go to `/register`
2. Fill in company details and admin account
3. Start managing your books immediately

## Architecture

**Multi-tenant SaaS** — Each company gets:
- Isolated data (all records scoped by `companyId`)
- Auto-provisioned Chart of Accounts (26 accounts)
- Default tax rate
- Admin user with full control
- Team member management with role-based access

**Data persistence** — localStorage with JSON serialization. All CRUD operations persist immediately.

**Authentication** — Session-based auth with role-based routing:
- `super_admin` — Platform admin, manages all companies
- `admin` — Company admin, full access to company data
- `accountant` — Can manage transactions and reports
- `viewer` — Read-only access

## Features

### Public Pages
- **Landing Page** (`/`) — Feature showcase, registration CTA
- **Register** (`/register`) — 2-step company registration wizard
- **Login** (`/login`) — Authentication with error handling

### Company Dashboard (`/dashboard`)
- KPI cards: Revenue, Receivable, Payable, Cash Balance
- Recent invoices and expenses
- Bank account summaries
- Action alerts for overdue items

### Invoicing (`/invoices`)
- Create invoices with dynamic line items
- Auto-generated invoice numbers
- Tax rate selection from company's configured rates
- Status workflow: Draft → Sent → Paid / Overdue
- Mark as Sent, Mark as Paid, Delete with confirmation

### Bills & AP (`/bills`)
- Record vendor bills with line items
- Category-based organization
- Approval workflow: Draft → Received → Approved → Paid
- Record partial payments

### Expense Tracking (`/expenses`)
- Track by vendor, category, payment method
- Approval workflow: Pending → Approved / Rejected
- Category breakdown summary
- 11 expense categories, 4 payment methods

### Bank & Reconciliation (`/bank`)
- Multiple bank accounts (Checking, Savings, Credit Card)
- Add transactions with auto-balance updates
- Interactive reconciliation with checkboxes
- Split view: Unreconciled vs Reconciled
- Select-all and batch reconcile

### Chart of Accounts (`/accounts`)
- 26 auto-provisioned accounts across 5 types
- Expandable/collapsible account groups
- Add, edit, toggle active/inactive, delete
- Balance adjustment capability
- Summary totals for Assets, Liabilities, Equity

### Journal Entries (`/journal`)
- Double-entry bookkeeping with debit/credit validation
- Dynamic line items with account selection
- Balance validation (debits must equal credits)
- Status: Draft → Posted → Void

### Financial Reports (`/reports`)
- **Profit & Loss** — Revenue vs expenses from real account data
- **Balance Sheet** — Assets = Liabilities + Equity verification
- **AR Aging** — Customer receivables by age bucket (Current, 31-60, 61-90, 90+)
- **AP Aging** — Vendor payables by age bucket

### Contacts/CRM (`/contacts`)
- Customer and vendor management
- Full contact details with edit capability
- Type filtering (Customer / Vendor / Both)

### Tax Management (`/taxes`)
- Configure tax rates (Sales Tax, VAT, GST)
- Tax collected vs paid analysis
- Net tax liability calculation

### Multi-Currency (`/currencies`)
- Real-time currency converter
- 8 currencies with exchange rates

### Settings (`/settings`)
- **Company Profile** — Edit all company details
- **Team Members** — Invite users, assign roles, activate/deactivate
- **Invite Link** — Shareable registration URL

### Super Admin (`/admin`)
- View all registered companies
- Activate/deactivate companies
- Change company plans (Free, Starter, Professional, Enterprise)
- View company details and users

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript** (zero build errors)
- **Tailwind CSS v4**
- **Lucide React** icons
- **clsx** for conditional classes
- **localStorage** for data persistence

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── (public)/
│   │   ├── login/page.tsx    # Login
│   │   └── register/page.tsx # Company registration
│   └── (app)/
│       ├── layout.tsx        # Protected layout + sidebar
│       ├── dashboard/        # Company dashboard
│       ├── invoices/         # Invoice management
│       ├── bills/            # Bill management
│       ├── expenses/         # Expense tracking
│       ├── bank/             # Bank reconciliation
│       ├── accounts/         # Chart of accounts
│       ├── journal/          # Journal entries
│       ├── reports/          # Financial reports
│       ├── contacts/         # Contact management
│       ├── taxes/            # Tax management
│       ├── currencies/       # Multi-currency
│       ├── settings/         # Company settings
│       └── admin/            # Super admin panel
├── contexts/
│   └── AppContext.tsx         # Multi-tenant data store + auth
└── lib/
    ├── types.ts              # TypeScript definitions
    └── utils.ts              # Formatters, constants, helpers
```
