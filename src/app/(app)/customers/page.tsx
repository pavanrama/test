import { prisma } from "@/lib/db";
import { round2 } from "@/lib/money";
import { ContactManager, type Contact } from "@/components/ContactManager";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [org, customers] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: {
        invoices: { where: { status: { not: "VOID" } }, select: { total: true, amountPaid: true } },
      },
    }),
  ]);

  const data: Contact[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    address: c.address,
    taxNumber: c.taxNumber,
    notes: c.notes,
    isActive: c.isActive,
    balance: round2(
      c.invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0),
    ),
  }));

  return (
    <ContactManager
      kind="customers"
      contacts={data}
      symbol={org?.currencySymbol ?? "$"}
    />
  );
}
