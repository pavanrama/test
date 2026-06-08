import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, toErrorResponse } from "@/lib/api";
import { orgSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireUser();
    let org = await prisma.organization.findFirst();
    if (!org) org = await prisma.organization.create({ data: {} });
    return ok(org);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireUser();
    const data = orgSchema.partial().parse(await req.json());
    let org = await prisma.organization.findFirst();
    if (!org) org = await prisma.organization.create({ data: {} });
    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.legalName !== undefined && { legalName: data.legalName || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.website !== undefined && { website: data.website || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.taxNumber !== undefined && { taxNumber: data.taxNumber || null }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.currencySymbol !== undefined && { currencySymbol: data.currencySymbol }),
        ...(data.fiscalYearStart !== undefined && { fiscalYearStart: data.fiscalYearStart }),
        ...(data.invoicePrefix !== undefined && { invoicePrefix: data.invoicePrefix }),
        ...(data.billPrefix !== undefined && { billPrefix: data.billPrefix }),
        ...(data.defaultTaxRate !== undefined && { defaultTaxRate: data.defaultTaxRate }),
        ...(data.invoiceTerms !== undefined && { invoiceTerms: data.invoiceTerms || null }),
      },
    });
    return ok(updated);
  } catch (err) {
    return toErrorResponse(err);
  }
}
