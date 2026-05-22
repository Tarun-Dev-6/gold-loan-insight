import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import type { Payment, PaymentMethod, Paginated } from "@/lib/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { PaymentMethodBadge } from "@/components/common/StatusBadge";
import { PaymentForm } from "@/features/payments/PaymentForm";
import { formatCurrency, formatDate } from "@/lib/format";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/_authenticated/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [method, setMethod] = useState<PaymentMethod | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["payments", { method, page }],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Payment> | Payment[]>("/api/payments/", {
        params: {
          payment_method: method === "ALL" ? undefined : method,
          page,
          page_size: PAGE_SIZE,
        },
      });
      return data;
    },
  });

  const payments: Payment[] = Array.isArray(data) ? data : (data?.results ?? []);
  const total = Array.isArray(data) ? payments.length : (data?.count ?? 0);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <AppLayout title="Payments">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Select
            value={method}
            onValueChange={(v) => {
              setPage(1);
              setMethod(v as PaymentMethod | "ALL");
            }}
          >
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All methods</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Payment
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
          {isLoading ? (
            <LoadingState />
          ) : payments.length === 0 ? (
            <EmptyState icon={Wallet} title="No payments yet" description="Record a payment to see it here." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden md:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.customer_name ?? `Loan #${p.loan}`}
                      </TableCell>
                      <TableCell>{formatCurrency(p.amount_paid)}</TableCell>
                      <TableCell><PaymentMethodBadge method={p.payment_method} /></TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.payment_date)}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[280px] truncate text-muted-foreground">
                        {p.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      <PaymentForm open={createOpen} onOpenChange={setCreateOpen} />
    </AppLayout>
  );
}