import type { Category } from "@prisma/client";

// Session 4 (PROJECT_REFERENCE.md §5, §2): "a simple keyword-match function
// that suggests/confirms the domain — no real ML model or external API
// call". This is intentionally plain string matching, nothing fancier.
//
// Behavior: score the challenge's title+description against a keyword list
// per category. If the citizen's own chosen category got at least one
// keyword hit, confirm it (citizen's own signal wins ties). If it got zero
// hits but another category scored higher, refine to that category instead.
// If nothing matches anything, confirm the citizen's original pick — a
// human already chose a category, so "no keywords found" isn't a reason to
// override them.
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  EDUCATION: ["school", "teacher", "student", "classroom", "education", "literacy", "college", "university", "exam", "scholarship"],
  AGRICULTURE: ["farm", "crop", "irrigation", "soil", "farmer", "agriculture", "harvest", "seed", "livestock", "pesticide"],
  HEALTHCARE: ["hospital", "doctor", "clinic", "disease", "health", "medicine", "patient", "nurse", "vaccination", "medical"],
  WATER: ["water", "drinking water", "well", "pipeline", "sanitation", "drainage", "flood", "borewell", "reservoir"],
  ENVIRONMENT: ["pollution", "waste", "forest", "tree", "environment", "garbage", "plastic", "deforestation", "wildlife", "air quality"],
  ENERGY: ["electricity", "power", "solar", "energy", "grid", "outage", "transformer", "renewable", "fuel"],
  URBAN_DEVELOPMENT: ["road", "traffic", "housing", "urban", "construction", "infrastructure", "streetlight", "pothole", "footpath"],
  PUBLIC_ADMIN: ["corruption", "government", "office", "certificate", "administration", "bureaucracy", "public service", "grievance", "ration"],
};

function scoreCategory(text: string, category: Category): number {
  const keywords = CATEGORY_KEYWORDS[category];
  return keywords.reduce((count, kw) => (text.includes(kw) ? count + 1 : count), 0);
}

/**
 * Confirms or refines a citizen-chosen category based on simple keyword
 * matching against the challenge's title + description.
 */
export function categorize(title: string, description: string, chosenCategory: Category): Category {
  const text = `${title} ${description}`.toLowerCase();

  const chosenScore = scoreCategory(text, chosenCategory);
  if (chosenScore > 0) {
    return chosenCategory;
  }

  let bestCategory: Category = chosenCategory;
  let bestScore = 0;
  for (const category of Object.keys(CATEGORY_KEYWORDS) as Category[]) {
    const score = scoreCategory(text, category);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore > 0 ? bestCategory : chosenCategory;
}

// Phase 2 Session 15 (PROJECT_REFERENCE.md §8a "Session 15 — decided
// design"): a challenge can be routed on several domains. Besides the one
// primary category above, any other domain with 2 or more keyword hits is
// suggested too. Same plain string matching as above, nothing fancier.
export const MAX_DOMAINS = 3;
const MIN_HITS_FOR_EXTRA_DOMAIN = 2;

/**
 * Builds the final ordered domain list for a challenge: the primary
 * category first, then domains the citizen ticked, then auto-suggested
 * domains (2+ keyword hits, strongest first), no duplicates, at most
 * MAX_DOMAINS in total.
 */
export function pickDomains(
  title: string,
  description: string,
  primary: Category,
  citizenPicked: Category[] = []
): Category[] {
  const text = `${title} ${description}`.toLowerCase();

  const suggested = (Object.keys(CATEGORY_KEYWORDS) as Category[])
    .map((category) => ({ category, score: scoreCategory(text, category) }))
    .filter((entry) => entry.score >= MIN_HITS_FOR_EXTRA_DOMAIN)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.category);

  const ordered: Category[] = [primary];
  for (const category of [...citizenPicked, ...suggested]) {
    if (ordered.length >= MAX_DOMAINS) break;
    if (!ordered.includes(category)) ordered.push(category);
  }
  return ordered;
}
