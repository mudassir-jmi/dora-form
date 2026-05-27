"use client";

import Link from "next/link";

import { useUser } from "~/hooks/api/auth";
import { getSignInHref } from "~/lib/landing-plans";

export function LandingFooter() {
  const { user } = useUser();
  const isLoggedIn = Boolean(user?.id);

  const productLinks = [
    { label: "Features", href: "#features" },
    { label: "Workflow", href: "#workflow" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:justify-between">
        <div className="max-w-sm space-y-3">
          <p className="text-sm font-semibold text-white">DoraForm</p>
          <p className="text-sm leading-relaxed text-zinc-500">
            Modern forms for teams who need to launch fast, validate answers, and understand
            responses without workflow sprawl.
          </p>
        </div>

        <div className="flex flex-wrap gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Product
            </p>
            <ul className="mt-3 space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">App</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/explore"
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  Explore
                </Link>
              </li>
              {isLoggedIn ? (
                <>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/forms"
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      Forms
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href={getSignInHref("/dashboard/forms")}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    Sign in
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800/80 py-4 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} DoraForm. All rights reserved.
      </div>
    </footer>
  );
}
