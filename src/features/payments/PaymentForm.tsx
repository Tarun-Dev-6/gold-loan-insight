import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import type { Loan, Paginated, PaymentMethod } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function PaymentForm({
  open,
  onOpenChange,
  defaultLoanId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultLoanId?: number;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    loan: defaultLoanId ? String(defaultLoanId) : "",
    amount: "",
    payment_method: "CASH" as PaymentMethod,
    notes: "",
  });

  const { data: loansData } = useQuery({
    queryKey: ["loans", "active-for-payment"],
    queryFn: async () => (await api.get<Paginated<Loan> | Loan[]>("/api/loans/?status=ACTIVE&page_size=500")).data,
    enabled: open && !defaultLoanId,
  });
  const loans: Loan[] = Array.isArray(loansData) ? loansData : (loansData?.results ?? []);

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/payments/", {
          loan: Number(form.loan),
          amount_paid: form.amount,
          payment_method: form.payment_method,
          notes: form.notes,
        })
      ).data,
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
      setForm({ loan: "", amount: "", payment_method: "CASH", notes: "" });
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Failed to add payment")),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.loan) {
      toast.error("Please select a loan");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!defaultLoanId && (
            <div className="space-y-2">
              <Label>Loan</Label>
              <Select value={form.loan} onValueChange={(v) => setForm((f) => ({ ...f, loan: v }))}>
                <SelectTrigger><SelectValue placeholder="Select an active loan" /></SelectTrigger>
                <SelectContent>
                  {loans.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      #{l.id} {l.customer_name ? `— ${l.customer_name}` : ""} — ₹{l.outstanding_balance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" step="0.01" required value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={form.payment_method}
                onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v as PaymentMethod }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}