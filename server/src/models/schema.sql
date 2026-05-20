-- MealBuddy P0 Database Schema — PostgreSQL
-- Run: psql -d mealbuddy -f schema.sql

-- ── Couple Profile ────────────────────────────────────

CREATE TABLE couple_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Partner A
  a_name TEXT NOT NULL,
  a_display_name TEXT,
  a_liked_flavors TEXT[] DEFAULT '{}',
  a_disliked_flavors TEXT[] DEFAULT '{}',
  a_allergies TEXT[] DEFAULT '{}',
  a_dietary_restrictions TEXT[] DEFAULT '{}',
  a_recent_aversions TEXT[] DEFAULT '{}',
  a_cooking_skill SMALLINT DEFAULT 1 CHECK (a_cooking_skill BETWEEN 1 AND 3),
  a_patience SMALLINT DEFAULT 2 CHECK (a_patience BETWEEN 1 AND 3),
  a_is_primary_cook BOOLEAN DEFAULT false,

  -- Partner B
  b_name TEXT NOT NULL,
  b_display_name TEXT,
  b_liked_flavors TEXT[] DEFAULT '{}',
  b_disliked_flavors TEXT[] DEFAULT '{}',
  b_allergies TEXT[] DEFAULT '{}',
  b_dietary_restrictions TEXT[] DEFAULT '{}',
  b_recent_aversions TEXT[] DEFAULT '{}',
  b_cooking_skill SMALLINT DEFAULT 1 CHECK (b_cooking_skill BETWEEN 1 AND 3),
  b_patience SMALLINT DEFAULT 2 CHECK (b_patience BETWEEN 1 AND 3),
  b_is_primary_cook BOOLEAN DEFAULT false,

  -- Shared
  frequent_dishes TEXT[] DEFAULT '{}',
  cooking_style TEXT DEFAULT 'balanced' CHECK (cooking_style IN ('quick', 'balanced', 'elaborate'))
);

-- ── Recipes ────────────────────────────────────────────

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'system' CHECK (source IN ('system', 'user_import', 'user_manual')),
  is_curated BOOLEAN NOT NULL DEFAULT false,
  name TEXT NOT NULL,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('荤菜', '素菜', '汤', '主食', '甜品', '小吃')),
  tags TEXT[] DEFAULT '{}',
  scenario_tags TEXT[] DEFAULT '{}',
  flavors TEXT[] DEFAULT '{}',
  primary_flavor TEXT,
  equipment_needed TEXT[] DEFAULT '{}',
  total_time_minutes INTEGER NOT NULL,
  difficulty SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  servings INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipe ingredients (1:N)
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('meat', 'vegetable', 'staple', 'egg_dairy', 'other')),
  is_staple BOOLEAN DEFAULT false
);

-- Recipe seasonings (1:N)
CREATE TABLE recipe_seasonings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount TEXT NOT NULL,
  is_staple BOOLEAN DEFAULT false
);

-- Recipe steps (1:N, ordered)
CREATE TABLE recipe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER,
  fire_hint TEXT CHECK (fire_hint IN ('high', 'medium', 'low', 'off')),
  warning TEXT,
  assigned_to TEXT CHECK (assigned_to IN ('A', 'B', 'together')),
  UNIQUE (recipe_id, step_order)
);

-- Recipe stats (1:1 with recipe, updated via feedback aggregation)
CREATE TABLE recipe_stats (
  recipe_id UUID PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  total_cooked INTEGER NOT NULL DEFAULT 0,
  rating_delicious INTEGER NOT NULL DEFAULT 0,
  rating_okay INTEGER NOT NULL DEFAULT 0,
  rating_never_again INTEGER NOT NULL DEFAULT 0,
  tag_counts JSONB DEFAULT '{}',
  last_cooked_at TIMESTAMPTZ,
  couple_favorite_score REAL NOT NULL DEFAULT 0
);

-- ── Meal Plans ─────────────────────────────────────────

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_profile_id UUID NOT NULL REFERENCES couple_profiles(id),
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated', 'confirmed', 'cooked', 'feedback_done')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  feedback_at TIMESTAMPTZ,

  -- Input snapshot (for debugging/reproducibility)
  scenario TEXT NOT NULL,
  time_budget_minutes INTEGER,
  meal_structure_meat SMALLINT DEFAULT 0,
  meal_structure_veg SMALLINT DEFAULT 0,
  meal_structure_soup SMALLINT DEFAULT 0,
  meal_structure_staple SMALLINT DEFAULT 0,
  leftovers TEXT[] DEFAULT '{}',
  fridge_ingredients TEXT[] DEFAULT '{}',
  today_flavors_self TEXT[] DEFAULT '{}',
  today_flavors_partner TEXT[] DEFAULT '{}',

  -- Output
  rationale TEXT,
  total_time_minutes INTEGER,
  difficulty SMALLINT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  suitable_for_together BOOLEAN DEFAULT false
);

-- Meal plan dishes (1:N)
CREATE TABLE meal_plan_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  dish_index SMALLINT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('荤菜', '素菜', '汤', '主食', '甜品', '小吃')),
  reason TEXT,
  UNIQUE (meal_plan_id, dish_index)
);

-- Shopping list (1:1 with meal plan)
CREATE TABLE shopping_lists (
  meal_plan_id UUID PRIMARY KEY REFERENCES meal_plans(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '{"alreadyHave":[],"needToBuy":[],"optional":[]}'
);

-- Task division (1:1 with meal plan, optional)
CREATE TABLE task_divisions (
  meal_plan_id UUID PRIMARY KEY REFERENCES meal_plans(id) ON DELETE CASCADE,
  partner_a_tasks TEXT[] DEFAULT '{}',
  partner_b_tasks TEXT[] DEFAULT '{}',
  together_tasks TEXT[] DEFAULT '{}',
  chef TEXT CHECK (chef IN ('A', 'B')),
  dishwasher TEXT CHECK (dishwasher IN ('A', 'B')),
  prep TEXT CHECK (prep IN ('A', 'B')),
  cleanup TEXT CHECK (cleanup IN ('A', 'B'))
);

-- Cooking progress (1:1 with meal plan)
CREATE TABLE cooking_progress (
  meal_plan_id UUID PRIMARY KEY REFERENCES meal_plans(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}'
);

-- ── Meal Feedback ──────────────────────────────────────

CREATE TABLE meal_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_url TEXT,
  note TEXT,

  -- Person A feedback
  feedback_a_overall TEXT CHECK (feedback_a_overall IN ('delicious', 'okay', 'never_again')),
  feedback_a_tags TEXT[] DEFAULT '{}',
  feedback_a_would_repeat BOOLEAN,

  -- Person B feedback
  feedback_b_overall TEXT CHECK (feedback_b_overall IN ('delicious', 'okay', 'never_again')),
  feedback_b_tags TEXT[] DEFAULT '{}',
  feedback_b_would_repeat BOOLEAN
);

-- Per-dish feedback (1:N)
CREATE TABLE dish_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_feedback_id UUID NOT NULL REFERENCES meal_feedback(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  overall TEXT NOT NULL CHECK (overall IN ('delicious', 'okay', 'never_again')),
  tags TEXT[] DEFAULT '{}',
  would_repeat BOOLEAN DEFAULT false
);

-- ── Indexes ────────────────────────────────────────────

CREATE INDEX idx_recipes_type ON recipes(type);
CREATE INDEX idx_recipes_is_curated ON recipes(is_curated);
CREATE INDEX idx_recipes_scenario_tags ON recipes USING GIN(scenario_tags);
CREATE INDEX idx_recipes_flavors ON recipes USING GIN(flavors);
CREATE INDEX idx_meal_plans_status ON meal_plans(status);
CREATE INDEX idx_meal_plans_profile ON meal_plans(couple_profile_id);
CREATE INDEX idx_meal_plan_dishes_recipe ON meal_plan_dishes(recipe_id);
CREATE INDEX idx_meal_feedback_plan ON meal_feedback(meal_plan_id);
CREATE INDEX idx_dish_feedback_recipe ON dish_feedback(recipe_id);
CREATE INDEX idx_recipe_stats_favorite ON recipe_stats(couple_favorite_score DESC);
