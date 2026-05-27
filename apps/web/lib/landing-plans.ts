export const LANDING_PLANS = [
  {
    code: "free",
    name: "Free Plan",
    description: "Ideal for personal projects and quick surveys",
    priceLabel: "FREE",
    period: null as string | null,
    formLimit: "5 Active Survey Sheets",
    submissionLimit: "100 responses per form",
    feature: "Clean responsive layouts",
  },
  {
    code: "premium_399",
    name: "Premium Professional",
    description: "Perfect for growing businesses and creators",
    priceLabel: "₹399",
    period: "/ month",
    formLimit: "250 Active Survey Sheets",
    submissionLimit: "500 responses per form",
    feature: "Clean responsive layouts",
    recommended: true,
  },
  {
    code: "enterprise_799",
    name: "Enterprise Unlimited",
    description: "For scaling platforms requiring full capabilities",
    priceLabel: "₹799",
    period: "/ month",
    formLimit: "Unlimited Active Survey Sheets",
    submissionLimit: "2000 responses per form",
    feature: "Clean responsive layouts",
  },
] as const;

export type PlanCode = (typeof LANDING_PLANS)[number]["code"];

export function getSafeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}

export function getSignInHref(next: string): string {
  return `/signin?next=${encodeURIComponent(next)}`;
}

export function getPlanCta(
  planCode: PlanCode,
  isLoggedIn: boolean,
  currentPlanCode: string | undefined,
): { href: string; label: string; disabled: boolean } {
  const isCurrent = currentPlanCode === planCode;
  if (isCurrent) {
    return {
      href: "#",
      label: planCode === "free" ? "Current Plan" : "Current Active Plan",
      disabled: true,
    };
  }

  if (planCode === "free") {
    const href = isLoggedIn ? "/dashboard/forms" : getSignInHref("/dashboard/forms");
    return { href, label: "Start Free", disabled: false };
  }

  const href = isLoggedIn
    ? "/dashboard/billing"
    : getSignInHref("/dashboard/billing");
  return { href, label: "Upgrade Plan", disabled: false };
}

export const NAV_SECTIONS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;
