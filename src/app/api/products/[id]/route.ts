import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse, fail } from "@/lib/api";
import { productSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const data = productSchema.partial().parse(await req.json());
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sku !== undefined && { sku: data.sku || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
        ...(data.incomeAccountId !== undefined && { incomeAccountId: data.incomeAccountId || null }),
        ...(data.expenseAccountId !== undefined && { expenseAccountId: data.expenseAccountId || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return ok(product);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const used =
      (await prisma.invoiceLine.count({ where: { productId: id } })) +
      (await prisma.billLine.count({ where: { productId: id } }));
    if (used > 0)
      return fail(
        "This item is used on transactions and cannot be deleted. Deactivate it instead.",
        422,
      );
    await prisma.product.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
