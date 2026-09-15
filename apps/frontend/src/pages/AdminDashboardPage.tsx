import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "../lib/api";
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
          </div>
        )}
      </div>
    </AppLayout>
  );
}
