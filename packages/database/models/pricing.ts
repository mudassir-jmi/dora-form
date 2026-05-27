import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const billingIntervalEnum = pgEnum("billing_interval", ["MONTHLY"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
  "EXPIRED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "CREATED",
  "AUTHORIZED",
  "CAPTURED",
  "FAILED",
  "REFUNDED",
]);

export const pricingPlansTable = pgTable("pricing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  description: text("description"),
  priceInPaise: integer("price_in_paise").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  billingInterval: billingIntervalEnum("billing_interval").notNull().default("MONTHLY"),
  formLimit: integer("form_limit"),
  submissionLimitPerForm: integer("submission_limit_per_form").notNull(),
  razorpayPlanId: varchar("razorpay_plan_id", { length: 120 }).unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const userSubscriptionsTable = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  planId: uuid("plan_id")
    .notNull()
    .references(() => pricingPlansTable.id),
  status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 120 }),
  razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 120 }).unique(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptionsTable.id),
  planId: uuid("plan_id")
    .notNull()
    .references(() => pricingPlansTable.id),
  status: paymentStatusEnum("status").notNull().default("CREATED"),
  amountInPaise: integer("amount_in_paise").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  razorpayOrderId: varchar("razorpay_order_id", { length: 120 }).unique(),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 120 }).unique(),
  razorpaySignature: varchar("razorpay_signature", { length: 255 }),
  failureReason: text("failure_reason"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectPricingPlan = typeof pricingPlansTable.$inferSelect;
export type InsertPricingPlan = typeof pricingPlansTable.$inferInsert;
export type SelectUserSubscription = typeof userSubscriptionsTable.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptionsTable.$inferInsert;
export type SelectPayment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;
