import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse } from "@/lib/api";
import { productSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireUser();
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { incomeAccount: true, expenseAccount: true },
    });
    return ok(products);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const data = productSchema.parse(await req.json());
    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku || null,
        description: data.description || null,
        type: data.type,
        price: data.price,
        cost: data.cost,
        taxRate: data.taxRate,
        incomeAccountId: data.incomeAccountId || null,
        expenseAccountId: data.expenseAccountId || null,
      },
    });
    return ok(product);
  } catch (err) {
    return toErrorResponse(err);
  }
}
