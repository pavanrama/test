import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse } from "@/lib/api";
import { customerSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireUser();
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });
    return ok(customers);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const data = customerSchema.parse(await req.json());
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        address: data.address || null,
        taxNumber: data.taxNumber || null,
        notes: data.notes || null,
      },
    });
    return ok(customer);
  } catch (err) {
    return toErrorResponse(err);
  }
}
