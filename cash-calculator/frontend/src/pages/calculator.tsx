import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  RotateCcw, Copy, Save, Download, FileSpreadsheet, Printer,
  TrendingUp, Hash, IndianRupee, ChevronRight,
} from "lucide-react";
import { useCreateCalculation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import * as XLSX from "xlsx";

interface DenomConfig {
  value: number;
  label: string;
  color: string;
  bgClass: string;
}

const DENOMS: DenomConfig[] = [
  { value: 500, label: "₹500", color: "#a855f7", bgClass: "bg-purple-500/10 border-purple-500/20" },
  { value: 200, label: "₹200", color: "#8b5cf6", bgClass: "bg-violet-500/10 border-violet-500/20" },
  { value: 100, label: "₹100", color: "#6366f1", bgClass: "bg-indigo-500/10 border-indigo-500/20" },
  { value: 50, label: "₹50", color: "#3b82f6", bgClass: "bg-blue-500/10 border-blue-500/20" },
  { value: 20, label: "₹20", color: "#06b6d4", bgClass: "bg-cyan-500/10 border-cyan-500/20" },
  { value: 10, label: "₹10", color: "#10b981", bgClass: "bg-emerald-500/10 border-emerald-500/20" },
  { value: 5, label: "₹5", color: "#84cc16", bgClass: "bg-lime-500/10 border-lime-500/20" },
  { value: 2, label: "₹2", color: "#f59e0b", bgClass: "bg-amber-500/10 border-amber-500/20" },
  { value: 1, label: "₹1", color: "#f97316", bgClass: "bg-orange-500/10 border-orange-500/20" },
  { value: 1, label: "Coins", color: "#94a3b8", bgClass: "bg-slate-500/10 border-slate-500/20" },
];

type Quantities = Record<string, number>;

function getKey(d: DenomConfig) {
  return d.label;
}

export default function CalculatorPage() {
  const [quantities, setQuantities] = useState<Quantities>(() =>
    Object.fromEntries(DENOMS.map((d) => [getKey(d), 0]))
  );
  const [label, setLabel] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const queryClient = useQueryClient();
  const createCalc = useCreateCalculation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["listCalculations"] });
        queryClient.invalidateQueries({ queryKey: ["getCalculationStats"] });
        toast.success("Saved to history");
      },
      onError: () => {
        toast.error("Failed to save");
      },
    },
  });

  const totalAmount = DENOMS.reduce((sum, d) => sum + (quantities[getKey(d)] ?? 0) * d.value, 0);
  const totalNotes = DENOMS.reduce((sum, d) => sum + (quantities[getKey(d)] ?? 0), 0);

  const handleChange = useCallback((key: string, raw: string) => {
    const val = parseInt(raw, 10);
    setQuantities((prev) => ({ ...prev, [key]: isNaN(val) || val < 0 ? 0 : val }));
  }, []);

  const handleReset = useCallback(() => {
    setQuantities(Object.fromEntries(DENOMS.map((d) => [getKey(d), 0])));
    setLabel("");
    toast.info("Calculator reset");
  }, []);

  const buildResultText = useCallback(() => {
    const lines = [
      "=== Cash Count Summary ===",
      label ? `Label: ${label}` : "",
      "",
      ...DENOMS.filter((d) => (quantities[getKey(d)] ?? 0) > 0).map(
        (d) =>
          `${d.label.padEnd(8)} x ${String(quantities[getKey(d)]).padStart(4)} = ${formatCurrency((quantities[getKey(d)] ?? 0) * d.value)}`
      ),
      "",
      `Total Notes : ${formatNumber(totalNotes)}`,
      `Total Amount: ${formatCurrency(totalAmount)}`,
      "==========================",
    ].filter((l) => l !== undefined);
    return lines.join("\n");
  }, [quantities, totalAmount, totalNotes, label]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(buildResultText());
    toast.success("Copied to clipboard");
  }, [buildResultText]);

  const handleSave = useCallback(() => {
    if (totalAmount === 0) {
      toast.warning("Nothing to save — enter some quantities first");
      return;
    }
    const denominations = DENOMS.map((d) => ({
      value: d.value,
      label: d.label,
      quantity: quantities[getKey(d)] ?? 0,
      subtotal: (quantities[getKey(d)] ?? 0) * d.value,
    }));
    createCalc.mutate({
      data: { label: label || undefined, denominations, totalAmount, totalNotes },
    });
  }, [quantities, totalAmount, totalNotes, label, createCalc]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExcel = useCallback(() => {
    const rows = [
      ["Denomination", "Quantity", "Subtotal"],
      ...DENOMS.map((d) => [
        d.label,
        quantities[getKey(d)] ?? 0,
        (quantities[getKey(d)] ?? 0) * d.value,
      ]),
      ["", "", ""],
      ["Total Notes", totalNotes, ""],
      ["Total Amount", "", totalAmount],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash Count");
    XLSX.writeFile(wb, `cash-count-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel file downloaded");
  }, [quantities, totalAmount, totalNotes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        handleReset();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        handleCopy();
      }
      if (e.key === "Enter" && document.activeElement?.tagName === "INPUT") {
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleReset, handleCopy, handleSave]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Denomination input panel */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight gradient-text">Cash Calculator</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Enter note quantities to calculate total</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs">Ctrl+R</kbd>
            <span>reset</span>
          </div>
        </div>

        {/* Label input */}
        <div className="glass-card rounded-xl p-3 no-print">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Add a label (optional, e.g. 'Morning float')"
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/60 outline-none text-foreground"
          />
        </div>

        {/* Denominations grid */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 px-4 py-2.5 border-b border-border/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">Note</div>
            <div className="col-span-4 text-center">Quantity</div>
            <div className="col-span-5 text-right">Amount</div>
          </div>

          {/* Denomination rows */}
          <div className="divide-y divide-border/30">
            {DENOMS.map((d, i) => {
              const key = getKey(d);
              const qty = quantities[key] ?? 0;
              const subtotal = qty * d.value;

              return (
                <div
                  key={key}
                  className="denom-row grid grid-cols-12 items-center px-4 py-3 hover:bg-muted/20 transition-colors"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Label */}
                  <div className="col-span-3 flex items-center gap-2">
                    <div
                      className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border", d.bgClass)}
                      style={{ color: d.color }}
                    >
                      {d.label === "Coins" ? "¢" : d.label.replace("₹", "")}
                    </div>
                    <span className="text-sm font-semibold">{d.label}</span>
                  </div>

                  {/* Input */}
                  <div className="col-span-4 flex justify-center">
                    <input
                      ref={(el) => { inputRefs.current[key] = el; }}
                      type="number"
                      min={0}
                      value={qty === 0 ? "" : qty}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder="0"
                      className={cn(
                        "w-24 h-9 rounded-lg text-center text-sm font-medium",
                        "bg-muted/30 border border-border/50",
                        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50",
                        "transition-all duration-200 placeholder:text-muted-foreground/40"
                      )}
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="col-span-5 text-right">
                    <span
                      className={cn(
                        "text-sm font-semibold transition-all duration-300",
                        subtotal > 0 ? "text-foreground" : "text-muted-foreground/40"
                      )}
                    >
                      {subtotal > 0 ? formatCurrency(subtotal) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary panel */}
      <div className="space-y-4">
        {/* Total card */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/5 pointer-events-none" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
          <div className="amount-display" key={totalAmount}>
            <span className="text-4xl font-black tracking-tight gradient-text">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{formatNumber(totalNotes)}</span> notes
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {DENOMS.filter((d) => (quantities[getKey(d)] ?? 0) > 0).length}
                </span> types
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        {totalAmount > 0 && (
          <div className="glass-card rounded-2xl p-4 animate-fade-in-up print-section">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Breakdown</p>
            <div className="space-y-2">
              {DENOMS.filter((d) => (quantities[getKey(d)] ?? 0) > 0).map((d) => {
                const qty = quantities[getKey(d)] ?? 0;
                const subtotal = qty * d.value;
                const pct = totalAmount > 0 ? (subtotal / totalAmount) * 100 : 0;

                return (
                  <div key={getKey(d)} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium">{d.label}</span>
                        <span className="text-muted-foreground">× {qty}</span>
                      </span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: d.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 no-print">
          <button
            onClick={handleSave}
            disabled={totalAmount === 0 || createCalc.isPending}
            className={cn(
              "w-full h-10 rounded-xl flex items-center justify-center gap-2",
              "bg-primary text-primary-foreground font-semibold text-sm",
              "hover:opacity-90 active:scale-95 transition-all duration-200",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <Save className="w-4 h-4" />
            {createCalc.isPending ? "Saving..." : "Save to History"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="h-9 rounded-xl flex items-center justify-center gap-1.5 bg-muted/50 hover:bg-muted text-sm font-medium transition-all duration-200 border border-border/50 hover:border-border"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
            <button
              onClick={handleReset}
              className="h-9 rounded-xl flex items-center justify-center gap-1.5 bg-muted/50 hover:bg-muted text-sm font-medium transition-all duration-200 border border-border/50 hover:border-border"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="h-9 rounded-xl flex items-center justify-center gap-1.5 bg-muted/50 hover:bg-muted text-sm font-medium transition-all duration-200 border border-border/50 hover:border-border"
            >
              <Printer className="w-3.5 h-3.5" />
              Print PDF
            </button>
            <button
              onClick={handleExcel}
              disabled={totalAmount === 0}
              className="h-9 rounded-xl flex items-center justify-center gap-1.5 bg-muted/50 hover:bg-muted text-sm font-medium transition-all duration-200 border border-border/50 hover:border-border disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="no-print glass rounded-xl p-3 text-xs text-muted-foreground space-y-1">
          <div className="font-medium text-foreground/60 mb-1.5">Keyboard shortcuts</div>
          <div className="flex justify-between"><span>Save entry</span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">Enter</kbd></div>
          <div className="flex justify-between"><span>Reset all</span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">Ctrl+R</kbd></div>
          <div className="flex justify-between"><span>Copy result</span><kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">Ctrl+C</kbd></div>
        </div>
      </div>

      {/* Print-only section */}
      <div className="hidden print-only col-span-3">
        <h1 style={{ fontFamily: "sans-serif" }}>Cash Count Report</h1>
        {label && <p style={{ fontFamily: "sans-serif" }}>Label: {label}</p>}
        <p style={{ fontFamily: "sans-serif" }}>Date: {new Date().toLocaleString("en-IN")}</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "sans-serif", marginTop: "16px" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Denomination</th>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>Quantity</th>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {DENOMS.filter((d) => (quantities[getKey(d)] ?? 0) > 0).map((d) => (
              <tr key={getKey(d)}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{d.label}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>{quantities[getKey(d)] ?? 0}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right" }}>
                  {formatCurrency((quantities[getKey(d)] ?? 0) * d.value)}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} style={{ border: "1px solid #ccc", padding: "8px", fontWeight: "bold" }}>Total</td>
              <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
                {formatCurrency(totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontFamily: "sans-serif", marginTop: "8px" }}>Total Notes: {formatNumber(totalNotes)}</p>
      </div>
    </div>
  );
}
