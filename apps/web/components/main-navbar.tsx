"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  IconForms,
  IconMenu2,
  IconLayoutDashboard,
  IconUserCircle,
  IconLogout,
} from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useUser, useSignout } from "~/hooks/api/auth";
import { NAV_SECTIONS, getSignInHref } from "~/lib/landing-plans";
import { cn } from "~/lib/utils";

function BrandMark() {
  return (
    <span className="flex size-7 items-center justify-center rounded-md border border-rose-500/30 bg-rose-500/10">
      <IconForms className="size-4 text-sky-500" stroke={1.75} />
    </span>
  );
}

function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1 md:flex-row md:items-center md:gap-6", className)}>
      {NAV_SECTIONS.map((item) => {
        const href = pathname === "/" ? item.href : `/${item.href}`;
        return (
          <a
            key={item.href}
            href={href}
            onClick={onNavigate}
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export function MainNavbar() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { signOut } = useSignout({
    onSuccess: () => {
      router.push("/signin");
    },
  });

  const isLoggedIn = Boolean(user?.id);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const startHref = isLoggedIn ? "/dashboard/forms" : getSignInHref("/dashboard/forms");
  const startLabel = isLoggedIn ? "Create Form" : "Start Now";

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "HF";

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 pointer-events-none">
      <motion.div
        layout
        className={cn(
          "pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-4 border border-sky-700 bg-sky-950/88 shadow-lg shadow-sky-950/40 backdrop-blur-md transition-colors",
          scrolled ? "rounded-md px-3 py-2" : "rounded-lg px-4 py-3",
        )}
        animate={{
          boxShadow: scrolled
            ? "0 8px 24px rgba(0,0,0,0.35)"
            : "0 12px 32px rgba(0,0,0,0.4)",
        }}
        transition={{ duration: 0.2 }}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight text-white">DoraForm</span>
        </Link>

        <div className="hidden lg:flex lg:flex-1 lg:justify-center">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden border-sky-600 bg-transparent text-slate-100 hover:bg-sky-950 hover:text-white sm:inline-flex"
          >
            <Link href="/explore">Explore</Link>
          </Button>

          {!isLoading && isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-full border border-sky-600 bg-sky-950 outline-none ring-sky-300/40 focus-visible:ring-2"
                  aria-label="Account menu"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={user?.profileImageUrl ?? ""} alt={user?.fullName ?? ""} />
                    <AvatarFallback className="bg-sky-800 text-xs text-slate-100">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-sky-700 bg-sky-950">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <IconLayoutDashboard className="mr-2 size-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account" className="cursor-pointer">
                    <IconUserCircle className="mr-2 size-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-sky-700" />
                <DropdownMenuItem
                  onClick={() => {
                    signOut();
                  }}
                  className="cursor-pointer text-rose-400 hover:text-rose-500 focus:text-rose-500"
                >
                  <IconLogout className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {!isLoading && !isLoggedIn ? (
            <Button size="sm" asChild className="cta-primary hidden font-semibold sm:inline-flex">
              <Link href={startHref}>{startLabel}</Link>
            </Button>
          ) : null}

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="border-zinc-700 bg-zinc-900 lg:hidden"
                aria-label="Open menu"
              >
                <IconMenu2 className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-sky-700 bg-sky-950 w-[min(100vw-2rem,320px)]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left text-white">
                  <BrandMark />
                  DoraForm
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-6 mt-4">
                <NavLinks onNavigate={() => setSheetOpen(false)} />
                <div className="flex flex-col gap-2 border-t border-sky-700 pt-6">
                  <Button variant="outline" asChild className="border-zinc-700">
                    <Link href="/explore" onClick={() => setSheetOpen(false)}>
                      Explore
                    </Link>
                  </Button>
                  {!isLoggedIn && (
                    <Button asChild className="cta-primary font-semibold">
                      <Link href={startHref} onClick={() => setSheetOpen(false)}>
                        {startLabel}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </header>
  );
}
