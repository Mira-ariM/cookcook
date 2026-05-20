// tRPC Router: mealPlan
// 覆盖 6 大核心接口 + 辅助接口

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

// ---- Zod schemas (mirror shared types for runtime validation) ----

const scenarioEnum = z.enum(['random', 'leftover', 'fridge', 'collection', 'revisit']);
const dishRoleEnum = z.enum(['main_meat', 'side_vegetable', 'soup', 'staple', 'dessert']);
const ratingEnum = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5),
]);

const generateInput = z.object({
  coupleId: z.string(),
  scenario: scenarioEnum,
  mealStructure: z.string(),
  timeBudgetMinutes: z.number().int().positive().optional(),
  todayFlavorsA: z.array(z.string()),
  todayFlavorsB: z.array(z.string()),
  inputLeftovers: z.array(z.string()).optional(),
  inputIngredients: z.array(z.string()).optional(),
});

const swapInput = z.object({
  mealPlanId: z.string(),
  dishRole: dishRoleEnum,
  excludeRecipeIds: z.array(z.string()).optional(),
});

const confirmInput = z.object({
  mealPlanId: z.string(),
});

const updateShoppingInput = z.object({
  mealPlanId: z.string(),
  item: z.string(),
  checked: z.boolean(),
});

const cookingAction = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start') }),
  z.object({ type: z.literal('check_step'), stepOrder: z.number(), completed: z.boolean() }),
  z.object({ type: z.literal('start_timer'), stepOrder: z.number() }),
  z.object({ type: z.literal('complete') }),
]);

const updateCookingInput = z.object({
  mealPlanId: z.string(),
  action: cookingAction,
});

const dishFeedback = z.object({
  recipeId: z.string(),
  ratingA: ratingEnum,
  ratingB: ratingEnum,
  tagsA: z.array(z.string()).optional(),
  tagsB: z.array(z.string()).optional(),
});

const submitFeedbackInput = z.object({
  mealPlanId: z.string(),
  feedback: z.object({
    ratingA: ratingEnum,
    ratingB: ratingEnum,
    notesA: z.string().optional(),
    notesB: z.string().optional(),
    tagsA: z.array(z.string()).optional(),
    tagsB: z.array(z.string()).optional(),
    photo: z.string().optional(),
    scenario: z.string().optional(),
    dishFeedbacks: z.array(dishFeedback).optional(),
    createdAt: z.string(),
  }),
});

const getCookingStateInput = z.object({
  mealPlanId: z.string(),
});

const listMealPlansInput = z.object({
  coupleId: z.string(),
  status: z.enum(['generated', 'confirmed', 'cooked', 'feedback_done']).optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

// ---- Router ----

export const mealPlanRouter = router({
  generate: publicProcedure
    .input(generateInput)
    .mutation(async ({ input, ctx }) => {
      // TODO: 调研员补充推荐规则，目前返回 mock
      throw new Error('Not implemented: generateMealPlan');
    }),

  swapDish: publicProcedure
    .input(swapInput)
    .mutation(async ({ input, ctx }) => {
      throw new Error('Not implemented: swapDish');
    }),

  confirm: publicProcedure
    .input(confirmInput)
    .mutation(async ({ input, ctx }) => {
      throw new Error('Not implemented: confirmMealPlan');
    }),

  updateShopping: publicProcedure
    .input(updateShoppingInput)
    .mutation(async ({ input, ctx }) => {
      throw new Error('Not implemented: updateShoppingItem');
    }),

  updateCooking: publicProcedure
    .input(updateCookingInput)
    .mutation(async ({ input, ctx }) => {
      throw new Error('Not implemented: updateCookingProgress');
    }),

  getCookingState: publicProcedure
    .input(getCookingStateInput)
    .query(async ({ input, ctx }) => {
      throw new Error('Not implemented: getCookingState');
    }),

  submitFeedback: publicProcedure
    .input(submitFeedbackInput)
    .mutation(async ({ input, ctx }) => {
      throw new Error('Not implemented: submitFeedback');
    }),

  list: publicProcedure
    .input(listMealPlansInput)
    .query(async ({ input, ctx }) => {
      throw new Error('Not implemented: listMealPlans');
    }),
});
