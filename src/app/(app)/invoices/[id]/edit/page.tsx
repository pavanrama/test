import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { InvoiceForm } from "@/components/InvoiceForm";
import { toDateInput } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [org, invoice, customers, products] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.invoice.findUnique({ where: { id }, include: { lines: true } }),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, price: true, taxRate: true } }),
  ]);

  if (!invoice) notFound();
  if (invoice.status !== "DRAFT") redirect(`/invoices/${id}`);

  return (
    <InvoiceForm
      customers={customers}
      products={products}
      defaultTaxRate={org?.defaultTaxRate ?? 0}
      defaultTerms={org?.invoiceTerms ?? ""}
      symbol={org?.currencySymbol ?? "$"}
      initial={{
        id: invoice.id,
        customerId: invoice.customerId,
        issueDate: toDateInput(invoice.issueDate),
        dueDate: toDateInput(invoice.dueDate),
        notes: invoice.notes,
        terms: invoice.terms,
        lines: invoice.lines.map((l) => ({
          productId: l.productId ?? "",
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
      }}
    />
  );
}
