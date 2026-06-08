"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { money } from "@/lib/format";
import { round2 } from "@/lib/money";

type Vendor = { id: string; name: string };
type AccountOption = { id: string; code: string; name: string };
type Product = { id: string; name: string; cost: number; expenseAccountId: string | null };
type Line = {
  accountId: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

function blankLine(accountId = ""): Line {
  return { accountId, productId: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0 };
}

export function BillForm({
  vendors,
  accounts,
  products,
  symbol,
}: {
  vendors: Vendor[];
  accounts: AccountOption[];
  products: Product[];
  symbol: string;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const defaultAccount = accounts[0]?.id ?? "";

  const [vendorId, setVendorId] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(in30);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([blankLine(defaultAccount)]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function onProductChange(i: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (p) updateLine(i, { productId, description: p.name, unitPrice: p.cost, accountId: p.expenseAccountId ?? lines[i].accountId });
    else updateLine(i, { productId: "" });
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

  async function submit() {
    setSaving(true);
    setError(null);
    const payload = {
      vendorId,
      issueDate,
      dueDate,
      notes,
      lines: lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          accountId: l.accountId || null,
          productId: l.productId || null,
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate),
        })),
    };
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) return setError(json.error ?? "Something went wrong");
    router.push(`/bills/${json.data.id}`);
    router.refresh();
  }

  return (
    <div>
      <Link href="/bills" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">New bill</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Vendor *" className="sm:col-span-3">
              <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
                <option value="">Select a vendor…</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
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
              <Button type="button" size="sm" variant="outline" onClick={() => setLines([...lines, blankLine(defaultAccount)])}>
                <Plus size={14} /> Add line
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => {
                const amt = round2((l.quantity || 0) * (l.unitPrice || 0));
                return (
                  <div key={i} className="grid grid-cols-12 items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                    <div className="col-span-12 sm:col-span-5">
                      <Select value={l.accountId} onChange={(e) => updateLine(i, { accountId: e.target.value })} className="mb-1 text-xs">
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                      </Select>
                      <div className="flex gap-1">
                        <Select value={l.productId} onChange={(e) => onProductChange(i, e.target.value)} className="text-xs">
                          <option value="">— Item —</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                      </div>
                      <Input className="mt-1" placeholder="Description" value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} />
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
                    <div className="col-span-2 flex items-center justify-end pt-2 sm:col-span-1">
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

          <Field label="Notes" className="mt-6">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
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
          <Button onClick={submit} disabled={saving || !vendorId} className="w-full">
            {saving ? "Saving…" : "Save bill"}
          </Button>
        </div>
      </div>
    </div>
  );
}
