import Link from "next/link";
import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import { getSession } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex lg:w-1/2">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #6366f1 0, transparent 45%), radial-gradient(circle at 80% 60%, #10b981 0, transparent 45%)",
          }}
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <Landmark size={20} />
          </div>
          <span className="text-xl font-bold">Ledgerly</span>
        </Link>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            Bookkeeping that balances itself.
          </h1>
          <p className="mt-4 text-slate-300">
            Real double-entry accounting with invoicing, bills, banking and
            instant financial statements — Balance Sheet, P&amp;L and Trial
            Balance — all in one clean workspace.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              "Automated journal entries on every transaction",
              "GAAP-style Balance Sheet & Profit and Loss",
              "Accounts receivable, payable & cash flow tracking",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Ledgerly. Built for small businesses.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
