// ═══════════════════════════════════════════════════════
// Recommendation Engine — rule-based v0
//
// Input:  MealPlanInput (scenario, flavors, ingredients, profile)
// Output: 2-3 MealPlan variants
//
// Weighting strategy (P0, rule-based, no ML):
//   Hard filter: allergies, dietaryRestrictions, equipment mismatch
//   Boost:      todayFlavors match, alreadyHave ingredients, coupleFavoriteScore
//   Demote:     recently cooked, too troublesome, partner dislikes
//   Tiebreak:   coupleFavoriteScore, totalTimeMinutes
//
// @调研员: add weight values and rule logic here
// ═══════════════════════════════════════════════════════

import type {
  MealPlanInput,
  MealPlan,
  Recipe,
  CoupleProfile,
  MealDish,
  ShoppingList,
  FlavorTag,
} from '../../../shared/types';

// ── Weight constants (tune here) ──────────────────────

export const WEIGHTS = {
  // Boosts
  FLAVOR_MATCH: 10,           // per matching flavor tag
  INGREDIENT_MATCH: 8,        // per alreadyHave ingredient
  COUPLE_FAVORITE: 15,        // coupleFavoriteScore multiplier
  WORKDAY_QUICK: 5,           // suitableFor weekday + <30min

  // Demotions
  RECENTLY_COOKED_7D: -20,    // cooked within 7 days
  RECENTLY_COOKED_14D: -10,   // cooked within 14 days
  TOO_TROUBLESOME: -15,       // tagCounts['太麻烦'] > threshold
  PARTNER_DISLIKES: -12,      // one partner's dislikedFlavors match
  TIME_OVER_BUDGET: -30,      // exceeds timeBudgetMinutes
};

// ── Main entry ────────────────────────────────────────

export async function generateMealPlans(
  input: MealPlanInput,
  profile: CoupleProfile,
  recipePool: Recipe[]
): Promise<MealPlan[]> {
  // 1. Hard filter
  const eligible = hardFilter(recipePool, profile);

  // 2. Score each recipe
  const scored = scoreRecipes(eligible, input, profile);

  // 3. Compose meal combinations (match mealStructure)
  const combinations = composeMeals(scored, input);

  // 4. Build 2-3 MealPlan variants with rationale + shopping list
  const plans = combinations.slice(0, 3).map((dishes, i) =>
    buildMealPlan(input, dishes, i)
  );

  return plans;
}

// ── Hard filter ───────────────────────────────────────

function hardFilter(recipes: Recipe[], profile: CoupleProfile): Recipe[] {
  const allAllergies = new Set([
    ...profile.partnerA.allergies,
    ...profile.partnerB.allergies,
  ]);
  const allRestrictions = new Set([
    ...profile.partnerA.dietaryRestrictions,
    ...profile.partnerB.dietaryRestrictions,
  ]);

  return recipes.filter(r => {
    // Allergy check
    // TODO: match r.ingredients against allAllergies

    // Equipment check
    // TODO: match r.equipmentNeeded against available equipment

    return true;
  });
}

// ── Scoring ───────────────────────────────────────────

function scoreRecipes(
  recipes: Recipe[],
  input: MealPlanInput,
  profile: CoupleProfile
): { recipe: Recipe; score: number }[] {
  // TODO @调研员: implement scoring logic
  // - todayFlavors match → WEIGHTS.FLAVOR_MATCH * count
  // - ingredient overlap → WEIGHTS.INGREDIENT_MATCH * count
  // - recipe.stats.coupleFavoriteScore → WEIGHTS.COUPLE_FAVORITE * score
  // - lastCookedAt recency demotion
  // - timeBudgetMinutes constraint

  return recipes.map(r => ({ recipe: r, score: 0 }));
}

// ── Meal composition ──────────────────────────────────

function composeMeals(
  scored: { recipe: Recipe; score: number }[],
  input: MealPlanInput
): MealDish[][] {
  // TODO @调研员: greedy composition respecting mealStructure
  // - Pick highest-score 荤菜, 素菜, 汤
  // - Avoid flavor overlap too much
  // - Generate 2-3 variant combos

  return [];
}

// ── Build MealPlan ────────────────────────────────────

function buildMealPlan(
  input: MealPlanInput,
  dishes: MealDish[],
  variantIndex: number
): MealPlan {
  // TODO @工程师: construct complete MealPlan object
  // - Calculate totalTime
  // - Build shoppingList (alreadyHave / needToBuy / optional)
  // - Generate rationale text
  // - Build taskDivision if applicable

  return {
    id: '',
    generatedAt: new Date().toISOString(),
    status: 'generated',
    input,
    scenario: input.scenario,
    dishes,
    rationale: '',
    totalTimeMinutes: 0,
    difficulty: 1,
    suitableForCookingTogether: false,
    shoppingList: { alreadyHave: [], needToBuy: [], optional: [] },
  };
}
