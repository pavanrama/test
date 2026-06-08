import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { round2 } from "@/lib/money";
import {
  Card,
  LinkButton,
  EmptyState,
  Table,
  Th,
  Td,
  Badge,
} from "@/components/ui";
import {
  money,
  formatDate,
  displayStatus,
  INVOICE_STATUS_STYLES,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  const [org, bills] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.bill.findMany({ orderBy: { issueDate: "desc" }, include: { vendor: true } }),
  ]);
  const sym = org?.currencySymbol ?? "$";
  const outstanding = round2(
    bills.filter((b) => b.status !== "VOID").reduce((s, b) => s + (b.total - b.amountPaid), 0),
  );

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bills</h1>
          <p className="mt-1 text-sm text-slate-500">{money(outstanding, sym)} owed to vendors</p>
        </div>
        <LinkButton href="/bills/new"><Plus size={16} /> New bill</LinkButton>
      </div>

      <Card>
        {bills.length === 0 ? (
          <EmptyState icon={<Receipt size={20} />} title="No bills yet" description="Record a vendor bill to track what you owe." action={<LinkButton href="/bills/new"><Plus size={16} /> New bill</LinkButton>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Bill</Th>
                <Th>Vendor</Th>
                <Th>Issued</Th>
                <Th>Due</Th>
                <Th align="right">Total</Th>
                <Th align="right">Balance</Th>
                <Th align="center">Status</Th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => {
                const st = displayStatus(bill.status, bill.dueDate, bill.amountPaid, bill.total);
                return (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <Td><Link href={`/bills/${bill.id}`} className="font-medium text-brand-600 hover:underline">{bill.number}</Link></Td>
                    <Td>{bill.vendor.name}</Td>
                    <Td className="text-slate-500">{formatDate(bill.issueDate)}</Td>
                    <Td className="text-slate-500">{formatDate(bill.dueDate)}</Td>
                    <Td align="right" className="font-medium">{money(bill.total, sym)}</Td>
                    <Td align="right">{money(round2(bill.total - bill.amountPaid), sym)}</Td>
                    <Td align="center"><Badge className={INVOICE_STATUS_STYLES[st]}>{st}</Badge></Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
