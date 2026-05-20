# MealBuddy — 情侣搭饭

全栈 TypeScript：Taro (小程序+H5) + Express + PostgreSQL

## 快速开始

```bash
# 1. 启动 PostgreSQL
createdb mealbuddy

# 2. 安装依赖
npm install
cd server && npm install

# 3. 建表
npm run db:migrate

# 4. 导入种子数据（30-50道菜谱）
npm run db:seed

# 5. 启动后端
npm run dev:server
```

## 项目结构

```
mealbuddy/
├── shared/types.ts          # 共享类型（前后端+推荐引擎统一）
├── server/
│   ├── src/
│   │   ├── index.ts         # Express 入口
│   │   ├── models/schema.sql # PostgreSQL 建表语句
│   │   ├── models/migrate.ts # 迁移执行器
│   │   ├── routes/
│   │   │   ├── mealPlans.ts  # 6 个 P0 API
│   │   │   ├── recipes.ts    # 菜谱查询
│   │   │   └── profiles.ts   # 情侣档案
│   │   ├── engine/recommend.ts # 推荐引擎骨架（权重待填）
│   │   └── seed/
│   │       ├── run.ts        # 种子数据执行器
│   │       └── recipes.ts    # 菜谱数据（当前 9 道，目标 30-50）
├── client/                   # Taro 小程序（待初始化）
└── package.json
```

## 6 个 P0 API

| # | 方法 | 路径 | 说明 |
|---|------|------|------|
| 1 | POST | `/api/meal-plans/generate` | 生成 2-3 套整餐方案 |
| 2 | POST | `/api/meal-plans/:id/replace-dish` | 替换单道菜 |
| 3 | PATCH | `/api/meal-plans/:id/confirm` | 确认方案 |
| 4 | PATCH | `/api/meal-plans/:id/shopping-list` | 购物清单勾选 |
| 5 | PATCH | `/api/meal-plans/:id/cooking-progress` | 做饭进度 |
| 6 | POST | `/api/meal-plans/:id/feedback` | 提交反馈 |

## 待办

- [ ] @工程师：推荐引擎补全 `recommend.ts` 中的 filter/score/compose 逻辑
- [ ] @工程师：菜谱种子数据从 9 道扩容到 30-50 道
- [ ] @调研员：推荐规则权重填入 `WEIGHTS` 常量
- [ ] @技术负责人：Taro 小程序脚手架初始化
- [ ] 前后端联调：API 响应格式对齐 shared/types.ts
