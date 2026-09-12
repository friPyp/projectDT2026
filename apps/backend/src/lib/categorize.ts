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
