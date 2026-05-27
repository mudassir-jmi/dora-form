"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { AppSidebar } from "~/components/app-sidebar"
import { SiteHeader } from "~/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "~/components/ui/sidebar"
import { useUser } from "~/hooks/api/auth"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isLoading, isFetching, error } = useUser()
    const isCheckingSession = isLoading || isFetching

    React.useEffect(() => {
        if (!isCheckingSession && (!user || error)) {
            router.replace(`/signin?next=${encodeURIComponent(pathname)}`)
        }
    }, [error, isCheckingSession, pathname, router, user])

    if (isCheckingSession || !user || error) {
        return (
            <main className="min-h-dvh flex items-center justify-center bg-background">
                <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            </main>
        )
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-w-0 overflow-x-hidden">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    )
}
