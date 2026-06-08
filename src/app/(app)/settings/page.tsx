import { prisma } from "@/lib/db";
import { SettingsClient } from "@/components/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let org = await prisma.organization.findFirst();
  if (!org) org = await prisma.organization.create({ data: {} });

  return (
    <SettingsClient
      org={{
        name: org.name,
        legalName: org.legalName,
        email: org.email,
        phone: org.phone,
        website: org.website,
        address: org.address,
        taxNumber: org.taxNumber,
        currency: org.currency,
        currencySymbol: org.currencySymbol,
        invoicePrefix: org.invoicePrefix,
        billPrefix: org.billPrefix,
        defaultTaxRate: org.defaultTaxRate,
        invoiceTerms: org.invoiceTerms,
      }}
    />
  );
}
