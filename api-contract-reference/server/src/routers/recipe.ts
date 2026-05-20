// tRPC Router: recipe

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

const listRecipesInput = z.object({
  category: z.enum(['meat', 'vegetable', 'soup', 'staple', 'dessert', 'snack']).optional(),
  flavorTags: z.array(z.string()).optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  maxTime: z.number().int().positive().optional(),
  suitableForWeekday: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

const getRecipeInput = z.object({
  recipeId: z.string(),
});

export const recipeRouter = router({
  list: publicProcedure
    .input(listRecipesInput)
    .query(async ({ input, ctx }) => {
      throw new Error('Not implemented: listRecipes');
    }),

  get: publicProcedure
    .input(getRecipeInput)
    .query(async ({ input, ctx }) => {
      throw new Error('Not implemented: getRecipe');
    }),
});
