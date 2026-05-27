import type { CookieOptions, Request, Response } from "express"
import { TRPCContext } from "../context.js";

const ONE_MINUTES = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTES;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_MONTH = 30 * ONE_DAY;
const ONE_YEAR = 12 * ONE_MONTH;

const defaultCookieOptions: CookieOptions = {
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: ONE_YEAR
}

export function createCookieFactory(res: Response) {
    return function createCookie(
        name: string,
        value: string,
        opts: CookieOptions = defaultCookieOptions
    ) {
        res.cookie(name, value, opts)
    }
}

export function getCookieFactory(req: Request) {
    return function createCookie(
        name: string,

    ) {

        return req.cookies?.[name]
    }
}

export function clearCookieFactory(res: Response) {
    return function createCookie(
        name: string,

    ) {
        res.clearCookie(name)
    }
}

// Authentication Cookies\
const AUTHENTICATION_COOKIE_TOKEN_NAME = 'authentication_token'
export function setAuthenticationCookies(ctx: TRPCContext, accessToken: string) {
    ctx.createCookie(AUTHENTICATION_COOKIE_TOKEN_NAME, accessToken)
}

export function getAuthenticationCookie(ctx: TRPCContext) {
    return ctx.getCookie(AUTHENTICATION_COOKIE_TOKEN_NAME)
}
export function clearAuthenticationCookie(ctx: TRPCContext) {
    ctx.clearCookie(AUTHENTICATION_COOKIE_TOKEN_NAME)
}
