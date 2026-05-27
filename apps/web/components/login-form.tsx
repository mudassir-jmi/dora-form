"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Alert, AlertDescription } from "~/components/ui/alert"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useSignin } from "~/hooks/api/auth"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getSafeAuthErrorMessage } from "~/lib/auth-error"
import { getSafeNextPath } from "~/lib/landing-plans"

export type LoginFormValues = {
    email: string
    password: string
}

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [authError, setAuthError] = useState<string | null>(null)
    const nextPath = getSafeNextPath(searchParams.get("next"))
    const { register, handleSubmit } = useForm<LoginFormValues>({
        defaultValues: {
            email: "",
            password: "",
        },
    })


    const { signInUserWithEmailAndPasswordAsync, status } = useSignin();
    const isSubmitting = status === "pending"

    async function handleLogin(values: LoginFormValues) {
        setAuthError(null)

        try {
            const { id } = await signInUserWithEmailAndPasswordAsync({
                email: values.email,
                password: values.password
            })

            if (!id) {
                setAuthError("Unable to sign in right now. Please try again.")
                return
            }

            router.replace(nextPath ?? "/dashboard/forms")
        } catch (error) {
            setAuthError(getSafeAuthErrorMessage(error, "Unable to sign in. Please check your details and try again."))
        }

    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(handleLogin)} noValidate>
                        <FieldGroup>
                            {authError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{authError}</AlertDescription>
                                </Alert>
                            )}
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    autoComplete="email"
                                    {...register("email", { required: true })}
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <Link
                                        href="/forgot-password"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    {...register("password", { required: true })}
                                />
                            </Field>
                            <Field>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Logging in..." : "Login"}
                                </Button>
                                <FieldDescription className="text-center">
                                    Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
