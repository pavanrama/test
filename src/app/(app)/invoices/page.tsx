import Link from "next/link";
import { Plus, FileText } from "lucide-react";
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

export default async function InvoicesPage() {
  const [org, invoices] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: { customer: true },
    }),
  ]);
  const sym = org?.currencySymbol ?? "$";

  const outstanding = round2(
    invoices
      .filter((i) => i.status !== "VOID")
      .reduce((s, i) => s + (i.total - i.amountPaid), 0),
  );
  const overdue = round2(
    invoices
      .filter(
        (i) =>
          ["SENT", "PARTIAL"].includes(i.status) &&
          i.dueDate < new Date() &&
          i.amountPaid < i.total,
      )
      .reduce((s, i) => s + (i.total - i.amountPaid), 0),
  );

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            {money(outstanding, sym)} outstanding · {money(overdue, sym)} overdue
          </p>
        </div>
        <LinkButton href="/invoices/new"><Plus size={16} /> New invoice</LinkButton>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <EmptyState
            icon={<FileText size={20} />}
            title="No invoices yet"
            description="Create your first invoice to start billing customers."
            action={<LinkButton href="/invoices/new"><Plus size={16} /> New invoice</LinkButton>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Customer</Th>
                <Th>Issued</Th>
                <Th>Due</Th>
                <Th align="right">Total</Th>
                <Th align="right">Balance</Th>
                <Th align="center">Status</Th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const st = displayStatus(inv.status, inv.dueDate, inv.amountPaid, inv.total);
                return (
                  <tr key={inv.id} className="cursor-pointer hover:bg-slate-50">
                    <Td>
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-brand-600 hover:underline">
                        {inv.number}
                      </Link>
                    </Td>
                    <Td>{inv.customer.name}</Td>
                    <Td className="text-slate-500">{formatDate(inv.issueDate)}</Td>
                    <Td className="text-slate-500">{formatDate(inv.dueDate)}</Td>
                    <Td align="right" className="font-medium">{money(inv.total, sym)}</Td>
                    <Td align="right">{money(round2(inv.total - inv.amountPaid), sym)}</Td>
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
