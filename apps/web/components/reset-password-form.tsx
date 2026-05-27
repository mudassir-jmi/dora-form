"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Alert, AlertDescription } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useResetPassword } from "~/hooks/api/auth"

type ResetPasswordValues = {
    password: string
    confirmPassword: string
}

export function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const resetPassword = useResetPassword()
    const [message, setMessage] = useState<string | null>(null)
    const { register, handleSubmit } = useForm<ResetPasswordValues>({
        defaultValues: { password: "", confirmPassword: "" },
    })

    async function handleResetPassword(values: ResetPasswordValues) {
        setMessage(null)
        if (!token) {
            setMessage("Reset token is missing.")
            return
        }
        if (values.password !== values.confirmPassword) {
            setMessage("Passwords do not match.")
            return
        }

        await resetPassword.mutateAsync({ token, password: values.password })
        router.replace("/signin?reset=1")
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Choose a new password</CardTitle>
                <CardDescription>Use at least 8 characters for your new password.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleResetPassword)} noValidate>
                    <FieldGroup>
                        {(message || resetPassword.error) ? (
                            <Alert variant={resetPassword.error ? "destructive" : "default"}>
                                <AlertDescription>{resetPassword.error?.message ?? message}</AlertDescription>
                            </Alert>
                        ) : null}
                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input id="password" type="password" autoComplete="new-password" {...register("password", { required: true })} />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                            <Input id="confirm-password" type="password" autoComplete="new-password" {...register("confirmPassword", { required: true })} />
                        </Field>
                        <Field>
                            <Button type="submit" disabled={resetPassword.isPending || !token}>
                                {resetPassword.isPending ? "Saving..." : "Reset password"}
                            </Button>
                            <FieldDescription className="text-center">
                                Need a new link? <Link href="/forgot-password">Request reset</Link>
                            </FieldDescription>
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}
