import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

// Session 3 scope: only CITIZEN pages exist so far, so this only ever
// checks for a logged-in citizen. Partner/admin routes (Sessions 5/7) will
// need their own guards when those pages exist — extend here, don't
// generalize ahead of needing it.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "CITIZEN") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
