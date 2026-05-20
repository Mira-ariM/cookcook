// API 契约类型 — tRPC input/output 定义

import type {
  Recipe,
  RecipeCategory,
  FlavorTag,
  DifficultyLevel,
} from './recipe';
import type {
  MealPlan,
  MealPlanStatus,
  MealPlanContext,
  ScenarioType,
  MealDish,
  ShoppingList,
  MealFeedback,
  DishFeedback,
  Rating,
} from './meal-plan';
import type { CoupleProfile, PersonProfile } from './profile';

// ============================================================
// 1. 生成方案: generateMealPlan
// ============================================================

export interface GenerateMealPlanInput {
  coupleId: string;
  scenario: ScenarioType;
  mealStructure: string;
  timeBudgetMinutes?: number;
  todayFlavorsA: string[];
  todayFlavorsB: string[];
  inputLeftovers?: string[];
  inputIngredients?: string[];
}

export interface GenerateMealPlanOutput {
  plans: MealPlan[];           // 2-3 套方案
  generatedAt: string;
}

// ============================================================
// 2. 替换单菜: swapDish
// ============================================================

export interface SwapDishInput {
  mealPlanId: string;
  dishRole: DishRole;          // 替换哪个角色的菜
  excludeRecipeIds?: string[];  // 排除已看过的菜
}

export interface SwapDishOutput {
  mealPlan: MealPlan;          // 替换后的完整方案
}

// ============================================================
// 3. 确认方案: confirmMealPlan
// ============================================================

export interface ConfirmMealPlanInput {
  mealPlanId: string;
}

export interface ConfirmMealPlanOutput {
  mealPlan: MealPlan;
  confirmedAt: string;
}

// ============================================================
// 4. 购物清单状态: updateShoppingItem
// ============================================================

export interface UpdateShoppingItemInput {
  mealPlanId: string;
  item: string;
  checked: boolean;            // 是否已买/已有
}

export interface UpdateShoppingItemOutput {
  shoppingList: ShoppingList;
}

// ============================================================
// 5. 做饭进度: updateCookingProgress
// ============================================================

export type CookingAction =
  | { type: 'start' }                     // 开始做饭
  | { type: 'check_step'; stepOrder: number; completed: boolean }
  | { type: 'start_timer'; stepOrder: number }
  | { type: 'complete' };                 // 做完

export interface UpdateCookingProgressInput {
  mealPlanId: string;
  action: CookingAction;
}

export interface CookingState {
  status: MealPlanStatus;
  startedAt?: string;
  completedAt?: string;
  completedSteps: number[];               // 已完成的步骤 order
  activeTimer?: {
    stepOrder: number;
    minutes: number;
    startedAt: string;
  };
}

export interface UpdateCookingProgressOutput {
  cookingState: CookingState;
  mealPlan: MealPlan;                     // 含更新后的 status
}

// ============================================================
// 6. 提交反馈: submitFeedback
// ============================================================

export interface SubmitFeedbackInput {
  mealPlanId: string;
  feedback: MealFeedback;
}

export interface SubmitFeedbackOutput {
  mealPlan: MealPlan;
  feedbackAt: string;
}

// ============================================================
// 辅助接口
// ============================================================

// 获取/更新情侣档案
export interface GetProfileInput {
  coupleId: string;
}

export interface GetProfileOutput {
  profile: CoupleProfile;
}

export interface UpdateProfileInput {
  coupleId: string;
  personA?: Partial<PersonProfile>;
  personB?: Partial<PersonProfile>;
}

export interface UpdateProfileOutput {
  profile: CoupleProfile;
}

// 获取菜谱列表（搜索/浏览）
export interface ListRecipesInput {
  category?: RecipeCategory;
  flavorTags?: FlavorTag[];
  difficulty?: DifficultyLevel;
  maxTime?: number;
  suitableForWeekday?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListRecipesOutput {
  recipes: Recipe[];
  total: number;
}

// 获取菜谱详情
export interface GetRecipeInput {
  recipeId: string;
}

export interface GetRecipeOutput {
  recipe: Recipe;
}

// 获取方案历史
export interface ListMealPlansInput {
  coupleId: string;
  status?: MealPlanStatus;
  limit?: number;
  offset?: number;
}

export interface ListMealPlansOutput {
  mealPlans: MealPlan[];
  total: number;
}

// 获取当前做饭状态（断线重连）
export interface GetCookingStateInput {
  mealPlanId: string;
}

export interface GetCookingStateOutput {
  cookingState: CookingState;
}

// ============================================================
// tRPC Router 类型定义
// ============================================================

export interface AppRouter {
  mealPlan: {
    generate:       (input: GenerateMealPlanInput)     => Promise<GenerateMealPlanOutput>;
    swapDish:       (input: SwapDishInput)             => Promise<SwapDishOutput>;
    confirm:        (input: ConfirmMealPlanInput)      => Promise<ConfirmMealPlanOutput>;
    updateShopping: (input: UpdateShoppingItemInput)   => Promise<UpdateShoppingItemOutput>;
    updateCooking:  (input: UpdateCookingProgressInput) => Promise<UpdateCookingProgressOutput>;
    getCookingState:(input: GetCookingStateInput)      => Promise<GetCookingStateOutput>;
    submitFeedback: (input: SubmitFeedbackInput)       => Promise<SubmitFeedbackOutput>;
    list:           (input: ListMealPlansInput)        => Promise<ListMealPlansOutput>;
  };
  recipe: {
    list:   (input: ListRecipesInput)  => Promise<ListRecipesOutput>;
    get:    (input: GetRecipeInput)    => Promise<GetRecipeOutput>;
  };
  profile: {
    get:    (input: GetProfileInput)    => Promise<GetProfileOutput>;
    update: (input: UpdateProfileInput) => Promise<UpdateProfileOutput>;
  };
}
