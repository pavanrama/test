import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse } from "@/lib/api";
import { vendorSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireUser();
    const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
    return ok(vendors);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const data = vendorSchema.parse(await req.json());
    const vendor = await prisma.vendor.create({
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
    return ok(vendor);
  } catch (err) {
    return toErrorResponse(err);
  }
}
