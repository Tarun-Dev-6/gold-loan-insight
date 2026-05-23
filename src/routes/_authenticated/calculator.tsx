import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calculator as CalcIcon,
  IndianRupee,
  Percent,
  CalendarDays,
  RotateCcw,
  Printer,
  Share2,
  Copy,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calculator")({
  component: CalculatorPage,
});

type InterestType = "SIMPLE" | "COMPOUND";
type CompoundInterval = "MONTHLY" | "QUARTERLY" | "YEARLY";

function diffMonths(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
  const months =
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) +
    (e.getDate() >= s.getDate() ? 0 : -1);
  return Math.max(0, months);
}

function CalculatorPage() {
  const today = new Date();
  const oneYear = new Date(today);
  oneYear.setFullYear(oneYear.getFullYear() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const [principal, setPrincipal] = useState<number>(100000);
  const [rate, setRate] = useState<number>(1.5);
  const [start, setStart] = useState<string>(iso(today));
  const [end, setEnd] = useState<string>(iso(oneYear));
  const [duration, setDuration] = useState<number>(12);
  const [useDates, setUseDates] = useState<boolean>(true);
  const [type, setType] = useState<InterestType>("SIMPLE");
  const [interval, setInterval] = useState<CompoundInterval>("MONTHLY");

  const months = useDates ? diffMonths(start, end) : duration;

  const result = useMemo(() => {
    const p = Number(principal) || 0;
    const r = Number(rate) || 0; // monthly %
    const n = months;
    if (type === "SIMPLE") {
      const totalInterest = (p * r * n) / 100;
      const monthlyInterest = (p * r) / 100;
      return {
        principal: p,
        totalInterest,
        monthlyInterest,
        total: p + totalInterest,
        months: n,
      };
    }
    const periodsPerYear = interval === "MONTHLY" ? 12 : interval === "QUARTERLY" ? 4 : 1;
    const annualRate = r * 12;
    const periodRate = annualRate / 100 / periodsPerYear;
    const years = n / 12;
    const totalPeriods = years * periodsPerYear;
    const amount = p * Math.pow(1 + periodRate, totalPeriods);
    const totalInterest = amount - p;
    return {
      principal: p,
      totalInterest,
      monthlyInterest: n > 0 ? totalInterest / n : 0,
      total: amount,
      months: n,
    };
  }, [principal, rate, months, type, interval]);

  const breakdown = useMemo(() => {
    const rows: { month: number; principal: number; interest: number; total: number; balance: number }[] = [];
    const p = result.principal;
    if (type === "SIMPLE") {
      const monthlyInterest = (p * (Number(rate) || 0)) / 100;
      let cumulativeInterest = 0;
      for (let m = 1; m <= result.months; m++) {
        cumulativeInterest += monthlyInterest;
        rows.push({
          month: m,
          principal: p,
          interest: monthlyInterest,
          total: p + cumulativeInterest,
          balance: p + cumulativeInterest,
        });
      }
    } else {
      const annualRate = (Number(rate) || 0) * 12;
      const periodsPerYear = interval === "MONTHLY" ? 12 : interval === "QUARTERLY" ? 4 : 1;
      const periodRate = annualRate / 100 / periodsPerYear;
      let balance = p;
      let lastTotal = p;
      for (let m = 1; m <= result.months; m++) {
        const periods = (m / 12) * periodsPerYear;
        const newTotal = p * Math.pow(1 + periodRate, periods);
        const interest = newTotal - lastTotal;
        balance = newTotal;
        lastTotal = newTotal;
        rows.push({
          month: m,
          principal: p,
          interest,
          total: newTotal,
          balance,
        });
      }
    }
    return rows;
  }, [result, rate, type, interval]);

  const chartData = breakdown.map((r) => ({
    month: `M${r.month}`,
    Principal: r.principal,
    Interest: r.total - r.principal,
    Total: r.total,
  }));

  const reset = () => {
    setPrincipal(100000);
    setRate(1.5);
    setStart(iso(today));
    setEnd(iso(oneYear));
    setDuration(12);
    setType("SIMPLE");
    setInterval("MONTHLY");
    toast.success("Calculator reset");
  };

  const copyResults = async () => {
    const text = `Gold Loan Calculation\nPrincipal: ${formatCurrency(result.principal)}\nInterest: ${formatCurrency(result.totalInterest)}\nDuration: ${result.months} months\nMonthly Interest: ${formatCurrency(result.monthlyInterest)}\nTotal Payable: ${formatCurrency(result.total)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Results copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const share = async () => {
    const text = `Gold Loan: ${formatCurrency(result.principal)} @ ${rate}%/mo → Total ${formatCurrency(result.total)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Loan Calculation", text });
      } catch {
        /* user canceled */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };

  const exportCSV = () => {
    const header = "Month,Principal,Interest,Total,Balance";
    const rows = breakdown
      .map((r) => [r.month, r.principal.toFixed(2), r.interest.toFixed(2), r.total.toFixed(2), r.balance.toFixed(2)].join(","))
      .join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "loan-breakdown.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="Loan Calculator">
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-6 shadow-[var(--shadow-soft)] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[image:var(--gradient-primary)] opacity-10 blur-3xl" />
          <div className="flex items-center gap-3 relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
              <CalcIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Premium Gold Loan Calculator</h2>
              <p className="text-sm text-muted-foreground">
                Instantly compute interest, EMI breakdowns and total payable
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* LEFT — Inputs */}
          <div className="rounded-2xl border border-border glass p-6 shadow-[var(--shadow-soft)] space-y-5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("SIMPLE")}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  type === "SIMPLE"
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                Simple Interest
              </button>
              <button
                type="button"
                onClick={() => setType("COMPOUND")}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  type === "COMPOUND"
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                Compound
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Loan Amount (Principal)
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="pl-9 h-11 text-base font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Monthly Interest Rate
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="pl-9 h-11 text-base font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUseDates(true)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  useDates ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                Use Dates
              </button>
              <button
                type="button"
                onClick={() => setUseDates(false)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  !useDates ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                Use Months
              </button>
            </div>

            {useDates ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Start</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="pl-9 h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">End</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="pl-9 h-11" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duration (months)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="h-11 text-base font-medium"
                />
              </div>
            )}

            {type === "COMPOUND" && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Compound Interval
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["MONTHLY", "QUARTERLY", "YEARLY"] as const).map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInterval(i)}
                      className={cn(
                        "rounded-lg px-2 py-2 text-xs font-medium transition-all",
                        interval === i
                          ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            </div>
          </div>

          {/* RIGHT — Results */}
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-6 shadow-[var(--shadow-elegant)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[image:var(--gradient-primary)]" />
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Payable</p>
                  <p className="mt-1 text-4xl font-bold tracking-tight gold-text">
                    {formatCurrency(result.total)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    over {result.months} {result.months === 1 ? "month" : "months"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ResultPill label="Principal" value={formatCurrency(result.principal)} />
                  <ResultPill label="Interest" value={formatCurrency(result.totalInterest)} accent />
                  <ResultPill label="Monthly Interest" value={formatCurrency(result.monthlyInterest)} />
                  <ResultPill label="Duration" value={`${result.months} mo`} />
                </div>
              </div>
              <div className="relative mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={copyResults}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                </Button>
                <Button size="sm" variant="secondary" onClick={share}>
                  <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
                </Button>
                <Button size="sm" variant="secondary" onClick={exportCSV}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border glass p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Growth Projection
                </h3>
                <span className="text-xs text-muted-foreground">{type === "SIMPLE" ? "Linear" : "Compounded"}</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gPrincipal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="var(--warning)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Area
                      type="monotone"
                      dataKey="Principal"
                      stackId="1"
                      stroke="var(--primary)"
                      fill="url(#gPrincipal)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Interest"
                      stackId="1"
                      stroke="var(--warning)"
                      fill="url(#gInterest)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border glass p-5 shadow-[var(--shadow-soft)]">
              <h3 className="text-sm font-semibold mb-3">Compound Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Line type="monotone" dataKey="Total" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border glass shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Monthly Breakdown</h3>
            <span className="text-xs text-muted-foreground">{breakdown.length} rows</span>
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card/95 backdrop-blur z-10">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Month</th>
                  <th className="px-5 py-3 font-medium">Principal</th>
                  <th className="px-5 py-3 font-medium">Interest</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {breakdown.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Enter valid inputs to see the breakdown.
                    </td>
                  </tr>
                )}
                {breakdown.map((r) => (
                  <tr key={r.month} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-2.5 font-medium">M{r.month}</td>
                    <td className="px-5 py-2.5 text-muted-foreground">{formatCurrency(r.principal)}</td>
                    <td className="px-5 py-2.5 text-[color:var(--warning)]">{formatCurrency(r.interest)}</td>
                    <td className="px-5 py-2.5">{formatCurrency(r.total)}</td>
                    <td className="px-5 py-2.5 text-right font-semibold">{formatCurrency(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ResultPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/60 p-3 backdrop-blur transition-all hover:-translate-y-0.5",
        accent && "bg-primary/5 border-primary/20",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold tabular-nums", accent && "text-primary")}>{value}</p>
    </div>
  );
}