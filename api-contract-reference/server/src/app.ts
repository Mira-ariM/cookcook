// App Router — 组合所有 sub-routers

import { router } from './trpc';
import { mealPlanRouter } from './routers/meal-plan';
import { recipeRouter } from './routers/recipe';
import { profileRouter } from './routers/profile';

export const appRouter = router({
  mealPlan: mealPlanRouter,
  recipe: recipeRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
