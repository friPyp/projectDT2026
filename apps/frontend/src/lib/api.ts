// Thin fetch wrapper matching PROJECT_REFERENCE.md §8's frozen shapes.
// No new HTTP library — plain fetch is enough for this project's needs.
import { emitSessionExpired } from "./authEvents";

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

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    // fetch() itself threw — offline, DNS failure, CORS, the backend
    // host unreachable, etc. Distinct from an HTTP error response
    // below, and needs its own message: there's no server response to
    // read a code/message from here.
    throw new ApiError(
      "NETWORK_ERROR",
      "Couldn't reach the server. Check your connection and try again."
    );
  }

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
    // Only treat this as a *session* expiry if we actually sent a token —
    // /auth/login returns the same UNAUTHORIZED code for a plain wrong
    // password, and that's not a session to expire.
    if (code === "UNAUTHORIZED" && token) {
      emitSessionExpired();
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

// ---- Notifications (Session 6) ----

export type NotificationType = "CHALLENGE_ASSIGNED" | "STATUS_UPDATED";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export function getNotifications() {
  return apiFetch<Notification[]>("/notifications");
}

export function markNotificationRead(id: string) {
  return apiFetch<Notification>(`/notifications/${id}/read`, { method: "PATCH" });
}

// ---- Admin dashboard (Session 7) ----

export interface AdminDashboard {
  totalChallenges: number;
  byDomain: Partial<Record<Category, number>>;
  byStatus: Partial<Record<ChallengeStatus, number>>;
  partnersEngaged: number;
  completedCount: number;
}

export function getAdminDashboard() {
  return apiFetch<AdminDashboard>("/admin/dashboard");
}

// ---- Admin manual reassignment (Priority-B) ----
// GET /challenges already returns "all" for an ADMIN caller — same
// endpoint citizens/partners use, role-aware server-side (§8). Separate
// function name here just for readability at the call site, same
// convention as getAssignedChallenges above.
export function getAllChallengesForAdmin() {
  return apiFetch<Challenge[]>("/challenges");
}

export type PartnerType = "UNIVERSITY" | "INDUSTRY";

export interface Partner {
  id: string;
  orgName: string;
  type: PartnerType;
  domains: Category[];
}

export function getPartners() {
  return apiFetch<Partner[]>("/admin/partners");
}

export function reassignChallenge(id: string, partnerId: string) {
  return apiFetch<Challenge>(`/admin/challenges/${id}/reassign`, {
    method: "PATCH",
    body: JSON.stringify({ partnerId }),
  });
}
