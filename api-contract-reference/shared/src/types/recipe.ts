// Recipe（菜谱）— 对齐 schema v0.1

export type RecipeCategory =
  | 'meat'
  | 'vegetable'
  | 'soup'
  | 'staple'
  | 'dessert'
  | 'snack';

export type FlavorTag =
  | 'spicy'
  | 'sour_spicy'
  | 'savory'
  | 'light'
  | 'sweet'
  | 'rice_friendly'
  | 'grease_cutting'
  | 'warming'
  | 'appetizing';

export type IngredientCategory =
  | 'protein'
  | 'vegetable'
  | 'grain'
  | 'dairy'
  | 'egg'
  | 'other';

export type Assignee = 'A' | 'B' | 'both';

export type DifficultyLevel = 1 | 2 | 3;

export type RecipeSource =
  | 'system'
  | 'manual'
  | 'import_url'
  | 'import_screenshot';

export interface RecipeIngredient {
  name: string;
  amount?: string;
  category: IngredientCategory;
  isStaple: boolean;
}

export interface RecipeSeasoning {
  name: string;
  amount?: string;
  isStaple: boolean;
}

export interface RecipeStep {
  order: number;
  description: string;
  duration?: number;
  assignedTo?: Assignee;
  hasTimer?: boolean;
  timerMinutes?: number;
  tips?: string;
}

export interface SuitableFor {
  weekday: boolean;
  weekend: boolean;
  leftoverRemix: boolean;
}

export interface RecipeStats {
  totalMade: number;
  avgRatingA: number;
  avgRatingB: number;
  lastMadeAt?: string;
}

export interface Recipe {
  id: string;
  name: string;
  coverImage?: string;
  category: RecipeCategory;
  tags: string[];
  flavorTags: FlavorTag[];
  ingredients: RecipeIngredient[];
  seasonings: RecipeSeasoning[];
  steps: RecipeStep[];
  equipmentNeeded?: string[];
  totalTime: number;
  activeTime?: number;
  difficulty: DifficultyLevel;
  servingSize: number;
  suitableFor: SuitableFor;
  source: RecipeSource;
  sourceUrl?: string;
  stats?: RecipeStats;
}
