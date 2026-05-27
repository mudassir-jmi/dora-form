import { TRPCError } from "@trpc/server";
import { and, eq, db, desc, sql, count } from "@repo/database";
import { pricingPlansTable, userSubscriptionsTable, paymentsTable } from "@repo/database/models/pricing";
import { formsTable } from "@repo/database/models/form";
import { usersTable } from "@repo/database/models/user";
import { sendPaymentReceiptEmail } from "@repo/services/user";
import { authenticatedProcedure, publicProcedure, router } from "../../trpc.js";
import { randomUUID, createHmac } from "node:crypto";
import {
    checkoutInputModel,
    verifyPaymentInputModel,
    cancelSubscriptionInputModel,
    pricingPlanOutputModel,
    subscriptionOutputModel,
    checkoutOutputModel,
    verifyPaymentOutputModel,
    cancelSubscriptionOutputModel,
} from "./model.js";

const TAGS = ["Product"];

const DEFAULT_PLANS = [
    {
        code: "free",
        name: "Free Plan",
        description: "Ideal for personal projects and quick surveys",
        priceInPaise: 0,
        currency: "INR",
        billingInterval: "MONTHLY" as const,
        formLimit: 5,
        submissionLimitPerForm: 100,
        sortOrder: 0,
    },
    {
        code: "premium_399",
        name: "Premium Professional",
        description: "Perfect for growing businesses and creators",
        priceInPaise: 39900,
        currency: "INR",
        billingInterval: "MONTHLY" as const,
        formLimit: 250,
        submissionLimitPerForm: 500,
        sortOrder: 1,
    },
    {
        code: "enterprise_799",
        name: "Enterprise Unlimited",
        description: "For scaling platforms requiring full capabilities",
        priceInPaise: 79900,
        currency: "INR",
        billingInterval: "MONTHLY" as const,
        formLimit: null, // unlimited
        submissionLimitPerForm: 2000,
        sortOrder: 2,
    },
];

async function seedPlansIfNeeded() {
    const existing = await db.select().from(pricingPlansTable).limit(1);
    if (existing.length === 0) {
        for (const plan of DEFAULT_PLANS) {
            await db.insert(pricingPlansTable).values({
                code: plan.code,
                name: plan.name,
                description: plan.description,
                priceInPaise: plan.priceInPaise,
                currency: plan.currency,
                billingInterval: plan.billingInterval,
                formLimit: plan.formLimit,
                submissionLimitPerForm: plan.submissionLimitPerForm,
                sortOrder: plan.sortOrder,
            });
        }
    }
}

async function getUserSubscriptionPlan(userId: string) {
    await seedPlansIfNeeded();

    const [sub] = await db
        .select()
        .from(userSubscriptionsTable)
        .where(
            and(
                eq(userSubscriptionsTable.userId, userId),
                eq(userSubscriptionsTable.status, "ACTIVE")
            )
        )
        .limit(1);

    let planCode = "free";
    let formLimit = 5;
    let submissionLimit = 100;

    if (sub) {
        const now = new Date();
        // Grace period check: if subscription expired past currentPeriodEnd, downgrade to free
        if (sub.currentPeriodEnd && sub.currentPeriodEnd <= now) {
            await db
                .update(userSubscriptionsTable)
                .set({ status: "EXPIRED" })
                .where(eq(userSubscriptionsTable.id, sub.id));

            const [freePlan] = await db
                .select()
                .from(pricingPlansTable)
                .where(eq(pricingPlansTable.code, "free"))
                .limit(1);

            if (freePlan) {
                formLimit = freePlan.formLimit ?? 5;
                submissionLimit = freePlan.submissionLimitPerForm;
            }
        } else {
            const [plan] = await db
                .select()
                .from(pricingPlansTable)
                .where(eq(pricingPlansTable.id, sub.planId))
                .limit(1);

            if (plan) {
                planCode = plan.code;
                formLimit = plan.formLimit ?? 999999;
                submissionLimit = plan.submissionLimitPerForm;
            }
        }
    } else {
        const [freePlan] = await db
            .select()
            .from(pricingPlansTable)
            .where(eq(pricingPlansTable.code, "free"))
            .limit(1);

        if (freePlan) {
            formLimit = freePlan.formLimit ?? 5;
            submissionLimit = freePlan.submissionLimitPerForm;
        }
    }

    return {
        planCode,
        formLimit,
        submissionLimit,
    };
}

export const productRouter = router({
    listPlans: publicProcedure
        .meta({ openapi: { method: "GET", path: "/product/plans", tags: TAGS } })
        .output(pricingPlanOutputModel.array())
        .query(async () => {
            await seedPlansIfNeeded();
            const results = await db.select().from(pricingPlansTable).orderBy(pricingPlansTable.sortOrder);
            return results.map((item) => ({
                ...item,
                createdAt: item.createdAt ? item.createdAt.toISOString() : null,
                updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
            }));
        }),

    getSubscription: authenticatedProcedure
        .meta({ openapi: { method: "GET", path: "/product/subscription", tags: TAGS } })
        .output(subscriptionOutputModel)
        .query(async ({ ctx }) => {
            await seedPlansIfNeeded();

            // Get user active forms count
            const [formsCount] = await db
                .select({ value: count() })
                .from(formsTable)
                .where(
                    and(
                        eq(formsTable.ownerId, ctx.user.id),
                        sql`${formsTable.status} != 'ARCHIVED'`
                    )
                );

            // Get user's active subscription
            const [sub] = await db
                .select()
                .from(userSubscriptionsTable)
                .where(
                    and(
                        eq(userSubscriptionsTable.userId, ctx.user.id),
                        eq(userSubscriptionsTable.status, "ACTIVE")
                    )
                )
                .limit(1);

            if (!sub) {
                const [freePlan] = await db
                    .select()
                    .from(pricingPlansTable)
                    .where(eq(pricingPlansTable.code, "free"))
                    .limit(1);

                return {
                    active: false,
                    subscriptionId: null,
                    planCode: "free",
                    planName: freePlan?.name ?? "Free Plan",
                    formLimit: freePlan?.formLimit ?? 5,
                    submissionLimit: freePlan?.submissionLimitPerForm ?? 100,
                    currentPeriodEnd: null,
                    cancelAtPeriodEnd: false,
                    usage: {
                        activeForms: formsCount?.value ?? 0,
                    },
                };
            }

            const now = new Date();
            // Check grace period expiry
            if (sub.currentPeriodEnd && sub.currentPeriodEnd <= now) {
                await db
                    .update(userSubscriptionsTable)
                    .set({ status: "EXPIRED" })
                    .where(eq(userSubscriptionsTable.id, sub.id));

                const [freePlan] = await db
                    .select()
                    .from(pricingPlansTable)
                    .where(eq(pricingPlansTable.code, "free"))
                    .limit(1);

                return {
                    active: false,
                    subscriptionId: null,
                    planCode: "free",
                    planName: freePlan?.name ?? "Free Plan",
                    formLimit: freePlan?.formLimit ?? 5,
                    submissionLimit: freePlan?.submissionLimitPerForm ?? 100,
                    currentPeriodEnd: null,
                    cancelAtPeriodEnd: false,
                    usage: {
                        activeForms: formsCount?.value ?? 0,
                    },
                };
            }

            const [plan] = await db
                .select()
                .from(pricingPlansTable)
                .where(eq(pricingPlansTable.id, sub.planId))
                .limit(1);

            return {
                active: true,
                subscriptionId: sub.id,
                planCode: plan?.code ?? "unknown",
                planName: plan?.name ?? "Subscription Plan",
                formLimit: plan?.formLimit ?? 999999,
                submissionLimit: plan?.submissionLimitPerForm ?? 100,
                currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
                cancelAtPeriodEnd: sub.cancelledAt !== null,
                usage: {
                    activeForms: formsCount?.value ?? 0,
                },
            };
        }),

    checkout: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: "/product/checkout", tags: TAGS } })
        .input(checkoutInputModel)
        .output(checkoutOutputModel)
        .mutation(async ({ input, ctx }) => {
            await seedPlansIfNeeded();
            const [plan] = await db
                .select()
                .from(pricingPlansTable)
                .where(eq(pricingPlansTable.code, input.planCode))
                .limit(1);

            if (!plan) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Requested pricing plan not found." });
            }

            const keyId = process.env.RAZORPAY_KEY_ID || "";
            const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

            // Force strict integration: throw error if keys are missing
            if (!keyId || !keySecret) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Razorpay credentials are not defined in the backend environment. Please specify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file to enable checkouts.",
                });
            }

            try {
                const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
                const response = await fetch("https://api.razorpay.com/v1/orders", {
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${authHeader}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        amount: plan.priceInPaise,
                        currency: plan.currency,
                        receipt: `receipt_${ctx.user.id.slice(0, 8)}_${randomUUID().slice(0, 8)}`,
                    }),
                });

                if (!response.ok) {
                    const rawErr = await response.text();
                    console.error("Razorpay Order creation API error response:", rawErr);
                    throw new Error("Razorpay returned non-200 status code");
                }

                const orderData = (await response.json()) as { id: string };
                return {
                    simulated: false,
                    planCode: plan.code,
                    planName: plan.name,
                    amount: plan.priceInPaise,
                    currency: plan.currency,
                    razorpayOrderId: orderData.id,
                    keyId,
                };
            } catch (err) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: err instanceof Error ? err.message : "Razorpay order generation failed.",
                });
            }
        }),

    verifyPayment: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: "/product/verify", tags: TAGS } })
        .input(verifyPaymentInputModel)
        .output(verifyPaymentOutputModel)
        .mutation(async ({ input, ctx }) => {
            await seedPlansIfNeeded();
            const [plan] = await db
                .select()
                .from(pricingPlansTable)
                .where(eq(pricingPlansTable.code, input.planCode))
                .limit(1);

            if (!plan) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
            }

            // Verify payment signature
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            if (!keySecret) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Razorpay Secret key is missing." });
            }

            const generated = createHmac("sha256", keySecret)
                .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
                .digest("hex");

            if (generated !== input.razorpaySignature) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Signature verification failed. Payment is unauthorized.",
                });
            }

            // 1. Immediately terminate/upgrade existing active subscriptions for this user
            await db
                .update(userSubscriptionsTable)
                .set({ status: "CANCELLED" })
                .where(
                    and(
                        eq(userSubscriptionsTable.userId, ctx.user.id),
                        eq(userSubscriptionsTable.status, "ACTIVE")
                    )
                );

            // 2. Insert new active subscription record starting immediately (immediate upgrade benefits)
            const [newSub] = await db
                .insert(userSubscriptionsTable)
                .values({
                    userId: ctx.user.id,
                    planId: plan.id,
                    status: "ACTIVE",
                    razorpaySubscriptionId: input.razorpayOrderId,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Active for 30 days
                })
                .returning();

            // 3. Register payment log
            await db.insert(paymentsTable).values({
                userId: ctx.user.id,
                subscriptionId: newSub?.id,
                planId: plan.id,
                status: "CAPTURED",
                amountInPaise: plan.priceInPaise,
                currency: plan.currency,
                razorpayOrderId: input.razorpayOrderId,
                razorpayPaymentId: input.razorpayPaymentId,
                razorpaySignature: input.razorpaySignature,
                paidAt: new Date(),
            });

            const [user] = await db
                .select({
                    email: usersTable.email,
                    fullName: usersTable.fullName,
                })
                .from(usersTable)
                .where(eq(usersTable.id, ctx.user.id))
                .limit(1);

            if (user) {
                try {
                    await sendPaymentReceiptEmail({
                        to: user.email,
                        fullName: user.fullName,
                        planName: plan.name,
                        amountInPaise: plan.priceInPaise,
                        currency: plan.currency,
                        paymentId: input.razorpayPaymentId,
                        paidAt: new Date(),
                    });
                } catch (error) {
                    console.error("Unable to send payment receipt email", error);
                }
            }

            return { success: true };
        }),

    cancelSubscription: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: "/product/cancel", tags: TAGS } })
        .input(cancelSubscriptionInputModel)
        .output(cancelSubscriptionOutputModel)
        .mutation(async ({ ctx }) => {
            await db
                .update(userSubscriptionsTable)
                .set({
                    // Do NOT set status to cancelled immediately! Keep benefits active until currentPeriodEnd!
                    cancelledAt: new Date(),
                })
                .where(
                    and(
                        eq(userSubscriptionsTable.userId, ctx.user.id),
                        eq(userSubscriptionsTable.status, "ACTIVE")
                    )
                );

            return { success: true };
        }),
});
