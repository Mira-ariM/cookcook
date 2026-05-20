// MealPlan（整顿饭方案）— 对齐 schema v0.1

import type { DifficultyLevel } from './recipe';

export type ScenarioType =
  | 'random'
  | 'leftover'
  | 'fridge'
  | 'collection'
  | 'revisit';

export type DishRole =
  | 'main_meat'
  | 'side_vegetable'
  | 'soup'
  | 'staple'
  | 'dessert';

export type MealPlanStatus =
  | 'generated'
  | 'confirmed'
  | 'cooked'
  | 'feedback_done';

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface MealPlanContext {
  scenario: ScenarioType;
  mealStructure: string;
  timeBudgetMinutes?: number;
  todayFlavorsA: string[];
  todayFlavorsB: string[];
  inputLeftovers?: string[];
  inputIngredients?: string[];
}

export interface MealDish {
  recipeId: string;
  recipeName: string;
  role: DishRole;
  canSwap: boolean;
}

export interface ShoppingList {
  have: string[];
  need: string[];
  optional?: string[];
}

export interface DishFeedback {
  recipeId: string;
  ratingA: Rating;
  ratingB: Rating;
  tagsA?: string[];
  tagsB?: string[];
}

export interface MealFeedback {
  // 整顿饭级别
  ratingA: Rating;
  ratingB: Rating;
  notesA?: string;
  notesB?: string;
  tagsA?: string[];
  tagsB?: string[];
  photo?: string;
  scenario?: string;
  // 单道菜级别
  dishFeedbacks?: DishFeedback[];
  createdAt: string;
}

export interface MealPlan {
  id: string;
  coupleId: string;
  context: MealPlanContext;
  dishes: MealDish[];
  recommendationReason: string;
  totalTime: number;
  difficulty: DifficultyLevel;
  shoppingList: ShoppingList;
  status: MealPlanStatus;
  createdAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  feedbackAt?: string;
  feedback?: MealFeedback;
}
