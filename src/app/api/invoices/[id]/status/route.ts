import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse, fail } from "@/lib/api";
import { postInvoiceLedger } from "@/lib/services/documents";
import { reverseSourceEntries } from "@/lib/accounting";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const { action } = (await req.json()) as { action?: string };
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return fail("Invoice not found.", 404);

    if (action === "approve") {
      if (invoice.status !== "DRAFT")
        return fail("Only draft invoices can be approved.", 422);
      await prisma.$transaction(async (tx) => {
        await tx.invoice.update({ where: { id }, data: { status: "SENT" } });
        await postInvoiceLedger(tx, id);
      });
      return ok({ status: "SENT" });
    }

    if (action === "void") {
      if (invoice.amountPaid > 0)
        return fail("Cannot void an invoice that has payments.", 422);
      await prisma.$transaction(async (tx) => {
        await reverseSourceEntries(tx, "INVOICE", id);
        await tx.invoice.update({ where: { id }, data: { status: "VOID" } });
      });
      return ok({ status: "VOID" });
    }

    return fail("Unknown action.", 400);
  } catch (err) {
    return toErrorResponse(err);
  }
}
