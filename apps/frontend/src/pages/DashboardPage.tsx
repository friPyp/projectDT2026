import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyChallenges } from "../lib/api";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES } from "../lib/challengeLabels";
import AppLayout from "../components/AppLayout";

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["myChallenges"],
    queryFn: getMyChallenges,
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Your challenges</h1>
            <p className="text-sm text-slate-500">Everything you've submitted, and where it stands.</p>
          </div>
          <Link
            to="/submit"
            className="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 whitespace-nowrap"
          >
            + New challenge
          </Link>
        </div>

        {isLoading && <p className="text-sm text-slate-500">Loading...</p>}

        {isError && (
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Couldn't load your challenges."}
          </p>
        )}

        {data && data.length === 0 && (
          <div className="text-center bg-white rounded-xl border border-dashed border-slate-300 py-12 px-6">
            <p className="text-slate-600 mb-4">You haven't submitted any challenges yet.</p>
            <Link to="/submit" className="text-slate-900 font-medium hover:underline">
              Submit your first one
            </Link>
          </div>
        )}

        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((challenge) => (
              <li key={challenge.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-medium text-slate-900 truncate">{challenge.title}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {CATEGORY_LABELS[challenge.category]} · {challenge.district}
                    </p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{challenge.description}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[challenge.status]}`}
                  >
                    {STATUS_LABELS[challenge.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
