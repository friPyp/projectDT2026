import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { Role } from "../lib/api";

// Session 3 scope only checked for CITIZEN. Session 5 adds an optional
// `role` prop (defaulting to "CITIZEN" so every existing usage keeps its
// exact original behavior unchanged) so the new partner route can reuse
// this guard instead of a duplicate component. Admin's own guard is still
// Session 7's job.
export default function ProtectedRoute({
  children,
  role = "CITIZEN",
}: {
  children: ReactNode;
  role?: Role;
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
