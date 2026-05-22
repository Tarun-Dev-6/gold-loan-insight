// import { createFileRoute, Navigate } from "@tanstack/react-router";
// import { UserCog } from "lucide-react";
// import { AppLayout } from "@/components/layout/AppLayout";
// import { EmptyState } from "@/components/common/EmptyState";
// import { useAuth } from "@/lib/auth";

// export const Route = createFileRoute("/_authenticated/staff")({
//   component: StaffPage,
// });

// function StaffPage() {
//   const { isOwner } = useAuth();
//   if (!isOwner) return <Navigate to="/dashboard" />;
//   return (
//     <AppLayout title="Staff Management">
//       <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
//         <EmptyState
//           icon={UserCog}
//           title="Staff management"
//           description="Connect the /api/accounts/staff/ endpoint to manage team members from here."
//         />
//       </div>
//     </AppLayout>
//   );
// }



import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { UserCog } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";

import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/staff")({
  component: StaffPage,
});

interface StaffUser {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  role: string;
}

function StaffPage() {

  const { isOwner } = useAuth();

  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
  });

  if (!isOwner) {
    return <Navigate to="/dashboard" />;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const response = await api.get("/api/accounts/staff/");
      return response.data;
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/api/accounts/staff/", {
        ...formData,
        role: "STAFF",
      });

      return response.data;
    },

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey: ["staff"],
      });

      setFormData({
        username: "",
        email: "",
        phone_number: "",
        password: "",
      });

      alert("Staff created successfully");
    },

    onError: () => {
      alert("Failed to create staff");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    createStaffMutation.mutate();
  };

  return (
    <AppLayout title="Staff Management">

      <div className="space-y-6">

        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">

          <h2 className="text-lg font-semibold mb-4">
            Create Staff
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2"
          >

            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value,
                })
              }
              className="rounded-lg border border-border px-4 py-2"
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
              className="rounded-lg border border-border px-4 py-2"
              required
            />

            <input
              type="text"
              placeholder="Phone Number"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone_number: e.target.value,
                })
              }
              className="rounded-lg border border-border px-4 py-2"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
              className="rounded-lg border border-border px-4 py-2"
              required
            />

            <button
              type="submit"
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2"
            >
              Create Staff
            </button>

          </form>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">

          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold">
              Staff Members
            </h2>
          </div>

          {isLoading ? (

            <LoadingState />

          ) : !data || data.results?.length === 0 ? (

            <EmptyState
              icon={UserCog}
              title="No staff members"
              description="Create your first staff account."
            />

          ) : (

            <div className="divide-y divide-border">

              {data.results?.map((staff: StaffUser) => (

                <div
                  key={staff.id}
                  className="flex items-center justify-between px-6 py-4"
                >

                  <div>

                    <p className="font-medium">
                      {staff.username}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {staff.email}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {staff.phone_number}
                    </p>

                  </div>

                  <div className="text-sm font-medium text-primary">
                    STAFF
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
