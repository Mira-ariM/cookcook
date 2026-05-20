// ═══════════════════════════════════════════════════════
// Curated Recipe Pool — 30-50 structured recipes for P0
//
// Coverage targets:
//   荤菜 12-15, 素菜 10-12, 汤 6-8, 主食 4-6
//   Scenarios: quick_dinner, weekend_date, anniversary, lazy_meal
//   Flavors: acid-spicy, mild, savory, refreshing, rich
//   Difficulty spread: 1 (40%) / 2 (40%) / 3 (20%)
//
// @工程师: expand to 30-50 entries
// ═══════════════════════════════════════════════════════

import type { Recipe, Ingredient, Seasoning, CookingStep } from '../../../shared/types';

// Helper: recipe without id/stats/isCurated/source (filled by seeder)
type SeedRecipe = Omit<Recipe, 'id' | 'source' | 'isCurated' | 'stats' | 'imageUrl'>;

export const seedRecipes: SeedRecipe[] = [
  // ── 荤菜 (meat) ────────────────────────────────────
  {
    name: '酸辣牛肉片',
    type: '荤菜',
    tags: ['家常菜', '快手菜', '下饭菜', '双人餐'],
    scenarioTags: ['quick_dinner', 'weekend_date'],
    flavors: ['酸辣', '下饭', '开胃'],
    primaryFlavor: '酸辣',
    equipmentNeeded: ['stove'],
    totalTimeMinutes: 25,
    difficulty: 2,
    servings: 2,
    ingredients: [
      { name: '牛肉', amount: '300g', category: 'meat', isStaple: false },
      { name: '青椒', amount: '2个', category: 'vegetable', isStaple: false },
      { name: '蒜', amount: '3瓣', category: 'other', isStaple: true },
    ],
    seasonings: [
      { name: '生抽', amount: '2勺', isStaple: true },
      { name: '醋', amount: '1勺', isStaple: true },
      { name: '淀粉', amount: '1勺', isStaple: true },
    ],
    steps: [
      { order: 1, description: '牛肉切薄片，加生抽、淀粉腌制10分钟', durationMinutes: 10, assignedTo: 'B' },
      { order: 2, description: '青椒切丝，蒜切片', durationMinutes: 3, fireHint: 'off', assignedTo: 'B' },
      { order: 3, description: '热锅凉油，大火炒牛肉至变色盛出', durationMinutes: 3, fireHint: 'high', warning: '不要炒老', assignedTo: 'A' },
      { order: 4, description: '爆香蒜片，下青椒翻炒', durationMinutes: 2, fireHint: 'high', assignedTo: 'A' },
      { order: 5, description: '牛肉回锅，加醋翻炒均匀出锅', durationMinutes: 2, fireHint: 'high', assignedTo: 'A' },
    ],
  },

  {
    name: '可乐鸡翅',
    type: '荤菜',
    tags: ['家常菜', '快手菜', '双人餐'],
    scenarioTags: ['quick_dinner', 'lazy_meal'],
    flavors: ['咸鲜', '下饭', '甜口'],
    primaryFlavor: '咸鲜',
    equipmentNeeded: ['stove'],
    totalTimeMinutes: 30,
    difficulty: 1,
    servings: 2,
    ingredients: [
      { name: '鸡翅中', amount: '8个', category: 'meat', isStaple: false },
      { name: '可乐', amount: '1罐', category: 'other', isStaple: false },
      { name: '姜', amount: '3片', category: 'other', isStaple: true },
    ],
    seasonings: [
      { name: '生抽', amount: '2勺', isStaple: true },
      { name: '老抽', amount: '1勺', isStaple: true },
    ],
    steps: [
      { order: 1, description: '鸡翅洗净，两面划刀', durationMinutes: 3, fireHint: 'off', assignedTo: 'B' },
      { order: 2, description: '冷水下锅焯水，捞出沥干', durationMinutes: 5, fireHint: 'high', assignedTo: 'A' },
      { order: 3, description: '热锅少油，煎鸡翅至两面金黄', durationMinutes: 8, fireHint: 'medium', assignedTo: 'A' },
      { order: 4, description: '倒入可乐、生抽、老抽、姜片，中小火炖15分钟', durationMinutes: 15, fireHint: 'medium', assignedTo: 'A' },
      { order: 5, description: '大火收汁，翻匀出锅', durationMinutes: 2, fireHint: 'high', assignedTo: 'A' },
    ],
  },

  {
    name: '青椒鸡丁',
    type: '荤菜',
    tags: ['家常菜', '快手菜', '下饭菜'],
    scenarioTags: ['quick_dinner'],
    flavors: ['咸鲜', '下饭', '微辣'],
    primaryFlavor: '咸鲜',
    equipmentNeeded: ['stove'],
    totalTimeMinutes: 20,
    difficulty: 1,
    servings: 2,
    ingredients: [
      { name: '鸡胸肉', amount: '250g', category: 'meat', isStaple: false },
      { name: '青椒', amount: '2个', category: 'vegetable', isStaple: false },
      { name: '蒜', amount: '3瓣', category: 'other', isStaple: true },
      { name: '姜', amount: '2片', category: 'other', isStaple: true },
    ],
    seasonings: [
      { name: '生抽', amount: '1勺', isStaple: true },
      { name: '料酒', amount: '1勺', isStaple: true },
      { name: '淀粉', amount: '1勺', isStaple: true },
    ],
    steps: [
      { order: 1, description: '鸡胸肉切丁，加料酒生抽淀粉腌制', durationMinutes: 8, assignedTo: 'B' },
      { order: 2, description: '青椒切块，姜蒜切片', durationMinutes: 3, fireHint: 'off', assignedTo: 'B' },
      { order: 3, description: '热油下鸡丁滑炒至变色盛出', durationMinutes: 3, fireHint: 'high', assignedTo: 'A' },
      { order: 4, description: '爆香姜蒜，下青椒翻炒', durationMinutes: 2, fireHint: 'high', assignedTo: 'A' },
      { order: 5, description: '鸡丁回锅，加生抽翻炒均匀', durationMinutes: 2, fireHint: 'high', assignedTo: 'A' },
    ],
  },

  // ── 素菜 (veg) ──────────────────────────────────────
  {
    name: '蒜蓉生菜',
    type: '素菜',
    tags: ['快手菜', '凉拌菜', '开胃菜'],
    scenarioTags: ['quick_dinner', 'lazy_meal'],
    flavors: ['清淡', '开胃', '解腻'],
    primaryFlavor: '清淡',
    equipmentNeeded: ['stove'],
    totalTimeMinutes: 8,
    difficulty: 1,
    servings: 2,
    ingredients: [
      { name: '生菜', amount: '2棵', category: 'vegetable', isStaple: false },
      { name: '蒜', amount: '4瓣', category: 'other', isStaple: true },
    ],
    seasonings: [
      { name: '生抽', amount: '1勺', isStaple: true },
      { name: '蚝油', amount: '1勺', isStaple: false },
    ],
    steps: [
      { order: 1, description: '生菜洗净撕成小段，蒜切末', durationMinutes: 3, fireHint: 'off', assignedTo: 'B' },
      { order: 2, description: '水开焯生菜30秒捞出装盘', durationMinutes: 2, fireHint: 'high', warning: '不要焯太久会软烂', assignedTo: 'A' },
      { order: 3, description: '热油爆香蒜末，淋生抽蚝油煮开，浇在生菜上', durationMinutes: 3, fireHint: 'medium', assignedTo: 'A' },
    ],
  },

  {
    name: '清炒油麦菜',
    type: '素菜',
    tags: ['快手菜', '家常菜', '减脂餐'],
    scenarioTags: ['quick_dinner', 'lazy_meal'],
    flavors: ['清淡', '解腻', '清爽'],
    primaryFlavor: '清淡',
    equipmentNeeded: ['stove'],
    totalTimeMinutes: 8,
    difficulty: 1,
    servings: 2,
    ingredients: [
      { name: '油麦菜', amount: '300g', category: 'vegetable', isStaple: false },
      { name: '蒜', amount: '3瓣', category: 'other', isStaple: true },
    ],
    seasonings: [
      { name: '盐', amount: '适量', isStaple: true },
    ],
    steps: [
      { order: 1, description: '油麦菜洗净切段，蒜切片', durationMinutes: 3, fireHint: 'off', assignedTo: 'B' },
      { order: 2, description: '热油爆香蒜片', durationMinutes: 1, fireHint: 'high', assignedTo: 'A' },
      { order: 3, description: '下油麦菜大火快炒，加盐翻匀出锅', durationMinutes: 2, fireHint: 'high', warning: '全程大火，不超过3分钟', assignedTo: 'A' },
    ],
  },

  {
    name: '凉拌黄瓜',
    type: '素菜',
    tags: ['凉拌菜', '快手菜', '开胃菜', '懒人菜'],
    scenarioTags: ['quick_dinner', 'lazy_meal'],
    flavors: ['开胃', '解腻', '清爽'],
    primaryFlavor: '清爽',
    equipmentNeeded: ['none'],
    totalTimeMinutes: 6,
    difficulty: 1,
    servings: 2,
    ingredients: [
      { name: '黄瓜', amount: '2根', category: 'vegetable', isStaple: false },
      { name: '蒜', amount: '3瓣', category: 'other', isStaple: true },
    ],
    seasonings: [
      { name: '醋', amount: '2勺', isStaple: true },
      { name: '生抽', amount: '1勺', isStaple: true },
      { name: '香油', amount: '少许', isStaple: false },
    ],
    steps: [
      { order: 1, description: '黄瓜拍碎切段', durationMinutes: 2, fireHint: 'off', assignedTo: 'together' },
      { order: 2, description: '蒜切末，加醋、生抽、香油调汁', durationMinutes: 2, fireHint: 'off', assignedTo: 'B' },
      { order: 3, description: '料汁浇在黄瓜上拌匀', durationMinutes: 1, fireHint: 'off', assignedTo: 'together' },
    ],
  },

  // ── 汤 (soup) ───────────────────────────────────────
  {
    name: '番茄蛋花汤',
    type: '汤',
    tags: ['家常菜', '快手菜'],
    scenarioTags: ['quick_dinner', 'lazy_meal'],
    flavors: ['清淡', '开胃', '想喝汤'],
    primaryFlavor: '清淡',
    equipmentNeeded: ['stove'],
    totalTimeMinutes: 12,
    difficulty: 1,
    servings: 2,
    ingredients: [
      { name: '番茄', amount: '2个', category: 'vegetable', isStaple: false },
      { name: '鸡蛋', amount: '2个', category: 'egg_dairy', isStaple: true },
      { name: '葱', amount: '1根', category: 'other', isStaple: true },
    ],
    seasonings: [
      { name: '盐', amount: '适量', isStaple: true },
      { name: '香油', amount: '少许', isStaple: false },
    ],
    steps: [
      { order: 1, description: '番茄切块，鸡蛋打散，葱切花', durationMinutes: 3, fireHint: 'off', assignedTo: 'B' },
      { order: 2, description: '热油炒番茄至出汁，加水煮开', durationMinutes: 5, fireHint: 'medium', assignedTo: 'A' },
      { order: 3, description: '转圈倒入蛋液，搅拌成蛋花', durationMinutes: 1, fireHint: 'medium', assignedTo: 'A' },
      { order: 4, description: '加盐调味，撒葱花淋香油出锅', durationMinutes: 1, fireHint: 'off', assignedTo: 'A' },
    ],
  },

  {
    name: '紫菜蛋花汤',
    type: '汤',
    tags: ['快手菜', '家常菜', '懒人菜'],
    scenarioTags: ['quick_dinner', 'lazy_meal'],
    flavors: ['清淡', '想喝汤', '清爽'],
    primaryFlavor: '清淡',
    equipmentNeeded: ['stove'],
    totalTimeMinutes: 8,
    difficulty: 1,
    servings: 2,
    ingredients: [
      { name: '紫菜', amount: '1片', category: 'other', isStaple: false },
      { name: '鸡蛋', amount: '2个', category: 'egg_dairy', isStaple: true },
      { name: '葱', amount: '1根', category: 'other', isStaple: true },
    ],
    seasonings: [
      { name: '盐', amount: '适量', isStaple: true },
      { name: '香油', amount: '少许', isStaple: false },
    ],
    steps: [
      { order: 1, description: '紫菜撕碎，鸡蛋打散，葱切花', durationMinutes: 2, fireHint: 'off', assignedTo: 'B' },
      { order: 2, description: '水烧开，下紫菜煮1分钟', durationMinutes: 2, fireHint: 'high', assignedTo: 'A' },
      { order: 3, description: '转圈倒入蛋液成蛋花，加盐、香油、葱花出锅', durationMinutes: 2, fireHint: 'medium', assignedTo: 'A' },
    ],
  },

  // ── 主食 (staple) ──────────────────────────────────
  {
    name: '蛋炒饭',
    type: '主食',
    tags: ['快手菜', '家常菜', '懒人菜', '剩菜改造'],
    scenarioTags: ['quick_dinner', 'lazy_meal'],
    flavors: ['咸鲜', '下饭'],
    primaryFlavor: '咸鲜',
    equipmentNeeded: ['stove', 'rice_cooker'],
    totalTimeMinutes: 15,
    difficulty: 1,
    servings: 2,
    ingredients: [
      { name: '米饭', amount: '2碗（隔夜更好）', category: 'staple', isStaple: true },
      { name: '鸡蛋', amount: '2个', category: 'egg_dairy', isStaple: true },
      { name: '葱', amount: '2根', category: 'other', isStaple: true },
    ],
    seasonings: [
      { name: '盐', amount: '适量', isStaple: true },
    ],
    steps: [
      { order: 1, description: '鸡蛋打散，葱切花', durationMinutes: 2, fireHint: 'off', assignedTo: 'B' },
      { order: 2, description: '热油炒蛋盛出', durationMinutes: 2, fireHint: 'high', assignedTo: 'A' },
      { order: 3, description: '米饭下锅炒散', durationMinutes: 3, fireHint: 'high', assignedTo: 'A' },
      { order: 4, description: '鸡蛋回锅翻炒，加盐、葱花出锅', durationMinutes: 2, fireHint: 'high', assignedTo: 'A' },
    ],
  },
];
