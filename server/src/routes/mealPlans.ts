// MealPlan routes — 6 P0 API endpoints
import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../index';
import type {
  GenerateMealPlansRequest,
  ReplaceDishRequest,
  UpdateShoppingListRequest,
  UpdateCookingProgressRequest,
  SubmitFeedbackRequest,
  MealPlan,
  ApiResponse,
} from '../../../shared/types';

export const mealPlanRoutes = Router();

// ═══════════════════════════════════════════════════════
// POST /api/meal-plans/generate — 生成 2-3 套整餐方案
// ═══════════════════════════════════════════════════════
mealPlanRoutes.post('/generate', async (req: Request, res: Response) => {
  try {
    const input: GenerateMealPlansRequest = req.body;
    // TODO: Call recommendation engine → generate 2-3 MealPlans
    // const plans = await engine.generateMealPlans(input);

    const response: ApiResponse<{ plans: MealPlan[] }> = {
      success: true,
      data: { plans: [] },
    };
    res.json(response);
  } catch (err: any) {
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
    // 2. Validate dishIndex exists
    // 3. Load newRecipe
    // 4. Replace dish, recalculate totalTime, regenerate shoppingList
    // 5. Save as new variant (or update in-place) → return updated MealPlan

    const response: ApiResponse<MealPlan> = {
      success: true,
      // data: updatedPlan,
    };
    res.json(response);
  } catch (err: any) {
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

    // Merge checked state into shopping_lists.items JSONB
    // P0: session-local, persist to DB for return-after-exit

    res.json({ success: true });
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

    // If all steps complete, auto-transition to 'cooked'
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

    // 1. Insert meal_feedback + dish_feedback rows
    // 2. Update recipe_stats (aggregate) for each dish
    // 3. Transition meal_plan status → feedback_done

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/meal-plans/:id — 获取单个方案（含进度/清单）
// ═══════════════════════════════════════════════════════
mealPlanRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // TODO: Load MealPlan + dishes + shopping list + cooking progress
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
