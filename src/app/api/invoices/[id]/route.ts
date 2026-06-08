import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse, fail } from "@/lib/api";
import { invoiceSchema } from "@/lib/validators";
import { computeTotals } from "@/lib/services/documents";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: { include: { product: true } },
        payments: true,
      },
    });
    if (!invoice) return fail("Invoice not found.", 404);
    return ok(invoice);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return fail("Invoice not found.", 404);
    if (invoice.status !== "DRAFT")
      return fail("Only draft invoices can be edited.", 422);

    const data = invoiceSchema.parse(await req.json());
    const { computed, subtotal, taxTotal, total } = computeTotals(data.lines);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.update({
        where: { id },
        data: {
          customerId: data.customerId,
          issueDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          notes: data.notes ?? null,
          terms: data.terms ?? null,
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
      });
    });
    return ok(updated);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return fail("Invoice not found.", 404);
    if (invoice.status !== "DRAFT")
      return fail("Only draft invoices can be deleted. Void posted invoices instead.", 422);

    await prisma.invoice.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
