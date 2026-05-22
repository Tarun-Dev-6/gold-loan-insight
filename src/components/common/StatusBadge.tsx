import { cn } from "@/lib/utils";
import type { LoanStatus, PaymentMethod } from "@/lib/types";

const loanMap: Record<LoanStatus, string> = {
  ACTIVE: "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20",
  CLOSED: "bg-muted text-muted-foreground border-border",
  INACTIVE: "bg-destructive/10 text-destructive border-destructive/20",
};

const methodMap: Record<PaymentMethod, string> = {
  CASH: "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20",
  UPI: "bg-primary/10 text-primary border-primary/20",
  BANK_TRANSFER: "bg-accent text-accent-foreground border-accent",
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", loanMap[status])}>
      {status}
    </span>
  );
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", methodMap[method])}>
      {method.replace("_", " ")}
    </span>
  );
}