import type { Prisma, PrismaClient } from "@prisma/client";
import { round2 } from "../money";
import {
  AccountingError,
  getSystemAccount,
  postJournalEntry,
  reverseSourceEntries,
} from "../accounting";

type Db = PrismaClient | Prisma.TransactionClient;

export type DocLineInput = {
  productId?: string | null;
  accountId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

export type ComputedLine = DocLineInput & {
  taxRate: number;
  amount: number;
  tax: number;
};

export function computeTotals(lines: DocLineInput[]) {
  const computed: ComputedLine[] = lines.map((l) => {
    const amount = round2((l.quantity || 0) * (l.unitPrice || 0));
    const taxRate = l.taxRate ?? 0;
    const tax = round2((amount * taxRate) / 100);
    return { ...l, taxRate, amount, tax };
  });
  const subtotal = round2(computed.reduce((s, l) => s + l.amount, 0));
  const taxTotal = round2(computed.reduce((s, l) => s + l.tax, 0));
  const total = round2(subtotal + taxTotal);
  return { computed, subtotal, taxTotal, total };
}

export function deriveStatus(
  total: number,
  amountPaid: number,
  openLabel: "SENT" | "OPEN",
): string {
  if (amountPaid <= 0) return openLabel;
  if (round2(amountPaid) >= round2(total)) return "PAID";
  return "PARTIAL";
}

async function nextNumber(db: Db, kind: "invoice" | "bill"): Promise<string> {
  const org = await db.organization.findFirst();
  if (!org) throw new AccountingError("Organisation is not configured.");
  if (kind === "invoice") {
    const number = `${org.invoicePrefix}${String(org.invoiceCounter).padStart(4, "0")}`;
    await db.organization.update({
      where: { id: org.id },
      data: { invoiceCounter: org.invoiceCounter + 1 },
    });
    return number;
  }
  const number = `${org.billPrefix}${String(org.billCounter).padStart(4, "0")}`;
  await db.organization.update({
    where: { id: org.id },
    data: { billCounter: org.billCounter + 1 },
  });
  return number;
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export type CreateInvoiceInput = {
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  status?: "DRAFT" | "SENT";
  notes?: string | null;
  terms?: string | null;
  lines: DocLineInput[];
};

export async function createInvoice(db: Db, input: CreateInvoiceInput) {
  const { computed, subtotal, taxTotal, total } = computeTotals(input.lines);
  const number = await nextNumber(db, "invoice");
  const status = input.status ?? "DRAFT";

  const invoice = await db.invoice.create({
    data: {
      number,
      customerId: input.customerId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      status,
      notes: input.notes ?? null,
      terms: input.terms ?? null,
      subtotal,
      taxTotal,
      total,
      lines: {
        create: computed.map((l) => ({
          productId: l.productId ?? null,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          amount: l.amount,
        })),
      },
    },
    include: { lines: { include: { product: true } } },
  });

  if (status !== "DRAFT") {
    await postInvoiceLedger(db, invoice.id);
  }
  return invoice;
}

/** Builds (or rebuilds) the GL entry for a non-draft, non-void invoice. */
export async function postInvoiceLedger(db: Db, invoiceId: string) {
  await reverseSourceEntries(db, "INVOICE", invoiceId);
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: { include: { product: true } }, customer: true },
  });
  if (!invoice) throw new AccountingError("Invoice not found.");
  if (invoice.status === "DRAFT" || invoice.status === "VOID") return;

  const ar = await getSystemAccount(db, "ACCOUNTS_RECEIVABLE");
  const defaultIncome = await getSystemAccount(db, "SALES");
  const taxAccount = await getSystemAccount(db, "SALES_TAX_PAYABLE");

  const incomeByAccount = new Map<string, number>();
  for (const line of invoice.lines) {
    const accountId = line.product?.incomeAccountId || defaultIncome.id;
    incomeByAccount.set(
      accountId,
      round2((incomeByAccount.get(accountId) ?? 0) + line.amount),
    );
  }

  const lines = [
    { accountId: ar.id, debit: invoice.total, credit: 0, description: `Invoice ${invoice.number}` },
    ...Array.from(incomeByAccount.entries()).map(([accountId, amount]) => ({
      accountId,
      debit: 0,
      credit: amount,
      description: `Sales — invoice ${invoice.number}`,
    })),
  ];
  if (invoice.taxTotal > 0) {
    lines.push({
      accountId: taxAccount.id,
      debit: 0,
      credit: invoice.taxTotal,
      description: `Sales tax — invoice ${invoice.number}`,
    });
  }

  await postJournalEntry(db, {
    date: invoice.issueDate,
    memo: `Invoice ${invoice.number} — ${invoice.customer.name}`,
    reference: invoice.number,
    source: "INVOICE",
    sourceId: invoice.id,
    lines,
  });
}

export async function recordInvoicePayment(
  db: Db,
  invoiceId: string,
  input: {
    amount: number;
    date: Date;
    method?: string;
    depositAccountId?: string | null;
    reference?: string | null;
    notes?: string | null;
  },
) {
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new AccountingError("Invoice not found.");
  if (invoice.status === "DRAFT")
    throw new AccountingError("Approve the invoice before recording payment.");
  if (invoice.status === "VOID")
    throw new AccountingError("Cannot pay a voided invoice.");

  const amount = round2(input.amount);
  const outstanding = round2(invoice.total - invoice.amountPaid);
  if (amount > outstanding + 0.001)
    throw new AccountingError(
      `Payment exceeds the outstanding balance of ${outstanding}.`,
    );

  const ar = await getSystemAccount(db, "ACCOUNTS_RECEIVABLE");
  const deposit = input.depositAccountId
    ? await db.account.findUnique({ where: { id: input.depositAccountId } })
    : await getSystemAccount(db, "BANK");
  if (!deposit) throw new AccountingError("Deposit account not found.");

  const payment = await db.payment.create({
    data: {
      type: "RECEIVED",
      date: input.date,
      amount,
      method: input.method ?? "BANK",
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      depositAccountId: deposit.id,
      customerId: invoice.customerId,
      invoiceId: invoice.id,
    },
  });

  await postJournalEntry(db, {
    date: input.date,
    memo: `Payment for invoice ${invoice.number}`,
    reference: invoice.number,
    source: "PAYMENT",
    sourceId: payment.id,
    lines: [
      { accountId: deposit.id, debit: amount, credit: 0 },
      { accountId: ar.id, debit: 0, credit: amount },
    ],
  });

  const amountPaid = round2(invoice.amountPaid + amount);
  await db.invoice.update({
    where: { id: invoice.id },
    data: { amountPaid, status: deriveStatus(invoice.total, amountPaid, "SENT") },
  });
  return payment;
}

// ---------------------------------------------------------------------------
// Bills
// ---------------------------------------------------------------------------

export type CreateBillInput = {
  vendorId: string;
  issueDate: Date;
  dueDate: Date;
  notes?: string | null;
  lines: DocLineInput[];
};

export async function createBill(db: Db, input: CreateBillInput) {
  const { computed, subtotal, taxTotal, total } = computeTotals(input.lines);
  const number = await nextNumber(db, "bill");

  const bill = await db.bill.create({
    data: {
      number,
      vendorId: input.vendorId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      notes: input.notes ?? null,
      status: "OPEN",
      subtotal,
      taxTotal,
      total,
      lines: {
        create: computed.map((l) => ({
          productId: l.productId ?? null,
          accountId: l.accountId ?? null,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          amount: l.amount,
        })),
      },
    },
    include: { lines: true },
  });

  await postBillLedger(db, bill.id);
  return bill;
}

export async function postBillLedger(db: Db, billId: string) {
  await reverseSourceEntries(db, "BILL", billId);
  const bill = await db.bill.findUnique({
    where: { id: billId },
    include: { lines: { include: { product: true } }, vendor: true },
  });
  if (!bill) throw new AccountingError("Bill not found.");
  if (bill.status === "VOID") return;

  const ap = await getSystemAccount(db, "ACCOUNTS_PAYABLE");
  const defaultExpense = await getSystemAccount(db, "OPERATING_EXPENSE");

  // Tax on purchases is expensed alongside the line for simplicity.
  const expenseByAccount = new Map<string, number>();
  for (const line of bill.lines) {
    const accountId =
      line.accountId || line.product?.expenseAccountId || defaultExpense.id;
    const value = round2(line.amount + (line.amount * line.taxRate) / 100);
    expenseByAccount.set(
      accountId,
      round2((expenseByAccount.get(accountId) ?? 0) + value),
    );
  }

  const lines = [
    ...Array.from(expenseByAccount.entries()).map(([accountId, amount]) => ({
      accountId,
      debit: amount,
      credit: 0,
      description: `Bill ${bill.number}`,
    })),
    { accountId: ap.id, debit: 0, credit: bill.total, description: `Bill ${bill.number}` },
  ];

  await postJournalEntry(db, {
    date: bill.issueDate,
    memo: `Bill ${bill.number} — ${bill.vendor.name}`,
    reference: bill.number,
    source: "BILL",
    sourceId: bill.id,
    lines,
  });
}

export async function recordBillPayment(
  db: Db,
  billId: string,
  input: {
    amount: number;
    date: Date;
    method?: string;
    depositAccountId?: string | null;
    reference?: string | null;
    notes?: string | null;
  },
) {
  const bill = await db.bill.findUnique({ where: { id: billId } });
  if (!bill) throw new AccountingError("Bill not found.");
  if (bill.status === "VOID")
    throw new AccountingError("Cannot pay a voided bill.");

  const amount = round2(input.amount);
  const outstanding = round2(bill.total - bill.amountPaid);
  if (amount > outstanding + 0.001)
    throw new AccountingError(
      `Payment exceeds the outstanding balance of ${outstanding}.`,
    );

  const ap = await getSystemAccount(db, "ACCOUNTS_PAYABLE");
  const source = input.depositAccountId
    ? await db.account.findUnique({ where: { id: input.depositAccountId } })
    : await getSystemAccount(db, "BANK");
  if (!source) throw new AccountingError("Payment account not found.");

  const payment = await db.payment.create({
    data: {
      type: "PAID",
      date: input.date,
      amount,
      method: input.method ?? "BANK",
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      depositAccountId: source.id,
      vendorId: bill.vendorId,
      billId: bill.id,
    },
  });

  await postJournalEntry(db, {
    date: input.date,
    memo: `Payment for bill ${bill.number}`,
    reference: bill.number,
    source: "PAYMENT",
    sourceId: payment.id,
    lines: [
      { accountId: ap.id, debit: amount, credit: 0 },
      { accountId: source.id, debit: 0, credit: amount },
    ],
  });

  const amountPaid = round2(bill.amountPaid + amount);
  await db.bill.update({
    where: { id: bill.id },
    data: { amountPaid, status: deriveStatus(bill.total, amountPaid, "OPEN") },
  });
  return payment;
}
