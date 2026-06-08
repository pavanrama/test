"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Button, Field, Input, Select, Textarea } from "@/components/ui";

type Org = {
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  taxNumber: string | null;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  billPrefix: string;
  defaultTaxRate: number;
  invoiceTerms: string | null;
};

export function SettingsClient({ org }: { org: Org }) {
  const router = useRouter();
  const [form, setForm] = useState<Org>(org);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Org>(key: K, value: Org[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        defaultTaxRate: Number(form.defaultTaxRate),
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) return setError(json.error ?? "Could not save");
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Company profile, currency and document defaults.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Company profile" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Company name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></Field>
            <Field label="Legal name"><Input value={form.legalName ?? ""} onChange={(e) => set("legalName", e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Website"><Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} /></Field>
            <Field label="Tax number"><Input value={form.taxNumber ?? ""} onChange={(e) => set("taxNumber", e.target.value)} /></Field>
            <Field label="Address" className="sm:col-span-2"><Textarea rows={2} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Financial preferences" />
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Currency code"><Input value={form.currency} onChange={(e) => set("currency", e.target.value)} placeholder="USD" /></Field>
            <Field label="Currency symbol"><Input value={form.currencySymbol} onChange={(e) => set("currencySymbol", e.target.value)} placeholder="$" /></Field>
            <Field label="Default tax rate (%)"><Input type="number" step="0.01" value={form.defaultTaxRate} onChange={(e) => set("defaultTaxRate", Number(e.target.value))} /></Field>
            <Field label="Invoice prefix"><Input value={form.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value)} /></Field>
            <Field label="Bill prefix"><Input value={form.billPrefix} onChange={(e) => set("billPrefix", e.target.value)} /></Field>
          </div>
          <div className="px-5 pb-5">
            <Field label="Default invoice terms"><Textarea rows={2} value={form.invoiceTerms ?? ""} onChange={(e) => set("invoiceTerms", e.target.value)} /></Field>
          </div>
        </Card>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
