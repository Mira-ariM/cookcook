// MealPlan routes — 6 P0 API endpoints
import { Router, Request, Response } from 'express';
import { pool } from '../index';
import { generateMealPlans, replaceDish, aggregateFeedback } from '../engine/recommend';
import type {
  GenerateMealPlansRequest,
  ReplaceDishRequest,
  UpdateShoppingListRequest,
  UpdateCookingProgressRequest,
  SubmitFeedbackRequest,
  MealPlan,
  Recipe,
  CoupleProfile,
  ApiResponse,
  MealDish,
} from '../../../shared/types';

export const mealPlanRoutes = Router();

// ═══════════════════════════════════════════════════════
// POST /api/meal-plans/generate — 生成 2-3 套整餐方案
// ═══════════════════════════════════════════════════════
mealPlanRoutes.post('/generate', async (req: Request, res: Response) => {
  try {
    const input: GenerateMealPlansRequest = req.body;

    // 1. Load couple profile
    const profileResult = await pool.query(
      'SELECT * FROM couple_profiles WHERE id = $1',
      [input.coupleProfileId]
    );
    if (!profileResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Couple profile not found' });
    }
    const profile = rowToCoupleProfile(profileResult.rows[0]);

    // 2. Load curated recipe pool with full detail
    const recipePool = await loadRecipePool();

    // 3. Run recommendation engine
    const plans = await generateMealPlans(input, profile, recipePool);

    // 4. Persist generated plans
    const savedPlans: MealPlan[] = [];
    for (const plan of plans) {
      await saveMealPlan(plan, profile.id);
      savedPlans.push(plan);
    }

    const response: ApiResponse<{ plans: MealPlan[] }> = {
      success: true,
      data: { plans: savedPlans },
    };
    res.json(response);
  } catch (err: any) {
    console.error('generate error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/meal-plans/:id/replace-dish — 替换单道菜
// ═══════════════════════════════════════════════════════
mealPlanRoutes.post('/:id/replace-dish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dishIndex, newRecipeId }: ReplaceDishRequest = req.body;

    // 1. Load current MealPlan
    const planResult = await pool.query('SELECT * FROM meal_plans WHERE id = $1', [id]);
    if (!planResult.rows.length) {
      return res.status(404).json({ success: false, error: 'MealPlan not found' });
    }
    const planRow = planResult.rows[0];

    // Load dishes
    const dishesResult = await pool.query(
      'SELECT * FROM meal_plan_dishes WHERE meal_plan_id = $1 ORDER BY dish_index',
      [id]
    );

    // Reconstruct MealPlan with full recipe data
    const recipePool = await loadRecipePool();
    const dishes: MealDish[] = [];
    for (const d of dishesResult.rows) {
      const recipe = recipePool.find(r => r.id === d.recipe_id);
      if (!recipe) continue;
      dishes.push({
        recipeId: recipe.id,
        recipeSnapshot: recipe,
        role: d.role,
        reason: d.reason || '',
      });
    }

    // Load profile
    const profileResult = await pool.query(
      'SELECT * FROM couple_profiles WHERE id = $1',
      [planRow.couple_profile_id]
    );
    const profile = rowToCoupleProfile(profileResult.rows[0]);

    // 2. Reconstruct input
    const input = parseMealPlanInput(planRow);

    const mealPlan: MealPlan = {
      id: planRow.id,
      generatedAt: planRow.generated_at,
      status: planRow.status,
      confirmedAt: planRow.confirmed_at,
      feedbackAt: planRow.feedback_at,
      input,
      scenario: planRow.scenario,
      dishes,
      rationale: planRow.rationale || '',
      totalTimeMinutes: planRow.total_time_minutes,
      difficulty: planRow.difficulty,
      suitableForCookingTogether: planRow.suitable_for_together,
      shoppingList: { alreadyHave: [], needToBuy: [], optional: [] },
    };

    // 3. Validate dishIndex
    if (dishIndex < 0 || dishIndex >= mealPlan.dishes.length) {
      return res.status(400).json({ success: false, error: 'Invalid dishIndex' });
    }

    // 4. Execute replacement
    const updated = await replaceDish(mealPlan, dishIndex, newRecipeId, recipePool, profile);

    // 5. Update in DB — delete old dishes, insert new
    await pool.query('DELETE FROM meal_plan_dishes WHERE meal_plan_id = $1', [id]);
    await saveMealPlanDishes(id, updated.dishes);
    await pool.query(
      `UPDATE meal_plans SET status = $1, total_time_minutes = $2, difficulty = $3,
       suitable_for_together = $4, rationale = $5 WHERE id = $6`,
      [updated.status, updated.totalTimeMinutes, updated.difficulty,
       updated.suitableForCookingTogether, updated.rationale, id]
    );
    await saveShoppingList(id, updated.shoppingList);

    const response: ApiResponse<MealPlan> = {
      success: true,
      data: updated,
    };
    res.json(response);
  } catch (err: any) {
    console.error('replace-dish error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// PATCH /api/meal-plans/:id/confirm — 确认方案
// ═══════════════════════════════════════════════════════
mealPlanRoutes.patch('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE meal_plans SET status = 'confirmed', confirmed_at = now() WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// PATCH /api/meal-plans/:id/shopping-list — 购物清单勾选
// ═══════════════════════════════════════════════════════
mealPlanRoutes.patch('/:id/shopping-list', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items }: UpdateShoppingListRequest = req.body;

    // Load current shopping list
    const result = await pool.query(
      'SELECT items FROM shopping_lists WHERE meal_plan_id = $1',
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Shopping list not found' });
    }

    const list = result.rows[0].items;
    // Merge checked state into items
    for (const update of items) {
      for (const section of ['alreadyHave', 'needToBuy', 'optional']) {
        const idx = list[section]?.findIndex((i: any) => i.name === update.name);
        if (idx >= 0) {
          list[section][idx].checked = update.checked;
          break;
        }
      }
    }

    await pool.query(
      'UPDATE shopping_lists SET items = $1 WHERE meal_plan_id = $2',
      [JSON.stringify(list), id]
    );

    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// PATCH /api/meal-plans/:id/cooking-progress — 做饭进度
// ═══════════════════════════════════════════════════════
mealPlanRoutes.patch('/:id/cooking-progress', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentStep, completedSteps }: UpdateCookingProgressRequest = req.body;

    await pool.query(
      `INSERT INTO cooking_progress (meal_plan_id, current_step, completed_steps)
       VALUES ($1, $2, $3)
       ON CONFLICT (meal_plan_id) DO UPDATE
       SET current_step = $2, completed_steps = $3`,
      [id, currentStep, completedSteps]
    );

    // Check if all steps complete — load dish steps to verify
    const dishesResult = await pool.query(
      `SELECT rs.step_order as step_index
       FROM meal_plan_dishes mpd
       JOIN recipe_steps rs ON rs.recipe_id = mpd.recipe_id
       WHERE mpd.meal_plan_id = $1`,
      [id]
    );
    const totalSteps = dishesResult.rows.length;
    if (completedSteps.length >= totalSteps) {
      await pool.query(
        `UPDATE meal_plans SET status = 'cooked' WHERE id = $1`,
        [id]
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/meal-plans/:id/feedback — 提交反馈
// ═══════════════════════════════════════════════════════
mealPlanRoutes.post('/:id/feedback', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const feedback: SubmitFeedbackRequest = req.body;

    // 1. Insert meal-level feedback
    await pool.query(
      `INSERT INTO meal_feedback (meal_plan_id, photo_url, note,
        feedback_a_overall, feedback_a_tags, feedback_a_would_repeat,
        feedback_b_overall, feedback_b_tags, feedback_b_would_repeat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id, feedback.photoUrl, feedback.note,
        feedback.feedbackA.overall, feedback.feedbackA.tags, feedback.feedbackA.wouldRepeat,
        feedback.feedbackB.overall, feedback.feedbackB.tags, feedback.feedbackB.wouldRepeat,
      ]
    );

    // 2. Insert dish-level feedback and update recipe stats
    for (const df of feedback.dishFeedbacks) {
      // Insert dish feedback
      await pool.query(
        `INSERT INTO dish_feedback (meal_feedback_id, recipe_id, overall, tags, would_repeat)
         VALUES ((SELECT id FROM meal_feedback WHERE meal_plan_id = $1 ORDER BY created_at DESC LIMIT 1),
                 $2, $3, $4, $5)`,
        [id, df.recipeId, df.overall, df.tags, df.wouldRepeat]
      );

      // Update recipe stats
      const statsResult = await pool.query(
        'SELECT * FROM recipe_stats WHERE recipe_id = $1',
        [df.recipeId]
      );
      if (statsResult.rows.length > 0) {
        const currentStats = statsResult.rows[0];
        // Aggregate using engine helper
        const updates = aggregateFeedback(
          {
            totalCooked: currentStats.total_cooked,
            ratingDistribution: {
              delicious: currentStats.rating_delicious,
              okay: currentStats.rating_okay,
              neverAgain: currentStats.rating_never_again,
            },
            tagCounts: currentStats.tag_counts || {},
            lastCookedAt: currentStats.last_cooked_at,
            coupleFavoriteScore: currentStats.couple_favorite_score,
          },
          df.overall as any,
          df.overall as any, // dish feedback doesn't have A/B split for per-dish
          df.tags,
          []
        );

        await pool.query(
          `UPDATE recipe_stats SET
           total_cooked = $1, rating_delicious = $2, rating_okay = $3, rating_never_again = $4,
           tag_counts = $5, last_cooked_at = $6, couple_favorite_score = $7
           WHERE recipe_id = $8`,
          [
            updates.totalCooked,
            updates.ratingDistribution?.delicious,
            updates.ratingDistribution?.okay,
            updates.ratingDistribution?.neverAgain,
            JSON.stringify(updates.tagCounts),
            updates.lastCookedAt,
            updates.coupleFavoriteScore,
            df.recipeId,
          ]
        );
      }
    }

    // 3. Transition status
    await pool.query(
      `UPDATE meal_plans SET status = 'feedback_done', feedback_at = now() WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error('feedback error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/meal-plans/:id — 获取单个方案（含进度/清单）
// ═══════════════════════════════════════════════════════
mealPlanRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const planResult = await pool.query('SELECT * FROM meal_plans WHERE id = $1', [id]);
    if (!planResult.rows.length) {
      return res.status(404).json({ success: false, error: 'MealPlan not found' });
    }
    const planRow = planResult.rows[0];

    // Load dishes
    const dishesResult = await pool.query(
      'SELECT * FROM meal_plan_dishes WHERE meal_plan_id = $1 ORDER BY dish_index',
      [id]
    );

    // Load shopping list
    const listResult = await pool.query(
      'SELECT items FROM shopping_lists WHERE meal_plan_id = $1',
      [id]
    );

    // Load cooking progress
    const progressResult = await pool.query(
      'SELECT * FROM cooking_progress WHERE meal_plan_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...planRow,
        dishes: dishesResult.rows,
        shoppingList: listResult.rows[0]?.items || null,
        cookingProgress: progressResult.rows[0] || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

async function loadRecipePool(): Promise<Recipe[]> {
  const recipeRows = await pool.query(
    'SELECT * FROM recipes WHERE is_curated = true'
  );

  const recipes: Recipe[] = [];
  for (const row of recipeRows.rows) {
    const [ingredients, seasonings, steps, stats] = await Promise.all([
      pool.query('SELECT * FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY id', [row.id]),
      pool.query('SELECT * FROM recipe_seasonings WHERE recipe_id = $1 ORDER BY id', [row.id]),
      pool.query('SELECT * FROM recipe_steps WHERE recipe_id = $1 ORDER BY step_order', [row.id]),
      pool.query('SELECT * FROM recipe_stats WHERE recipe_id = $1', [row.id]),
    ]);

    recipes.push({
      id: row.id,
      source: row.source,
      isCurated: row.is_curated,
      name: row.name,
      imageUrl: row.image_url,
      type: row.type,
      tags: row.tags || [],
      scenarioTags: row.scenario_tags || [],
      flavors: row.flavors || [],
      primaryFlavor: row.primary_flavor,
      equipmentNeeded: row.equipment_needed || [],
      totalTimeMinutes: row.total_time_minutes,
      difficulty: row.difficulty,
      servings: row.servings,
      ingredients: ingredients.rows.map((i: any) => ({
        name: i.name,
        amount: i.amount,
        category: i.category,
        isStaple: i.is_staple,
      })),
      seasonings: seasonings.rows.map((s: any) => ({
        name: s.name,
        amount: s.amount,
        isStaple: s.is_staple,
      })),
      steps: steps.rows.map((s: any) => ({
        order: s.step_order,
        description: s.description,
        durationMinutes: s.duration_minutes,
        fireHint: s.fire_hint,
        warning: s.warning,
        assignedTo: s.assigned_to,
      })),
      stats: stats.rows.length > 0 ? {
        totalCooked: stats.rows[0].total_cooked,
        ratingDistribution: {
          delicious: stats.rows[0].rating_delicious,
          okay: stats.rows[0].rating_okay,
          neverAgain: stats.rows[0].rating_never_again,
        },
        tagCounts: stats.rows[0].tag_counts || {},
        lastCookedAt: stats.rows[0].last_cooked_at,
        coupleFavoriteScore: stats.rows[0].couple_favorite_score,
      } : {
        totalCooked: 0,
        ratingDistribution: { delicious: 0, okay: 0, neverAgain: 0 },
        tagCounts: {},
        coupleFavoriteScore: 0,
      },
    });
  }
  return recipes;
}

function rowToCoupleProfile(row: any): CoupleProfile {
  return {
    id: row.id,
    createdAt: row.created_at,
    partnerA: {
      name: row.a_name,
      displayName: row.a_display_name,
      role: 'self',
      likedFlavors: row.a_liked_flavors || [],
      dislikedFlavors: row.a_disliked_flavors || [],
      allergies: row.a_allergies || [],
      dietaryRestrictions: row.a_dietary_restrictions || [],
      recentAversions: row.a_recent_aversions || [],
      cookingSkill: row.a_cooking_skill,
      cookingPatience: row.a_patience,
      isPrimaryCook: row.a_is_primary_cook,
    },
    partnerB: {
      name: row.b_name,
      displayName: row.b_display_name,
      role: 'partner',
      likedFlavors: row.b_liked_flavors || [],
      dislikedFlavors: row.b_disliked_flavors || [],
      allergies: row.b_allergies || [],
      dietaryRestrictions: row.b_dietary_restrictions || [],
      recentAversions: row.b_recent_aversions || [],
      cookingSkill: row.b_cooking_skill,
      cookingPatience: row.b_patience,
      isPrimaryCook: row.b_is_primary_cook,
    },
    sharedPreferences: {
      frequentDishes: row.frequent_dishes || [],
      cookingStyle: row.cooking_style || 'balanced',
    },
  };
}

function parseMealPlanInput(row: any): any {
  return {
    scenario: row.scenario,
    timeBudgetMinutes: row.time_budget_minutes,
    mealStructure: {
      meat: row.meal_structure_meat || 0,
      veg: row.meal_structure_veg || 0,
      soup: row.meal_structure_soup || 0,
      staple: row.meal_structure_staple || 0,
    },
    leftovers: row.leftovers || [],
    fridgeIngredients: row.fridge_ingredients || [],
    todayFlavors: {
      self: row.today_flavors_self || [],
      partner: row.today_flavors_partner || [],
    },
    coupleProfileId: row.couple_profile_id,
  };
}

async function saveMealPlan(plan: MealPlan, profileId: string): Promise<void> {
  await pool.query(
    `INSERT INTO meal_plans (id, couple_profile_id, status, generated_at,
      scenario, time_budget_minutes,
      meal_structure_meat, meal_structure_veg, meal_structure_soup, meal_structure_staple,
      leftovers, fridge_ingredients, today_flavors_self, today_flavors_partner,
      rationale, total_time_minutes, difficulty, suitable_for_together)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      plan.id, profileId, plan.status, plan.generatedAt,
      plan.scenario, plan.input.timeBudgetMinutes || null,
      plan.input.mealStructure?.meat || 0, plan.input.mealStructure?.veg || 0,
      plan.input.mealStructure?.soup || 0, plan.input.mealStructure?.staple || 0,
      plan.input.leftovers || [], plan.input.fridgeIngredients || [],
      plan.input.todayFlavors.self, plan.input.todayFlavors.partner,
      plan.rationale, plan.totalTimeMinutes, plan.difficulty, plan.suitableForCookingTogether,
    ]
  );

  await saveMealPlanDishes(plan.id, plan.dishes);
  await saveShoppingList(plan.id, plan.shoppingList);
}

async function saveMealPlanDishes(planId: string, dishes: MealDish[]): Promise<void> {
  for (let i = 0; i < dishes.length; i++) {
    const d = dishes[i];
    // Ensure recipe snapshot is persisted (if not in DB yet)
    await pool.query(
      `INSERT INTO recipes (id, source, is_curated, name, type, tags, scenario_tags, flavors, primary_flavor, equipment_needed, total_time_minutes, difficulty, servings)
       VALUES ($1, 'system', true, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        d.recipeId, d.recipeSnapshot.name, d.recipeSnapshot.type,
        d.recipeSnapshot.tags, d.recipeSnapshot.scenarioTags,
        d.recipeSnapshot.flavors, d.recipeSnapshot.primaryFlavor,
        d.recipeSnapshot.equipmentNeeded, d.recipeSnapshot.totalTimeMinutes,
        d.recipeSnapshot.difficulty, d.recipeSnapshot.servings,
      ]
    );

    await pool.query(
      `INSERT INTO meal_plan_dishes (meal_plan_id, recipe_id, dish_index, role, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [planId, d.recipeId, i, d.role, d.reason]
    );
  }
}

async function saveShoppingList(planId: string, list: any): Promise<void> {
  await pool.query(
    `INSERT INTO shopping_lists (meal_plan_id, items)
     VALUES ($1, $2)
     ON CONFLICT (meal_plan_id) DO UPDATE SET items = $2`,
    [planId, JSON.stringify(list)]
  );
}

export default mealPlanRoutes;
