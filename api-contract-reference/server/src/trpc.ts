// tRPC 初始化 — context + router builder

import { initTRPC } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import type { DrizzleD1Database } from 'drizzle-orm/d1'; // placeholder for SQLite adapter

// 创建 context（每个请求注入 db 实例）
export const createContext = async (opts: CreateHTTPContextOptions) => {
  // TODO: 初始化 DB 连接
  return {
    // db: drizzleClient,
    req: opts.req,
    res: opts.res,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
