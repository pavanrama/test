"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function ReportControls({
  showRange = true,
  showAsOf = false,
}: {
  showRange?: boolean;
  showAsOf?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const inputCls =
    "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      {showRange && (
        <>
          <label className="text-xs text-slate-500">From</label>
          <input type="date" defaultValue={params.get("from") ?? ""} onChange={(e) => update("from", e.target.value)} className={inputCls} />
          <label className="text-xs text-slate-500">To</label>
          <input type="date" defaultValue={params.get("to") ?? ""} onChange={(e) => update("to", e.target.value)} className={inputCls} />
        </>
      )}
      {showAsOf && (
        <>
          <label className="text-xs text-slate-500">As of</label>
          <input type="date" defaultValue={params.get("asOf") ?? ""} onChange={(e) => update("asOf", e.target.value)} className={inputCls} />
        </>
      )}
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer size={15} /> Print
      </Button>
    </div>
  );
}
