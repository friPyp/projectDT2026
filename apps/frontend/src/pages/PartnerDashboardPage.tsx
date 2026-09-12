import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssignedChallenges,
  updateChallengeTeam,
  updateChallengeStatus,
  ApiError,
  type Challenge,
} from "../lib/api";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES } from "../lib/challengeLabels";
import AppLayout from "../components/AppLayout";

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
  const [teamDraft, setTeamDraft] = useState(challenge.team ?? "");
  const [error, setError] = useState<string | null>(null);

  const teamMutation = useMutation({
    mutationFn: (team: string) => updateChallengeTeam(challenge.id, team),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["assignedChallenges"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't save team."),
  });

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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={teamDraft}
          onChange={(e) => setTeamDraft(e.target.value)}
          placeholder="Team name"
          className="flex-1 min-w-[10rem] rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          onClick={() => teamMutation.mutate(teamDraft)}
          disabled={teamMutation.isPending || !teamDraft.trim()}
          className="rounded-lg bg-slate-100 text-slate-900 text-sm font-medium px-3 py-1.5 hover:bg-slate-200 disabled:opacity-50"
        >
          {teamMutation.isPending ? "Saving..." : "Save team"}
        </button>

        {nextStatus && (
          <button
            onClick={() => statusMutation.mutate(nextStatus)}
            disabled={statusMutation.isPending}
            className="rounded-lg bg-slate-900 text-white text-sm font-medium px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50"
          >
            {statusMutation.isPending ? "Updating..." : `Move to ${STATUS_LABELS[nextStatus]}`}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </li>
  );
}

export default function PartnerDashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
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

        {isLoading && <p className="text-sm text-slate-500">Loading...</p>}

        {isError && (
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Couldn't load assigned challenges."}
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
