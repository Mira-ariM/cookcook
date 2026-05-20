// ═══════════════════════════════════════════════════════
// MealBuddy Shared Types — single source of truth
// Used by: server, client, recommendation engine, PRD
// ═══════════════════════════════════════════════════════

// ── Flavor / Tag enums ─────────────────────────────────

export type FlavorTag =
  | '辣' | '微辣' | '酸辣' | '酸甜' | '麻辣'
  | '清淡' | '咸鲜' | '下饭' | '开胃' | '解腻'
  | '热乎' | '不油腻' | '想喝汤' | '不想吃汤'
  | '重口' | '清爽' | '甜口';

export type DishType = '荤菜' | '素菜' | '汤' | '主食' | '甜品' | '小吃';

export type RecipeTag =
  | '家常菜' | '快手菜' | '硬菜' | '凉拌菜' | '炒菜'
  | '炖菜' | '蒸菜' | '剩菜改造' | '双人餐'
  | '减脂餐' | '下饭菜' | '开胃菜' | '懒人菜';

export type ScenarioType =
  | 'random'           // 随机搭配
  | 'leftovers'        // 剩菜改造
  | 'fridge'           // 冰箱食材
  | 'from_favorites'   // 收藏搭配
  | 'repeat_recent';   // 复刻最近

export type ScenarioTag = 'quick_dinner' | 'weekend_date' | 'anniversary' | 'lazy_meal' | 'late_night';

export type MealPlanStatus = 'generated' | 'confirmed' | 'cooked' | 'feedback_done';

export type FeedbackTag =
  | '太辣' | '太淡' | '太油' | '太麻烦'
  | '下次还想吃' | '适合工作日' | '适合周末'
  | '对方很喜欢' | '做法太复杂' | '量太少' | '量太多';

export type OverallRating = 'delicious' | 'okay' | 'never_again';

export type EquipmentType = 'stove' | 'oven' | 'air_fryer' | 'steamer' | 'rice_cooker' | 'blender' | 'none';

// ── Core entities ──────────────────────────────────────

export interface CoupleProfile {
  id: string;
  createdAt: string; // ISO8601
  partnerA: PersonProfile;
  partnerB: PersonProfile;
  sharedPreferences: {
    frequentDishes: string[];  // recipeId[]
    cookingStyle: 'quick' | 'balanced' | 'elaborate';
  };
}

export interface PersonProfile {
  name: string;
  displayName?: string;           // for UI: "Miranda"
  role: 'self' | 'partner';
  likedFlavors: FlavorTag[];
  dislikedFlavors: FlavorTag[];
  allergies: string[];            // hard filter
  dietaryRestrictions: string[];  // hard filter: 素食/清真/不吃牛肉
  recentAversions: string[];      // short-term demotion
  cookingSkill: 1 | 2 | 3;
  cookingPatience: 1 | 2 | 3;
  isPrimaryCook: boolean;
}

export interface Recipe {
  id: string;
  source: 'system' | 'user_import' | 'user_manual';
  isCurated: boolean;             // P0: true = 精选池 30-50道
  name: string;
  imageUrl?: string;
  type: DishType;
  tags: RecipeTag[];
  scenarioTags: ScenarioTag[];    // quick_dinner / weekend_date / anniversary
  flavors: FlavorTag[];
  primaryFlavor: FlavorTag;
  ingredients: Ingredient[];
  seasonings: Seasoning[];
  equipmentNeeded: EquipmentType[];
  steps: CookingStep[];
  totalTimeMinutes: number;
  difficulty: 1 | 2 | 3;
  servings: number;
  stats: RecipeStats;
}

export interface Ingredient {
  name: string;
  amount: string;
  category: 'meat' | 'vegetable' | 'staple' | 'egg_dairy' | 'other';
  isStaple: boolean;              // 常备: egg/葱姜蒜/生抽
}

export interface Seasoning {
  name: string;
  amount: string;
  isStaple: boolean;
}

export interface CookingStep {
  order: number;
  description: string;
  durationMinutes?: number;       // for timer
  fireHint?: 'high' | 'medium' | 'low' | 'off';
  warning?: string;
  assignedTo?: 'A' | 'B' | 'together';
}

export interface RecipeStats {
  totalCooked: number;
  ratingDistribution: {
    delicious: number;
    okay: number;
    neverAgain: number;
  };
  tagCounts: Record<string, number>;
  lastCookedAt?: string;
  coupleFavoriteScore: number;    // composite: both liked
}

export interface MealPlan {
  id: string;
  generatedAt: string;
  status: MealPlanStatus;
  confirmedAt?: string;
  feedbackAt?: string;
  input: MealPlanInput;
  scenario: ScenarioType;
  dishes: MealDish[];
  rationale: string;
  totalTimeMinutes: number;
  difficulty: 1 | 2 | 3;
  suitableForCookingTogether: boolean;
  shoppingList: ShoppingList;
  taskDivision?: TaskDivision;
}

export interface MealPlanInput {
  scenario: ScenarioType;
  timeBudgetMinutes?: number;     // hard constraint
  mealStructure?: {
    meat: number;
    veg: number;
    soup: number;
    staple?: number;
  };
  leftovers?: string[];
  fridgeIngredients?: string[];
  todayFlavors: {
    self: FlavorTag[];
    partner: FlavorTag[];
  };
  coupleProfileId: string;
}

export interface MealDish {
  recipeId: string;
  recipeSnapshot: Recipe;
  role: DishType;
  reason: string;
}

export interface ShoppingList {
  alreadyHave: ShoppingItem[];
  needToBuy: ShoppingItem[];
  optional: ShoppingItem[];
}

export interface ShoppingItem {
  name: string;
  amount: string;
  fromRecipe: string;
  category: 'meat' | 'vegetable' | 'staple' | 'seasoning' | 'egg_dairy' | 'other';
  checked?: boolean;              // P0 session-local
}

export interface TaskDivision {
  partnerA: string[];
  partnerB: string[];
  together: string[];
  randomAssignment?: {
    chef: 'A' | 'B';
    dishwasher: 'A' | 'B';
    prep: 'A' | 'B';
    cleanup: 'A' | 'B';
  };
}

export interface MealFeedback {
  id: string;
  mealPlanId: string;
  createdAt: string;
  photoUrl?: string;
  note?: string;
  feedbackA: PersonFeedback;
  feedbackB: PersonFeedback;
  dishFeedbacks: DishFeedback[];
}

export interface DishFeedback {
  recipeId: string;
  overall: OverallRating;
  tags: FeedbackTag[];
  wouldRepeat: boolean;
}

export interface PersonFeedback {
  overall: OverallRating;
  tags: FeedbackTag[];
  wouldRepeat: boolean;
}

// ── API request / response types ───────────────────────

export interface GenerateMealPlansRequest extends MealPlanInput {}

export interface ReplaceDishRequest {
  dishIndex: number;
  newRecipeId: string;
}

export interface ConfirmMealPlanRequest {}

export interface UpdateShoppingListRequest {
  items: { name: string; checked: boolean }[];
}

export interface UpdateCookingProgressRequest {
  currentStep: number;
  completedSteps: number[];
}

export interface SubmitFeedbackRequest {
  feedbackA: PersonFeedback;
  feedbackB: PersonFeedback;
  dishFeedbacks: DishFeedback[];
  photoUrl?: string;
  note?: string;
}

// ── API response wrappers ──────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GenerateMealPlansResponse {
  plans: MealPlan[];
}
