import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Users, Eye } from "lucide-react";
import { api } from "@/lib/api";
import type { Customer, Paginated } from "@/lib/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { CustomerForm } from "@/features/customers/CustomerForm";
import { CustomerDetailsDialog } from "@/features/customers/CustomerDetailsDialog";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", { search, page }],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Customer> | Customer[]>("/api/customers/", {
        params: { search: search || undefined, page, page_size: PAGE_SIZE },
      });
      return data;
    },
  });

  const customers: Customer[] = Array.isArray(data) ? data : (data?.results ?? []);
  const total = Array.isArray(data) ? customers.length : (data?.count ?? 0);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <AppLayout title="Customers">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search by name, phone, or guardian"
              className="pl-9"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
          {isLoading ? (
            <LoadingState />
          ) : customers.length === 0 ? (
            <EmptyState icon={Users} title="No customers found" description="Try a different search or create one." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Address</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell>{c.guardian_name}</TableCell>
                      <TableCell>{c.phone_number}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[240px] truncate">{c.address}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(c)}>
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
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

      <CustomerForm open={createOpen} onOpenChange={setCreateOpen} />
      <CustomerDetailsDialog customer={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </AppLayout>
  );
}