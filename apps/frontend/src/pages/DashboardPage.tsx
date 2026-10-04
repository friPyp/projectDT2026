import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyChallenges,
  getNotifications,
  markNotificationRead,
  getPartnerContacts,
  updateChallenge,
  ApiError,
  type Notification,
  type Challenge,
  type Category,
  type UpdateChallengeInput,
} from "../lib/api";
import { CATEGORY_LABELS, CATEGORY_OPTIONS, STATUS_LABELS, STATUS_STYLES } from "../lib/challengeLabels";
import AppLayout from "../components/AppLayout";
import ChallengeEditHistory from "../components/ChallengeEditHistory";
import ChallengeUpdates from "../components/ChallengeUpdates";

// Session 6: citizen-facing notification list — plain fetch-on-load, no
// polling (per PROJECT_REFERENCE.md §2/§7, nothing here needs real-time).
// Clicking an unread one marks it read via PATCH /notifications/:id/read.
function NotificationsList() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
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
      <p role="alert" className="mb-6 flex items-center gap-2 text-sm text-red-600">
        Couldn't load notifications.
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

// Phase 2 Session 12: how to reach the partner assigned to a challenge.
// Collapsed by default; contacts are fetched only when opened.
function PartnerContactsPanel({ partnerId, orgName }: { partnerId: string; orgName?: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["partnerContacts", partnerId],
    queryFn: () => getPartnerContacts(partnerId),
    enabled: open,
  });

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-sm font-medium text-slate-700 underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 rounded"
      >
        {open ? `Hide ${orgName ?? "partner"} contact` : `Contact ${orgName ?? "partner"}`}
      </button>

      {open && isLoading && (
        <p aria-live="polite" className="text-sm text-slate-500 mt-2">
          Loading...
        </p>
      )}

      {open && isError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-600 mt-2">
          Couldn't load contact details.
          <button
            type="button"
            onClick={() => refetch()}
            className="font-medium underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 rounded"
          >
            Try again
          </button>
        </p>
      )}

      {open && data && data.length === 0 && (
        <p className="text-sm text-slate-500 mt-2">
          This partner hasn't added contact details yet.
        </p>
      )}

      {open && data && data.length > 0 && (
        <ul className="mt-2 space-y-1">
          {data.map((c) => (
            <li key={c.id} className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">{c.label}:</span> {c.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Phase 2 Session 13: inline edit form inside the challenge card
// (PROJECT_REFERENCE.md §8a "Session 13 — decided design"). District is
// deliberately not editable. Only changed fields are sent; Save stays
// disabled until something actually differs.
interface EditFormValues {
  title: string;
  description: string;
  category: Category;
  state: string;
  city: string;
  locality: string;
  address: string;
}

const EDIT_FIELDS = ["title", "description", "category", "state", "city", "locality", "address"] as const;

const EDIT_LOCATION_FIELDS: { name: "state" | "city" | "locality" | "address"; label: string; max: number }[] = [
  { name: "state", label: "State (optional)", max: 100 },
  { name: "city", label: "City (optional)", max: 100 },
  { name: "locality", label: "Locality / area (optional)", max: 100 },
  { name: "address", label: "Address or landmark (optional)", max: 300 },
];

function EditChallengeForm({
  challenge,
  onClose,
  onSaved,
  onCompleted,
}: {
  challenge: Challenge;
  onClose: () => void;
  onSaved: () => void;
  onCompleted: () => void;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const idp = `edit-${challenge.id}`;

  const original: EditFormValues = {
    title: challenge.title,
    description: challenge.description,
    category: challenge.category,
    state: challenge.state ?? "",
    city: challenge.city ?? "",
    locality: challenge.locality ?? "",
    address: challenge.address ?? "",
  };

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<EditFormValues>({ defaultValues: original });

  // Move focus to the first field when the form opens.
  useEffect(() => {
    setFocus("title");
  }, [setFocus]);

  const values = watch();
  const changed: UpdateChallengeInput = {};
  for (const f of EDIT_FIELDS) {
    if ((values[f] ?? "").trim() !== original[f].trim()) {
      (changed as Record<string, string>)[f] = (values[f] ?? "").trim();
    }
  }
  const hasChanges = Object.keys(changed).length > 0;

  const mutation = useMutation({
    mutationFn: (data: UpdateChallengeInput) => updateChallenge(challenge.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["challengeEdits", challenge.id] });
      onSaved();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "CHALLENGE_COMPLETED") {
        // Refetch so the Edit button disappears, then close the form.
        queryClient.invalidateQueries({ queryKey: ["myChallenges"] });
        onCompleted();
        return;
      }
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    },
  });

  const onSubmit = () => {
    if (!hasChanges) return;
    setServerError(null);
    mutation.mutate(changed);
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <div>
        <label htmlFor={`${idp}-title`} className="block text-sm font-medium text-slate-700 mb-1">
          Title
        </label>
        <input
          id={`${idp}-title`}
          type="text"
          {...register("title", {
            validate: (v) => v.trim().length > 0 || "Title is required.",
            maxLength: { value: 200, message: "Title is too long." },
          })}
          aria-invalid={errors.title ? "true" : "false"}
          aria-describedby={errors.title ? `${idp}-title-error` : undefined}
          className={inputClass}
        />
        {errors.title && (
          <p id={`${idp}-title-error`} className="text-xs text-red-600 mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${idp}-description`} className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          id={`${idp}-description`}
          rows={5}
          {...register("description", {
            validate: (v) => v.trim().length > 0 || "Description is required.",
          })}
          aria-invalid={errors.description ? "true" : "false"}
          aria-describedby={errors.description ? `${idp}-description-error` : undefined}
          className={inputClass}
        />
        {errors.description && (
          <p id={`${idp}-description-error`} className="text-xs text-red-600 mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${idp}-category`} className="block text-sm font-medium text-slate-700 mb-1">
          Category
        </label>
        <select
          id={`${idp}-category`}
          {...register("category")}
          aria-describedby={`${idp}-category-help`}
          className={`${inputClass} bg-white`}
        >
          {CATEGORY_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p id={`${idp}-category-help`} className="text-xs text-slate-500 mt-1">
          Changing the category won't move your challenge to a different partner.
        </p>
      </div>

      {EDIT_LOCATION_FIELDS.map(({ name, label, max }) => (
        <div key={name}>
          <label htmlFor={`${idp}-${name}`} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
          <input
            id={`${idp}-${name}`}
            type="text"
            {...register(name, { maxLength: { value: max, message: `Must be ${max} characters or fewer.` } })}
            aria-invalid={errors[name] ? "true" : "false"}
            aria-describedby={errors[name] ? `${idp}-${name}-error` : undefined}
            className={inputClass}
          />
          {errors[name] && (
            <p id={`${idp}-${name}-error`} className="text-xs text-red-600 mt-1">
              {errors[name]?.message}
            </p>
          )}
        </div>
      ))}

      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!hasChanges || mutation.isPending}
          className="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
        >
          {mutation.isPending ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={mutation.isPending}
          className="rounded-lg bg-slate-100 text-slate-900 text-sm font-medium px-4 py-2 hover:bg-slate-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Phase 2 Session 13: one challenge card. The JSX inside is the same
// card that used to be inlined in the list below; it moved into its own
// component only so each card can hold its own "editing" state.
function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const [editing, setEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const canEdit = challenge.status !== "COMPLETED";

  const closeForm = () => {
    setEditing(false);
    // Return focus to the Edit button once it is back on screen.
    setTimeout(() => editButtonRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!savedMessage) return;
    const t = setTimeout(() => setSavedMessage(""), 4000);
    return () => clearTimeout(t);
  }, [savedMessage]);

  return (
    <li className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-medium text-slate-900 truncate">{challenge.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {(challenge.domains && challenge.domains.length > 0 ? challenge.domains : [challenge.category])
              .map((d) => CATEGORY_LABELS[d])
              .join(", ")}{" "}
            · {challenge.district}
          </p>
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{challenge.description}</p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[challenge.status]}`}
        >
          {STATUS_LABELS[challenge.status]}
        </span>
      </div>
      {/* Session 15: one contact panel per assigned partner (falls back to
          the old single partner if a response carries no assignments). */}
      {challenge.assignments && challenge.assignments.length > 0
        ? challenge.assignments.map((a) => (
            <PartnerContactsPanel key={a.partnerId} partnerId={a.partnerId} orgName={a.orgName} />
          ))
        : challenge.assignedPartnerId && <PartnerContactsPanel partnerId={challenge.assignedPartnerId} />}
      <ChallengeEditHistory challengeId={challenge.id} />
      <ChallengeUpdates challengeId={challenge.id} />

      <p aria-live="polite" className="text-sm text-green-700 mt-2 empty:hidden">
        {savedMessage}
      </p>

      {canEdit && !editing && (
        <button
          ref={editButtonRef}
          type="button"
          onClick={() => setEditing(true)}
          className="mt-3 rounded-lg bg-slate-100 text-slate-900 text-sm font-medium px-3 py-1.5 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
        >
          Edit
        </button>
      )}

      {canEdit && editing && (
        <EditChallengeForm
          challenge={challenge}
          onClose={closeForm}
          onSaved={() => {
            setSavedMessage("Saved");
            closeForm();
          }}
          onCompleted={() => {
            setSavedMessage("");
            setEditing(false);
          }}
        />
      )}
    </li>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
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
          <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "Couldn't load your challenges."}
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
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
