import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { round2 } from "./money";

export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "INCOME"
  | "EXPENSE";

export const ACCOUNT_TYPES: AccountType[] = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Asset",
  LIABILITY: "Liability",
  EQUITY: "Equity",
  INCOME: "Income",
  EXPENSE: "Expense",
};

/** Account types whose natural (normal) balance increases on the debit side. */
const DEBIT_NORMAL: Set<string> = new Set(["ASSET", "EXPENSE"]);

export function isDebitNormal(type: string): boolean {
  return DEBIT_NORMAL.has(type);
}

/**
 * Convert a raw (debit - credit) figure into the account's natural balance.
 * For debit-normal accounts the natural balance is debit - credit; for
 * credit-normal accounts it is credit - debit.
 */
export function naturalBalance(type: string, debit: number, credit: number) {
  return isDebitNormal(type)
    ? round2(debit - credit)
    : round2(credit - debit);
}

type Db = PrismaClient | Prisma.TransactionClient;

export type JournalLineInput = {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string | null;
};

export type PostEntryInput = {
  date: Date;
  memo?: string | null;
  reference?: string | null;
  source?: string;
  sourceId?: string | null;
  lines: JournalLineInput[];
};

/**
 * Posts a balanced journal entry. Throws when debits != credits or when fewer
 * than two lines carry an amount.
 */
export async function postJournalEntry(db: Db, input: PostEntryInput) {
  const lines = input.lines
    .map((l) => ({
      accountId: l.accountId,
      debit: round2(l.debit ?? 0),
      credit: round2(l.credit ?? 0),
      description: l.description ?? null,
    }))
    .filter((l) => l.debit !== 0 || l.credit !== 0);

  if (lines.length < 2) {
    throw new AccountingError("A journal entry needs at least two lines.");
  }

  const totalDebit = round2(lines.reduce((s, l) => s + l.debit, 0));
  const totalCredit = round2(lines.reduce((s, l) => s + l.credit, 0));

  if (totalDebit !== totalCredit) {
    throw new AccountingError(
      `Entry is not balanced: debits ${totalDebit} ≠ credits ${totalCredit}.`,
    );
  }

  for (const l of lines) {
    if (l.debit < 0 || l.credit < 0) {
      throw new AccountingError("Debit and credit amounts cannot be negative.");
    }
    if (l.debit > 0 && l.credit > 0) {
      throw new AccountingError(
        "A single line cannot have both a debit and a credit.",
      );
    }
  }

  return db.journalEntry.create({
    data: {
      date: input.date,
      memo: input.memo ?? null,
      reference: input.reference ?? null,
      source: input.source ?? "MANUAL",
      sourceId: input.sourceId ?? null,
      lines: { create: lines },
    },
    include: { lines: true },
  });
}

/** Removes the automated journal entry tied to a source document. */
export async function reverseSourceEntries(
  db: Db,
  source: string,
  sourceId: string,
) {
  await db.journalEntry.deleteMany({ where: { source, sourceId } });
}

/** Finds a protected system account by subtype, throwing if missing. */
export async function getSystemAccount(db: Db, subtype: string) {
  const account = await db.account.findFirst({
    where: { subtype, isSystem: true },
  });
  if (!account) {
    throw new AccountingError(
      `Required system account "${subtype}" is missing. Re-seed the chart of accounts.`,
    );
  }
  return account;
}

export type AccountBalanceRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  debit: number;
  credit: number;
  balance: number; // natural balance
};

/** Aggregates ledger balances per account, optionally bounded by date. */
export async function getAccountBalances(
  opts: { from?: Date; to?: Date; activeOnly?: boolean } = {},
): Promise<AccountBalanceRow[]> {
  const accounts = await prisma.account.findMany({
    where: opts.activeOnly ? { isActive: true } : undefined,
    orderBy: { code: "asc" },
  });

  const dateFilter: Prisma.JournalEntryWhereInput = {};
  if (opts.from || opts.to) {
    dateFilter.date = {};
    if (opts.from) (dateFilter.date as Prisma.DateTimeFilter).gte = opts.from;
    if (opts.to) (dateFilter.date as Prisma.DateTimeFilter).lte = opts.to;
  }

  const grouped = await prisma.journalLine.groupBy({
    by: ["accountId"],
    _sum: { debit: true, credit: true },
    where: opts.from || opts.to ? { journalEntry: dateFilter } : undefined,
  });

  const map = new Map(grouped.map((g) => [g.accountId, g._sum]));

  return accounts.map((a) => {
    const sums = map.get(a.id);
    const debit = round2(sums?.debit ?? 0);
    const credit = round2(sums?.credit ?? 0);
    return {
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      subtype: a.subtype,
      debit,
      credit,
      balance: naturalBalance(a.type, debit, credit),
    };
  });
}

export class AccountingError extends Error {}
