import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Customer } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export function CustomerDetailsDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>
        {customer && (
          <div className="space-y-3">
            <DetailRow label="Full name" value={customer.full_name} />
            <DetailRow label="Guardian name" value={customer.guardian_name} />
            <DetailRow label="Phone" value={customer.phone_number} />
            <DetailRow label="Address" value={customer.address} />
            <DetailRow label="Created" value={formatDateTime(customer.created_at)} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border last:border-0 pb-2 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}