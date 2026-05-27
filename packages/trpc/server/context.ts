import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { createCookieFactory, getCookieFactory, clearCookieFactory } from "./utils/cookie";
export interface TRPCContext {
  createCookie: ReturnType<typeof createCookieFactory>;
  getCookie: ReturnType<typeof getCookieFactory>;
  clearCookie: ReturnType<typeof clearCookieFactory>;
  ip: string;
  userAgent: string | undefined;
}
export async function createContext({ req, res }: CreateExpressContextOptions) {
  const ctx: TRPCContext = {
    createCookie: createCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookieFactory(res),
    ip: req.ip ?? req.socket.remoteAddress ?? "unknown",
    userAgent: req.headers["user-agent"],
  };
  return ctx;
}
export type Context = Awaited<ReturnType<typeof createContext>>;
