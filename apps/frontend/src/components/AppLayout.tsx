import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-slate-900">Civic Challenge Platform</span>
          <div className="flex items-center gap-3 text-sm">
            {user && <span className="text-slate-600">{user.name}</span>}
            <button onClick={handleLogout} className="text-slate-500 hover:text-slate-900">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
