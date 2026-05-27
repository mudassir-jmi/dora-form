import { z } from "zod";

export const createUserWithEmailAndPasswordInput = z.object({
    fullName: z.string().min(5).describe("Full name of the user"),
    email: z.email().describe("Email address of the user"),
    password: z.string().min(8).describe("Password of the user")

})

export type CreateUserWithEmailAndPasswordInputType = z.infer<typeof createUserWithEmailAndPasswordInput>



export const generateUserTokenPayload = z.object({
    id: z.string().describe("uuid of the user")
})

export type generateUserTokenPayloadType = z.infer<typeof generateUserTokenPayload>

export const signInUserWithEmailAndPasswordInput = z.object({
    email: z.email().describe("email of the user"),
    password: z.string().min(8).describe("password of the user")
})

export type SignInUserWithEmailAndPasswordInputType = z.infer<typeof signInUserWithEmailAndPasswordInput>

export const verifyEmailInput = z.object({
    token: z.string().min(32).max(256).describe("raw email verification token")
})

export type VerifyEmailInputType = z.infer<typeof verifyEmailInput>

export const requestPasswordResetInput = z.object({
    email: z.email().describe("email of the user")
})

export type RequestPasswordResetInputType = z.infer<typeof requestPasswordResetInput>

export const resetPasswordInput = z.object({
    token: z.string().min(32).max(256).describe("raw password reset token"),
    password: z.string().min(8).describe("new password")
})

export type ResetPasswordInputType = z.infer<typeof resetPasswordInput>
