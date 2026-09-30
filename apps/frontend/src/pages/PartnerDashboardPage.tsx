import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssignedChallenges,
  updateChallengeStatus,
  getMyPartnerContacts,
  addPartnerContact,
  ApiError,
  type Challenge,
} from "../lib/api";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES } from "../lib/challengeLabels";
import AppLayout from "../components/AppLayout";
import ChallengeEditHistory from "../components/ChallengeEditHistory";
import ChallengeUpdates from "../components/ChallengeUpdates";

// Session 5 (PROJECT_REFERENCE.md §5): partner's own view of challenges
// assigned to them — set a team, move status forward one step at a time.
// No notifications (Session 6) or admin view (Session 7) here.
const NEXT_STATUS: Record<Challenge["status"], "IN_PROGRESS" | "COMPLETED" | null> = {
  SUBMITTED: null,
  ASSIGNED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: null,
};

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: (status: "IN_PROGRESS" | "COMPLETED") => updateChallengeStatus(challenge.id, status),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["assignedChallenges"] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Couldn't update status."),
  });

  const nextStatus = NEXT_STATUS[challenge.status];

  return (
    <li className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium text-slate-900 truncate">{challenge.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {CATEGORY_LABELS[challenge.category]} · {challenge.district}
          </p>
          <p className="text-sm text-slate-600 mt-2">{challenge.description}</p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[challenge.status]}`}
        >
          {STATUS_LABELS[challenge.status]}
        </span>
      </div>

      {/* The team-name box was removed from this screen on frPyP's request,
          2026-09-29. Backend route PATCH /challenges/:id/team and the
          updateChallengeTeam() helper in lib/api.ts are kept. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {nextStatus && (
          <button
            onClick={() => statusMutation.mutate(nextStatus)}
            disabled={statusMutation.isPending}
            className="rounded-lg bg-slate-900 text-white text-sm font-medium px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
          >
            {statusMutation.isPending ? "Updating..." : `Move to ${STATUS_LABELS[nextStatus]}`}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600 mt-2">
          {error}
        </p>
      )}

      <ChallengeEditHistory challengeId={challenge.id} />
      <ChallengeUpdates challengeId={challenge.id} canPost />
    </li>
  );
}

// Phase 2 Session 12: partner-managed contact channels — citizens see
// these (read-only, via getPartnerContacts) so they have a direct way to
// reach whoever their challenge was routed to.
function ContactChannels() {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["myPartnerContacts"],
    queryFn: getMyPartnerContacts,
  });

  const addMutation = useMutation({
    mutationFn: () => addPartnerContact({ label, value }),
    onSuccess: () => {
      setError(null);
      setLabel("");
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["myPartnerContacts"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't add contact."),
  });

  return (
    <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Your contact channels</h2>
      <p className="text-xs text-slate-500 mt-0.5">
        Citizens see these on any challenge assigned to you, so they can reach you directly.
      </p>

      {isLoading && (
        <p aria-live="polite" className="text-sm text-slate-500 mt-3">
          Loading...
        </p>
      )}

      {isError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-600 mt-3">
          Couldn't load your contact channels.
          <button
            type="button"
            onClick={() => refetch()}
            className="font-medium underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 rounded"
          >
            Try again
          </button>
        </p>
      )}

      {data && data.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {data.map((c) => (
            <li key={c.id} className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">{c.label}:</span> {c.value}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="contact-label" className="sr-only">
          Channel label
        </label>
        <input
          id="contact-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Phone"
          className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <label htmlFor="contact-value" className="sr-only">
          Channel value
        </label>
        <input
          id="contact-value"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. +91 98765 43210"
          className="flex-1 min-w-[10rem] rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !label.trim() || !value.trim()}
          className="rounded-lg bg-slate-100 text-slate-900 text-sm font-medium px-3 py-1.5 hover:bg-slate-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
        >
          {addMutation.isPending ? "Adding..." : "Add channel"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}

export default function PartnerDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["assignedChallenges"],
    queryFn: getAssignedChallenges,
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Assigned challenges</h1>
          <p className="text-sm text-slate-500">Challenges routed to your organization.</p>
        </div>

        <ContactChannels />

        {isLoading && (
          <p aria-live="polite" className="text-sm text-slate-500">
            Loading...
          </p>
        )}

        {isError && (
          <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "Couldn't load assigned challenges."}
            <button
              type="button"
              onClick={() => refetch()}
              className="font-medium underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 rounded"
            >
              Try again
            </button>
          </p>
        )}

        {data && data.length === 0 && (
          <div className="text-center bg-white rounded-xl border border-dashed border-slate-300 py-12 px-6">
            <p className="text-slate-600">No challenges assigned yet.</p>
          </div>
        )}

        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
