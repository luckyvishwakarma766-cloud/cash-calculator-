import { useState } from "react";
import { toast } from "sonner";
import { Search, Trash2, Trash, Clock, ChevronRight, IndianRupee, Hash } from "lucide-react";
import {
  useListCalculations,
  useDeleteCalculation,
  useClearCalculations,
  getListCalculationsQueryKey,
  getGetCalculationStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatCurrency, formatNumber, formatDate } from "@/lib/utils";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useListCalculations(
    { search: search || undefined, limit: 100 },
    { query: { queryKey: getListCalculationsQueryKey({ search: search || undefined, limit: 100 }) } }
  );

  const deleteCalc = useDeleteCalculation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCalculationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCalculationStatsQueryKey() });
        toast.success("Entry deleted");
      },
      onError: () => toast.error("Failed to delete"),
    },
  });

  const clearAll = useClearCalculations({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCalculationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCalculationStatsQueryKey() });
        toast.success("All history cleared");
      },
      onError: () => toast.error("Failed to clear"),
    },
  });

  const handleClear = () => {
    if (window.confirm("Clear all calculation history? This cannot be undone.")) {
      clearAll.mutate();
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight gradient-text">History</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} {total === 1 ? "entry" : "entries"} saved
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearAll.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all duration-200 disabled:opacity-50"
          >
            <Trash className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl flex items-center gap-2.5 px-4 py-2.5">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by label..."
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/60 outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-muted-foreground hover:text-foreground text-xs px-1.5 py-0.5 rounded bg-muted/50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card rounded-xl p-6 text-center text-destructive text-sm">
          Failed to load history
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && items.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground/70">
            {search ? "No results found" : "No calculations saved yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Try a different search term" : "Save your first calculation from the Calculator tab"}
          </p>
        </div>
      )}

      {/* List */}
      {!isLoading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => {
            const isExpanded = expandedId === item.id;
            const denominations = item.denominations as Array<{
              value: number; label: string; quantity: number; subtotal: number;
            }>;

            return (
              <div
                key={item.id}
                className="glass-card rounded-xl overflow-hidden transition-all duration-200"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/10 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="w-4 h-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">
                        {item.label || "Untitled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {formatNumber(item.totalNotes)} notes
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </div>

                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                      isExpanded && "rotate-90"
                    )}
                  />
                </div>

                {/* Expanded breakdown */}
                {isExpanded && (
                  <div className="border-t border-border/30 px-4 py-3 bg-muted/10 animate-fade-in-up">
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                      <span>Denomination</span>
                      <span className="text-center">Quantity</span>
                      <span className="text-right">Amount</span>
                    </div>
                    {denominations
                      .filter((d) => d.quantity > 0)
                      .map((d) => (
                        <div key={d.label} className="grid grid-cols-3 gap-2 text-sm py-1">
                          <span className="font-medium">{d.label}</span>
                          <span className="text-center text-muted-foreground">× {d.quantity}</span>
                          <span className="text-right font-semibold">{formatCurrency(d.subtotal)}</span>
                        </div>
                      ))}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/30">
                      <span className="text-sm font-semibold">Total</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCalc.mutate({ id: item.id });
                          }}
                          disabled={deleteCalc.isPending}
                          className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                        <span className="text-sm font-bold gradient-text">{formatCurrency(item.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
