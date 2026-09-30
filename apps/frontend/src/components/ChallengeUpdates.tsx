import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, createChallengeUpdate, getChallengeUpdates } from "../lib/api";

// Phase 2 Session 14: shared status-note timeline (PROJECT_REFERENCE.md
// §5a, §8a). Read-only on the citizen and admin views; on the partner view
// (canPost) it also shows a small "post a note" form. Newest first. Notes
// are append-only — there is no edit or delete control.

const MAX_NOTE_LENGTH = 500;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ChallengeUpdates({
  challengeId,
  canPost = false,
}: {
  challengeId: string;
  canPost?: boolean;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, isError, refetch } = useQuery({
    queryKey: ["challengeUpdates", challengeId],
    queryFn: () => getChallengeUpdates(challengeId),
  });

  const mutation = useMutation({
    mutationFn: () => createChallengeUpdate(challengeId, note.trim()),
    onSuccess: () => {
      setNote("");
      setError(null);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["challengeUpdates", challengeId] });
    },
    onError: (err) => {
      setSaved(false);
      setError(err instanceof ApiError ? err.message : "Couldn't post the note.");
    },
  });

  if (isError) {
    return (
      <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-600">
        Couldn't load status notes.
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

  const hasNotes = !!data && data.length > 0;
  // Citizen/admin views show nothing until a partner has posted a note.
  if (!canPost && !hasNotes) return null;

  const trimmed = note.trim();
  const headingId = `status-notes-${challengeId}`;

  return (
    <section className="mt-4" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-sm font-medium text-slate-900">
        Status notes
      </h3>

      {canPost && (
        <div className="mt-2">
          <label htmlFor={`note-${challengeId}`} className="sr-only">
            New status note
          </label>
          <textarea
            id={`note-${challengeId}`}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            maxLength={MAX_NOTE_LENGTH}
            rows={2}
            placeholder="Add a short update for the citizen…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          />
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!trimmed || mutation.isPending}
              className="rounded-lg bg-slate-900 text-white text-sm font-medium px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
            >
              {mutation.isPending ? "Posting..." : "Post note"}
            </button>
            <span className="text-xs text-slate-500">
              {note.length}/{MAX_NOTE_LENGTH} · notes can't be edited or deleted once posted
            </span>
          </div>
          {error && (
            <p role="alert" className="text-xs text-red-600 mt-1">
              {error}
            </p>
          )}
          <p role="status" aria-live="polite" className="text-xs text-green-700 mt-1">
            {saved ? "Posted" : ""}
          </p>
        </div>
      )}

      {hasNotes && (
        <ol className="mt-2 space-y-3 border-l-2 border-slate-200 pl-3">
          {data!.map((entry) => (
            <li key={entry.id} className="text-sm text-slate-700">
              <p className="text-xs text-slate-500">{formatDate(entry.createdAt)}</p>
              <p className="mt-0.5 whitespace-pre-wrap break-words">{entry.note}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
