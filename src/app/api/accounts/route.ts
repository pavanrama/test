import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse, fail } from "@/lib/api";
import { accountSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireUser();
    const accounts = await prisma.account.findMany({ orderBy: { code: "asc" } });
    return ok(accounts);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const data = accountSchema.parse(await req.json());
    const existing = await prisma.account.findUnique({ where: { code: data.code } });
    if (existing) return fail("An account with this code already exists.", 409);

    const account = await prisma.account.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        subtype: data.subtype || null,
        description: data.description || null,
        isActive: data.isActive ?? true,
      },
    });
    return ok(account);
  } catch (err) {
    return toErrorResponse(err);
  }
}
