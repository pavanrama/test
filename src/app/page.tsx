import Link from "next/link";
import {
  Landmark,
  FileText,
  Receipt,
  BarChart3,
  BookOpen,
  Users,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { getSession } from "@/lib/auth";

const FEATURES = [
  { icon: FileText, title: "Invoicing", desc: "Create, send and track invoices with tax, partial payments and auto-numbering." },
  { icon: Receipt, title: "Bills & Expenses", desc: "Record vendor bills, categorise spending and stay on top of what you owe." },
  { icon: BookOpen, title: "Double-Entry Ledger", desc: "Every transaction posts balanced journal entries automatically." },
  { icon: BarChart3, title: "Financial Reports", desc: "Balance Sheet, Profit & Loss, Trial Balance and General Ledger on demand." },
  { icon: Users, title: "Customers & Vendors", desc: "Manage contacts with running balances and full transaction history." },
  { icon: Wallet, title: "Banking & Cash", desc: "Track cash and bank accounts, deposits and payments in real time." },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Landmark size={18} />
            </div>
            <span className="text-lg font-bold text-slate-900">Ledgerly</span>
          </div>
          <nav className="flex items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 10%, #6366f1 0, transparent 40%), radial-gradient(circle at 85% 30%, #10b981 0, transparent 40%)",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              Double-entry accounting, simplified
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Bookkeeping &amp; accounting
              <br />
              <span className="text-brand-600">your business will love</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Invoices, bills, expenses, banking and real financial statements —
              powered by a proper double-entry ledger that always balances.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href={session ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                {session ? "Open your workspace" : "Start free"}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Try the demo
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-slate-900 py-16 text-center text-white">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="text-3xl font-bold">Ready to balance your books?</h2>
            <p className="mt-3 text-slate-300">
              Sign in with the demo account and explore a fully populated set of
              books — invoices, bills, payments and reports included.
            </p>
            <Link
              href={session ? "/dashboard" : "/login"}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              {session ? "Go to dashboard" : "Launch the demo"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Ledgerly — Bookkeeping &amp; Accounting.
      </footer>
    </div>
  );
}
