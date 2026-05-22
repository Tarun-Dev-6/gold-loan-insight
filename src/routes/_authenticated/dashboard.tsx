import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Coins, CheckCircle2, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import type { DashboardStats, Loan, Payment, Paginated } from "@/lib/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/common/StatCard";
import { LoadingState } from "@/components/common/LoadingState";
import { LoanStatusBadge, PaymentMethodBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

async function fetchDashboard(): Promise<DashboardStats> {
  // Try a dedicated stats endpoint, otherwise fall back to composing from lists
  try {
    const { data } = await api.get<DashboardStats>("/api/dashboard/stats/");
    return data;
  } catch {
    const [customersRes, activeRes, closedRes, loansRes, paymentsRes] = await Promise.all([
      api.get<Paginated<unknown> | unknown[]>("/api/customers/?page_size=1"),
      api.get<Paginated<Loan> | Loan[]>("/api/loans/?status=ACTIVE&page_size=100"),
      api.get<Paginated<Loan> | Loan[]>("/api/loans/?status=CLOSED&page_size=1"),
      api.get<Paginated<Loan> | Loan[]>("/api/loans/?page_size=5"),
      api.get<Paginated<Payment> | Payment[]>("/api/payments/?page_size=5"),
    ]);
    const count = (r: { data: Paginated<unknown> | unknown[] }): number =>
      Array.isArray(r.data) ? r.data.length : r.data.count ?? 0;
    const list = <T,>(r: { data: Paginated<T> | T[] }): T[] =>
      Array.isArray(r.data) ? r.data : r.data.results;
    const activeLoans = list(activeRes);
    const outstanding = activeLoans.reduce(
      (sum, l) => sum + Number(l.outstanding_balance ?? 0),
      0,
    );
    return {
      total_customers: count(customersRes),
      total_active_loans: count(activeRes),
      total_closed_loans: count(closedRes),
      total_outstanding_amount: outstanding,
      recent_loans: list(loansRes).slice(0, 5),
      recent_payments: list(paymentsRes).slice(0, 5),
    };
  }
}

function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  return (
    <AppLayout title="Dashboard">
      {isLoading || !data ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Customers" value={data.total_customers} icon={Users} />
            <StatCard label="Active Loans" value={data.total_active_loans} icon={Coins} accent="warning" />
            <StatCard label="Closed Loans" value={data.total_closed_loans} icon={CheckCircle2} accent="success" />
            <StatCard
              label="Outstanding"
              value={formatCurrency(data.total_outstanding_amount)}
              icon={Wallet}
              accent="primary"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold">Recent Loans</h3>
              </div>
              <div className="divide-y divide-border">
                {data.recent_loans.length === 0 && (
                  <p className="px-5 py-6 text-sm text-muted-foreground">No loans yet.</p>
                )}
                {data.recent_loans.map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {l.customer_name ?? `Customer #${l.customer}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(l.issued_date)} · {l.gold_weight}g
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(l.loan_amount)}</p>
                      <LoanStatusBadge status={l.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold">Recent Payments</h3>
              </div>
              <div className="divide-y divide-border">
                {data.recent_payments.length === 0 && (
                  <p className="px-5 py-6 text-sm text-muted-foreground">No payments yet.</p>
                )}
                {data.recent_payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.customer_name ?? `Loan #${p.loan}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.payment_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                      <PaymentMethodBadge method={p.payment_method} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}