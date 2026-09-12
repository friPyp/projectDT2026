// Thin fetch wrapper matching PROJECT_REFERENCE.md §8's frozen shapes.
// No new HTTP library — plain fetch is enough for this project's needs.

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Matches the frozen error shape from §8:
// { success: false, error: { code, message } }
export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Auth routes and challenge routes return the resource directly on
  // success and { success: false, error } on failure — never
  // { success: true, ...data } for successful reads/writes here, so we
  // only branch on the error shape.
  if (!res.ok) {
    let code = "UNKNOWN";
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? message;
      }
    } catch {
      // Response wasn't JSON (e.g. a proxy error page) — keep the default message.
    }
    throw new ApiError(code, message);
  }

  return res.json() as Promise<T>;
}

// ---- Types matching prisma/schema.prisma + §6 ----

export type Role = "CITIZEN" | "PARTNER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: Role;
  district: string | null;
  createdAt: string;
}

export type Category =
  | "EDUCATION"
  | "AGRICULTURE"
  | "HEALTHCARE"
  | "WATER"
  | "ENVIRONMENT"
  | "ENERGY"
  | "URBAN_DEVELOPMENT"
  | "PUBLIC_ADMIN";

export type ChallengeStatus = "SUBMITTED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";

export interface Challenge {
  id: string;
  citizenId: string;
  title: string;
  description: string;
  category: Category;
  district: string;
  status: ChallengeStatus;
  assignedPartnerId: string | null;
  team: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Auth ----

export function registerCitizen(data: {
  name: string;
  phone: string;
  password: string;
  district: string;
}) {
  return apiFetch<{ user: User; token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: { phone?: string; email?: string; password: string }) {
  return apiFetch<{ user: User; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logout() {
  return apiFetch<{ success: true }>("/auth/logout", { method: "POST" });
}

// ---- Challenges (Session 3 scope: citizen create + own list only) ----

export function createChallenge(data: {
  title: string;
  description: string;
  category: Category;
  district: string;
}) {
  return apiFetch<Challenge>("/challenges", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyChallenges() {
  return apiFetch<Challenge[]>("/challenges");
}

// ---- Partner dashboard (Session 5) ----
// GET /challenges is role-aware server-side: same endpoint as above,
// backend returns the assigned list for a PARTNER caller. Separate
// function name here just for readability at the call site.
export function getAssignedChallenges() {
  return apiFetch<Challenge[]>("/challenges");
}

export function updateChallengeTeam(id: string, team: string) {
  return apiFetch<Challenge>(`/challenges/${id}/team`, {
    method: "PATCH",
    body: JSON.stringify({ team }),
  });
}

export function updateChallengeStatus(id: string, status: "IN_PROGRESS" | "COMPLETED") {
  return apiFetch<Challenge>(`/challenges/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
