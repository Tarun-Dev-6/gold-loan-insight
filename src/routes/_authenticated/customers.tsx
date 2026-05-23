import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { CustomerWorkspace } from "@/features/customers/CustomerWorkspace";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <AppLayout title="Customers">
      <CustomerWorkspace />
    </AppLayout>
  );
}