# Ledgerly — Bookkeeping & Accounting

A complete, modern double-entry **bookkeeping and accounting** web application.
Ledgerly brings together the best features of tools like QuickBooks, Xero,
Wave, FreshBooks and Zoho Books into one clean, self-hostable workspace:
invoicing, bills & expenses, customers & vendors, a full chart of accounts, a
real double-entry general ledger, and instant financial statements.

> Demo login — **`demo@ledgerly.app`** / **`password123`**

---

## Features

### Sales
- **Invoices** — line items, tax, auto-numbering, drafts, approve/void, partial
  payments, printable PDF-style view, and automatic GL posting.
- **Customers** — contact records with live "owes you" (accounts receivable)
  balances and full history.

### Purchases
- **Bills / Expenses** — vendor bills with per-line expense accounts, tax,
  payments and automatic GL posting.
- **Vendors** — contact records with live "you owe" (accounts payable) balances.

### Accounting core
- **Double-entry engine** — every transaction posts a balanced journal entry.
  Debits always equal credits, enforced at the service layer.
- **Chart of Accounts** — full preloaded CoA (assets, liabilities, equity,
  income, expenses) with protected system accounts for automation.
- **Manual Journal Entries** — post adjusting entries with a live balance
  checker.
- **Products & Services** — reusable catalog items mapped to income/expense
  accounts.

### Reporting
- **Profit & Loss** (income statement) with gross profit & net income
- **Balance Sheet** (assets = liabilities + equity, always balances)
- **Trial Balance**
- **General Ledger** with running balances and account/date filters
- **Dashboard** — cash, AR/AP, net income, overdue alerts, 6-month income vs
  expense trend and expense breakdown charts.

### Platform
- Email/password **authentication** with JWT HttpOnly-cookie sessions
- **Company settings** — currency, tax defaults, document prefixes, branding
- Responsive UI, print-friendly documents and reports

---

## Tech stack

| Layer     | Technology                                  |
| --------- | ------------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19          |
| Language  | TypeScript                                  |
| Styling   | Tailwind CSS v4                             |
| Database  | Prisma ORM + SQLite (zero-config local dev) |
| Auth      | `jose` (JWT) + `bcryptjs`                    |
| Charts    | Recharts                                    |
| Icons     | lucide-react                                |
| Validation| Zod                                         |

---

## Getting started

### Prerequisites
- Node.js 20+ (tested on Node 22)

### Install & run

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Create the SQLite database and load demo data
npm run db:reset

# 3. Start the dev server
npm run dev
```

Open <http://localhost:3000> and sign in with the demo account:

```
email:    demo@ledgerly.app
password: password123
```

### Environment

Configuration lives in `.env` (committed with safe local-dev defaults):

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-in-production"
```

In production, set a long random `AUTH_SECRET` and point `DATABASE_URL` at a
managed database (swap the Prisma datasource `provider` to `postgresql` if
desired).

---

## Scripts

| Script             | Description                                        |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Start the development server                        |
| `npm run build`    | Generate the Prisma client and build for production |
| `npm run start`    | Run the production build                            |
| `npm run db:push`  | Sync the Prisma schema to the database              |
| `npm run db:seed`  | Load demo data                                      |
| `npm run db:reset` | Reset the database and reseed                        |

---

## How the accounting works

Ledgerly is a genuine double-entry system. Source documents automatically
generate balanced journal entries:

| Action                | Debit                    | Credit                     |
| --------------------- | ------------------------ | -------------------------- |
| Approve invoice       | Accounts Receivable      | Income + Sales Tax Payable |
| Receive invoice payment | Bank / Cash            | Accounts Receivable        |
| Enter a bill          | Expense accounts         | Accounts Payable           |
| Pay a bill            | Accounts Payable         | Bank / Cash                |

Because every entry balances, the Trial Balance, Balance Sheet and Profit &
Loss are always internally consistent.

---

## Project structure

```
prisma/
  schema.prisma        # Data model (double-entry ledger)
  seed.ts              # Chart of accounts + demo data
src/
  app/
    (auth)/            # Login / register
    (app)/             # Authenticated app (dashboard, invoices, …)
    api/               # REST route handlers
  components/          # UI primitives + feature components
  lib/
    accounting.ts      # Posting engine, balances, account helpers
    reports.ts         # P&L, Balance Sheet, Trial Balance, GL, dashboard
    services/documents.ts  # Invoice / bill / payment workflows
    auth.ts            # Sessions & password hashing
    validators.ts      # Zod schemas
```

---

## License

MIT — built as a reference implementation of a full accounting application.
