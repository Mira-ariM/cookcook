// Server entry — Hono + tRPC adapter

import { Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './app';
import { createContext } from './trpc';

const app = new Hono();

// tRPC 路由挂载
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok' }));

const port = parseInt(process.env.PORT || '3001', 10);

export default {
  port,
  fetch: app.fetch,
};

// 直接启动（开发环境）
if (import.meta.env?.DEV || process.env.NODE_ENV !== 'production') {
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port });
  console.log(`🍳 Recipe API server running on http://localhost:${port}`);
}
