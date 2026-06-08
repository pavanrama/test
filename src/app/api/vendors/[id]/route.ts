import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse, fail } from "@/lib/api";
import { vendorSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const data = vendorSchema.partial().parse(await req.json());
    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.company !== undefined && { company: data.company || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.taxNumber !== undefined && { taxNumber: data.taxNumber || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return ok(vendor);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const bills = await prisma.bill.count({ where: { vendorId: id } });
    if (bills > 0)
      return fail(
        "This vendor has bills and cannot be deleted. Deactivate it instead.",
        422,
      );
    await prisma.vendor.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
