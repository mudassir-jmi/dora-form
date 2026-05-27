"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"

import { Alert, AlertDescription } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useRequestPasswordReset } from "~/hooks/api/auth"

type ForgotPasswordValues = {
    email: string
}

export function ForgotPasswordForm() {
    const { register, handleSubmit } = useForm<ForgotPasswordValues>({ defaultValues: { email: "" } })
    const requestPasswordReset = useRequestPasswordReset()
    const [message, setMessage] = useState<string | null>(null)

    async function handleForgotPassword(values: ForgotPasswordValues) {
        setMessage(null)
        await requestPasswordReset.mutateAsync({ email: values.email })
        setMessage("If an account exists for this email, a reset link has been sent.")
    }

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Reset your password</CardTitle>
                <CardDescription>Enter your account email to receive a secure reset link.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleForgotPassword)} noValidate>
                    <FieldGroup>
                        {message ? (
                            <Alert>
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        ) : null}
                        {requestPasswordReset.error ? (
                            <Alert variant="destructive">
                                <AlertDescription>{requestPasswordReset.error.message}</AlertDescription>
                            </Alert>
                        ) : null}
                        <Field>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input id="email" type="email" autoComplete="email" {...register("email", { required: true })} />
                        </Field>
                        <Field>
                            <Button type="submit" disabled={requestPasswordReset.isPending}>
                                {requestPasswordReset.isPending ? "Sending..." : "Send reset link"}
                            </Button>
                            <FieldDescription className="text-center">
                                Remember your password? <Link href="/signin">Sign in</Link>
                            </FieldDescription>
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}
