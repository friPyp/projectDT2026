import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import * as api from "./api";
import type { User } from "./api";
import { onSessionExpired } from "./authEvents";

// Read by LoginPage to show a one-time "your session expired" message —
// sessionStorage (not React state) because the redirect to /login is a
// full route change, not a prop hand-off.
const SESSION_EXPIRED_FLAG = "sessionExpired";

interface AuthContextValue {
  user: User | null;
  login: (data: { phone?: string; email?: string; password: string }) => Promise<User>;
  register: (data: { name: string; phone: string; password: string; district: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// No GET /me endpoint in §8, so on a hard refresh we only have the raw
// token, not the decoded user. Keeping the last-known user in
// localStorage alongside the token is enough for Session 3's scope
// (nothing here does anything security-sensitive with it — every real
// permission check happens server-side via the JWT, per PROJECT_REFERENCE.md
// §4's auth note).
const USER_KEY = "user";

function loadStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser());

  const applySession = useCallback((nextUser: User, token: string) => {
    api.setToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (data: { phone?: string; email?: string; password: string }) => {
      const { user: loggedInUser, token } = await api.login(data);
      applySession(loggedInUser, token);
      return loggedInUser;
    },
    [applySession]
  );

  const register = useCallback(
    async (data: { name: string; phone: string; password: string; district: string }) => {
      const { user: newUser, token } = await api.registerCitizen(data);
      applySession(newUser, token);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      api.clearToken();
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  }, []);

  // api.ts has no access to this component's state, so it emits an
  // event instead of calling setUser directly — this is where that
  // event actually clears the stale session.
  useEffect(() => {
    return onSessionExpired(() => {
      api.clearToken();
      localStorage.removeItem(USER_KEY);
      setUser(null);
      sessionStorage.setItem(SESSION_EXPIRED_FLAG, "1");
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// One-shot read: returns true once right after a session expired and
// clears the flag, so the message doesn't reappear on a later visit.
export function consumeSessionExpiredFlag(): boolean {
  const wasSet = sessionStorage.getItem(SESSION_EXPIRED_FLAG) === "1";
  if (wasSet) sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
  return wasSet;
}
