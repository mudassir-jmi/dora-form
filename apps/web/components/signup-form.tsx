"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
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
import { useSignup } from "~/hooks/api/auth"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSafeAuthErrorMessage } from "~/lib/auth-error"

export type SignupFormValues = {
    fullName: string
    email: string
    password: string
    confirmPassword: string
}



export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {


    // signup hook
    const { createUserWithEmailAndPasswordAsync, status } = useSignup()
    const router = useRouter()
    const [authError, setAuthError] = useState<string | null>(null)
    const isSubmitting = status === "pending"

    const { register, handleSubmit } = useForm<SignupFormValues>({
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })
    async function handleSignupSubmit(values: SignupFormValues) {
        setAuthError(null)

        // basic client-side password validations before sending request
        if (values.password.length < 8) {
            const message = "Password must be at least 8 characters long."
            setAuthError(message)
            toast.error(message)
            return
        }

        if (values.password !== values.confirmPassword) {
            const message = "Passwords do not match."
            setAuthError(message)
            toast.error(message)
            return
        }

        try {
            const { id } = await createUserWithEmailAndPasswordAsync({
                email: values.email,
                fullName: values.fullName,
                password: values.password,
            })

            if (!id) {
                const message = "Unable to create your account right now."
                setAuthError(message)
                toast.error(message)
                return
            }

            router.replace("/verify-email?sent=1")
        } catch (error) {
            const message = getSafeAuthErrorMessage(
                error,
                "Unable to create your account. Please check your details and try again.",
            )
            setAuthError(message)
            toast.error(message)
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Create your account</CardTitle>
                    <CardDescription>
                        Enter your email below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(handleSignupSubmit)} noValidate>
                        <FieldGroup>
                            {authError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{authError}</AlertDescription>
                                </Alert>
                            )}
                            <Field>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    autoComplete="name"
                                    {...register("fullName", { required: true })}
                                />
                            </Field>
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
                                <Field className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            autoComplete="new-password"
                                            {...register("password", { required: true })}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="confirm-password">
                                            Confirm Password
                                        </FieldLabel>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            autoComplete="new-password"
                                            {...register("confirmPassword", { required: true })}
                                        />
                                    </Field>
                                </Field>
                                <FieldDescription>
                                    Must be at least 8 characters long.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Creating..." : "Create Account"}
                                </Button>
                                <FieldDescription className="text-center">
                                    Already have an account? <Link href="/signin">Sign in</Link>

                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}
