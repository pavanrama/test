export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function toDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function money(value: number, symbol = "$"): string {
  const safe = Number.isFinite(value) ? value : 0;
  const formatted = Math.abs(safe).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${safe < 0 ? "-" : ""}${symbol}${formatted}`;
}

export const INVOICE_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-200",
  SENT: "bg-blue-50 text-blue-700 ring-blue-200",
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 ring-red-200",
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
  VOID: "bg-slate-100 text-slate-400 ring-slate-200 line-through",
};

/** Returns the display status, deriving OVERDUE from the due date. */
export function displayStatus(
  status: string,
  dueDate: Date | string,
  amountPaid: number,
  total: number,
): string {
  if (["PAID", "VOID", "DRAFT"].includes(status)) return status;
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (amountPaid < total && due < new Date()) return "OVERDUE";
  return status;
}
