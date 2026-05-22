import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStore } from "./api";

export type Role = "OWNER" | "STAFF";

export interface AuthUser {
  id: number | string;
  username: string;
  email?: string;
  role: Role;
  full_name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isStaff: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => tokenStore.getUser<AuthUser>());
  const [loading, setLoading] = useState(false);

  // Sync user across tabs
  useEffect(() => {
    const onStorage = () => setUser(tokenStore.getUser<AuthUser>());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/accounts/login/", { username, password });
      const access = data.access ?? data.token ?? data.access_token;
      const refresh = data.refresh ?? data.refresh_token;
      if (!access) throw new Error("Invalid login response");
      tokenStore.set(access, refresh);
      const u: AuthUser = data.user ?? {
        id: data.id ?? "me",
        username: data.username ?? username,
        email: data.email,
        role: (data.role as Role) ?? "STAFF",
        full_name: data.full_name,
      };
      tokenStore.setUser(u);
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    window.location.href = "/login";
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isOwner: user?.role === "OWNER",
      isStaff: user?.role === "STAFF",
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}