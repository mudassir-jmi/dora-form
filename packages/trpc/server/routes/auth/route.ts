import { z } from "zod";
import { userService } from "../../services/index.js";
import { authenticatedProcedure, publicProcedure, router } from "../../trpc.js";
import { clearAuthenticationCookie, setAuthenticationCookies } from "../../utils/cookie.js";
import { generatePath } from "../../utils/path-generator.js";
import {
    createUserWithEmailAndPasswordInuptModel,
    CreateUserWithEmailAndPasswordOutputModel,
    getLoggedInUserInfoInputModel,
    getLoggedInUserInfoOutputModel,
    requestPasswordResetInputModel,
    requestPasswordResetOutputModel,
    resetPasswordInputModel,
    resetPasswordOutputModel,
    signInUserWitEmailAndPasswordInputModel,
    SignInUserWitEmailAndPasswordOutputModel,
    verifyEmailInputModel,
    verifyEmailOutputModel,
} from "./model.js";
const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
    createUserWithEmailAndPassword: publicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/createUserWitEmailAndPassword"),
                tags: TAGS,
            },
        }) // not a trpc part
        .input(createUserWithEmailAndPasswordInuptModel)
        .output(CreateUserWithEmailAndPasswordOutputModel)
        .mutation(async ({ input, ctx }) => {
            const { fullName, email, password } = input;
      const { id, token, verificationEmailSent } = await userService.createUserWithEmailAndPassword({
        fullName,
        email,
        password,
            });
            setAuthenticationCookies(ctx, token);
      return {
        id,
        verificationEmailSent,
        // token  we have to send this too if the client on not for web (like mobile devices)
      };
        }),

    verifyEmail: publicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/verifyEmail"),
                tags: TAGS,
            },
        })
        .input(verifyEmailInputModel)
        .output(verifyEmailOutputModel)
        .mutation(async ({ input, ctx }) => {
            const { id, token } = await userService.verifyEmail(input);
            setAuthenticationCookies(ctx, token);
            return { id, success: true };
        }),

    requestPasswordReset: publicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/requestPasswordReset"),
                tags: TAGS,
            },
        })
        .input(requestPasswordResetInputModel)
        .output(requestPasswordResetOutputModel)
        .mutation(async ({ input }) => {
            return userService.requestPasswordReset(input);
        }),

    resetPassword: publicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/resetPassword"),
                tags: TAGS,
            },
        })
        .input(resetPasswordInputModel)
        .output(resetPasswordOutputModel)
        .mutation(async ({ input }) => {
            return userService.resetPassword(input);
        }),

    signInUserWithEmailAndPassword: publicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/signInUserWitEmailAndPassword"),
                tags: TAGS,
            },
        })
        .input(signInUserWitEmailAndPasswordInputModel)
        .output(SignInUserWitEmailAndPasswordOutputModel)
        .mutation(async ({ input, ctx }) => {
            const { email, password } = input;
            const { id, token } = await userService.signInUserWithEmailAndPassword({ email, password });
            setAuthenticationCookies(ctx, token);
            return {
                id,
            };
        }),

    getLoggedInUserInfo: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/getLoggedInUserInfo"),
                tags: TAGS,
            },
        })
        .input(getLoggedInUserInfoInputModel)
        .output(getLoggedInUserInfoOutputModel)
        .query(async ({ ctx }) => {
            return {
                id: ctx.user.id,
                email: ctx.user.email,
                fullName: ctx.user.fullName,
                profileImageUrl: ctx.user.profileImageUrl,
                emailVerified: ctx.user.emailVerified,
            };
        }),

    signOut: publicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/signOut"),
                tags: TAGS,
            },
        })
        .input(z.object({}).optional())
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx }) => {
            clearAuthenticationCookie(ctx);
            return { success: true };
        }),
});
