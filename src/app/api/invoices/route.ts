import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse } from "@/lib/api";
import { invoiceSchema } from "@/lib/validators";
import { createInvoice } from "@/lib/services/documents";

export async function GET() {
  try {
    await requireUser();
    const invoices = await prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: { customer: true },
    });
    return ok(invoices);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const data = invoiceSchema.parse(await req.json());
    const invoice = await prisma.$transaction((tx) =>
      createInvoice(tx, {
        customerId: data.customerId,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        status: data.status ?? "DRAFT",
        notes: data.notes ?? null,
        terms: data.terms ?? null,
        lines: data.lines,
      }),
    );
    return ok(invoice);
  } catch (err) {
    return toErrorResponse(err);
  }
}
