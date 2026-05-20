// ═══════════════════════════════════════════════════════
// Recommendation Engine — rule-based v0
//
// Input:  MealPlanInput + CoupleProfile + Recipe pool
// Output: 2-3 MealPlan variants
//
// Strategy (P0, rule-based per 调研员 rules v0):
//   A. Hard filter: allergies, dietary restrictions, equipment, scenario
//   B. Score: flavor match, ingredient match, couple favorite, recency, time
//   C. Compose: greedy pick per dish role, flavor complement, time budget
//   D. Build: rationale, shopping list, task division
// ═══════════════════════════════════════════════════════

import { v4 as uuid } from 'uuid';
import type {
  MealPlanInput,
  MealPlan,
  Recipe,
  CoupleProfile,
  MealDish,
  ShoppingList,
  ShoppingItem,
  FlavorTag,
  DishType,
  TaskDivision,
} from '../../../shared/types';

// ── Weight constants (aligned with 调研员 rules v0) ─────

const W = {
  // Boosts
  BOTH_FLAVOR_MATCH: 30,         // both partners' todayFlavors match
  ONE_FLAVOR_MATCH: 12,          // one partner's todayFlavors match
  INGREDIENT_OVERLAP: 20,        // per matching fridge/leftover ingredient
  COUPLE_FAVORITE: 25,           // cap, scaled from coupleFavoriteScore
  SCENARIO_MATCH: 15,            // recipe.scenarioTags includes scenario
  WORKDAY_QUICK: 10,             // weekday + low difficulty + <30min

  // Demotions
  RECENT_7D: -25,                // cooked within 7 days
  DISLIKED_OR_AVERSION: -20,     // hits dislikedFlavors or recentAversions
  TOO_TROUBLESOME: -15,          // tagCounts['太麻烦'] > 2
  OVER_SKILL: -10,               // difficulty > max cookingSkill of couple
};

const DEFAULT_EQUIPMENT = new Set(['stove', 'rice_cooker']);

// ── Main entry ────────────────────────────────────────

export async function generateMealPlans(
  input: MealPlanInput,
  profile: CoupleProfile,
  recipePool: Recipe[]
): Promise<MealPlan[]> {
  // 1. Hard filter
  const eligible = hardFilter(recipePool, profile, input);

  // 2. Score each recipe
  const scored = scoreRecipes(eligible, input, profile);

  // 3. Compose meal combinations
  const combinations = composeMeals(scored, input);

  // 4. Build MealPlan variants
  const plans = combinations.slice(0, 3).map((dishes, i) =>
    buildMealPlan(input, dishes, profile, i)
  );

  return plans;
}

// ── A. Hard filter ─────────────────────────────────────

function hardFilter(
  recipes: Recipe[],
  profile: CoupleProfile,
  input: MealPlanInput
): Recipe[] {
  const { partnerA, partnerB } = profile;

  // Collect all hard exclusions
  const allAllergies = new Set([...partnerA.allergies, ...partnerB.allergies]);
  const allRestrictions = new Set([
    ...partnerA.dietaryRestrictions,
    ...partnerB.dietaryRestrictions,
  ]);

  // Determine scenario priority
  const scenario = input.scenario;

  return recipes.filter(r => {
    // 1. Allergy / dietary restriction check
    for (const ing of r.ingredients) {
      if (allAllergies.has(ing.name)) return false;
      // Simple dietary restriction matching (e.g. "不吃牛肉")
      if (allRestrictions.has(ing.name)) return false;
    }

    // 2. Equipment check (P0: assume couple has stove + rice cooker only)
    if (r.equipmentNeeded && r.equipmentNeeded.length > 0) {
      for (const eq of r.equipmentNeeded) {
        if (eq === 'none') continue;
        if (!DEFAULT_EQUIPMENT.has(eq)) return false;
      }
    }

    // 3. Time budget (soft filter: don't remove, but require within 2x budget)
    if (input.timeBudgetMinutes && r.totalTimeMinutes > input.timeBudgetMinutes * 2) {
      return false;
    }

    // 4. Scenario match
    if (scenario === 'leftovers' && !r.tags.includes('剩菜改造') && r.type !== '素菜' && r.type !== '汤') {
      // For leftovers, keep 素菜 and 汤 (they complement leftover mains), plus 剩菜改造 dishes
      return r.tags.includes('剩菜改造');
    }

    return true;
  });
}

// ── B. Single recipe scoring ───────────────────────────

function scoreRecipes(
  recipes: Recipe[],
  input: MealPlanInput,
  profile: CoupleProfile
): { recipe: Recipe; score: number }[] {
  const { partnerA, partnerB } = profile;
  const { todayFlavors } = input;

  // Collect all liked/disliked/aversion flavors
  const dislikedA = new Set(partnerA.dislikedFlavors);
  const dislikedB = new Set(partnerB.dislikedFlavors);
  const aversionA = new Set(partnerA.recentAversions);
  const aversionB = new Set(partnerB.recentAversions);

  // Today flavor sets
  const todaySelf = new Set(todayFlavors.self);
  const todayPartner = new Set(todayFlavors.partner);

  // Fridge/leftover ingredient set
  const availableIngredients = new Set([
    ...(input.fridgeIngredients || []),
    ...(input.leftovers || []),
  ]);

  // Max cooking skill in couple
  const maxSkill = Math.max(partnerA.cookingSkill, partnerB.cookingSkill);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return recipes.map(r => {
    let score = 0;

    // ++ Flavor match
    let bothHits = 0;
    let oneHits = 0;
    for (const f of r.flavors) {
      const selfHit = todaySelf.has(f);
      const partnerHit = todayPartner.has(f);
      if (selfHit && partnerHit) bothHits++;
      else if (selfHit || partnerHit) oneHits++;
    }
    score += bothHits * W.BOTH_FLAVOR_MATCH;
    score += oneHits * W.ONE_FLAVOR_MATCH;

    // ++ Ingredient overlap
    let ingOverlap = 0;
    for (const ing of r.ingredients) {
      if (availableIngredients.has(ing.name)) ingOverlap++;
    }
    score += ingOverlap * W.INGREDIENT_OVERLAP;

    // ++ Couple favorite score (scale 0-W.COUPLE_FAVORITE)
    if (r.stats?.coupleFavoriteScore) {
      // coupleFavoriteScore is cumulative, cap contribution
      const capped = Math.min(r.stats.coupleFavoriteScore, 10);
      score += Math.round((capped / 10) * W.COUPLE_FAVORITE);
    }

    // ++ Scenario match
    if (r.scenarioTags?.includes(input.scenario as any)) {
      score += W.SCENARIO_MATCH;
    }

    // ++ Weekday quick
    const isWeekday = input.scenario === 'random' || r.scenarioTags?.includes('quick_dinner');
    if (isWeekday && r.difficulty <= 1 && r.totalTimeMinutes <= 30) {
      score += W.WORKDAY_QUICK;
    }

    // -- Recently cooked (7 days)
    if (r.stats?.lastCookedAt) {
      const lastCooked = new Date(r.stats.lastCookedAt);
      if (lastCooked >= sevenDaysAgo) {
        score += W.RECENT_7D;
      }
    }

    // -- Disliked flavors or recent aversions
    for (const f of r.flavors) {
      if (dislikedA.has(f) || dislikedB.has(f) || aversionA.has(f) || aversionB.has(f)) {
        score += W.DISLIKED_OR_AVERSION;
        break; // apply once per recipe
      }
    }

    // -- Too troublesome
    const troubleCount = r.stats?.tagCounts?.['太麻烦'] || 0;
    if (troubleCount > 2) {
      score += W.TOO_TROUBLESOME;
    }

    // -- Over skill
    if (r.difficulty > maxSkill) {
      score += W.OVER_SKILL;
    }

    return { recipe: r, score };
  });
}

// ── C. Meal composition ────────────────────────────────

function composeMeals(
  scored: { recipe: Recipe; score: number }[],
  input: MealPlanInput
): MealDish[][] {
  // Determine meal structure
  const structure = input.mealStructure || defaultStructure(input.scenario);

  // Group recipes by type
  const byType: Record<string, { recipe: Recipe; score: number }[]> = {};
  for (const s of scored) {
    const t = s.recipe.type;
    if (!byType[t]) byType[t] = [];
    byType[t].push(s);
  }

  // Sort each group by score descending
  for (const t of Object.keys(byType)) {
    byType[t].sort((a, b) => b.score - a.score);
  }

  const combos: MealDish[][] = [];

  // Generate up to 3 variants with different top picks
  for (let variant = 0; variant < 3; variant++) {
    const dishes: MealDish[] = [];
    const usedIds = new Set<string>();
    const usedPrimaryFlavors = new Set<string>();

    // Pick meat dishes
    for (let i = 0; i < (structure.meat || 0); i++) {
      const pick = pickDish(byType['荤菜'] || [], usedIds, usedPrimaryFlavors, variant);
      if (pick) {
        dishes.push(toMealDish(pick, '荤菜'));
        usedIds.add(pick.recipe.id);
        usedPrimaryFlavors.add(pick.recipe.primaryFlavor);
      }
    }

    // Pick veg dishes
    for (let i = 0; i < (structure.veg || 0); i++) {
      const pick = pickDish(byType['素菜'] || [], usedIds, usedPrimaryFlavors, variant);
      if (pick) {
        dishes.push(toMealDish(pick, '素菜'));
        usedIds.add(pick.recipe.id);
        usedPrimaryFlavors.add(pick.recipe.primaryFlavor);
      }
    }

    // Pick soups
    for (let i = 0; i < (structure.soup || 0); i++) {
      const pick = pickDish(byType['汤'] || [], usedIds, usedPrimaryFlavors, variant);
      if (pick) {
        dishes.push(toMealDish(pick, '汤'));
        usedIds.add(pick.recipe.id);
        usedPrimaryFlavors.add(pick.recipe.primaryFlavor);
      }
    }

    // Pick staples
    for (let i = 0; i < (structure.staple || 0); i++) {
      const pick = pickDish(byType['主食'] || [], usedIds, usedPrimaryFlavors, variant);
      if (pick) {
        dishes.push(toMealDish(pick, '主食'));
        usedIds.add(pick.recipe.id);
        usedPrimaryFlavors.add(pick.recipe.primaryFlavor);
      }
    }

    // Only add non-empty combos
    if (dishes.length > 0) {
      combos.push(dishes);
    }
  }

  return combos;
}

/** Pick a dish, trying to avoid flavor overlap and using variant offset */
function pickDish(
  group: { recipe: Recipe; score: number }[],
  usedIds: Set<string>,
  usedFlavors: Set<string>,
  variant: number
): { recipe: Recipe; score: number } | undefined {
  // Separate into: unused with different flavor, unused same flavor, all unused
  const diff = group.filter(
    s => !usedIds.has(s.recipe.id) && !usedFlavors.has(s.recipe.primaryFlavor)
  );
  const same = group.filter(
    s => !usedIds.has(s.recipe.id) && usedFlavors.has(s.recipe.primaryFlavor)
  );

  // Pick with variant offset for diversity
  const candidates = [...diff, ...same];
  const index = Math.min(variant, candidates.length - 1);
  return candidates[index] || group.find(s => !usedIds.has(s.recipe.id));
}

function toMealDish(
  s: { recipe: Recipe; score: number },
  role: DishType
): MealDish {
  return {
    recipeId: s.recipe.id,
    recipeSnapshot: s.recipe,
    role,
    reason: buildDishReason(s.recipe, s.score),
  };
}

function buildDishReason(recipe: Recipe, score: number): string {
  const parts: string[] = [];
  if (score >= 40) parts.push('口味高度匹配');
  else if (score >= 20) parts.push('口味匹配');
  if (recipe.stats?.coupleFavoriteScore && recipe.stats.coupleFavoriteScore > 3) {
    parts.push('你们之前很喜欢');
  }
  if (recipe.difficulty === 1 && recipe.totalTimeMinutes <= 20) {
    parts.push('快手简单');
  }
  if (recipe.tags.includes('下饭菜')) parts.push('下饭');
  if (recipe.tags.includes('减脂餐')) parts.push('轻负担');
  if (recipe.tags.includes('开胃菜')) parts.push('开胃');
  return parts.length > 0 ? parts.join('，') : '搭配均衡';
}

function defaultStructure(scenario: string): { meat: number; veg: number; soup: number; staple?: number } {
  switch (scenario) {
    case 'leftovers':
      return { meat: 0, veg: 1, soup: 1 };
    case 'fridge':
    case 'random':
    default:
      return { meat: 1, veg: 1, soup: 1 };
    case 'from_favorites':
    case 'repeat_recent':
      return { meat: 1, veg: 1, soup: 1 };
  }
}

// ── D. Build MealPlan ──────────────────────────────────

function buildMealPlan(
  input: MealPlanInput,
  dishes: MealDish[],
  profile: CoupleProfile,
  variantIndex: number
): MealPlan {
  // Total time (accounting for parallel steps — rough: 70% of sum)
  const sumTime = dishes.reduce((t, d) => t + d.recipeSnapshot.totalTimeMinutes, 0);
  const parallelFactor = dishes.length > 2 ? 0.7 : 0.85;
  const totalTime = Math.round(sumTime * parallelFactor);

  // Max difficulty
  const difficulty = Math.max(...dishes.map(d => d.recipeSnapshot.difficulty), 1) as 1 | 2 | 3;

  // Shopping list
  const shoppingList = buildShoppingList(dishes, input);

  // Rationale
  const rationale = buildRationale(dishes, input, totalTime);

  // Task division
  const taskDivision = buildTaskDivision(dishes);

  // Check if suitable for cooking together
  const hasATasks = dishes.some(d =>
    d.recipeSnapshot.steps.some(s => s.assignedTo === 'A')
  );
  const hasBTasks = dishes.some(d =>
    d.recipeSnapshot.steps.some(s => s.assignedTo === 'B')
  );
  const hasTogetherTasks = dishes.some(d =>
    d.recipeSnapshot.steps.some(s => s.assignedTo === 'together')
  );
  const suitableForTogether = (hasATasks && hasBTasks) || hasTogetherTasks;

  const variantLabel = ['A', 'B', 'C'][variantIndex];

  return {
    id: uuid(),
    generatedAt: new Date().toISOString(),
    status: 'generated',
    input,
    scenario: input.scenario,
    dishes,
    rationale,
    totalTimeMinutes: totalTime,
    difficulty,
    suitableForCookingTogether: suitableForTogether,
    shoppingList,
    taskDivision,
  };
}

function buildShoppingList(
  dishes: MealDish[],
  input: MealPlanInput
): ShoppingList {
  const alreadyHave: ShoppingItem[] = [];
  const needToBuy: ShoppingItem[] = [];
  const optional: ShoppingItem[] = [];

  // What's already in the kitchen
  const availableSet = new Set([
    ...(input.fridgeIngredients || []),
    ...(input.leftovers || []),
  ]);

  for (const dish of dishes) {
    const r = dish.recipeSnapshot;

    for (const ing of r.ingredients) {
      const item: ShoppingItem = {
        name: ing.name,
        amount: ing.amount,
        fromRecipe: r.name,
        category: ing.category,
      };

      if (ing.isStaple || availableSet.has(ing.name)) {
        // Only add staple items once
        if (!alreadyHave.find(i => i.name === ing.name)) {
          alreadyHave.push(item);
        }
      } else {
        needToBuy.push(item);
      }
    }

    for (const s of r.seasonings) {
      const item: ShoppingItem = {
        name: s.name,
        amount: s.amount,
        fromRecipe: r.name,
        category: 'seasoning',
      };

      if (s.isStaple) {
        if (!alreadyHave.find(i => i.name === s.name)) {
          alreadyHave.push(item);
        }
      } else {
        // Non-staple seasonings go to optional
        if (!optional.find(i => i.name === s.name)) {
          optional.push(item);
        }
      }
    }
  }

  return { alreadyHave, needToBuy, optional };
}

function buildRationale(
  dishes: MealDish[],
  input: MealPlanInput,
  totalTime: number
): string {
  const parts: string[] = [];

  // Scenario context
  const scenarioLabels: Record<string, string> = {
    random: '随机搭配',
    leftovers: '剩菜改造',
    fridge: '冰箱食材',
    from_favorites: '收藏搭配',
    repeat_recent: '复刻最近',
  };
  parts.push(`场景：${scenarioLabels[input.scenario] || '随机'}`);

  // Dish roles and names
  const roleNames = dishes.map(d => `${d.role}：${d.recipeSnapshot.name}`).join('；');
  parts.push(roleNames);

  // Flavor summary
  const flavors = dishes.map(d => d.recipeSnapshot.primaryFlavor).filter(Boolean);
  if (flavors.length > 0) {
    const unique = [...new Set(flavors)];
    if (unique.length <= 2) {
      parts.push(`口味协调：${unique.join('+')}`);
    } else {
      parts.push(`口味丰富：${unique.join('、')}`);
    }
  }

  // Time estimate
  parts.push(`预计总耗时约${totalTime}分钟`);

  // Shopping burden
  const needBuy = dishes.reduce((sum, d) => {
    const nonStaple = d.recipeSnapshot.ingredients.filter(i => !i.isStaple);
    return sum + nonStaple.length;
  }, 0);
  if (needBuy <= 3) {
    parts.push('购物负担低');
  }

  return parts.join('。');
}

function buildTaskDivision(dishes: MealDish[]): TaskDivision | undefined {
  const partnerA: string[] = [];
  const partnerB: string[] = [];
  const together: string[] = [];

  for (const dish of dishes) {
    for (const step of dish.recipeSnapshot.steps) {
      const label = `[${dish.recipeSnapshot.name}] ${step.description}`;
      if (step.assignedTo === 'A') partnerA.push(label);
      else if (step.assignedTo === 'B') partnerB.push(label);
      else if (step.assignedTo === 'together') together.push(label);
    }
  }

  if (partnerA.length === 0 && partnerB.length === 0 && together.length === 0) {
    return undefined;
  }

  // Random assignment
  const roles: ('A' | 'B')[] = ['A', 'B'];
  const chef = roles[Math.floor(Math.random() * 2)];
  const dishwasher = chef === 'A' ? 'B' : 'A';

  return {
    partnerA,
    partnerB,
    together,
    randomAssignment: {
      chef,
      dishwasher,
      prep: dishwasher,
      cleanup: chef,
    },
  };
}

// ── Replace single dish ─────────────────────────────────

export async function replaceDish(
  mealPlan: MealPlan,
  dishIndex: number,
  newRecipeId: string,
  recipePool: Recipe[],
  profile: CoupleProfile
): Promise<MealPlan> {
  if (dishIndex < 0 || dishIndex >= mealPlan.dishes.length) {
    throw new Error(`Invalid dishIndex: ${dishIndex}`);
  }

  const newRecipe = recipePool.find(r => r.id === newRecipeId);
  if (!newRecipe) {
    throw new Error(`Recipe not found: ${newRecipeId}`);
  }

  // Validate same type
  const oldDish = mealPlan.dishes[dishIndex];
  if (newRecipe.type !== oldDish.role) {
    throw new Error(
      `Type mismatch: expected ${oldDish.role}, got ${newRecipe.type}`
    );
  }

  // Build new MealDish
  const newDish: MealDish = {
    recipeId: newRecipe.id,
    recipeSnapshot: newRecipe,
    role: oldDish.role,
    reason: buildDishReason(newRecipe, 0),
  };

  // Replace dish
  const newDishes = [...mealPlan.dishes];
  newDishes[dishIndex] = newDish;

  // Rebuild plan
  const rebuilt = buildMealPlan(mealPlan.input, newDishes, profile, 0);
  // Preserve original id and timestamps
  rebuilt.id = mealPlan.id;
  rebuilt.generatedAt = mealPlan.generatedAt;
  rebuilt.status = 'generated'; // reset status after modification

  return rebuilt;
}

// ── Feedback aggregation ────────────────────────────────

export function aggregateFeedback(
  recipeStats: Recipe['stats'],
  overallA: 'delicious' | 'okay' | 'never_again',
  overallB: 'delicious' | 'okay' | 'never_again',
  tagsA: string[],
  tagsB: string[]
): Partial<Recipe['stats']> {
  const stats = { ...recipeStats };

  stats.totalCooked = (stats.totalCooked || 0) + 1;

  // Rating distribution
  const rate = (r: string) => {
    if (r === 'delicious') stats.ratingDistribution.delicious++;
    else if (r === 'okay') stats.ratingDistribution.okay++;
    else stats.ratingDistribution.neverAgain++;
  };
  rate(overallA);
  rate(overallB);

  // Tag counts
  const tagCounts = { ...(stats.tagCounts || {}) };
  for (const t of [...tagsA, ...tagsB]) {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  }
  stats.tagCounts = tagCounts;

  // Couple favorite score
  const bothLike = overallA === 'delicious' && overallB === 'delicious';
  const bothRepeat = tagsA.includes('下次还想吃') && tagsB.includes('下次还想吃');
  if (bothLike || bothRepeat) {
    stats.coupleFavoriteScore = (stats.coupleFavoriteScore || 0) + 2;
  }
  const eitherNeverAgain = overallA === 'never_again' || overallB === 'never_again';
  if (eitherNeverAgain) {
    stats.coupleFavoriteScore = Math.max(0, (stats.coupleFavoriteScore || 0) - 5);
  }

  stats.lastCookedAt = new Date().toISOString();

  return stats;
}
