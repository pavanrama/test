import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse, fail } from "@/lib/api";
import { accountSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const data = accountSchema.partial().parse(await req.json());

    if (data.code) {
      const dupe = await prisma.account.findFirst({
        where: { code: data.code, NOT: { id } },
      });
      if (dupe) return fail("An account with this code already exists.", 409);
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.subtype !== undefined && { subtype: data.subtype || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return ok(account);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) return fail("Account not found.", 404);
    if (account.isSystem)
      return fail("System accounts cannot be deleted.", 422);

    const used = await prisma.journalLine.count({ where: { accountId: id } });
    if (used > 0)
      return fail(
        "This account has transactions and cannot be deleted. Deactivate it instead.",
        422,
      );

    await prisma.account.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
