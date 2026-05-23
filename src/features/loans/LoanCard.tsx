import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, Wallet, Power, CalendarDays, CheckCircle2, Gem } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import type { Loan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LoanStatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PaymentForm } from "@/features/payments/PaymentForm";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function LoanCard({ loan }: { loan: Loan }) {
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const deactivate = useMutation({
    mutationFn: async () => {
      try {
        return (await api.post(`/api/loans/${loan.id}/deactivate/`)).data;
      } catch {
        return (await api.patch(`/api/loans/${loan.id}/`, { status: "INACTIVE" })).data;
      }
    },
    onSuccess: () => {
      toast.success("Loan deactivated");
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["customer-loans"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setDeactivateOpen(false);
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Failed to deactivate loan")),
  });

  const isActive = loan.status === "ACTIVE";

  return (
    <div className="group relative rounded-xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-elegant)] overflow-hidden">
      <div className="h-1 w-full bg-[image:var(--gradient-primary)]" />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Coins className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Loan #{loan.id}</p>
              <p className="text-lg font-semibold tracking-tight">{formatCurrency(loan.loan_amount)}</p>
            </div>
          </div>
          <LoanStatusBadge status={loan.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Stat label="Outstanding" value={formatCurrency(loan.outstanding_balance)} accent="warning" />
          <Stat label="Total Paid" value={formatCurrency(loan.total_paid)} accent="success" />
          <Stat label="Interest" value={`${loan.interest_rate}%`} />
          <Stat label="Gold Weight" value={`${loan.gold_weight} g`} icon={Gem} />
          <Stat label="Issued" value={formatDate(loan.issued_date)} icon={CalendarDays} />
          <Stat label="Closed" value={formatDate(loan.closed_date)} icon={CheckCircle2} />
        </div>

        {loan.gold_description && (
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Gold: </span>
            {loan.gold_description}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {isActive && (
            <Button size="sm" onClick={() => setPayOpen(true)}>
              <Wallet className="h-4 w-4" />
              Record Payment
            </Button>
          )}
          {isActive && isOwner && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeactivateOpen(true)}
            >
              <Power className="h-4 w-4" />
              Deactivate
            </Button>
          )}
        </div>
      </div>

      <PaymentForm open={payOpen} onOpenChange={setPayOpen} defaultLoanId={loan.id} />
      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate loan?"
        description={`This will mark loan #${loan.id} as inactive.`}
        confirmText="Deactivate"
        destructive
        onConfirm={() => deactivate.mutate()}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "warning" | "success";
}) {
  const tone =
    accent === "warning"
      ? "text-[color:var(--warning)]"
      : accent === "success"
        ? "text-[color:var(--success)]"
        : "text-foreground";
  return (
    <div className="space-y-0.5">
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className={`text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}