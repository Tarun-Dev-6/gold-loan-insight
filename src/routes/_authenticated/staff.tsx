import { createFileRoute, Navigate } from "@tanstack/react-router";
import { UserCog } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/staff")({
  component: StaffPage,
});

function StaffPage() {
  const { isOwner } = useAuth();
  if (!isOwner) return <Navigate to="/dashboard" />;
  return (
    <AppLayout title="Staff Management">
      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <EmptyState
          icon={UserCog}
          title="Staff management"
          description="Connect the /api/accounts/staff/ endpoint to manage team members from here."
        />
      </div>
    </AppLayout>
  );
}