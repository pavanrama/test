import { prisma } from "@/lib/db";
import { InvoiceForm } from "@/components/InvoiceForm";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const [org, customers, products] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, price: true, taxRate: true } }),
  ]);

  return (
    <InvoiceForm
      customers={customers}
      products={products}
      defaultTaxRate={org?.defaultTaxRate ?? 0}
      defaultTerms={org?.invoiceTerms ?? ""}
      symbol={org?.currencySymbol ?? "$"}
    />
  );
}
