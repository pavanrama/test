import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { ok, fail, toErrorResponse } from "@/lib/api";
import { registerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) return fail("An account with this email already exists.", 409);

    const userCount = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: await hashPassword(data.password),
        role: userCount === 0 ? "OWNER" : "ACCOUNTANT",
      },
    });

    // Ensure an organisation exists for first-run setups.
    const org = await prisma.organization.findFirst();
    if (!org) await prisma.organization.create({ data: {} });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    return ok({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    return toErrorResponse(err);
  }
}
