# 工程脚手架 v0.1 — 交接说明

## 技术栈（已定）

| 层 | 选型 | 理由 |
|---|---|---|
| 前端 | Taro 4 + React + TS | 一套代码出微信小程序 + H5 |
| 后端 | Hono + tRPC + TS | 轻量，部署灵活，类型安全 |
| 数据库 | SQLite + Drizzle ORM | P0 零运维，通过 Drizzle 可无缝迁 PG |
| 类型共享 | `@recipe-app/shared` | monorepo 内前后端同源类型 |

## 目录结构

```
packages/
├── shared/               # 前后端共享类型（已完）
│   └── src/types/
│       ├── recipe.ts     # Recipe 实体
│       ├── meal-plan.ts  # MealPlan 实体
│       ├── profile.ts    # CoupleProfile 实体
│       └── api.ts        # 全部 API 输入输出类型 + AppRouter 类型定义
├── server/               # 后端（骨架已完，等填业务逻辑）
│   └── src/
│       ├── index.ts      # Hono + tRPC 入口
│       ├── trpc.ts       # tRPC context
│       ├── app.ts        # AppRouter 组合
│       ├── db/schema.ts  # Drizzle schema（与 shared types 对齐）
│       └── routers/
│           ├── meal-plan.ts  # 8 个过程（6 核心 + 2 辅助）
│           ├── recipe.ts     # 2 个过程
│           └── profile.ts    # 2 个过程
└── app/                  # Taro 前端（待创建）
```

## API 契约总览

所有接口通过 tRPC 暴露，类型从 `@recipe-app/shared` 导入，前后端零类型断层。

### mealPlan 路由
1. `generate` — 生成 2-3 套整餐方案
2. `swapDish` — 替换单道菜
3. `confirm` — 确认方案（状态 → confirmed）
4. `updateShopping` — 勾选/取消购物清单
5. `updateCooking` — 做饭进度（start / check_step / start_timer / complete）
6. `getCookingState` — 获取当前做饭状态（断线重连）
7. `submitFeedback` — 提交饭后反馈（含 dish-level）
8. `list` — 历史方案列表

### recipe 路由
1. `list` — 搜索/浏览菜谱（category / flavor / difficulty / time / weekday 过滤）
2. `get` — 菜谱详情

### profile 路由
1. `get` — 获取情侣档案
2. `update` — 更新 A 或 B 的偏好/能力

## 下一步（工程侧接手）

1. `pnpm install` 装依赖
2. 创建 `packages/app/` — `taro init` 或手动搭
3. 填充 routers 里的 `throw new Error('Not implemented')` 为实际业务逻辑
4. 推荐引擎调用调研员的规则（`mealPlan.generate` 里）
5. `drizzle-kit push:sqlite` 初始化 DB

## 待确认

- [ ] Taro 用 Webpack 还是 Vite？（建议 Vite，启动快）
- [ ] 前端状态管理用 Zustand 还是 Jotai？
- [ ] 部署方式：微信云开发 / 自建服务器 / Vercel？
