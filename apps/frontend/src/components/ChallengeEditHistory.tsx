import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getChallengeEdits } from "../lib/api";
import { CATEGORY_LABELS } from "../lib/challengeLabels";

// Phase 2 Session 13: shared edit-history panel, used on the citizen,
// partner and admin views (PROJECT_REFERENCE.md §8a). Renders nothing when
// a challenge has never been edited.

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  category: "Category",
  state: "State",
  city: "City",
  locality: "Locality",
  address: "Address",
};

const MAX_VALUE_LENGTH = 80;

function formatValue(field: string, value: string | null): string {
  if (value === null || value === "") return "(blank)";
  const shown =
    field === "category" && value in CATEGORY_LABELS
      ? CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS]
      : value;
  return shown.length > MAX_VALUE_LENGTH ? `${shown.slice(0, MAX_VALUE_LENGTH)}…` : shown;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ChallengeEditHistory({ challengeId }: { challengeId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isError, refetch } = useQuery({
    queryKey: ["challengeEdits", challengeId],
    queryFn: () => getChallengeEdits(challengeId),
  });

  if (isError) {
    return (
      <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-600">
        Couldn't load edit history.
        <button
          type="button"
          onClick={() => refetch()}
          className="font-medium underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 rounded"
        >
          Try again
        </button>
      </p>
    );
  }

  if (!data || data.length === 0) return null;

  const panelId = `edit-history-${challengeId}`;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="text-sm font-medium text-slate-700 underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 rounded"
      >
        Edited {data.length}× · last {formatDate(data[0].editedAt)}
      </button>

      {open && (
        <ul id={panelId} className="mt-2 space-y-3 border-l-2 border-slate-200 pl-3">
          {data.map((entry) => (
            <li key={entry.id} className="text-sm text-slate-700">
              <p className="text-xs text-slate-500">{formatDate(entry.editedAt)}</p>
              <ul className="mt-0.5 space-y-0.5">
                {Object.entries(entry.changedFields).map(([field, change]) => (
                  <li key={field}>
                    <span className="font-medium text-slate-900">{FIELD_LABELS[field] ?? field}:</span>{" "}
                    {formatValue(field, change.before)} → {formatValue(field, change.after)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
