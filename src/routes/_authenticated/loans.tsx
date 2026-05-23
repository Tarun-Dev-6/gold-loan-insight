import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Coins, Power } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import type { Loan, LoanStatus, Paginated } from "@/lib/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { LoanStatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LoanForm } from "@/features/loans/LoanForm";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/_authenticated/loans")({
  component: LoansPage,
});

function LoansPage() {
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<LoanStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Loan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["loans", { status, page }],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Loan> | Loan[]>("/api/loans/", {
        params: { status: status === "ALL" ? undefined : status, page, page_size: PAGE_SIZE },
      });
      return data;
    },
  });

  const loans: Loan[] = Array.isArray(data) ? data : (data?.results ?? []);
  const total = Array.isArray(data) ? loans.length : (data?.count ?? 0);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return ( await api.patch(`/api/loans/${id}/deactivate/`) ).data;
      } catch {
        return (await api.patch(`/api/loans/${id}/`, { status: "INACTIVE" })).data;
      }
    },
    onSuccess: () => {
      toast.success("Loan deactivated");
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setDeactivateTarget(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Failed to deactivate loan")),
  });

  return (
    <AppLayout title="Loans">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v as LoanStatus | "ALL");
            }}
          >
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Loan
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
          {isLoading ? (
            <LoadingState />
          ) : loans.length === 0 ? (
            <EmptyState icon={Coins} title="No loans found" description="Try changing the filter or create a new loan." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Gold</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Closed</TableHead>
                      <TableHead>Status</TableHead>
                      {isOwner && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.customer_name ?? `#${l.customer}`}</TableCell>
                        <TableCell>{formatCurrency(l.loan_amount)}</TableCell>
                        <TableCell>{l.interest_rate}%</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{l.gold_weight}g</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[160px]">{l.gold_description}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(l.outstanding_balance)}</TableCell>
                        <TableCell>{formatCurrency(l.total_paid)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(l.issued_date)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(l.closed_date)}</TableCell>
                        <TableCell><LoanStatusBadge status={l.status} /></TableCell>
                        {isOwner && (
                          <TableCell className="text-right">
                            {l.status === "ACTIVE" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeactivateTarget(l)}
                              >
                                <Power className="h-4 w-4" />
                                Deactivate
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      <LoanForm open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(v) => !v && setDeactivateTarget(null)}
        title="Deactivate loan?"
        description={`This will mark loan #${deactivateTarget?.id} as inactive.`}
        confirmText="Deactivate"
        destructive
        onConfirm={() => {
          if (deactivateTarget) deactivateMutation.mutate(deactivateTarget.id);
        }}
      />
    </AppLayout>
  );
}