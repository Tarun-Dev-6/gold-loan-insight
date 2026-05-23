import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Coins,
  CheckCircle2,
  Wallet,
  TrendingUp,
  Banknote,
  AlertTriangle,
  Clock,
  XCircle,
  Plus,
  FileDown,
  Receipt,
  Activity,
  UserPlus,
  CreditCard,
  Calculator as CalcIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import type { Loan, Payment, Paginated, Customer } from "@/lib/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/common/StatCard";
import { LoadingState } from "@/components/common/LoadingState";
import { LoanStatusBadge, PaymentMethodBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const listOf = <T,>(r: { data: Paginated<T> | T[] }): T[] =>
  Array.isArray(r.data) ? r.data : r.data.results ?? [];
const countOf = (r: { data: Paginated<unknown> | unknown[] }): number =>
  Array.isArray(r.data) ? r.data.length : (r.data as Paginated<unknown>).count ?? 0;

interface DashboardData {
  totalCustomers: number;
  activeLoans: number;
  closedLoans: number;
  inactiveLoans: number;
  outstanding: number;
  monthlyInterest: number;
  todaysCollections: number;
  totalPayments: number;
  loans: Loan[];
  payments: Payment[];
  customers: Customer[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const [customersRes, activeRes, closedRes, inactiveRes, loansRes, paymentsRes, paymentsAllRes] =
    await Promise.all([
      api.get<Paginated<Customer> | Customer[]>("/api/customers/?page_size=100"),
      api.get<Paginated<Loan> | Loan[]>("/api/loans/?status=ACTIVE&page_size=200"),
      api.get<Paginated<Loan> | Loan[]>("/api/loans/?status=CLOSED&page_size=1"),
      api.get<Paginated<Loan> | Loan[]>("/api/loans/?status=INACTIVE&page_size=1"),
      api.get<Paginated<Loan> | Loan[]>("/api/loans/?page_size=8"),
      api.get<Paginated<Payment> | Payment[]>("/api/payments/?page_size=8"),
      api.get<Paginated<Payment> | Payment[]>("/api/payments/?page_size=500"),
    ]);

  const activeLoans = listOf<Loan>(activeRes);
  const outstanding = activeLoans.reduce((s, l) => s + Number(l.outstanding_balance ?? 0), 0);
  const monthlyInterest = activeLoans.reduce(
    (s, l) => s + (Number(l.loan_amount ?? 0) * Number(l.interest_rate ?? 0)) / 100,
    0,
  );

  const allPayments = listOf<Payment>(paymentsAllRes);
  const today = new Date().toISOString().slice(0, 10);
  const todaysCollections = allPayments
    .filter((p) => (p.payment_date ?? "").slice(0, 10) === today)
    .reduce((s, p) => s + Number(p.amount_paid ?? 0), 0);
  const totalPayments = allPayments.reduce((s, p) => s + Number(p.amount_paid ?? 0), 0);

  return {
    totalCustomers: countOf(customersRes),
    activeLoans: countOf(activeRes),
    closedLoans: countOf(closedRes),
    inactiveLoans: countOf(inactiveRes),
    outstanding,
    monthlyInterest,
    todaysCollections,
    totalPayments,
    loans: listOf<Loan>(loansRes),
    payments: listOf<Payment>(paymentsRes),
    customers: listOf<Customer>(customersRes),
  };
}

function monthKey(d: string): string {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(k: string): string {
  const [y, m] = k.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}
function lastMonths(n: number): string[] {
  const arr: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    arr.push(`${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}`);
  }
  return arr;
}

function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return (
      <AppLayout title="Dashboard">
        <LoadingState />
      </AppLayout>
    );
  }

  const months = lastMonths(6);
  const monthlyCollections = months.map((k) => {
    const total = data.payments.concat([]).reduce((acc, p) => {
      return monthKey(p.payment_date) === k ? acc + Number(p.amount_paid ?? 0) : acc;
    }, 0);
    return { month: monthLabel(k), Collections: total };
  });
  const customerGrowth = months.map((k) => {
    const total = data.customers.filter((c) => monthKey(c.created_at) <= k).length;
    return { month: monthLabel(k), Customers: total };
  });
  const outstandingTrend = months.map((k, idx) => {
    // approximate: outstanding grows with loans issued up to month
    const issued = data.loans
      .filter((l) => monthKey(l.issued_date) <= k)
      .reduce((s, l) => s + Number(l.loan_amount ?? 0), 0);
    const repaid = data.payments
      .filter((p) => monthKey(p.payment_date) <= k)
      .reduce((s, p) => s + Number(p.amount_paid ?? 0), 0);
    return { month: monthLabel(k), Outstanding: Math.max(0, issued - repaid) || (idx === months.length - 1 ? data.outstanding : 0) };
  });

  const statusData = [
    { name: "Active", value: data.activeLoans, color: "var(--success)" },
    { name: "Closed", value: data.closedLoans, color: "var(--muted-foreground)" },
    { name: "Inactive", value: data.inactiveLoans, color: "var(--destructive)" },
  ].filter((s) => s.value > 0);

  // Overdue heuristic: ACTIVE loans issued over 11 months ago
  const now = Date.now();
  const overdue = data.loans
    .filter((l) => l.status === "ACTIVE")
    .map((l) => {
      const days = Math.floor((now - new Date(l.issued_date).getTime()) / 86400000);
      let level: "healthy" | "due" | "overdue" | "critical" = "healthy";
      if (days > 365) level = "critical";
      else if (days > 330) level = "overdue";
      else if (days > 300) level = "due";
      return { ...l, days, level };
    })
    .filter((l) => l.level !== "healthy")
    .slice(0, 5);

  const activity = [
    ...data.loans.map((l) => ({
      kind: "loan" as const,
      icon: Coins,
      title: `Loan created · ${l.customer_name ?? `#${l.customer}`}`,
      detail: `${formatCurrency(l.loan_amount)} · ${l.gold_weight}g`,
      at: l.issued_date,
    })),
    ...data.payments.map((p) => ({
      kind: "payment" as const,
      icon: Wallet,
      title: `Payment received · ${p.customer_name ?? `Loan #${p.loan}`}`,
      detail: `${formatCurrency(p.amount_paid)} · ${p.payment_method.replace("_", " ")}`,
      at: p.payment_date,
    })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* SECTION 1 — Hero Analytics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Customers" value={data.totalCustomers} icon={Users} hint="registered" />
          <StatCard label="Active Loans" value={data.activeLoans} icon={Coins} accent="warning" hint="currently active" />
          <StatCard label="Closed Loans" value={data.closedLoans} icon={CheckCircle2} accent="success" hint="completed" />
          <StatCard label="Inactive Loans" value={data.inactiveLoans} icon={XCircle} accent="destructive" hint="deactivated" />
          <StatCard label="Total Outstanding" value={formatCurrency(data.outstanding)} icon={Wallet} accent="primary" hint="unpaid balance" />
          <StatCard label="Monthly Interest" value={formatCurrency(data.monthlyInterest)} icon={TrendingUp} accent="success" hint="estimated / month" />
          <StatCard label="Today's Collections" value={formatCurrency(data.todaysCollections)} icon={Banknote} accent="warning" hint="received today" />
          <StatCard label="Total Payments" value={formatCurrency(data.totalPayments)} icon={Receipt} accent="primary" hint="cumulative" />
        </div>

        {/* SECTION 2 — Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Loan Status" subtitle="Distribution">
            <div className="h-64">
              {statusData.length === 0 ? (
                <EmptyChart text="No loans yet" />
              ) : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      stroke="var(--background)"
                      strokeWidth={3}
                      animationDuration={800}
                    >
                      {statusData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          <ChartCard title="Monthly Collections" subtitle="Last 6 months">
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={monthlyCollections}>
                  <defs>
                    <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="var(--primary-glow)" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Bar dataKey="Collections" fill="url(#barG)" radius={[8, 8, 0, 0]} animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Outstanding Trend" subtitle="Repayment curve">
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={outstandingTrend}>
                  <defs>
                    <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--primary-glow)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Line
                    type="monotone"
                    dataKey="Outstanding"
                    stroke="url(#lineG)"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: "var(--primary)", fill: "var(--background)", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Customer Growth" subtitle="Cumulative registrations">
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={customerGrowth}>
                <defs>
                  <linearGradient id="custG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="Customers" stroke="var(--primary)" strokeWidth={2.5} fill="url(#custG)" animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* SECTION 5 — Quick Actions */}
        <div className="rounded-2xl border border-border glass p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Quick Actions</h3>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <QuickAction to="/customers" label="New Customer" icon={UserPlus} />
            <QuickAction to="/customers" label="New Loan" icon={Coins} />
            <QuickAction to="/customers" label="Record Payment" icon={CreditCard} />
            <QuickAction to="/calculator" label="Calculator" icon={CalcIcon} />
            <QuickAction label="Export Excel" icon={FileDown} onClick={() => exportLoansCSV(data.loans)} />
            <QuickAction label="Generate Receipt" icon={Receipt} onClick={() => window.print()} />
          </div>
        </div>

        {/* Recent Loans + Payments */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Recent Loans" subtitle={`${data.loans.length} latest`}>
            <div className="divide-y divide-border">
              {data.loans.length === 0 && <Empty text="No loans yet." />}
              {data.loans.map((l) => (
                <div key={l.id} className="group flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.customer_name ?? `Customer #${l.customer}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(l.issued_date)} · {l.gold_weight}g · {l.interest_rate}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(l.loan_amount)}</p>
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                      <LoanStatusBadge status={l.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Payments" subtitle="Transaction feed">
            <div className="divide-y divide-border">
              {data.payments.length === 0 && <Empty text="No payments yet." />}
              {data.payments.map((p) => (
                <div key={p.id} className="group flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.customer_name ?? `Loan #${p.loan}`}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.payment_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-[color:var(--success)]">
                      +{formatCurrency(p.amount_paid)}
                    </p>
                    <div className="mt-1"><PaymentMethodBadge method={p.payment_method} /></div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* SECTION 6 — Overdue + SECTION 7 — Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Overdue Alerts" subtitle="Loans needing attention" icon={AlertTriangle} accent="warning">
            <div className="divide-y divide-border">
              {overdue.length === 0 && <Empty text="All loans are healthy." />}
              {overdue.map((l) => {
                const colorMap = {
                  due: "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30",
                  overdue: "bg-destructive/15 text-destructive border-destructive/30",
                  critical: "bg-destructive text-destructive-foreground border-destructive",
                  healthy: "",
                } as const;
                return (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l.customer_name ?? `Customer #${l.customer}`}</p>
                      <p className="text-xs text-muted-foreground">Issued {formatDate(l.issued_date)} · {l.days} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(l.outstanding_balance)}</p>
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", colorMap[l.level])}>
                        {l.level}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Activity Timeline" subtitle="Latest events" icon={Activity}>
            <div className="px-5 py-4">
              {activity.length === 0 ? (
                <Empty text="No recent activity." />
              ) : (
                <ol className="relative space-y-4 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-px before:bg-border">
                  {activity.map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <li key={i} className="relative flex gap-3 pl-7">
                        <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]">
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.detail}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(a.at)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border glass p-5 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-elegant)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  icon: Icon,
  accent,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "warning";
}) {
  return (
    <div className="rounded-2xl border border-border glass shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                accent === "warning"
                  ? "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-8 text-sm text-muted-foreground text-center">{text}</p>;
}
function EmptyChart({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{text}</div>;
}

function QuickAction({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to?: "/customers" | "/calculator";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  const cls =
    "group relative flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card/60 backdrop-blur p-4 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)] hover:border-primary/40";
  const inner = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs text-center">{label}</span>
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function exportLoansCSV(loans: Loan[]) {
  const header = "ID,Customer,Amount,Interest %,Gold (g),Status,Issued,Outstanding";
  const rows = loans
    .map((l) =>
      [l.id, l.customer_name ?? l.customer, l.loan_amount, l.interest_rate, l.gold_weight, l.status, l.issued_date, l.outstanding_balance]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "loans.csv";
  a.click();
  URL.revokeObjectURL(url);
}