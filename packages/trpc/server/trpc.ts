import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { userService } from "./services/index.js";
import { createContext } from "./context.js";
import { getAuthenticationCookie } from "./utils/cookie.js";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<typeof createContext>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const authenticatedProcedure = publicProcedure.use(async ({ ctx, next }) => {
    const userToken = getAuthenticationCookie(ctx);

    if (!userToken) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be signed in to access this resource.",
        });
    }

    try {
        const user = await userService.verfiyAndDecodeUserByToken(userToken);

        return next({
            ctx: {
                ...ctx,
                user,
            },
        });
    } catch {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Your session is invalid or expired. Please sign in again.",
        });
    }
});
