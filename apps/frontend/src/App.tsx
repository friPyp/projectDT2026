import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SubmitChallengePage from "./pages/SubmitChallengePage";
import DashboardPage from "./pages/DashboardPage";
import PartnerDashboardPage from "./pages/PartnerDashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./lib/auth";

// Session 5: send an already-logged-in user to the dashboard for their
// own role instead of always assuming CITIZEN. Unauthenticated users still
// fall through to /login via ProtectedRoute on whichever page they land on.
function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === "PARTNER") {
    return <Navigate to="/partner" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

// Session 3: citizen submission form + dashboard, login/register pages.
// Session 5 adds /partner (assigned challenges, set team, status
// transitions). Admin's page (Session 7) still doesn't exist — do not add
// a route for it here.
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="CITIZEN">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/submit"
        element={
          <ProtectedRoute role="CITIZEN">
            <SubmitChallengePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/partner"
        element={
          <ProtectedRoute role="PARTNER">
            <PartnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default App;
