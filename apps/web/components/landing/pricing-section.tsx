"use client";

import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { LandingSectionHeader } from "~/components/landing/landing-section-header";
import { useUser } from "~/hooks/api/auth";
import { useSubscription } from "~/hooks/api/product";
import {
  LANDING_PLANS,
  getPlanCta,
  type PlanCode,
} from "~/lib/landing-plans";
import { SectionReveal } from "~/components/landing/section-reveal";
import { cn } from "~/lib/utils";

export function PricingSection() {
  const { user } = useUser();
  const isLoggedIn = Boolean(user?.id);

  const { data: subscription } = useSubscription({
    enabled: isLoggedIn,
    retry: false,
  });

  const currentPlanCode = subscription?.planCode ?? (isLoggedIn ? "free" : undefined);

  return (
    <section id="pricing" className="landing-section mx-auto max-w-6xl px-4 py-20 md:py-28">
      <SectionReveal>
        <LandingSectionHeader
          label="Pricing"
          title="Plans that scale with your forms"
          description="Start free, upgrade when you need more active sheets and responses per form."
        />
      </SectionReveal>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {LANDING_PLANS.map((plan, index) => {
          const isCurrent = currentPlanCode === plan.code;
          const isRecommended =
            plan.code === "premium_399" &&
            (!currentPlanCode || currentPlanCode === "free") &&
            !isCurrent;
          const cta = getPlanCta(plan.code as PlanCode, isLoggedIn, currentPlanCode);

          return (
            <SectionReveal key={plan.code} delay={index * 0.08}>
              <article
                className={cn(
                  "relative flex h-full min-h-[380px] flex-col justify-between rounded-lg border bg-zinc-900/60 p-6 transition-colors",
                  isCurrent
                    ? "border-white/80"
                    : isRecommended
                      ? "border-rose-500/40 shadow-lg shadow-rose-950/20"
                      : "border-zinc-800 hover:border-zinc-700",
                )}
              >
                {isRecommended ? (
                  <Badge className="absolute top-4 right-4 rounded-md border-amber-500/30 bg-gradient-to-r from-rose-500/20 to-amber-500/15 text-[10px] font-semibold uppercase text-amber-200">
                    Recommended
                  </Badge>
                ) : null}
                {isCurrent ? (
                  <Badge className="absolute top-4 right-4 rounded-md bg-white text-[10px] font-semibold uppercase text-zinc-950">
                    Active plan
                  </Badge>
                ) : null}

                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-[0.9375rem]">
                      {plan.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-4xl font-extrabold text-white">{plan.priceLabel}</span>
                    {plan.period ? (
                      <span className="text-sm text-zinc-500">{plan.period}</span>
                    ) : null}
                  </div>

                  <ul className="space-y-3 border-t border-zinc-800 pt-4 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-rose-500" />
                      <span>{plan.formLimit}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-rose-500" />
                      <span>{plan.submissionLimit}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-rose-500" />
                      <span>{plan.feature}</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  {cta.disabled ? (
                    <Button
                      disabled
                      className="w-full cursor-not-allowed rounded-md border border-zinc-700 bg-zinc-800 text-zinc-500"
                    >
                      {cta.label}
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className={cn(
                        "w-full rounded-md font-semibold",
                        plan.code === "free"
                          ? "border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
                          : "cta-primary",
                      )}
                    >
                      <Link href={cta.href}>{cta.label}</Link>
                    </Button>
                  )}
                </div>
              </article>
            </SectionReveal>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Upgrade anytime from billing. Cancel or change plans from your dashboard.
      </p>
    </section>
  );
}
