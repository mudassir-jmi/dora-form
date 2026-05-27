import { z } from "../../schema";

export const checkoutInputModel = z.object({
  planCode: z.string().min(1),
});

export const verifyPaymentInputModel = z.object({
  planCode: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const cancelSubscriptionInputModel = z.object({
  id: z.string().uuid().optional(),
});

export const pricingPlanOutputModel = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  priceInPaise: z.number(),
  currency: z.string(),
  billingInterval: z.enum(["MONTHLY"]),
  formLimit: z.number().nullable(),
  submissionLimitPerForm: z.number(),
  razorpayPlanId: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
});

export const subscriptionOutputModel = z.object({
  active: z.boolean(),
  subscriptionId: z.string().optional().nullable(),
  planCode: z.string(),
  planName: z.string(),
  formLimit: z.number(),
  submissionLimit: z.number(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean().optional(),
  usage: z.object({
    activeForms: z.number(),
  }),
});

export const checkoutOutputModel = z.object({
  simulated: z.boolean(),
  planCode: z.string(),
  planName: z.string(),
  amount: z.number(),
  currency: z.string(),
  razorpayOrderId: z.string(),
  keyId: z.string(),
});

export const verifyPaymentOutputModel = z.object({
  success: z.boolean(),
});

export const simulatedCheckoutOutputModel = z.object({
  success: z.boolean(),
  planCode: z.string(),
});

export const cancelSubscriptionOutputModel = z.object({
  success: z.boolean(),
});
