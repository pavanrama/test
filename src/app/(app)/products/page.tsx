import { prisma } from "@/lib/db";
import { ProductsClient } from "@/components/ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [org, products, accounts] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, type: true },
    }),
  ]);

  return (
    <ProductsClient
      products={products}
      accounts={accounts}
      symbol={org?.currencySymbol ?? "$"}
    />
  );
}
