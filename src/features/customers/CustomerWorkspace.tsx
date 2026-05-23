import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, Users, User, Phone, MapPin, CalendarDays, Plus, Coins } from "lucide-react";
import { api } from "@/lib/api";
import type { Customer, Loan, Paginated } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { CustomerForm } from "@/features/customers/CustomerForm";
import { LoanForm } from "@/features/loans/LoanForm";
import { LoanCard } from "@/features/loans/LoanCard";
import { formatCurrency, formatDate } from "@/lib/format";
import { Pagination } from "@/components/common/Pagination";

export function CustomerWorkspace() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createLoanOpen, setCreateLoanOpen] = useState(false);

  const debounced = useDebounced(search, 250);

  const { data, isFetching } = useQuery({
    queryKey: ["customers", "search", debounced],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Customer> | Customer[]>("/api/customers/", {
        params: { search: debounced || undefined, page_size: 20 },
      });
      return data;
    },
  });

  const results: Customer[] = Array.isArray(data) ? data : (data?.results ?? []);
  const noResults = debounced.length > 0 && !isFetching && results.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-[image:var(--gradient-surface)] p-5 sm:p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-2 mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Customer Workspace</p>
          <h2 className="text-xl font-semibold tracking-tight">Find a customer to manage their loans</h2>
          <p className="text-sm text-muted-foreground">Search by name, guardian name, or phone number.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected(null);
              }}
              placeholder="Search customers…"
              className="pl-9 h-11"
            />
          </div>
          <Button size="lg" onClick={() => setCreateCustomerOpen(true)}>
            <UserPlus className="h-4 w-4" />
            New Customer
          </Button>
        </div>

        {debounced && !selected && (
          <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
            {isFetching ? (
              <div className="p-4 text-sm text-muted-foreground">Searching…</div>
            ) : noResults ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5">
                <div>
                  <p className="text-sm font-medium">No customer matches “{debounced}”.</p>
                  <p className="text-xs text-muted-foreground">You can create a new customer record.</p>
                </div>
                <Button onClick={() => setCreateCustomerOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Create Customer
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border max-h-80 overflow-auto">
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setSelected(c);
                        setSearch("");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {c.full_name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.guardian_name} · {c.phone_number}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {!selected ? (
        <EmptyState
          icon={Users}
          title="No customer selected"
          description="Search above to view a customer's profile and loans, or create a new one."
        />
      ) : (
        <SelectedCustomerView
          customer={selected}
          onClear={() => setSelected(null)}
          onCreateLoan={() => setCreateLoanOpen(true)}
        />
      )}

      <CustomerForm open={createCustomerOpen} onOpenChange={setCreateCustomerOpen} />
      {selected && (
        <LoanForm
          open={createLoanOpen}
          onOpenChange={setCreateLoanOpen}
          presetCustomerId={selected.id}
          presetCustomerName={selected.full_name}
        />
      )}
    </div>
  );
}

function SelectedCustomerView({
  customer,
  onClear,
  onCreateLoan,
}: {
  customer: Customer;
  onClear: () => void;
  onCreateLoan: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["customer-loans", customer.id],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Loan> | Loan[]>("/api/loans/", {
        params: { customer: customer.id, page_size: 200 },
      });
      return data;
    },
  });
  const loans: Loan[] = useMemo(() => {
    const arr = Array.isArray(data) ? data : (data?.results ?? []);
    // backend filter may not be honored; ensure client-side scope
    return arr.filter((l) => Number(l.customer) === Number(customer.id));
  }, [data, customer.id]);

  const totalLoans = loans.length;
const [loanPage, setLoanPage] = useState(1);

const LOANS_PER_PAGE = 2;

const paginatedLoans = loans.slice(
  (loanPage - 1) * LOANS_PER_PAGE,
  loanPage * LOANS_PER_PAGE
);

const loanPageCount = Math.ceil(
  loans.length / LOANS_PER_PAGE
);

  const activeLoans = loans.filter((l) => l.status === "ACTIVE");
  const outstanding = activeLoans.reduce((s, l) => s + Number(l.outstanding_balance ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="h-1 w-full bg-[image:var(--gradient-primary)]" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground text-lg font-bold shadow-[var(--shadow-elegant)]">
                {customer.full_name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Customer</p>
                <h2 className="text-2xl font-semibold tracking-tight truncate">{customer.full_name}</h2>
                <p className="text-sm text-muted-foreground">S/D/W of {customer.guardian_name}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onCreateLoan}>
                <Plus className="h-4 w-4" />
                New Loan
              </Button>
              <Button variant="outline" onClick={onClear}>Change customer</Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileField icon={Phone} label="Phone" value={customer.phone_number} />
            <ProfileField icon={User} label="Guardian" value={customer.guardian_name} />
            <ProfileField icon={CalendarDays} label="Customer since" value={formatDate(customer.created_at)} />
            <ProfileField icon={MapPin} label="Address" value={customer.address} className="sm:col-span-2 lg:col-span-3" />
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricTile label="Total Loans" value={String(totalLoans)} />
            <MetricTile label="Active Loans" value={String(activeLoans.length)} accent="warning" />
            <MetricTile label="Outstanding" value={formatCurrency(outstanding)} accent="primary" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">Loans</h3>
        <p className="text-xs text-muted-foreground">{totalLoans} total</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : loans.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="No loans yet"
          description="Create the first loan for this customer."
          action={
            <Button onClick={onCreateLoan}>
              <Plus className="h-4 w-4" />
              New Loan
            </Button>
          }
        />
) : (
  <>
    <div className="grid gap-4 lg:grid-cols-2">
      {paginatedLoans.map((l) => (
        <LoanCard
          key={l.id}
          loan={{
            ...l,
            customer_name: l.customer_name ?? customer.full_name,
          }}
        />
      ))}
    </div>

    {loanPageCount > 1 && (
      <div className="pt-4">
        <Pagination
          page={loanPage}
          pageCount={loanPageCount}
          onChange={setLoanPage}
        />
      </div>
    )}
  </>
)}

    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "primary" | "warning";
}) {
  const tone =
    accent === "primary"
      ? "text-primary"
      : accent === "warning"
        ? "text-[color:var(--warning)]"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${tone}`}>{value}</p>
    </div>
  );
}

function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}