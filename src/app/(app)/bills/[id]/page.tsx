import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { round2 } from "@/lib/money";
import { Card, Badge, Table, Th, Td } from "@/components/ui";
import { BillActions } from "@/components/BillActions";
import {
  money,
  formatDate,
  displayStatus,
  INVOICE_STATUS_STYLES,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [org, bill, payAccounts] = await Promise.all([
    prisma.organization.findFirst(),
    prisma.bill.findUnique({
      where: { id },
      include: { vendor: true, lines: true, payments: { orderBy: { date: "desc" } } },
    }),
    prisma.account.findMany({
      where: { type: "ASSET", isActive: true, subtype: { in: ["BANK", "CASH"] } },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  if (!bill) notFound();
  const sym = org?.currencySymbol ?? "$";
  const outstanding = round2(bill.total - bill.amountPaid);
  const st = displayStatus(bill.status, bill.dueDate, bill.amountPaid, bill.total);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between no-print">
        <Link href="/bills" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Bills
        </Link>
        <BillActions billId={bill.id} status={st} outstanding={outstanding} symbol={sym} payAccounts={payAccounts} />
      </div>

      <Card className="print-full mx-auto max-w-3xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vendor bill</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{bill.vendor.name}</h1>
            {bill.vendor.company && <p className="text-sm text-slate-500">{bill.vendor.company}</p>}
            {bill.vendor.address && <p className="whitespace-pre-line text-sm text-slate-500">{bill.vendor.address}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">{bill.number}</p>
            <Badge className={`mt-2 ${INVOICE_STATUS_STYLES[st]}`}>{st}</Badge>
            <div className="mt-3 text-sm">
              <div className="flex justify-between gap-6"><span className="text-slate-400">Issued</span><span className="text-slate-700">{formatDate(bill.issueDate)}</span></div>
              <div className="flex justify-between gap-6"><span className="text-slate-400">Due</span><span className="text-slate-700">{formatDate(bill.dueDate)}</span></div>
            </div>
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
              {bill.lines.map((l) => (
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
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="tabular">{money(bill.subtotal, sym)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Tax</dt><dd className="tabular">{money(bill.taxTotal, sym)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><dt>Total</dt><dd className="tabular">{money(bill.total, sym)}</dd></div>
            <div className="flex justify-between text-emerald-600"><dt>Paid</dt><dd className="tabular">{money(bill.amountPaid, sym)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><dt>Balance due</dt><dd className="tabular">{money(outstanding, sym)}</dd></div>
          </dl>
        </div>

        {bill.notes && (
          <div className="mt-8 border-t border-slate-100 pt-4 text-sm text-slate-500">
            <span className="font-medium text-slate-700">Notes: </span>{bill.notes}
          </div>
        )}
      </Card>

      {bill.payments.length > 0 && (
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
              {bill.payments.map((p) => (
                <tr key={p.id}>
                  <Td>{formatDate(p.date)}</Td>
                  <Td>{p.method}</Td>
                  <Td className="text-slate-500">{p.reference ?? "—"}</Td>
                  <Td align="right" className="font-medium text-red-600">{money(p.amount, sym)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
