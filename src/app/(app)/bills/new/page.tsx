import { prisma } from "@/lib/db";
import { BillForm } from "@/components/BillForm";

export const dynamic = "force-dynamic";

export default async function NewBillPage() {
  const [org, vendors, accounts, products] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.account.findMany({
      where: { isActive: true, type: { in: ["EXPENSE", "ASSET", "LIABILITY"] } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, cost: true, expenseAccountId: true } }),
  ]);

  return (
    <BillForm
      vendors={vendors}
      accounts={accounts}
      products={products}
      symbol={org?.currencySymbol ?? "$"}
    />
  );
}
