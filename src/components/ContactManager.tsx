"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Textarea,
  Table,
  Th,
  Td,
  Badge,
} from "@/components/ui";
import { money } from "@/lib/format";

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  taxNumber: string | null;
  notes: string | null;
  isActive: boolean;
  balance: number;
};

const EMPTY: Partial<Contact> = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  taxNumber: "",
  notes: "",
};

export function ContactManager({
  kind,
  contacts,
  symbol,
}: {
  kind: "customers" | "vendors";
  contacts: Contact[];
  symbol: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);
  const [form, setForm] = useState<Partial<Contact>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const balanceLabel = kind === "customers" ? "Owes you" : "You owe";

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setOpen(true);
  }
  function openEdit(c: Contact) {
    setEditing(c);
    setForm(c);
    setError(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editing ? `/api/${kind}/${editing.id}` : `/api/${kind}`;
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove(c: Contact) {
    if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/${kind}/${c.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json.error ?? "Could not delete");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
            {kind}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {contacts.length} {kind === "customers" ? "customer" : "vendor"}
            {contacts.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New {kind === "customers" ? "customer" : "vendor"}
        </Button>
      </div>

      <Card>
        {contacts.length === 0 ? (
          <EmptyState
            title={`No ${kind} yet`}
            description={`Add your first ${kind === "customers" ? "customer" : "vendor"} to start tracking ${kind === "customers" ? "sales" : "purchases"}.`}
            action={<Button onClick={openCreate}><Plus size={16} /> Add {kind === "customers" ? "customer" : "vendor"}</Button>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Contact</Th>
                <Th align="right">{balanceLabel}</Th>
                <Th align="right"></Th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="group hover:bg-slate-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{c.name}</p>
                        {c.company && <p className="text-xs text-slate-500">{c.company}</p>}
                      </div>
                      {!c.isActive && <Badge className="bg-slate-100 text-slate-500 ring-slate-200">Inactive</Badge>}
                    </div>
                  </Td>
                  <Td>
                    <div className="space-y-0.5 text-xs text-slate-500">
                      {c.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {c.email}</p>}
                      {c.phone && <p className="flex items-center gap-1.5"><Phone size={12} /> {c.phone}</p>}
                      {!c.email && !c.phone && <span>—</span>}
                    </div>
                  </Td>
                  <Td align="right">
                    <span className={c.balance > 0 ? "font-semibold text-slate-900" : "text-slate-400"}>
                      {money(c.balance, symbol)}
                    </span>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(c)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.name}` : `New ${kind === "customers" ? "customer" : "vendor"}`} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Company">
              <Input value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Tax number">
              <Input value={form.taxNumber ?? ""} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} />
            </Field>
          </div>
          <Field label="Address">
            <Textarea rows={2} value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
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
