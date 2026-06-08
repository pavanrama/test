import { prisma } from "@/lib/db";
import { round2 } from "@/lib/money";
import { ContactManager, type Contact } from "@/components/ContactManager";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const [org, vendors] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.vendor.findMany({
      orderBy: { name: "asc" },
      include: {
        bills: { where: { status: { not: "VOID" } }, select: { total: true, amountPaid: true } },
      },
    }),
  ]);

  const data: Contact[] = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    email: v.email,
    phone: v.phone,
    company: v.company,
    address: v.address,
    taxNumber: v.taxNumber,
    notes: v.notes,
    isActive: v.isActive,
    balance: round2(v.bills.reduce((s, b) => s + (b.total - b.amountPaid), 0)),
  }));

  return (
    <ContactManager
      kind="vendors"
      contacts={data}
      symbol={org?.currencySymbol ?? "$"}
    />
  );
}
