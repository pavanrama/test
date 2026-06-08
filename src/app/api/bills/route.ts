import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse } from "@/lib/api";
import { billSchema } from "@/lib/validators";
import { createBill } from "@/lib/services/documents";

export async function GET() {
  try {
    await requireUser();
    const bills = await prisma.bill.findMany({
      orderBy: { issueDate: "desc" },
      include: { vendor: true },
    });
    return ok(bills);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const data = billSchema.parse(await req.json());
    const bill = await prisma.$transaction((tx) =>
      createBill(tx, {
        vendorId: data.vendorId,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        notes: data.notes ?? null,
        lines: data.lines,
      }),
    );
    return ok(bill);
  } catch (err) {
    return toErrorResponse(err);
  }
}
