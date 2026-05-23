import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import type { Customer, Paginated } from "@/lib/types";
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

export function LoanForm({
  open,
  onOpenChange,
  presetCustomerId,
  presetCustomerName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presetCustomerId?: number;
  presetCustomerName?: string;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customer: presetCustomerId ? String(presetCustomerId) : "",
    loan_amount: "",
    interest_rate: "",
    gold_weight: "",
    gold_description: "",
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers", "all-for-loan"],
    queryFn: async () => (await api.get<Paginated<Customer> | Customer[]>("/api/customers/?page_size=500")).data,
    enabled: open && !presetCustomerId,
  });
  const customers: Customer[] = Array.isArray(customersData) ? customersData : (customersData?.results ?? []);

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/loans/", {
          customer: Number(form.customer),
          loan_amount: form.loan_amount,
          interest_rate: form.interest_rate,
          gold_weight: form.gold_weight,
          gold_description: form.gold_description,
        })
      ).data,
    onSuccess: () => {
      toast.success("Loan created");
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({
  queryKey: ["customer-loans", Number(form.customer)],
});

qc.invalidateQueries({
  queryKey: ["customer-profile", Number(form.customer)],
});
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
      setForm({
        customer: presetCustomerId ? String(presetCustomerId) : "",
        loan_amount: "",
        interest_rate: "",
        gold_weight: "",
        gold_description: "",
      });
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Failed to create loan")),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.customer) {
      toast.error("Please select a customer");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {presetCustomerId ? (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="text-sm font-medium">{presetCustomerName ?? `#${presetCustomerId}`}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customer} onValueChange={(v) => setForm((f) => ({ ...f, customer: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.full_name} — {c.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="loan_amount">Loan amount (₹)</Label>
              <Input id="loan_amount" type="number" step="0.01" required value={form.loan_amount}
                onChange={(e) => setForm((f) => ({ ...f, loan_amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Interest rate (%)</Label>
              <Input id="interest_rate" type="number" step="0.01" required value={form.interest_rate}
                onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gold_weight">Gold weight (g)</Label>
            <Input id="gold_weight" type="number" step="0.01" required value={form.gold_weight}
              onChange={(e) => setForm((f) => ({ ...f, gold_weight: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gold_description">Gold description</Label>
            <Textarea id="gold_description" rows={3} required value={form.gold_description}
              onChange={(e) => setForm((f) => ({ ...f, gold_description: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Loan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}