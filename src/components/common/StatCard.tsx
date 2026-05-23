import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "primary",
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
  trend?: { value: number; positive?: boolean };
}) {
  const accentMap = {
    primary: {
      icon: "bg-primary/10 text-primary",
      glow: "bg-primary/20",
      ring: "from-primary/30 to-primary-glow/30",
    },
    success: {
      icon: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
      glow: "bg-[color:var(--success)]/20",
      ring: "from-[color:var(--success)]/30 to-[color:var(--success)]/10",
    },
    warning: {
      icon: "bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
      glow: "bg-[color:var(--warning)]/20",
      ring: "from-[color:var(--warning)]/30 to-[color:var(--warning)]/10",
    },
    destructive: {
      icon: "bg-destructive/10 text-destructive",
      glow: "bg-destructive/20",
      ring: "from-destructive/30 to-destructive/10",
    },
  } as const;
  const a = accentMap[accent];
  const TrendIcon = trend?.positive === false ? TrendingDown : TrendingUp;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border glass p-5 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1">
      <div className={cn("pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity", a.glow)} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            {trend && (
              <span className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                trend.positive === false ? "bg-destructive/10 text-destructive" : "bg-[color:var(--success)]/10 text-[color:var(--success)]",
              )}>
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend.value).toFixed(1)}%
              </span>
            )}
            {hint && <span className="text-muted-foreground truncate">{hint}</span>}
          </div>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shadow-[var(--shadow-soft)] transition-transform group-hover:scale-110", a.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}