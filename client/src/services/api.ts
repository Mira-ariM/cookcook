// MealBuddy API client — Taro 小程序 + H5 通用
import Taro from '@tarojs/taro';
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
  GenerateMealPlansResponse,
} from '@shared/types';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function request<T>(path: string, options: {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
} = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const res = await Taro.request({
    url: `${BASE_URL}${path}`,
    method,
    data: body,
    header: { 'Content-Type': 'application/json' },
  });

  if (res.statusCode >= 400) {
    throw new Error((res.data as any)?.error || `HTTP ${res.statusCode}`);
  }

  return res.data as T;
}

// ── Meal Plans ──────────────────────────────────────────

export async function generateMealPlans(input: GenerateMealPlansRequest) {
  return request<ApiResponse<GenerateMealPlansResponse>>('/meal-plans/generate', {
    method: 'POST',
    body: input,
  });
}

export async function replaceDish(planId: string, body: ReplaceDishRequest) {
  return request<ApiResponse<MealPlan>>(`/meal-plans/${planId}/replace-dish`, {
    method: 'POST',
    body,
  });
}

export async function confirmMealPlan(planId: string) {
  return request<ApiResponse<null>>(`/meal-plans/${planId}/confirm`, {
    method: 'PATCH',
  });
}

export async function updateShoppingList(planId: string, body: UpdateShoppingListRequest) {
  return request<ApiResponse<null>>(`/meal-plans/${planId}/shopping-list`, {
    method: 'PATCH',
    body,
  });
}

export async function updateCookingProgress(planId: string, body: UpdateCookingProgressRequest) {
  return request<ApiResponse<null>>(`/meal-plans/${planId}/cooking-progress`, {
    method: 'PATCH',
    body,
  });
}

export async function submitFeedback(planId: string, body: SubmitFeedbackRequest) {
  return request<ApiResponse<null>>(`/meal-plans/${planId}/feedback`, {
    method: 'POST',
    body,
  });
}

export async function getMealPlan(planId: string) {
  return request<ApiResponse<MealPlan>>(`/meal-plans/${planId}`);
}

// ── Recipes ─────────────────────────────────────────────

export async function listRecipes(filters?: {
  type?: string;
  scenario?: string;
  flavor?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.scenario) params.set('scenario', filters.scenario);
  if (filters?.flavor) params.set('flavor', filters.flavor);
  if (filters?.limit) params.set('limit', String(filters.limit));

  return request<ApiResponse<Recipe[]>>(`/recipes?${params.toString()}`);
}

export async function getRecipe(id: string) {
  return request<ApiResponse<Recipe>>(`/recipes/${id}`);
}

// ── Profiles ────────────────────────────────────────────

export async function createProfile(profile: {
  partnerA: any;
  partnerB: any;
  sharedPreferences?: any;
}) {
  return request<ApiResponse<{ id: string }>>('/profiles', {
    method: 'POST',
    body: profile,
  });
}

export async function getProfile(id: string) {
  return request<ApiResponse<CoupleProfile>>(`/profiles/${id}`);
}
