"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
  Table,
  Th,
  Td,
  Badge,
} from "@/components/ui";
import { money } from "@/lib/format";

type AccountOption = { id: string; code: string; name: string; type: string };
type Product = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  type: string;
  price: number;
  cost: number;
  taxRate: number;
  isActive: boolean;
  incomeAccountId: string | null;
  expenseAccountId: string | null;
};

const EMPTY = {
  name: "",
  sku: "",
  description: "",
  type: "SERVICE",
  price: 0,
  cost: 0,
  taxRate: 0,
  incomeAccountId: "",
  expenseAccountId: "",
  isActive: true,
};

export function ProductsClient({
  products,
  accounts,
  symbol,
}: {
  products: Product[];
  accounts: AccountOption[];
  symbol: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const incomeAccounts = accounts.filter((a) => a.type === "INCOME");
  const expenseAccounts = accounts.filter((a) => ["EXPENSE", "ASSET"].includes(a.type));

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      description: p.description ?? "",
      type: p.type,
      price: p.price,
      cost: p.cost,
      taxRate: p.taxRate,
      incomeAccountId: p.incomeAccountId ?? "",
      expenseAccountId: p.expenseAccountId ?? "",
      isActive: p.isActive,
    });
    setError(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      price: Number(form.price),
      cost: Number(form.cost),
      taxRate: Number(form.taxRate),
    };
    const url = editing ? `/api/products/${editing.id}` : "/api/products";
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) return setError(json.error ?? "Something went wrong");
    setOpen(false);
    router.refresh();
  }

  async function remove(p: Product) {
    if (!confirm(`Delete ${p.name}?`)) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return alert(json.error ?? "Could not delete");
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products &amp; Services
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Reusable line items for invoices and bills.
          </p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> New item</Button>
      </div>

      <Card>
        {products.length === 0 ? (
          <EmptyState icon={<Package size={20} />} title="No items yet" description="Create products or services to speed up invoicing." action={<Button onClick={openCreate}><Plus size={16} /> Add item</Button>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Item</Th>
                <Th>Type</Th>
                <Th align="right">Price</Th>
                <Th align="right">Cost</Th>
                <Th align="right">Tax</Th>
                <Th align="right"></Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50">
                  <Td>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <div className="flex items-center gap-2">
                      {p.sku && <p className="font-mono text-xs text-slate-400">{p.sku}</p>}
                      {!p.isActive && <Badge className="bg-slate-100 text-slate-500 ring-slate-200">Inactive</Badge>}
                    </div>
                  </Td>
                  <Td><Badge className="bg-slate-100 text-slate-600 ring-slate-200">{p.type}</Badge></Td>
                  <Td align="right">{money(p.price, symbol)}</Td>
                  <Td align="right" className="text-slate-400">{money(p.cost, symbol)}</Td>
                  <Td align="right" className="text-slate-500">{p.taxRate}%</Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil size={15} /></button>
                      <button onClick={() => remove(p)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.name}` : "New item"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="SKU">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="SERVICE">Service</option>
                <option value="INVENTORY">Inventory</option>
              </Select>
            </Field>
            <Field label="Tax rate (%)">
              <Input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} />
            </Field>
            <Field label="Sales price">
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </Field>
            <Field label="Cost">
              <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
            </Field>
            <Field label="Income account">
              <Select value={form.incomeAccountId} onChange={(e) => setForm({ ...form, incomeAccountId: e.target.value })}>
                <option value="">Default (Sales Revenue)</option>
                {incomeAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
              </Select>
            </Field>
            <Field label="Expense account">
              <Select value={form.expenseAccountId} onChange={(e) => setForm({ ...form, expenseAccountId: e.target.value })}>
                <option value="">Default (Operating Expenses)</option>
                {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
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
