"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Badge,
} from "@/components/ui";
import { money, formatDate } from "@/lib/format";
import { round2 } from "@/lib/money";

type AccountOption = { id: string; code: string; name: string };
type EntryLine = { id: string; debit: number; credit: number; description: string | null; account: { code: string; name: string } };
type Entry = {
  id: string;
  date: string;
  memo: string | null;
  reference: string | null;
  source: string;
  lines: EntryLine[];
};
type FormLine = { accountId: string; description: string; debit: number; credit: number };

export function JournalClient({
  entries,
  accounts,
  symbol,
}: {
  entries: Entry[];
  accounts: AccountOption[];
  symbol: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<FormLine[]>([
    { accountId: "", description: "", debit: 0, credit: 0 },
    { accountId: "", description: "", debit: 0, credit: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const debit = round2(lines.reduce((s, l) => s + (Number(l.debit) || 0), 0));
    const credit = round2(lines.reduce((s, l) => s + (Number(l.credit) || 0), 0));
    return { debit, credit, balanced: debit === credit && debit > 0 };
  }, [lines]);

  function updateLine(i: number, patch: Partial<FormLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function reset() {
    setDate(new Date().toISOString().slice(0, 10));
    setMemo("");
    setReference("");
    setLines([
      { accountId: "", description: "", debit: 0, credit: 0 },
      { accountId: "", description: "", debit: 0, credit: 0 },
    ]);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        memo,
        reference,
        lines: lines
          .filter((l) => l.accountId && (Number(l.debit) || Number(l.credit)))
          .map((l) => ({ accountId: l.accountId, description: l.description, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) return setError(json.error ?? "Could not post entry");
    setOpen(false);
    reset();
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this journal entry?")) return;
    const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return alert(json.error ?? "Could not delete");
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Journal Entries</h1>
          <p className="mt-1 text-sm text-slate-500">Every posting in your general ledger, balanced by design.</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus size={16} /> New entry</Button>
      </div>

      <Card>
        {entries.length === 0 ? (
          <EmptyState icon={<BookOpen size={20} />} title="No journal entries" description="Post a manual entry, or create invoices and bills to generate entries automatically." />
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((e) => {
              const total = round2(e.lines.reduce((s, l) => s + l.debit, 0));
              return (
                <div key={e.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{e.memo || "Journal entry"}</span>
                        <Badge className={e.source === "MANUAL" ? "bg-brand-50 text-brand-700 ring-brand-200" : "bg-slate-100 text-slate-500 ring-slate-200"}>{e.source}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(e.date)}{e.reference ? ` · ${e.reference}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-700 tabular">{money(total, symbol)}</span>
                      {e.source === "MANUAL" && (
                        <button onClick={() => remove(e.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
                    <table className="w-full text-sm">
                      <tbody>
                        {e.lines.map((l) => (
                          <tr key={l.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-3 py-1.5 text-slate-600"><span className="font-mono text-xs text-slate-400">{l.account.code}</span> {l.account.name}</td>
                            <td className="px-3 py-1.5 text-right tabular text-slate-700">{l.debit ? money(l.debit, symbol) : ""}</td>
                            <td className="px-3 py-1.5 text-right tabular text-slate-700">{l.credit ? money(l.credit, symbol) : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New journal entry" size="xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
            <Field label="Reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" /></Field>
            <Field label="Memo"><Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Description" /></Field>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Account</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">
                      <Select value={l.accountId} onChange={(e) => updateLine(i, { accountId: e.target.value })} className="text-xs">
                        <option value="">Select…</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                      </Select>
                    </td>
                    <td className="px-2 py-1.5"><Input value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} /></td>
                    <td className="px-2 py-1.5"><Input type="number" step="0.01" className="text-right" value={l.debit || ""} onChange={(e) => updateLine(i, { debit: Number(e.target.value), credit: 0 })} /></td>
                    <td className="px-2 py-1.5"><Input type="number" step="0.01" className="text-right" value={l.credit || ""} onChange={(e) => updateLine(i, { credit: Number(e.target.value), debit: 0 })} /></td>
                    <td className="px-2 py-1.5 text-center">
                      <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" disabled={lines.length <= 2}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
                  <td className="px-3 py-2" colSpan={2}>Totals</td>
                  <td className="px-3 py-2 text-right tabular">{money(totals.debit, symbol)}</td>
                  <td className="px-3 py-2 text-right tabular">{money(totals.credit, symbol)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" size="sm" variant="outline" onClick={() => setLines([...lines, { accountId: "", description: "", debit: 0, credit: 0 }])}>
              <Plus size={14} /> Add line
            </Button>
            <span className={`text-sm font-medium ${totals.balanced ? "text-emerald-600" : "text-amber-600"}`}>
              {totals.balanced ? "Balanced ✓" : `Out of balance by ${money(Math.abs(totals.debit - totals.credit), symbol)}`}
            </span>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !totals.balanced}>{saving ? "Posting…" : "Post entry"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
