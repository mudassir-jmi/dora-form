"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { IconAlertCircle, IconCircleCheck, IconForms, IconLock } from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export const formCardClass =
  "relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-lg shadow-black/20";

export const formShellClass = "min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col";

export function PublicFormBrandBar({
  title,
  audioControl,
}: {
  title: string;
  audioControl?: ReactNode;
}) {
  return (
    <header className="z-10 mx-auto flex w-full max-w-2xl items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <Link href="/" className="flex shrink-0 items-center gap-2 text-zinc-400 transition-colors hover:text-white">
        <span className="flex size-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10">
          <IconForms className="size-4 text-emerald-400" />
        </span>
        <span className="hidden text-xs font-semibold sm:inline">DoraForm</span>
      </Link>
      <span className="truncate text-center text-sm font-medium text-white">{title}</span>
      <div className="flex shrink-0 items-center gap-2">
        {audioControl}
        <Badge
          variant="outline"
          className="hidden rounded-md border-zinc-700 bg-zinc-950/50 text-[10px] text-zinc-400 sm:flex"
        >
          <IconLock className="mr-1 size-3" />
          Draft saved
        </Badge>
      </div>
    </header>
  );
}

export function PublicFormLoading() {
  return (
    <main className={cn(formShellClass, "items-center justify-center p-6")}>
      <div className="text-center space-y-4">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-zinc-800 border-t-emerald-400" />
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Loading form…</p>
      </div>
    </main>
  );
}

export function PublicFormError({ message }: { message?: string }) {
  return (
    <main className={cn(formShellClass, "items-center justify-center p-6")}>
      <div className="w-full max-w-md space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md border border-rose-500/30 bg-rose-500/10">
          <IconAlertCircle className="size-6 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Form unavailable</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            {message ?? "This link is invalid, unpublished, or no longer accepting responses."}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full rounded-md border-zinc-700">
          <Link href="/explore">Browse public forms</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full text-zinc-400">
          <Link href="/">Back to DoraForm</Link>
        </Button>
      </div>
    </main>
  );
}

export function PublicFormReceipt({
  title,
  fields,
  answers,
  headline,
  description,
  children,
}: {
  title: string;
  fields: { id: string; label: string; labelKey: string; type?: string }[];
  answers: Record<string, unknown>;
  headline: string;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <main className={cn(formShellClass, "items-center justify-center p-6")}>
      <div className="relative z-10 w-full max-w-lg space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 md:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10">
          <IconCircleCheck className="size-8 text-emerald-400" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">{headline}</h2>
          <p className="text-sm text-zinc-400">{description}</p>
          <p className="text-xs text-zinc-500">{title}</p>
        </div>
        <div className="overflow-hidden rounded-md border border-zinc-800">
          <div className="border-b border-zinc-800 bg-zinc-950/80 px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Response receipt
          </div>
          <div className="max-h-[220px] space-y-2 overflow-y-auto p-4 text-left text-xs">
            {fields.map((f, idx) => {
              const val = answers[f.labelKey];
              let displayVal = "—";
              if (val !== undefined && val !== null && val !== "") {
                displayVal =
                  f.type === "FILE_URL"
                    ? "Uploaded file"
                    : Array.isArray(val)
                      ? val.join(", ")
                      : String(val);
              }
              return (
                <div
                  key={f.id}
                  className="flex justify-between gap-4 border-b border-zinc-800/60 py-2 last:border-0"
                >
                  <span className="max-w-[200px] truncate text-zinc-400">
                    {idx + 1}. {f.label}
                  </span>
                  <span className="max-w-[220px] break-all text-right font-medium text-zinc-200">
                    {displayVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
