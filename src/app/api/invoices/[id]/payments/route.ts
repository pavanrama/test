import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse } from "@/lib/api";
import { paymentSchema } from "@/lib/validators";
import { recordInvoicePayment } from "@/lib/services/documents";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const data = paymentSchema.parse(await req.json());
    const payment = await prisma.$transaction((tx) =>
      recordInvoicePayment(tx, id, {
        amount: data.amount,
        date: new Date(data.date),
        method: data.method,
        depositAccountId: data.depositAccountId ?? null,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
      }),
    );
    return ok(payment);
  } catch (err) {
    return toErrorResponse(err);
  }
}
