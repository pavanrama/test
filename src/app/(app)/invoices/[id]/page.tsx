import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { round2 } from "@/lib/money";
import { Card, Badge, Table, Th, Td } from "@/components/ui";
import { InvoiceActions } from "@/components/InvoiceActions";
import {
  money,
  formatDate,
  displayStatus,
  INVOICE_STATUS_STYLES,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [org, invoice, depositAccounts] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: true,
        payments: { orderBy: { date: "desc" } },
      },
    }),
    prisma.account.findMany({
      where: { type: "ASSET", isActive: true, subtype: { in: ["BANK", "CASH"] } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  if (!invoice) notFound();
  const sym = org?.currencySymbol ?? "$";
  const outstanding = round2(invoice.total - invoice.amountPaid);
  const st = displayStatus(invoice.status, invoice.dueDate, invoice.amountPaid, invoice.total);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between no-print">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Invoices
        </Link>
        <InvoiceActions
          invoiceId={invoice.id}
          status={st}
          outstanding={outstanding}
          symbol={sym}
          depositAccounts={depositAccounts}
        />
      </div>

      <Card className="print-full mx-auto max-w-3xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{org?.name ?? "My Company"}</h1>
            {org?.address && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{org.address}</p>}
            {org?.email && <p className="text-sm text-slate-500">{org.email}</p>}
            {org?.taxNumber && <p className="text-sm text-slate-500">Tax: {org.taxNumber}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Invoice</p>
            <p className="text-lg font-bold text-slate-900">{invoice.number}</p>
            <Badge className={`mt-2 ${INVOICE_STATUS_STYLES[st]}`}>{st}</Badge>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
            <p className="mt-1 font-medium text-slate-900">{invoice.customer.name}</p>
            {invoice.customer.company && <p className="text-sm text-slate-500">{invoice.customer.company}</p>}
            {invoice.customer.address && <p className="whitespace-pre-line text-sm text-slate-500">{invoice.customer.address}</p>}
            {invoice.customer.email && <p className="text-sm text-slate-500">{invoice.customer.email}</p>}
          </div>
          <div className="text-right text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Issue date</span><span className="text-slate-700">{formatDate(invoice.issueDate)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-slate-400">Due date</span><span className="text-slate-700">{formatDate(invoice.dueDate)}</span></div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <Th>Description</Th>
                <Th align="right">Qty</Th>
                <Th align="right">Price</Th>
                <Th align="right">Tax</Th>
                <Th align="right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l) => (
                <tr key={l.id}>
                  <Td>{l.description}</Td>
                  <Td align="right">{l.quantity}</Td>
                  <Td align="right">{money(l.unitPrice, sym)}</Td>
                  <Td align="right">{l.taxRate}%</Td>
                  <Td align="right" className="font-medium">{money(l.amount, sym)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="tabular">{money(invoice.subtotal, sym)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Tax</dt><dd className="tabular">{money(invoice.taxTotal, sym)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><dt>Total</dt><dd className="tabular">{money(invoice.total, sym)}</dd></div>
            <div className="flex justify-between text-emerald-600"><dt>Paid</dt><dd className="tabular">{money(invoice.amountPaid, sym)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><dt>Balance due</dt><dd className="tabular">{money(outstanding, sym)}</dd></div>
          </dl>
        </div>

        {(invoice.notes || invoice.terms) && (
          <div className="mt-8 space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
            {invoice.notes && <p><span className="font-medium text-slate-700">Notes: </span>{invoice.notes}</p>}
            {invoice.terms && <p><span className="font-medium text-slate-700">Terms: </span>{invoice.terms}</p>}
          </div>
        )}
      </Card>

      {invoice.payments.length > 0 && (
        <Card className="mx-auto mt-4 max-w-3xl no-print">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Payment history</h3>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Method</Th>
                <Th>Reference</Th>
                <Th align="right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <Td>{formatDate(p.date)}</Td>
                  <Td>{p.method}</Td>
                  <Td className="text-slate-500">{p.reference ?? "—"}</Td>
                  <Td align="right" className="font-medium text-emerald-600">{money(p.amount, sym)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
