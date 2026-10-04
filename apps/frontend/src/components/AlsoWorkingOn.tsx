import { useQuery } from "@tanstack/react-query";
import { getPartnerContacts, type ChallengeAssignmentEntry } from "../lib/api";
import { STATUS_LABELS, STATUS_STYLES } from "../lib/challengeLabels";

// Phase 2 Session 15 (PROJECT_REFERENCE.md §8a "Session 15 — decided
// design"): the partner's coordination view. For each *other* partner on
// the same challenge it shows their org name, their own status and their
// contact channels (Session 12 data). Read-only — no chat, no messaging.

function OtherPartner({ entry }: { entry: ChallengeAssignmentEntry }) {
  const { data } = useQuery({
    queryKey: ["partnerContacts", entry.partnerId],
    queryFn: () => getPartnerContacts(entry.partnerId),
  });

  return (
    <li className="text-sm text-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-900">{entry.orgName}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[entry.status]}`}>
          {STATUS_LABELS[entry.status]}
        </span>
      </div>
      {data && data.length > 0 && (
        <ul className="mt-0.5 text-xs text-slate-600 space-y-0.5">
          {data.map((c) => (
            <li key={c.id}>
              {c.label}: {c.value}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function AlsoWorkingOn({
  assignments,
  ownPartnerId,
  challengeId,
}: {
  assignments: ChallengeAssignmentEntry[];
  ownPartnerId?: string;
  challengeId: string;
}) {
  const others = ownPartnerId ? assignments.filter((a) => a.partnerId !== ownPartnerId) : assignments;
  if (others.length === 0) return null;

  const headingId = `also-working-${challengeId}`;
  return (
    <section className="mt-4" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-sm font-medium text-slate-900">
        Also working on this
      </h3>
      <ul className="mt-2 space-y-2">
        {others.map((a) => (
          <OtherPartner key={a.partnerId} entry={a} />
        ))}
      </ul>
    </section>
  );
}
