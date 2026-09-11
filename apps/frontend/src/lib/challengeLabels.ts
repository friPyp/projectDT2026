import type { Category, ChallengeStatus } from "./api";

// Matches PROJECT_REFERENCE.md §6's fixed category list exactly (8 total).
export const CATEGORY_LABELS: Record<Category, string> = {
  EDUCATION: "Education",
  AGRICULTURE: "Agriculture",
  HEALTHCARE: "Healthcare",
  WATER: "Water",
  ENVIRONMENT: "Environment",
  ENERGY: "Energy",
  URBAN_DEVELOPMENT: "Urban Development",
  PUBLIC_ADMIN: "Public Administration",
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [Category, string][];

// Matches §6's status enum. Session 3 only ever produces SUBMITTED, but
// the dashboard should render whatever status comes back once later
// sessions (4-6) start moving challenges through the others.
export const STATUS_LABELS: Record<ChallengeStatus, string> = {
  SUBMITTED: "Submitted",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const STATUS_STYLES: Record<ChallengeStatus, string> = {
  SUBMITTED: "bg-slate-100 text-slate-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
};
