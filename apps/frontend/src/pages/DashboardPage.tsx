import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyChallenges, getNotifications, markNotificationRead, type Notification } from "../lib/api";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES } from "../lib/challengeLabels";
import AppLayout from "../components/AppLayout";

// Session 6: citizen-facing notification list — plain fetch-on-load, no
// polling (per PROJECT_REFERENCE.md §2/§7, nothing here needs real-time).
// Clicking an unread one marks it read via PATCH /notifications/:id/read.
function NotificationsList() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) {
    // Quiet on the loading tick too — the challenges list below has its
    // own loading state, no need for two loading messages stacked.
    return null;
  }

  if (isError) {
    // Session 6 spec didn't call for an error state here, but silently
    // hiding a failed fetch is a Session 8 gap — a citizen with an
    // unread assignment notice deserves to know it didn't load, not
    // just see it missing.
    return (
      <p role="alert" className="mb-6 text-sm text-red-600">
        Couldn't load notifications.
      </p>
    );
  }

  if (!data || data.length === 0) {
    // Session 6 spec doesn't call for an empty state here beyond just
    // not showing the section — the challenges list below still carries
    // the page on a first visit with nothing to notify about yet.
    return null;
  }

  const unreadCount = data.filter((n: Notification) => !n.read).length;

  return (
    <div className="mb-6 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">
          Notifications{unreadCount > 0 ? ` (${unreadCount} new)` : ""}
        </h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {data.map((n: Notification) => (
          <li key={n.id}>
            {n.read ? (
              <div className="px-4 py-3 text-sm text-slate-500">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-slate-500">{n.message}</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => readMutation.mutate(n.id)}
                className="w-full text-left px-4 py-3 text-sm text-slate-900 bg-slate-50 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400"
                aria-label={`Mark notification as read: ${n.title}`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-slate-500">{n.message}</p>
                  </div>
                </div>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["myChallenges"],
    queryFn: getMyChallenges,
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Your challenges</h1>
            <p className="text-sm text-slate-500">Everything you've submitted, and where it stands.</p>
          </div>
          <Link
            to="/submit"
            className="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 self-start sm:self-auto"
          >
            + New challenge
          </Link>
        </div>

        <NotificationsList />

        {isLoading && (
          <p aria-live="polite" className="text-sm text-slate-500">
            Loading...
          </p>
        )}

        {isError && (
          <p role="alert" className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Couldn't load your challenges."}
          </p>
        )}

        {data && data.length === 0 && (
          <div className="text-center bg-white rounded-xl border border-dashed border-slate-300 py-12 px-6">
            <p className="text-slate-600 mb-4">You haven't submitted any challenges yet.</p>
            <Link
              to="/submit"
              className="text-slate-900 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 rounded"
            >
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
