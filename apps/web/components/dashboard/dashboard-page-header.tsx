import type { ReactNode } from "react";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

export function DashboardPageHeader({
  label,
  title,
  description,
  className,
  children,
}: {
  label: string;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 md:flex md:items-center md:justify-between md:gap-6",
        className,
      )}
    >
      <div className="space-y-2">
        <Badge
          variant="outline"
          className="rounded-md border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold uppercase tracking-widest text-emerald-400"
        >
          {label}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">{description}</p>
      </div>
      {children}
    </header>
  );
}
