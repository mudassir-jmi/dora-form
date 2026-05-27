import { z } from "zod"

export const createUserWithEmailAndPasswordInuptModel = z.object({
    fullName: z.string().min(5, "full name should contain atleast 5 character").describe("fullname is required"),
    email: z.email().describe("email of the user"),
    password: z.string().min(8, "password should contain minimum 8 char").describe("user-password")
})


export const CreateUserWithEmailAndPasswordOutputModel = z.object({
    id: z.string().describe("id string of the user"),
    verificationEmailSent: z.boolean().describe("whether verification email was queued")
})

export const signInUserWitEmailAndPasswordInputModel = z.object({
    email: z.email().describe("email of the user"),
    password: z.string().min(8, "password should contain minimum 8 char").describe("user-password")
})


export const SignInUserWitEmailAndPasswordOutputModel = z.object({
    id: z.string().describe("id string of the user")
})


export const getLoggedInUserInfoInputModel = z.undefined();

export const getLoggedInUserInfoOutputModel = z.object({
    id: z.string().describe("id string of the user"),
    email: z.email().describe("email of the user"),
    fullName: z.string().describe("full name of the user"),
    profileImageUrl: z.string().optional().nullable().describe("profile image url of the user"),
    emailVerified: z.boolean().describe("email verification status")

})

export const verifyEmailInputModel = z.object({
    token: z.string().min(32).max(256)
})

export const verifyEmailOutputModel = z.object({
    id: z.string(),
    success: z.boolean()
})

export const requestPasswordResetInputModel = z.object({
    email: z.email()
})

export const requestPasswordResetOutputModel = z.object({
    success: z.boolean()
})

export const resetPasswordInputModel = z.object({
    token: z.string().min(32).max(256),
    password: z.string().min(8, "password should contain minimum 8 char")
})

export const resetPasswordOutputModel = z.object({
    success: z.boolean()
})
