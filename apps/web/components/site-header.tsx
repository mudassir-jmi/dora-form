"use client";

import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Badge } from "~/components/ui/badge";
import { useSubscription } from "~/hooks/api/product";

export function SiteHeader() {
  const { data: subscription } = useSubscription();
  const planCode = subscription?.planCode || "free";

  let badgeText = "Free";
  let badgeStyles = "border-zinc-700 bg-zinc-800/40 text-zinc-300";

  if (planCode.includes("premium")) {
    badgeText = "Premium";
    badgeStyles = "border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.1)]";
  } else if (planCode.includes("enterprise") || planCode.includes("unlimited") || planCode.includes("799")) {
    badgeText = "Unlimited";
    badgeStyles = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.14)]";
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="ml-auto flex items-center gap-3">
          {subscription && (
            <Badge
              variant="outline"
              className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-medium font-sans ${badgeStyles}`}
            >
              {badgeText} Plan
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
