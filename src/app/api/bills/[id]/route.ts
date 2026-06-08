import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse, fail } from "@/lib/api";
import { reverseSourceEntries } from "@/lib/accounting";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        vendor: true,
        lines: { include: { product: true } },
        payments: true,
      },
    });
    if (!bill) return fail("Bill not found.", 404);
    return ok(bill);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  // Status actions (void) for bills.
  try {
    await requireUser();
    const { id } = await params;
    const { action } = (await req.json()) as { action?: string };
    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) return fail("Bill not found.", 404);

    if (action === "void") {
      if (bill.amountPaid > 0)
        return fail("Cannot void a bill that has payments.", 422);
      await prisma.$transaction(async (tx) => {
        await reverseSourceEntries(tx, "BILL", id);
        await tx.bill.update({ where: { id }, data: { status: "VOID" } });
      });
      return ok({ status: "VOID" });
    }
    return fail("Unknown action.", 400);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) return fail("Bill not found.", 404);
    if (bill.amountPaid > 0)
      return fail("Cannot delete a bill that has payments. Void it instead.", 422);
    await prisma.$transaction(async (tx) => {
      await reverseSourceEntries(tx, "BILL", id);
      await tx.bill.delete({ where: { id } });
    });
    return ok({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
