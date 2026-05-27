import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

export function LandingSectionHeader({
  label,
  title,
  description,
  className,
  align = "center",
  labelClassName,
}: {
  label: string;
  title: string;
  description?: ReactNode;
  className?: string;
  align?: "center" | "left";
  labelClassName?: string;
}) {
  return (
    <div
      className={cn(
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left",
        className,
      )}
    >
      <p className={cn("text-xs font-semibold uppercase tracking-widest", labelClassName || "text-rose-500")}>
        {label}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.5rem] md:leading-tight">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}
