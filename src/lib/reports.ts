import { prisma } from "./db";
import { round2 } from "./money";
import { getAccountBalances, isDebitNormal } from "./accounting";

export type TrialBalanceRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
};

export async function getTrialBalance(asOf?: Date) {
  const balances = await getAccountBalances({ to: asOf });
  const rows: TrialBalanceRow[] = balances
    .map((b) => {
      const net = round2(b.debit - b.credit); // raw debit-credit
      return {
        id: b.id,
        code: b.code,
        name: b.name,
        type: b.type,
        debit: net > 0 ? net : 0,
        credit: net < 0 ? -net : 0,
      };
    })
    .filter((r) => r.debit !== 0 || r.credit !== 0);

  const totalDebit = round2(rows.reduce((s, r) => s + r.debit, 0));
  const totalCredit = round2(rows.reduce((s, r) => s + r.credit, 0));
  return { rows, totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}

export type ReportLine = { id: string; code: string; name: string; amount: number };
export type ReportSection = { title: string; lines: ReportLine[]; total: number };

export async function getProfitAndLoss(from: Date, to: Date) {
  const balances = await getAccountBalances({ from, to });

  const incomeLines = balances
    .filter((b) => b.type === "INCOME")
    .map((b) => ({ id: b.id, code: b.code, name: b.name, amount: b.balance }))
    .filter((l) => l.amount !== 0);
  const expenseLines = balances
    .filter((b) => b.type === "EXPENSE")
    .map((b) => ({ id: b.id, code: b.code, name: b.name, amount: b.balance }))
    .filter((l) => l.amount !== 0);

  const totalIncome = round2(incomeLines.reduce((s, l) => s + l.amount, 0));
  const totalExpense = round2(expenseLines.reduce((s, l) => s + l.amount, 0));

  const cogsLines = balances
    .filter((b) => b.type === "EXPENSE" && b.subtype === "COGS")
    .map((b) => ({ id: b.id, code: b.code, name: b.name, amount: b.balance }))
    .filter((l) => l.amount !== 0);
  const opexLines = expenseLines.filter(
    (l) => !cogsLines.some((c) => c.id === l.id),
  );
  const totalCogs = round2(cogsLines.reduce((s, l) => s + l.amount, 0));
  const totalOpex = round2(opexLines.reduce((s, l) => s + l.amount, 0));
  const grossProfit = round2(totalIncome - totalCogs);
  const netIncome = round2(totalIncome - totalExpense);

  return {
    income: { title: "Income", lines: incomeLines, total: totalIncome } as ReportSection,
    cogs: { title: "Cost of Goods Sold", lines: cogsLines, total: totalCogs } as ReportSection,
    expenses: { title: "Operating Expenses", lines: opexLines, total: totalOpex } as ReportSection,
    grossProfit,
    netIncome,
    totalIncome,
    totalExpense,
  };
}

export async function getBalanceSheet(asOf: Date) {
  const balances = await getAccountBalances({ to: asOf });

  const mapLines = (type: string) =>
    balances
      .filter((b) => b.type === type)
      .map((b) => ({ id: b.id, code: b.code, name: b.name, amount: b.balance }))
      .filter((l) => l.amount !== 0);

  const assets = mapLines("ASSET");
  const liabilities = mapLines("LIABILITY");
  const equity = mapLines("EQUITY");

  const totalAssets = round2(assets.reduce((s, l) => s + l.amount, 0));
  const totalLiabilities = round2(liabilities.reduce((s, l) => s + l.amount, 0));

  // Net income for the period flows into equity as current-year earnings.
  const income = round2(
    balances
      .filter((b) => b.type === "INCOME")
      .reduce((s, b) => s + b.balance, 0),
  );
  const expense = round2(
    balances
      .filter((b) => b.type === "EXPENSE")
      .reduce((s, b) => s + b.balance, 0),
  );
  const netIncome = round2(income - expense);

  const equityWithEarnings = [
    ...equity,
    { id: "current-earnings", code: "—", name: "Current Year Earnings", amount: netIncome },
  ].filter((l) => l.amount !== 0);
  const totalEquity = round2(
    equityWithEarnings.reduce((s, l) => s + l.amount, 0),
  );

  return {
    assets: { title: "Assets", lines: assets, total: totalAssets } as ReportSection,
    liabilities: { title: "Liabilities", lines: liabilities, total: totalLiabilities } as ReportSection,
    equity: { title: "Equity", lines: equityWithEarnings, total: totalEquity } as ReportSection,
    totalAssets,
    totalLiabilitiesAndEquity: round2(totalLiabilities + totalEquity),
    balanced: round2(totalAssets) === round2(totalLiabilities + totalEquity),
  };
}

export async function getGeneralLedger(opts: {
  accountId?: string;
  from?: Date;
  to?: Date;
}) {
  const where: Record<string, unknown> = {};
  if (opts.accountId) where.accountId = opts.accountId;
  if (opts.from || opts.to) {
    where.journalEntry = { date: {} as Record<string, Date> };
    const df = (where.journalEntry as { date: Record<string, Date> }).date;
    if (opts.from) df.gte = opts.from;
    if (opts.to) df.lte = opts.to;
  }

  const lines = await prisma.journalLine.findMany({
    where,
    include: {
      account: true,
      journalEntry: true,
    },
    orderBy: [{ journalEntry: { date: "asc" } }, { id: "asc" }],
  });

  // Running balance grouped by account (natural balance).
  const running = new Map<string, number>();
  return lines.map((l) => {
    const prev = running.get(l.accountId) ?? 0;
    const delta = isDebitNormal(l.account.type)
      ? l.debit - l.credit
      : l.credit - l.debit;
    const balance = round2(prev + delta);
    running.set(l.accountId, balance);
    return {
      id: l.id,
      date: l.journalEntry.date,
      account: { id: l.account.id, code: l.account.code, name: l.account.name, type: l.account.type },
      memo: l.journalEntry.memo,
      reference: l.journalEntry.reference,
      source: l.journalEntry.source,
      description: l.description,
      debit: l.debit,
      credit: l.credit,
      balance,
    };
  });
}

export async function getDashboardMetrics() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [pl, balances, invoices, bills] = await Promise.all([
    getProfitAndLoss(startOfYear, now),
    getAccountBalances({ to: now }),
    prisma.invoice.findMany({ where: { status: { not: "VOID" } } }),
    prisma.bill.findMany({ where: { status: { not: "VOID" } } }),
  ]);

  const cash = round2(
    balances
      .filter((b) => b.subtype === "BANK" || b.subtype === "CASH")
      .reduce((s, b) => s + b.balance, 0),
  );
  const receivables = round2(
    balances
      .filter((b) => b.subtype === "ACCOUNTS_RECEIVABLE")
      .reduce((s, b) => s + b.balance, 0),
  );
  const payables = round2(
    balances
      .filter((b) => b.subtype === "ACCOUNTS_PAYABLE")
      .reduce((s, b) => s + b.balance, 0),
  );

  const overdueInvoices = invoices.filter(
    (i) =>
      ["SENT", "PARTIAL"].includes(i.status) &&
      i.dueDate < now &&
      i.amountPaid < i.total,
  );
  const overdueAmount = round2(
    overdueInvoices.reduce((s, i) => s + (i.total - i.amountPaid), 0),
  );

  // 6-month income vs expense trend.
  const trend: { month: string; income: number; expense: number; net: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthPl = await getProfitAndLoss(start, end);
    trend.push({
      month: start.toLocaleString(undefined, { month: "short" }),
      income: monthPl.totalIncome,
      expense: monthPl.totalExpense,
      net: monthPl.netIncome,
    });
  }

  return {
    cash,
    receivables,
    payables,
    income: pl.totalIncome,
    expense: pl.totalExpense,
    netIncome: pl.netIncome,
    overdueAmount,
    overdueCount: overdueInvoices.length,
    openInvoices: invoices.filter((i) => ["SENT", "PARTIAL"].includes(i.status)).length,
    openBills: bills.filter((b) => ["OPEN", "PARTIAL"].includes(b.status)).length,
    trend,
    expenseBreakdown: pl.expenses.lines
      .concat(pl.cogs.lines)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6),
  };
}
