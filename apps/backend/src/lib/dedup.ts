import { prisma } from "../prisma";

// Priority-B (PROJECT_REFERENCE.md §2): "dedup detection" — same
// no-ML philosophy as lib/categorize.ts's keyword matching. This is
// plain word-overlap between a new submission and existing challenges
// in the same district, not a real similarity model or external API.
//
// Per the call made when this was scoped: this only ever produces a
// soft, non-blocking warning — it never prevents a submission. See
// routes/challenges.ts's POST / handler, which creates the challenge
// either way and just attaches this check's result to the response.

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "and", "or", "but", "in",
  "on", "at", "to", "for", "of", "with", "this", "that", "it", "there",
  "has", "have", "had", "not", "no", "we", "our", "i", "my", "you", "your",
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const word of a) {
    if (b.has(word)) shared += 1;
  }
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

// Deliberately conservative (few false positives) — this is a heads-up,
// not a block, so it's fine to miss some real duplicates, but a false
// "this looks like a duplicate" on two unrelated challenges would just
// train citizens to ignore the warning.
const SIMILARITY_THRESHOLD = 0.35;
const MAX_MATCHES = 3;
// Plain word-overlap check, not meant to scan an unbounded table — recent
// challenges in the same district are what matters for a live duplicate.
const CANDIDATE_LIMIT = 200;

export interface PossibleDuplicate {
  id: string;
  title: string;
}

interface CandidateChallenge {
  id: string;
  title: string;
  description: string;
}

interface ScoredCandidate {
  id: string;
  title: string;
  score: number;
}

export async function findPossibleDuplicates(
  district: string,
  title: string,
  description: string
): Promise<PossibleDuplicate[]> {
  const candidates: CandidateChallenge[] = await prisma.challenge.findMany({
    where: { district },
    select: { id: true, title: true, description: true },
    orderBy: { createdAt: "desc" },
    take: CANDIDATE_LIMIT,
  });

  const newWords = significantWords(`${title} ${description}`);

  const scored: ScoredCandidate[] = candidates.map((c) => ({
    id: c.id,
    title: c.title,
    score: jaccardSimilarity(newWords, significantWords(`${c.title} ${c.description}`)),
  }));

  return scored
    .filter((c) => c.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES)
    .map(({ id, title }) => ({ id, title }));
}
