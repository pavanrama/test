import { prisma } from "@/lib/db";
import { getAccountBalances } from "@/lib/accounting";
import { AccountsClient } from "@/components/AccountsClient";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [org, accounts, balances] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.account.findMany({ orderBy: { code: "asc" } }),
    getAccountBalances(),
  ]);

  const balanceMap = new Map(balances.map((b) => [b.id, b.balance]));

  const data = accounts.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    type: a.type,
    subtype: a.subtype,
    description: a.description,
    isActive: a.isActive,
    isSystem: a.isSystem,
    balance: balanceMap.get(a.id) ?? 0,
  }));

  return <AccountsClient accounts={data} symbol={org?.currencySymbol ?? "$"} />;
}
