import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminDashboard,
  getAllChallengesForAdmin,
  getPartners,
  reassignChallenge,
  ApiError,
  type Challenge,
} from "../lib/api";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES } from "../lib/challengeLabels";
import AppLayout from "../components/AppLayout";
import type { Category, ChallengeStatus } from "../lib/api";

// Session 7 (PROJECT_REFERENCE.md §5/§8): read-only counts only — no
// workflow actions here (§2: admin is a dashboard viewer for MVP).

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

// Priority-B: admin manual reassignment (PROJECT_REFERENCE.md §2). Per
// the call made when this was scoped, reassigning resets status to
// ASSIGNED and clears the team name (new partner starts fresh), and the
// new partner gets notified — all handled server-side, see
// routes/admin.ts. The admin picks freely from every partner, not just
// ones matching the challenge's category — the point of a manual
// override is being able to go against the automatic domain match.
function ReassignRow({ challenge }: { challenge: Challenge }) {
  const queryClient = useQueryClient();
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: partners } = useQuery({
    queryKey: ["partners"],
    queryFn: getPartners,
  });

  const mutation = useMutation({
    mutationFn: (partnerId: string) => reassignChallenge(challenge.id, partnerId),
    onSuccess: () => {
      setError(null);
      setSelectedPartnerId("");
      queryClient.invalidateQueries({ queryKey: ["adminChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't reassign."),
  });

  const currentPartner = partners?.find((p) => p.id === challenge.assignedPartnerId);

  return (
    <li className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{challenge.title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {CATEGORY_LABELS[challenge.category]} · {challenge.district}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Currently: {currentPartner ? currentPartner.orgName : "Unassigned"}
          </p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[challenge.status]}`}
        >
          {STATUS_LABELS[challenge.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={`reassign-${challenge.id}`} className="sr-only">
          Reassign {challenge.title} to a different partner
        </label>
        <select
          id={`reassign-${challenge.id}`}
          value={selectedPartnerId}
          onChange={(e) => setSelectedPartnerId(e.target.value)}
          className="flex-1 min-w-[10rem] rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">Reassign to...</option>
          {partners?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.orgName} ({p.domains.map((d) => CATEGORY_LABELS[d]).join(", ")})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => mutation.mutate(selectedPartnerId)}
          disabled={mutation.isPending || !selectedPartnerId}
          className="rounded-lg bg-slate-900 text-white text-sm font-medium px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
        >
          {mutation.isPending ? "Reassigning..." : "Reassign"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600 mt-2">
          {error}
        </p>
      )}
    </li>
  );
}

function AllChallengesSection() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["adminChallenges"],
    queryFn: getAllChallengesForAdmin,
  });

  return (
    <div>
      <h2 className="text-sm font-medium text-slate-900 mb-3">All challenges</h2>

      {isLoading && (
        <p aria-live="polite" className="text-sm text-slate-500">
          Loading...
        </p>
      )}

      {isError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
          {error instanceof Error ? error.message : "Couldn't load challenges."}
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
        <p className="text-sm text-slate-500">No challenges submitted yet.</p>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((challenge) => (
            <ReassignRow key={challenge.id} challenge={challenge} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: getAdminDashboard,
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Admin dashboard</h1>
          <p className="text-sm text-slate-500">Aggregate totals across all challenges.</p>
        </div>

        {isLoading && (
          <p aria-live="polite" className="text-sm text-slate-500">
            Loading...
          </p>
        )}

        {isError && (
          <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "Couldn't load dashboard totals."}
            <button
              type="button"
              onClick={() => refetch()}
              className="font-medium underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 rounded"
            >
              Try again
            </button>
          </p>
        )}

        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard label="Total challenges" value={data.totalChallenges} />
              <StatCard label="Partners engaged" value={data.partnersEngaged} />
              <StatCard label="Completed" value={data.completedCount} />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-medium text-slate-900 mb-3">By status</h2>
              <ul className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_LABELS) as ChallengeStatus[]).map((status) => (
                  <li
                    key={status}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}
                  >
                    {STATUS_LABELS[status]}: {data.byStatus[status] ?? 0}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-medium text-slate-900 mb-3">By domain</h2>
              <ul className="space-y-1.5">
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
                  <li
                    key={category}
                    className="flex items-center justify-between text-sm text-slate-700"
                  >
                    <span>{CATEGORY_LABELS[category]}</span>
                    <span className="font-medium">{data.byDomain[category] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>

            <AllChallengesSection />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
