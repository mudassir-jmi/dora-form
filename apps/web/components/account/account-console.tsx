"use client";

import {
  IconMail,
  IconShieldCheck,
  IconLoader,
  IconForms,
} from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { DashboardPageHeader } from "~/components/dashboard/dashboard-page-header";
import { useUser } from "~/hooks/api/auth";

export function AccountConsole() {
  const { user, isLoading, error } = useUser();

  if (isLoading) {
    return (
      <main className="hex-grid-bg flex min-h-[calc(100dvh-6rem)] items-center justify-center p-4">
        <IconLoader className="size-8 animate-spin text-rose-500" />
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-6 text-center text-sm text-rose-300">
          {error?.message ?? "You are not signed in."}
        </div>
      </main>
    );
  }

  const initials =
    user.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "HF";

  return (
    <main className="hex-grid-bg mx-auto min-h-[calc(100dvh-6rem)] max-w-6xl space-y-8 p-6 animate-in fade-in duration-200">
      <DashboardPageHeader
        label="Account"
        title="Your workspace profile"
        description="Signed-in identity for form creation, publishing, analytics, and billing."
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 lg:col-span-2">
          <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
            <Avatar className="size-14 rounded-md border border-zinc-700">
              <AvatarImage src={user.profileImageUrl ?? ""} alt={user.fullName} />
              <AvatarFallback className="rounded-md bg-zinc-800 text-lg text-zinc-200">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white">{user.fullName}</h2>
              <p className="truncate text-sm text-zinc-400">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Info
              label="Profile image"
              value={user.profileImageUrl ? "Configured" : "Not set"}
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="space-y-3">
            <IconShieldCheck className="size-7 text-rose-500" stroke={1.5} />
            <h2 className="text-sm font-semibold text-white">Protected access</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Dashboard, builders, and analytics run under authenticated procedures tied to your
              account.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/80 p-3 text-sm">
            <IconMail className="size-4 shrink-0 text-rose-500" />
            <span className="truncate text-zinc-200">{user.email}</span>
          </div>
          <Button asChild variant="outline" className="rounded-md border-zinc-700 bg-transparent">
            <Link href="/dashboard/forms">
              <IconForms className="mr-2 size-4" />
              Go to forms
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1.5 break-all text-sm font-medium text-white">{value}</p>
    </div>
  );
}
