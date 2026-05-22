import { createFileRoute, Navigate } from "@tanstack/react-router";
import { tokenStore } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const authed = typeof window !== "undefined" && !!tokenStore.getAccess();
  return <Navigate to={authed ? "/dashboard" : "/login"} />;
}
