"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Alert, AlertDescription } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { useVerifyEmail } from "~/hooks/api/auth"

export function VerifyEmailForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const sent = searchParams.get("sent") === "1"
    const verifyEmail = useVerifyEmail()
    const [message, setMessage] = useState(sent ? "We sent a verification link to your email." : "Checking your verification link...")

    useEffect(() => {
        if (!token) return

        verifyEmail.mutate(
            { token },
            {
                onSuccess: () => {
                    setMessage("Email verified. Taking you to your dashboard...")
                    router.replace("/dashboard/forms")
                },
                onError: (error) => {
                    setMessage(error.message || "This verification link is invalid or expired.")
                },
            },
        )
    }, [token])

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Verify email</CardTitle>
                <CardDescription>Secure your DoraForm account before you continue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert variant={verifyEmail.isError ? "destructive" : "default"}>
                    <AlertDescription>{message}</AlertDescription>
                </Alert>
                {!token ? (
                    <Button asChild className="w-full">
                        <Link href="/signin">Back to sign in</Link>
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    )
}
