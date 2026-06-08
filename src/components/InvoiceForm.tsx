"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { money } from "@/lib/format";
import { round2 } from "@/lib/money";

type Customer = { id: string; name: string };
type Product = { id: string; name: string; price: number; taxRate: number };
type Line = {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type InvoiceInitial = {
  id: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  terms: string | null;
  lines: Line[];
};

function blankLine(taxRate = 0): Line {
  return { productId: "", description: "", quantity: 1, unitPrice: 0, taxRate };
}

export function InvoiceForm({
  customers,
  products,
  defaultTaxRate,
  defaultTerms,
  symbol,
  initial,
}: {
  customers: Customer[];
  products: Product[];
  defaultTaxRate: number;
  defaultTerms: string;
  symbol: string;
  initial?: InvoiceInitial;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? today);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? in30);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [terms, setTerms] = useState(initial?.terms ?? defaultTerms);
  const [lines, setLines] = useState<Line[]>(
    initial?.lines?.length ? initial.lines : [blankLine(defaultTaxRate)],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function onProductChange(i: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (p) {
      updateLine(i, { productId, description: p.name, unitPrice: p.price, taxRate: p.taxRate });
    } else {
      updateLine(i, { productId: "" });
    }
  }

  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    for (const l of lines) {
      const amt = round2((l.quantity || 0) * (l.unitPrice || 0));
      subtotal += amt;
      taxTotal += round2((amt * (l.taxRate || 0)) / 100);
    }
    subtotal = round2(subtotal);
    taxTotal = round2(taxTotal);
    return { subtotal, taxTotal, total: round2(subtotal + taxTotal) };
  }, [lines]);

  async function submit(status: "DRAFT" | "SENT") {
    setSaving(true);
    setError(null);
    const payload = {
      customerId,
      issueDate,
      dueDate,
      status,
      notes,
      terms,
      lines: lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          productId: l.productId || null,
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate),
        })),
    };
    const url = initial ? `/api/invoices/${initial.id}` : "/api/invoices";
    const res = await fetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) return setError(json.error ?? "Something went wrong");
    const id = json.data?.id ?? initial?.id;
    router.push(`/invoices/${id}`);
    router.refresh();
  }

  return (
    <div>
      <Link href={initial ? `/invoices/${initial.id}` : "/invoices"} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        {initial ? "Edit invoice" : "New invoice"}
      </h1>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Customer *" className="sm:col-span-3">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                <option value="">Select a customer…</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Issue date">
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </Field>
            <Field label="Due date">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Line items</h3>
              <Button type="button" size="sm" variant="outline" onClick={() => setLines([...lines, blankLine(defaultTaxRate)])}>
                <Plus size={14} /> Add line
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => {
                const amt = round2((l.quantity || 0) * (l.unitPrice || 0));
                return (
                  <div key={i} className="grid grid-cols-12 items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                    <div className="col-span-12 sm:col-span-5">
                      <Select value={l.productId} onChange={(e) => onProductChange(i, e.target.value)} className="mb-1 text-xs">
                        <option value="">— Custom item —</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </Select>
                      <Input placeholder="Description" value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Input type="number" step="0.01" placeholder="Qty" value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Input type="number" step="0.01" placeholder="Price" value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Input type="number" step="0.01" placeholder="Tax %" value={l.taxRate} onChange={(e) => updateLine(i, { taxRate: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1 pt-2 sm:col-span-1">
                      <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" disabled={lines.length === 1}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="col-span-12 pr-2 text-right text-xs text-slate-500">
                      Line total: <span className="font-medium text-slate-700">{money(amt, symbol)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Notes">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes visible to the customer" />
            </Field>
            <Field label="Terms">
              <Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="tabular font-medium">{money(totals.subtotal, symbol)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tax</dt><dd className="tabular font-medium">{money(totals.taxTotal, symbol)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base"><dt className="font-semibold text-slate-900">Total</dt><dd className="tabular font-bold text-slate-900">{money(totals.total, symbol)}</dd></div>
            </dl>
          </Card>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-2">
            <Button onClick={() => submit("SENT")} disabled={saving || !customerId}>
              {saving ? "Saving…" : initial ? "Save invoice" : "Save & approve"}
            </Button>
            {!initial && (
              <Button variant="outline" onClick={() => submit("DRAFT")} disabled={saving || !customerId}>
                Save as draft
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
