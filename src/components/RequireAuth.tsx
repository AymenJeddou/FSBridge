import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const RequireAuth = ({ children, role }: { children: ReactNode; role?: "admin" }) => {
  const { user, loading, role: r } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl tracking-tight animate-pulse">…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" state={{ from: loc }} replace />;
  if (role === "admin" && r !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
