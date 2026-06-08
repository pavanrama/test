import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { ok, fail, toErrorResponse } from "@/lib/api";
import { loginSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return fail("Invalid email or password.", 401);
    }

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
