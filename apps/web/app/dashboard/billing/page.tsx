"use client";

import { useState } from "react";
import {
  IconCheck,
  IconLoader,
  IconSparkles,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { DashboardPageHeader } from "~/components/dashboard/dashboard-page-header";
import { useUser } from "~/hooks/api/auth";
import {
  usePlans,
  useSubscription,
  useCheckout,
  useVerifyPayment,
  useCancelSubscription,
} from "~/hooks/api/product";
import { cn } from "~/lib/utils";

interface CheckoutResponse {
  simulated: boolean;
  planCode: string;
  planName: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  keyId: string;
}

function PlanCardPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/60 p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-zinc-800 pb-3 text-sm font-semibold text-white">
      {children}
    </h3>
  );
}

export default function BillingPage() {
  const { user } = useUser();

  const { data: plans, isLoading: isPlansLoading } = usePlans();
  const { data: subscription, isLoading: isSubLoading, refetch: refetchSub } =
    useSubscription();

  const checkoutMutation = useCheckout();
  const verifyPaymentMutation = useVerifyPayment();
  const cancelSubMutation = useCancelSubscription();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as Window & { Razorpay?: unknown }).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planCode: string) => {
    setLoadingPlan(planCode);
    try {
      if (planCode === "free") {
        toast(
          "To downgrade to the Free Plan, cancel your active subscription. You will revert to Free when the current period ends.",
        );
        return;
      }

      const checkoutRes = (await checkoutMutation.mutateAsync({ planCode })) as CheckoutResponse;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay payment SDK. Please verify your connection.");
        return;
      }

      const options = {
        key: checkoutRes.keyId,
        amount: checkoutRes.amount,
        currency: checkoutRes.currency,
        name: "DoraForm",
        description: `Upgrade to ${checkoutRes.planName}`,
        order_id: checkoutRes.razorpayOrderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const loadingToast = toast.loading("Verifying payment with Razorpay...");
          try {
            await verifyPaymentMutation.mutateAsync({
              planCode,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.dismiss(loadingToast);
            toast.success(
              `Payment verified. Your account is now on ${checkoutRes.planName}.`,
            );
            await refetchSub();
          } catch (verifyErr) {
            toast.dismiss(loadingToast);
            toast.error(
              verifyErr instanceof Error ? verifyErr.message : "Payment verification failed.",
            );
          }
        },
        prefill: {
          name: user?.fullName || "",
          email: user?.email || "",
        },
        theme: {
          color: "#18181b",
        },
      };

      const Razorpay = (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay;
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate payment checkout.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Cancel your premium subscription? Benefits stay active until the end of your current billing period.",
      )
    ) {
      return;
    }
    try {
      await cancelSubMutation.mutateAsync({});
      toast.success(
        "Subscription cancelled. Premium benefits continue until the renewal date, then you revert to Free.",
      );
      await refetchSub();
    } catch {
      toast.error("Failed to cancel subscription");
    }
  };

  if (isSubLoading || isPlansLoading) {
    return (
      <main className="hex-grid-bg flex min-h-[calc(100dvh-6rem)] items-center justify-center p-4">
        <IconLoader className="size-8 animate-spin text-emerald-400" />
      </main>
    );
  }

  const activeForms = subscription?.usage?.activeForms ?? 0;
  const formLimit = subscription?.formLimit ?? 5;
  const limitDisplay = subscription?.formLimit === 999999 ? "∞" : formLimit;
  const percentage =
    subscription?.formLimit === 999999
      ? Math.min(activeForms > 0 ? 8 : 0, 100)
      : Math.min((activeForms / formLimit) * 100, 100);

  const statusLabel = subscription?.active
    ? subscription.cancelAtPeriodEnd
      ? "Cancels at period end"
      : "Active premium"
    : "Free plan";

  return (
    <main className="hex-grid-bg mx-auto min-h-[calc(100dvh-6rem)] max-w-6xl space-y-8 p-6 animate-in fade-in duration-200">
      <DashboardPageHeader
        label="Billing"
        title="Plans & billing"
        description="Manage your subscription, check workspace usage, and upgrade when you need more capacity."
      >
        <Button
          variant="outline"
          asChild
          className="mt-4 shrink-0 rounded-md border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-900 md:mt-0"
        >
          <Link href="/#pricing">View pricing on site</Link>
        </Button>
      </DashboardPageHeader>

      <section className="grid gap-6 md:grid-cols-2">
        <PlanCardPanel className="flex flex-col justify-between">
          <div className="space-y-4">
            <SectionTitle>Active plan</SectionTitle>
            <dl className="space-y-0 text-sm">
              <Row label="Plan" value={subscription?.planName ?? "Free Plan"} />
              <Row label="Status">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    subscription?.active
                      ? subscription.cancelAtPeriodEnd
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-800 text-zinc-400",
                  )}
                >
                  {statusLabel}
                </span>
              </Row>
              <Row
                label="Active survey sheets"
                value={
                  subscription?.formLimit === 999999
                    ? "Unlimited"
                    : String(subscription?.formLimit ?? 5)
                }
              />
              <Row
                label="Responses per form"
                value={String(subscription?.submissionLimit ?? 100)}
              />
              {subscription?.currentPeriodEnd ? (
                <Row
                  label="Next renewal"
                  value={new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                />
              ) : null}
            </dl>
          </div>

          {subscription?.active && !subscription.cancelAtPeriodEnd ? (
            <div className="mt-6 flex justify-end border-t border-zinc-800 pt-4">
              <Button
                onClick={handleCancelSubscription}
                disabled={cancelSubMutation.isPending}
                variant="outline"
                className="rounded-md border-rose-500/30 bg-transparent text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              >
                {cancelSubMutation.isPending ? (
                  <IconLoader className="mr-1.5 size-3.5 animate-spin" />
                ) : null}
                Cancel auto-renewal
              </Button>
            </div>
          ) : null}
        </PlanCardPanel>

        <PlanCardPanel className="flex flex-col justify-between">
          <div className="space-y-4">
            <SectionTitle>Workspace usage</SectionTitle>
            <div className="space-y-3 pt-1">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Active forms</span>
                <span className="font-mono font-semibold text-white">
                  {activeForms} / {limitDisplay}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
                <div
                  className="h-full rounded-full bg-emerald-500/80 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                Active forms are non-archived sheets in your workspace. Per-form response limits
                apply on each submission.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-4">
            <IconSparkles className="mt-0.5 size-5 shrink-0 text-emerald-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">Upgrade highlights</h4>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                More active sheets, higher per-form response limits, and room to scale your
                workflows.
              </p>
            </div>
          </div>
        </PlanCardPanel>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Plans
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">Available tiers</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Upgrade anytime. Cancel or change plans from this page.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans?.map((plan) => {
            const isActivePlan = subscription?.planCode === plan.code;
            const isFree = plan.code === "free";
            const isRecommended =
              plan.code === "premium_399" &&
              (subscription?.planCode === "free" || !subscription?.active) &&
              !isActivePlan;
            const priceLabel = isFree ? "FREE" : `₹${plan.priceInPaise / 100}`;

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex min-h-[340px] flex-col justify-between rounded-lg border bg-zinc-900/60 p-6 transition-colors",
                  isActivePlan
                    ? "border-white/80"
                    : isRecommended
                      ? "border-rose-500/40"
                      : "border-zinc-800 hover:border-zinc-700",
                )}
              >
                {isRecommended ? (
                  <Badge className="absolute top-4 right-4 rounded-md border-rose-500/30 bg-rose-500/15 text-[10px] font-semibold uppercase text-rose-300">
                    Recommended
                  </Badge>
                ) : null}
                {isActivePlan ? (
                  <Badge className="absolute top-4 right-4 rounded-md bg-white text-[10px] font-semibold uppercase text-zinc-950">
                    Active plan
                  </Badge>
                ) : null}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-white">{plan.name}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{plan.description}</p>
                  </div>

                  <div>
                    <span className="text-3xl font-extrabold text-white">{priceLabel}</span>
                    {!isFree ? (
                      <span className="text-sm text-zinc-500"> / month</span>
                    ) : null}
                  </div>

                  <ul className="space-y-2.5 border-t border-zinc-800 pt-4 text-sm text-zinc-300">
                    <li className="flex items-center gap-2">
                      <IconCheck className="size-4 shrink-0 text-emerald-400" />
                      <span>
                        {plan.formLimit === null ? "Unlimited" : plan.formLimit} active survey
                        sheets
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck className="size-4 shrink-0 text-emerald-400" />
                      <span>{plan.submissionLimitPerForm} responses per form</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck className="size-4 shrink-0 text-emerald-400" />
                      <span>Clean responsive layouts</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  {isActivePlan ? (
                    <Button
                      disabled
                      className="h-11 w-full cursor-not-allowed rounded-md border border-zinc-700 bg-zinc-800 text-zinc-500"
                    >
                      Current active plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.code)}
                      disabled={loadingPlan !== null}
                      className={cn(
                        "h-11 w-full rounded-md text-sm font-semibold",
                        isFree
                          ? "border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
                          : "cta-primary",
                      )}
                    >
                      {loadingPlan === plan.code ? (
                        <IconLoader className="mr-1.5 size-4 animate-spin" />
                      ) : null}
                      {isFree ? "Downgrade tier" : "Upgrade plan"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/60 py-3">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="font-medium text-white">
        {children ?? value}
      </dd>
    </div>
  );
}
