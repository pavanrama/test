"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Trash2, CreditCard, Printer } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button, Field, Input, Select } from "@/components/ui";
import { money } from "@/lib/format";

type AccountOption = { id: string; code: string; name: string };

export function BillActions({
  billId,
  status,
  outstanding,
  symbol,
  payAccounts,
}: {
  billId: string;
  status: string;
  outstanding: number;
  symbol: string;
  payAccounts: AccountOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pay, setPay] = useState({
    amount: outstanding,
    date: new Date().toISOString().slice(0, 10),
    method: "BANK",
    depositAccountId: payAccounts[0]?.id ?? "",
    reference: "",
  });

  async function voidBill() {
    if (!confirm("Void this bill? Its ledger entries will be reversed.")) return;
    setBusy(true);
    const res = await fetch(`/api/bills/${billId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "void" }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return alert(j.error ?? "Action failed");
    }
    router.refresh();
  }

  async function del() {
    if (!confirm("Delete this bill?")) return;
    setBusy(true);
    const res = await fetch(`/api/bills/${billId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return alert(j.error ?? "Could not delete");
    }
    router.push("/bills");
    router.refresh();
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/bills/${billId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pay, amount: Number(pay.amount) }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Could not record payment");
    setPayOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2 no-print">
      {["OPEN", "PARTIAL", "OVERDUE"].includes(status) && outstanding > 0 && (
        <Button size="sm" onClick={() => setPayOpen(true)} disabled={busy}>
          <CreditCard size={15} /> Pay bill
        </Button>
      )}
      {["OPEN", "PARTIAL"].includes(status) && (
        <Button size="sm" variant="outline" onClick={voidBill} disabled={busy}>
          <Ban size={15} /> Void
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer size={15} /> Print
      </Button>
      <Button size="sm" variant="danger" onClick={del} disabled={busy}>
        <Trash2 size={15} /> Delete
      </Button>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Pay bill">
        <form onSubmit={submitPayment} className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Outstanding balance: <strong>{money(outstanding, symbol)}</strong>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount">
              <Input type="number" step="0.01" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} required />
            </Field>
            <Field label="Date">
              <Input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} required />
            </Field>
            <Field label="Method">
              <Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                <option value="BANK">Bank transfer</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>
            <Field label="Pay from">
              <Select value={pay.depositAccountId} onChange={(e) => setPay({ ...pay, depositAccountId: e.target.value })}>
                {payAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Reference">
            <Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} />
          </Field>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Record payment"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
