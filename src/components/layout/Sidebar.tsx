import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Calculator, UserCog, LogOut, Gem } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const baseNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/calculator", label: "Calculator", icon: Calculator },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isOwner, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    ...baseNav,
    ...(isOwner ? [{ to: "/staff" as const, label: "Staff", icon: UserCog }] : []),
  ];

  return (
    <aside className="relative flex h-full w-64 flex-col glass-strong text-sidebar-foreground border-r border-sidebar-border overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -left-10 h-48 w-48 rounded-full bg-[image:var(--gradient-primary)] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
          <Gem className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-base font-semibold leading-none tracking-tight gold-text">GoldLedger</p>
          <p className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50 mt-1">Fintech Suite</p>
        </div>
      </div>
      <nav className="relative flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-primary shadow-[var(--shadow-elegant)] glow-ring"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground hover:translate-x-0.5",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-1 rounded-r-full bg-[image:var(--gradient-primary)] shadow-[0_0_12px_var(--primary)]" />}
              <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", active && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="relative border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2 bg-sidebar-accent/40 backdrop-blur">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
            {(user?.full_name ?? user?.username ?? "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name ?? user?.username}</p>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-destructive/20 hover:text-destructive transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}