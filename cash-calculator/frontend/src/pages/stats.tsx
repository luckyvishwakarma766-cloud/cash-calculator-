import { TrendingUp, Hash, IndianRupee, Calendar, Award, BarChart2 } from "lucide-react";
import { useGetCalculationStats, getGetCalculationStatsQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  delay?: number;
}

function StatCard({ label, value, sub, icon: Icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <div
      className="glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 opacity-10 pointer-events-none ${gradient}`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-foreground/80" />
          </div>
        </div>
        <p className="text-2xl font-black tracking-tight text-foreground">{value}</p>
        <p className="text-sm font-medium text-foreground/70 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { data, isLoading, error } = useGetCalculationStats({
    query: { queryKey: getGetCalculationStatsQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div>
          <h1 className="text-xl font-bold tracking-tight gradient-text">Statistics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Loading your data...</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-sm text-destructive">Failed to load statistics</p>
      </div>
    );
  }

  const stats = data;

  const cards: StatCardProps[] = [
    {
      label: "Total Calculations",
      value: formatNumber(stats.totalCalculations),
      sub: "all-time",
      icon: Hash,
      gradient: "bg-gradient-to-br from-purple-500 to-violet-600",
      delay: 0,
    },
    {
      label: "Total Amount Processed",
      value: formatCurrency(stats.totalAmountProcessed),
      sub: "across all entries",
      icon: IndianRupee,
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-600",
      delay: 60,
    },
    {
      label: "Average Calculation",
      value: formatCurrency(stats.averageAmount),
      sub: "per entry",
      icon: BarChart2,
      gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
      delay: 120,
    },
    {
      label: "Largest Calculation",
      value: formatCurrency(stats.largestCalculation),
      sub: "single entry high",
      icon: Award,
      gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
      delay: 180,
    },
    {
      label: "Today's Count",
      value: formatNumber(stats.todayCount),
      sub: "calculations today",
      icon: Calendar,
      gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
      delay: 240,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight gradient-text">Statistics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Overview of all your cash calculations
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">All time</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Empty state */}
      {stats.totalCalculations === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center mt-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <BarChart2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground/70">No data yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Save your first calculation to start tracking statistics
          </p>
        </div>
      )}
    </div>
  );
}
