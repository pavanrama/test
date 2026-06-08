"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Lock } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
  Badge,
} from "@/components/ui";
import { money } from "@/lib/format";

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string | null;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  balance: number;
};

const TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const;
const TYPE_LABELS: Record<string, string> = {
  ASSET: "Assets",
  LIABILITY: "Liabilities",
  EQUITY: "Equity",
  INCOME: "Income",
  EXPENSE: "Expenses",
};

export function AccountsClient({
  accounts,
  symbol,
}: {
  accounts: Account[];
  symbol: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "EXPENSE",
    subtype: "",
    description: "",
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ code: "", name: "", type: "EXPENSE", subtype: "", description: "", isActive: true });
    setError(null);
    setOpen(true);
  }
  function openEdit(a: Account) {
    setEditing(a);
    setForm({
      code: a.code,
      name: a.name,
      type: a.type,
      subtype: a.subtype ?? "",
      description: a.description ?? "",
      isActive: a.isActive,
    });
    setError(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editing ? `/api/accounts/${editing.id}` : "/api/accounts";
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) return setError(json.error ?? "Something went wrong");
    setOpen(false);
    router.refresh();
  }

  async function remove(a: Account) {
    if (!confirm(`Delete account ${a.code} — ${a.name}?`)) return;
    const res = await fetch(`/api/accounts/${a.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return alert(json.error ?? "Could not delete");
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Chart of Accounts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            The backbone of your ledger — every transaction posts here.
          </p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> New account</Button>
      </div>

      <div className="space-y-5">
        {TYPES.map((type) => {
          const rows = accounts.filter((a) => a.type === type);
          if (rows.length === 0) return null;
          const total = rows.reduce((s, a) => s + a.balance, 0);
          return (
            <Card key={type}>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-900">{TYPE_LABELS[type]}</h3>
                <span className="text-sm font-semibold text-slate-700 tabular">{money(total, symbol)}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {rows.map((a) => (
                  <div key={a.id} className="group flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                    <span className="w-14 shrink-0 font-mono text-xs text-slate-400">{a.code}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">{a.name}</p>
                        {a.isSystem && (
                          <span title="System account" className="text-slate-300"><Lock size={12} /></span>
                        )}
                        {!a.isActive && <Badge className="bg-slate-100 text-slate-500 ring-slate-200">Inactive</Badge>}
                      </div>
                      {a.subtype && <p className="text-xs text-slate-400">{a.subtype.replace(/_/g, " ").toLowerCase()}</p>}
                    </div>
                    <span className="tabular text-sm font-medium text-slate-700">{money(a.balance, symbol)}</span>
                    <div className="flex w-16 justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil size={14} /></button>
                      {!a.isSystem && (
                        <button onClick={() => remove(a)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.code}` : "New account"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Code *">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="6500" />
            </Field>
            <Field label="Type *" className="sm:col-span-2">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} disabled={editing?.isSystem}>
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Name *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Marketing & Advertising" />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
