// Drizzle ORM Schema — SQLite 起步，可迁 Postgres
// 对齐 shared types 的 Recipe / MealPlan / CoupleProfile / MealFeedback

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================
// CoupleProfile
// ============================================================

export const coupleProfiles = sqliteTable('couple_profiles', {
  id: text('id').primaryKey(),
  inviteCode: text('invite_code').notNull().unique(),

  // Person A (JSON columns — SQLite 无原生 JSON 类型，存 text)
  personA: text('person_a', { mode: 'json' }).notNull(),
  personB: text('person_b', { mode: 'json' }).notNull(),

  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ============================================================
// Recipe
// ============================================================

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  coverImage: text('cover_image'),

  category: text('category').notNull(), // 'meat' | 'vegetable' | ...
  tags: text('tags', { mode: 'json' }).notNull().default('[]'),
  flavorTags: text('flavor_tags', { mode: 'json' }).notNull().default('[]'),

  ingredients: text('ingredients', { mode: 'json' }).notNull(),
  seasonings: text('seasonings', { mode: 'json' }).notNull().default('[]'),
  steps: text('steps', { mode: 'json' }).notNull(),

  equipmentNeeded: text('equipment_needed', { mode: 'json' }),

  totalTime: integer('total_time').notNull(),
  activeTime: integer('active_time'),
  difficulty: integer('difficulty').notNull().default(1), // 1|2|3
  servingSize: integer('serving_size').notNull().default(2),

  suitableFor: text('suitable_for', { mode: 'json' }).notNull(),

  source: text('source').notNull().default('system'),
  sourceUrl: text('source_url'),

  // Aggregated stats (updated by background job or on feedback submit)
  totalMade: integer('total_made').notNull().default(0),
  avgRatingA: real('avg_rating_a').notNull().default(0),
  avgRatingB: real('avg_rating_b').notNull().default(0),
  lastMadeAt: text('last_made_at'),
});

// ============================================================
// MealPlan
// ============================================================

export const mealPlans = sqliteTable('meal_plans', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => coupleProfiles.id),

  context: text('context', { mode: 'json' }).notNull(),
  dishes: text('dishes', { mode: 'json' }).notNull(),

  recommendationReason: text('recommendation_reason').notNull(),
  totalTime: integer('total_time').notNull(),
  difficulty: integer('difficulty').notNull(),

  shoppingList: text('shopping_list', { mode: 'json' }).notNull(),

  status: text('status').notNull().default('generated'),
  // 'generated' | 'confirmed' | 'cooked' | 'feedback_done'

  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  confirmedAt: text('confirmed_at'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  feedbackAt: text('feedback_at'),

  feedback: text('feedback', { mode: 'json' }),
});
