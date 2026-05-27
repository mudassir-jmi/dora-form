import { TRPCError } from "@trpc/server";
import { and, asc, count, db, desc, eq, inArray, sql } from "@repo/database";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createSignedUploadPayload, isCloudinaryUrl } from "@repo/services/clients/cloudinary.js";
import {
    formFieldOptionsTable,
    formFieldsTable,
    formsTable,
    formSubmissionAnswersTable,
    formSubmissionsTable,
} from "@repo/database/models/form";
import { pricingPlansTable, userSubscriptionsTable } from "@repo/database/models/pricing";

async function getUserSubscriptionPlan(userId: string) {
    const existingPlans = await db.select().from(pricingPlansTable).limit(1);
    if (existingPlans.length === 0) {
        const defaultPlans = [
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
        for (const plan of defaultPlans) {
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

async function generateUniqueFieldKey(formId: string, label: string) {
    const baseKey = normalizeKey(label) || "field";
    let candidate = baseKey;
    let suffix = 1;

    while (true) {
        const [existing] = await db
            .select({ id: formFieldsTable.id })
            .from(formFieldsTable)
            .where(
                and(
                    eq(formFieldsTable.formId, formId),
                    eq(formFieldsTable.labelKey, candidate)
                )
            )
            .limit(1);

        if (!existing) return candidate;

        suffix += 1;
        candidate = `${baseKey}_${suffix}`;
    }
}

import { authenticatedProcedure, publicProcedure, router } from "../../trpc.js";
import { generatePath } from "../../utils/path-generator.js";
import {
    analyticsOutputModel,
    createFieldInputModel,
    createFormInputModel,
    dashboardActivityInputModel,
    dashboardActivityOutputModel,
    deleteFieldInputModel,
    formFieldOutputModel,
    formIdInputModel,
    formOutputModel,
    getPublicFormInputModel,
    listFormsInputModel,
    listFormsOutputModel,
    listPublicFormsInputModel,
    listPublicFormsOutputModel,
    listResponsesOutputModel,
    publicFormOutputModel,
    publishFormInputModel,
    responseListInputModel,
    reorderFieldsInputModel,
    signFileUploadInputModel,
    signFileUploadOutputModel,
    submitFormInputModel,
    submitFormOutputModel,
    updateFieldInputModel,
    updateFormInputModel,
} from "./model.js";

const TAGS = ["Forms"];
const getPath = generatePath("/forms");
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;

const submissionAttempts = new Map<string, { count: number; resetAt: number }>();

type AnswerValue = string | number | boolean | string[] | null;
type FieldType =
    | "TEXT"
    | "LONG_TEXT"
    | "NUMBER"
    | "EMAIL"
    | "YES_NO"
    | "CHECKBOX"
    | "FILE_URL"
    | "SELECT"
    | "DATE"
    | "RATING";
type SelectMode = "SINGLE" | "MULTIPLE" | null;

function toIso(value: Date | null | undefined) {
    return value ? value.toISOString() : null;
}

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);
}

function normalizeKey(value: string) {
    return slugify(value).replace(/-/g, "_");
}

function assertRateLimit(key: string) {
    const now = Date.now();
    const current = submissionAttempts.get(key);

    if (!current || current.resetAt <= now) {
        submissionAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return;
    }

    if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
        throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many submissions. Please wait a minute and try again.",
        });
    }

    current.count += 1;
}

function shiftDateByTimezoneOffset(value: Date, timezoneOffsetMinutes: number) {
    return new Date(value.getTime() - timezoneOffsetMinutes * 60 * 1000);
}

function getTrendDays(timezoneOffsetMinutes: number) {
    const today = shiftDateByTimezoneOffset(new Date(), timezoneOffsetMinutes);
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - 6 + index);
        return date;
    });
}

function getNumberDigitCount(value: number) {
    return String(value).replace(/\D/g, "").length;
}

function toDateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

async function createUniqueSlug(title: string, requestedSlug?: string) {
    const baseSlug = slugify(requestedSlug ?? title) || randomUUID().slice(0, 8);
    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
        const [existing] = await db
            .select({ id: formsTable.id })
            .from(formsTable)
            .where(eq(formsTable.slug, candidate))
            .limit(1);

        if (!existing) return candidate;

        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
    }
}

async function ensureCreatorForm(formId: string, ownerId: string) {
    const [form] = await db
        .select()
        .from(formsTable)
        .where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId)))
        .limit(1);

    if (!form) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Form not found or you do not have access to it.",
        });
    }

    return form;
}

function mapOption(option: typeof formFieldOptionsTable.$inferSelect) {
    return {
        id: option.id,
        label: option.label,
        value: option.value,
        order: option.order,
        isDefault: option.isDefault,
    };
}

function mapField(
    field: typeof formFieldsTable.$inferSelect,
    options: Array<typeof formFieldOptionsTable.$inferSelect>,
) {
    return {
        id: field.id,
        formId: field.formId,
        label: field.label,
        labelKey: field.labelKey,
        description: field.description,
        placeholder: field.placeholder,
        isRequired: field.isRequired,
        order: field.order,
        type: field.type,
        selectMode: field.selectMode,
        validation: field.validation,
        metadata: field.metadata,
        options: options.map(mapOption),
    };
}

function mapForm(form: typeof formsTable.$inferSelect, fields: ReturnType<typeof mapField>[] = []) {
    return {
        id: form.id,
        ownerId: form.ownerId,
        title: form.title,
        description: form.description,
        posterUrl: form.posterUrl,
        status: form.status,
        visibility: form.visibility,
        slug: form.slug,
        isAcceptingSubmissions: form.isAcceptingSubmissions,
        submissionCount: form.submissionCount,
        publishedAt: toIso(form.publishedAt),
        createdAt: toIso(form.createdAt),
        updatedAt: toIso(form.updatedAt),
        fields,
    };
}

async function getFormFields(formId: string) {
    const fields = await db
        .select()
        .from(formFieldsTable)
        .where(eq(formFieldsTable.formId, formId))
        .orderBy(asc(formFieldsTable.order));

    if (fields.length === 0) return [];

    const options = await db
        .select()
        .from(formFieldOptionsTable)
        .where(
            inArray(
                formFieldOptionsTable.fieldId,
                fields.map((field) => field.id),
            ),
        )
        .orderBy(asc(formFieldOptionsTable.order));

    return fields.map((field) =>
        mapField(
            field,
            options.filter((option) => option.fieldId === field.id),
        ),
    );
}

function validateAnswer(field: ReturnType<typeof mapField>, value: AnswerValue) {
    const validation = field.validation as {
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        minSelected?: number;
        maxSelected?: number;
    };

    const hasEmptyValue =
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        typeof value === "undefined";

    if (field.isRequired && hasEmptyValue) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${field.label} is required.`,
        });
    }

    if (hasEmptyValue) return null;

    switch (field.type as FieldType) {
        case "TEXT":
        case "LONG_TEXT": {
            if (typeof value !== "string") {
                throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be text.` });
            }
            const minLength = validation.minLength ?? validation.min;
            const maxLength = validation.maxLength ?? validation.max;
            if (typeof minLength === "number" && value.length < minLength) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `${field.label} must have at least ${minLength} characters.`,
                });
            }
            if (typeof maxLength === "number" && value.length > maxLength) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `${field.label} must have at most ${maxLength} characters.`,
                });
            }
            return value;
        }
        case "EMAIL": {
            if (typeof value !== "string" || !/^\S+@\S+\.\S+$/.test(value)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be an email.` });
            }
            return value;
        }
        case "FILE_URL": {
            if (typeof value !== "string") {
                throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be an uploaded file.` });
            }
            if (!isCloudinaryUrl(value)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `${field.label} must be uploaded through DoraForm.`,
                });
            }
            return value;
        }
        case "DATE": {
            if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be a date.` });
            }
            return value;
        }
        case "NUMBER":
        case "RATING": {
            if (typeof value !== "number" || Number.isNaN(value)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be a number.` });
            }
            if (field.type === "NUMBER") {
                const digitCount = getNumberDigitCount(value);
                if (typeof validation.minLength === "number" && digitCount < validation.minLength) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `${field.label} must have at least ${validation.minLength} digits.`,
                    });
                }
                if (typeof validation.maxLength === "number" && digitCount > validation.maxLength) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `${field.label} must have at most ${validation.maxLength} digits.`,
                    });
                }
            }
            const min = validation.min ?? (field.type === "RATING" ? 1 : undefined);
            const max = validation.max ?? (field.type === "RATING" ? 5 : undefined);

            if (typeof min === "number" && value < min) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `${field.label} must be at least ${min}.`,
                });
            }
            if (typeof max === "number" && value > max) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `${field.label} must be at most ${max}.`,
                });
            }
            return value;
        }
        case "YES_NO":
        case "CHECKBOX": {
            if (typeof value !== "boolean") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `${field.label} must be true or false.`,
                });
            }
            return value;
        }
        case "SELECT": {
            const allowedValues = new Set(field.options.map((option) => option.value));

            if ((field.selectMode as SelectMode) === "MULTIPLE") {
                if (!Array.isArray(value) || value.some((item) => !allowedValues.has(item))) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `${field.label} contains an invalid option.`,
                    });
                }
                if (validation.minSelected && value.length < validation.minSelected) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `${field.label} needs at least ${validation.minSelected} option(s).`,
                    });
                }
                if (validation.maxSelected && value.length > validation.maxSelected) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `${field.label} allows at most ${validation.maxSelected} option(s).`,
                    });
                }
                return value;
            }

            if (typeof value !== "string" || !allowedValues.has(value)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `${field.label} contains an invalid option.`,
                });
            }
            return value;
        }
        default:
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: `${field.label} has an unsupported type.`,
            });
    }
}

async function replaceOptions(
    fieldId: string,
    options: Array<typeof formFieldOptionsTable.$inferInsert>,
) {
    await db.delete(formFieldOptionsTable).where(eq(formFieldOptionsTable.fieldId, fieldId));

    if (options.length > 0) {
        await db.insert(formFieldOptionsTable).values(options);
    }
}

export const formRouter = router({
    listMine: authenticatedProcedure
        .meta({ openapi: { method: "GET", path: getPath("/mine"), tags: TAGS } })
        .input(listFormsInputModel)
        .output(listFormsOutputModel)
        .query(async ({ input, ctx }) => {
            const conditions = [eq(formsTable.ownerId, ctx.user.id)];

            if (input?.status) conditions.push(eq(formsTable.status, input.status));
            if (input?.visibility) conditions.push(eq(formsTable.visibility, input.visibility));

            const forms = await db
                .select()
                .from(formsTable)
                .where(and(...conditions))
                .orderBy(desc(formsTable.createdAt))
                .limit(input?.limit ?? 50);

            return forms.map((form) => {
                const { fields, ...rest } = mapForm(form);
                return rest;
            });
        }),

    dashboardActivity: authenticatedProcedure
        .meta({ openapi: { method: "GET", path: getPath("/dashboard/activity"), tags: TAGS } })
        .input(dashboardActivityInputModel)
        .output(dashboardActivityOutputModel)
        .query(async ({ input, ctx }) => {
            const timezoneOffsetMinutes = input?.timezoneOffsetMinutes ?? 0;
            const trendDays = getTrendDays(timezoneOffsetMinutes);
            const rangeStart = new Date(trendDays[0]!.getTime() + timezoneOffsetMinutes * 60 * 1000);
            const rangeEnd = new Date(trendDays[6]!.getTime() + timezoneOffsetMinutes * 60 * 1000);
            rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

            const submissions = await db
                .select({
                    submittedAt: formSubmissionsTable.submittedAt,
                })
                .from(formSubmissionsTable)
                .innerJoin(formsTable, eq(formSubmissionsTable.formId, formsTable.id))
                .where(
                    and(
                        eq(formsTable.ownerId, ctx.user.id),
                        sql`${formsTable.status} != 'ARCHIVED'`,
                        sql`${formSubmissionsTable.submittedAt} >= ${rangeStart}`,
                        sql`${formSubmissionsTable.submittedAt} < ${rangeEnd}`,
                    ),
                );

            const countsByDate = new Map(trendDays.map((date) => [toDateKey(date), 0]));

            for (const submission of submissions) {
                if (!submission.submittedAt) continue;
                const localDate = shiftDateByTimezoneOffset(submission.submittedAt, timezoneOffsetMinutes);
                localDate.setHours(0, 0, 0, 0);
                const dateKey = toDateKey(localDate);
                countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
            }

            return trendDays.map((date) => {
                const dateKey = toDateKey(date);
                return {
                    date: dateKey,
                    day: date.toLocaleDateString("en-US", { weekday: "short" }),
                    responses: countsByDate.get(dateKey) ?? 0,
                };
            });
        }),

    getMineById: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/mine/get"), tags: TAGS } })
        .input(formIdInputModel)
        .output(formOutputModel)
        .query(async ({ input, ctx }) => {
            const form = await ensureCreatorForm(input.id, ctx.user.id);
            const fields = await getFormFields(form.id);
            return mapForm(form, fields);
        }),

    create: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/create"), tags: TAGS } })
        .input(createFormInputModel)
        .output(formOutputModel)
        .mutation(async ({ input, ctx }) => {
            const subPlan = await getUserSubscriptionPlan(ctx.user.id);
            const [activeFormsCount] = await db
                .select({ value: count() })
                .from(formsTable)
                .where(
                    and(
                        eq(formsTable.ownerId, ctx.user.id),
                        sql`${formsTable.status} != 'ARCHIVED'`
                    )
                );

            if ((activeFormsCount?.value ?? 0) >= subPlan.formLimit) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: `You have reached the form creation limit under your plan (${subPlan.formLimit} forms). Please upgrade your subscription in the Billing console.`,
                });
            }

            const slug = await createUniqueSlug(input.title, input.slug);
            const [form] = await db
                .insert(formsTable)
                .values({
                    ownerId: ctx.user.id,
                    title: input.title,
                    description: input.description,
                    posterUrl: input.posterUrl,
                    slug,
                    visibility: input.visibility ?? "UNLISTED",
                })
                .returning();

            if (!form) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create form." });
            }

            for (const field of input.fields ?? []) {
                const [createdField] = await db
                    .insert(formFieldsTable)
                    .values({
                        formId: form.id,
                        label: field.label,
                        labelKey: field.labelKey ?? normalizeKey(field.label),
                        description: field.description,
                        placeholder: field.placeholder,
                        isRequired: field.isRequired ?? false,
                        order: field.order,
                        type: field.type,
                        selectMode: field.type === "SELECT" ? (field.selectMode ?? "SINGLE") : null,
                        validation: field.validation ?? {},
                        metadata: field.metadata ?? {},
                    })
                    .returning();

                if (createdField && field.options && field.options.length > 0) {
                    await db.insert(formFieldOptionsTable).values(
                        field.options.map((option) => ({
                            fieldId: createdField.id,
                            label: option.label,
                            value: option.value,
                            order: option.order,
                            isDefault: option.isDefault ?? false,
                        })),
                    );
                }
            }

            const fields = await getFormFields(form.id);
            return mapForm(form, fields);
        }),

    update: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/update"), tags: TAGS } })
        .input(updateFormInputModel)
        .output(formOutputModel)
        .mutation(async ({ input, ctx }) => {
            await ensureCreatorForm(input.id, ctx.user.id);

            const updatePayload: Partial<typeof formsTable.$inferInsert> = {};

            if (input.title !== undefined) updatePayload.title = input.title;
            if (input.description !== undefined) updatePayload.description = input.description;
            if (input.posterUrl !== undefined) updatePayload.posterUrl = input.posterUrl;
            if (input.visibility !== undefined) updatePayload.visibility = input.visibility;
            if (input.slug !== undefined) updatePayload.slug = slugify(input.slug);

            const [updatedForm] = await db
                .update(formsTable)
                .set(updatePayload)
                .where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ctx.user.id)))
                .returning();

            if (!updatedForm) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to update form." });
            }

            const fields = await getFormFields(updatedForm.id);
            return mapForm(updatedForm, fields);
        }),

    publish: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/publish"), tags: TAGS } })
        .input(publishFormInputModel)
        .output(formOutputModel)
        .mutation(async ({ input, ctx }) => {
            await ensureCreatorForm(input.id, ctx.user.id);

            const [form] = await db
                .update(formsTable)
                .set({
                    status: "PUBLISHED",
                    ...(input.visibility ? { visibility: input.visibility } : {}),
                    isAcceptingSubmissions: true,
                    publishedAt: new Date(),
                })
                .where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ctx.user.id)))
                .returning();

            if (!form)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to publish form." });

            return mapForm(form, await getFormFields(form.id));
        }),

    unpublish: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/unpublish"), tags: TAGS } })
        .input(formIdInputModel)
        .output(formOutputModel)
        .mutation(async ({ input, ctx }) => {
            await ensureCreatorForm(input.id, ctx.user.id);

            const [form] = await db
                .update(formsTable)
                .set({ status: "DRAFT", isAcceptingSubmissions: false })
                .where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ctx.user.id)))
                .returning();

            if (!form)
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to unpublish form.",
                });

            return mapForm(form, await getFormFields(form.id));
        }),

    archive: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/archive"), tags: TAGS } })
        .input(formIdInputModel)
        .output(formOutputModel)
        .mutation(async ({ input, ctx }) => {
            await ensureCreatorForm(input.id, ctx.user.id);

            const [form] = await db
                .update(formsTable)
                .set({ status: "ARCHIVED", isAcceptingSubmissions: false })
                .where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ctx.user.id)))
                .returning();

            if (!form)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to archive form." });

            return mapForm(form, await getFormFields(form.id));
        }),

    createField: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/fields/create"), tags: TAGS } })
        .input(createFieldInputModel)
        .output(formFieldOutputModel)
        .mutation(async ({ input, ctx }) => {
            await ensureCreatorForm(input.formId, ctx.user.id);

            const labelKey = input.labelKey ?? (await generateUniqueFieldKey(input.formId, input.label));

            const [field] = await db
                .insert(formFieldsTable)
                .values({
                    formId: input.formId,
                    label: input.label,
                    labelKey,
                    description: input.description,
                    placeholder: input.placeholder,
                    isRequired: input.isRequired ?? false,
                    order: input.order,
                    type: input.type,
                    selectMode: input.type === "SELECT" ? (input.selectMode ?? "SINGLE") : null,
                    validation: input.validation ?? {},
                    metadata: input.metadata ?? {},
                })
                .returning();

            if (!field)
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create field." });

            if (input.options && input.options.length > 0) {
                await db.insert(formFieldOptionsTable).values(
                    input.options.map((option) => ({
                        fieldId: field.id,
                        label: option.label,
                        value: option.value,
                        order: option.order,
                        isDefault: option.isDefault ?? false,
                    })),
                );
            }

            const created = (await getFormFields(input.formId)).find((item) => item.id === field.id);

            if (!created) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to load created field.",
                });
            }

            return created;
        }),

    updateField: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/fields/update"), tags: TAGS } })
        .input(updateFieldInputModel)
        .output(formFieldOutputModel)
        .mutation(async ({ input, ctx }) => {
            await ensureCreatorForm(input.formId, ctx.user.id);

            const updatePayload: Partial<typeof formFieldsTable.$inferInsert> = {};

            if (input.label !== undefined) updatePayload.label = input.label;
            if (input.labelKey !== undefined) updatePayload.labelKey = input.labelKey;
            if (input.description !== undefined) updatePayload.description = input.description;
            if (input.placeholder !== undefined) updatePayload.placeholder = input.placeholder;
            if (input.isRequired !== undefined) updatePayload.isRequired = input.isRequired;
            if (input.order !== undefined) updatePayload.order = input.order;
            if (input.type !== undefined) updatePayload.type = input.type;
            if (input.selectMode !== undefined) updatePayload.selectMode = input.selectMode;
            if (input.validation !== undefined) updatePayload.validation = input.validation;
            if (input.metadata !== undefined) updatePayload.metadata = input.metadata;

            const [field] = await db
                .update(formFieldsTable)
                .set(updatePayload)
                .where(and(eq(formFieldsTable.id, input.id), eq(formFieldsTable.formId, input.formId)))
                .returning();

            if (!field) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Field not found." });
            }

            if (input.options) {
                await replaceOptions(
                    field.id,
                    input.options.map((option) => ({
                        fieldId: field.id,
                        label: option.label,
                        value: option.value,
                        order: option.order,
                        isDefault: option.isDefault ?? false,
                    })),
                );
            }

            const updated = (await getFormFields(input.formId)).find((item) => item.id === field.id);

            if (!updated) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Unable to load updated field.",
                });
            }

            return updated;
        }),

    deleteField: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/fields/delete"), tags: TAGS } })
        .input(deleteFieldInputModel)
        .output(formFieldOutputModel)
        .mutation(async ({ input, ctx }) => {
            await ensureCreatorForm(input.formId, ctx.user.id);

            const existing = (await getFormFields(input.formId)).find((field) => field.id === input.id);
            if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Field not found." });

            const [answerCount] = await db
                .select({ value: count() })
                .from(formSubmissionAnswersTable)
                .where(eq(formSubmissionAnswersTable.fieldId, input.id));

            if ((answerCount?.value ?? 0) > 0) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message:
                        "This field already has responses. Archive or clone the form before removing it.",
                });
            }

            await db.delete(formFieldOptionsTable).where(eq(formFieldOptionsTable.fieldId, input.id));
            await db
                .delete(formFieldsTable)
                .where(and(eq(formFieldsTable.id, input.id), eq(formFieldsTable.formId, input.formId)));

            return existing;
        }),

    reorderFields: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/fields/reorder"), tags: TAGS } })
        .input(reorderFieldsInputModel)
        .output(formOutputModel)
        .mutation(async ({ input, ctx }) => {
            const form = await ensureCreatorForm(input.formId, ctx.user.id);

            await db.transaction(async (tx) => {
                for (let i = 0; i < input.fieldIds.length; i++) {
                    const fieldId = input.fieldIds[i];
                    if (!fieldId) continue;
                    await tx
                        .update(formFieldsTable)
                        .set({ order: -i - 1 })
                        .where(and(eq(formFieldsTable.id, fieldId), eq(formFieldsTable.formId, form.id)));
                }

                for (let i = 0; i < input.fieldIds.length; i++) {
                    const fieldId = input.fieldIds[i];
                    if (!fieldId) continue;
                    await tx
                        .update(formFieldsTable)
                        .set({ order: i })
                        .where(and(eq(formFieldsTable.id, fieldId), eq(formFieldsTable.formId, form.id)));
                }
            });

            const fields = await getFormFields(form.id);
            return mapForm(form, fields);
        }),

    getPublicBySlug: publicProcedure
        .meta({ openapi: { method: "POST", path: getPath("/public/get"), tags: TAGS } })
        .input(getPublicFormInputModel)
        .output(publicFormOutputModel)
        .query(async ({ input }) => {
            const [form] = await db
                .select()
                .from(formsTable)
                .where(eq(formsTable.slug, input.slug))
                .limit(1);

            if (!form || form.status !== "PUBLISHED" || !form.isAcceptingSubmissions) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This form is unavailable, unpublished, or no longer accepting responses.",
                });
            }

            const { ownerId, status, isAcceptingSubmissions, ...publicForm } = mapForm(
                form,
                await getFormFields(form.id),
            );

            return publicForm;
        }),

    explorePublic: publicProcedure
        .meta({ openapi: { method: "GET", path: getPath("/public/explore"), tags: TAGS } })
        .input(listPublicFormsInputModel)
        .output(listPublicFormsOutputModel)
        .query(async ({ input }) => {
            const forms = await db
                .select()
                .from(formsTable)
                .where(
                    and(
                        eq(formsTable.status, "PUBLISHED"),
                        eq(formsTable.visibility, "PUBLIC"),
                        eq(formsTable.isAcceptingSubmissions, true),
                    ),
                )
                .orderBy(desc(formsTable.publishedAt))
                .limit(input?.limit ?? 24);

            return forms.map((form) => {
                const { ownerId, status, isAcceptingSubmissions, fields, ...publicForm } = mapForm(form);
                return publicForm;
            });
        }),

    signFileUpload: publicProcedure
        .meta({ openapi: { method: "POST", path: getPath("/public/upload/sign"), tags: TAGS } })
        .input(signFileUploadInputModel)
        .output(signFileUploadOutputModel)
        .mutation(async ({ input }) => {
            const [form] = await db
                .select()
                .from(formsTable)
                .where(eq(formsTable.slug, input.slug))
                .limit(1);

            if (!form || form.status !== "PUBLISHED" || !form.isAcceptingSubmissions) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This form is unavailable, unpublished, or no longer accepting responses.",
                });
            }

            const [field] = await db
                .select()
                .from(formFieldsTable)
                .where(
                    and(
                        eq(formFieldsTable.formId, form.id),
                        eq(formFieldsTable.labelKey, input.fieldKey),
                        eq(formFieldsTable.type, "FILE_URL"),
                    ),
                )
                .limit(1);

            if (!field) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This file field is not available on the public form.",
                });
            }

            try {
                return createSignedUploadPayload(input);
            } catch (error) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: error instanceof Error ? error.message : "Unable to prepare file upload.",
                });
            }
        }),

    submitPublic: publicProcedure
        .meta({ openapi: { method: "POST", path: getPath("/public/submit"), tags: TAGS } })
        .input(submitFormInputModel)
        .output(submitFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            assertRateLimit(`${ctx.ip}:${input.slug}`);

            if (input.honeypot) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Submission rejected." });
            }

            const [form] = await db
                .select()
                .from(formsTable)
                .where(eq(formsTable.slug, input.slug))
                .limit(1);

            if (!form || form.status !== "PUBLISHED" || !form.isAcceptingSubmissions) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "This form is unavailable, unpublished, or no longer accepting responses.",
                });
            }

            const subPlan = await getUserSubscriptionPlan(form.ownerId);
            if (form.submissionCount >= subPlan.submissionLimit) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: `This form has reached its response limit under the owner's plan (${subPlan.submissionLimit} responses).`,
                });
            }

            const fields = await getFormFields(form.id);
            const answerMap = new Map(input.answers.map((answer) => [answer.fieldKey, answer.value]));
            const validatedAnswers = fields.map((field) => ({
                field,
                value: validateAnswer(field, answerMap.get(field.labelKey) ?? null),
            }));

            const [submission] = await db
                .insert(formSubmissionsTable)
                .values({
                    formId: form.id,
                    respondentEmail: input.respondentEmail,
                    metadata: {
                        ip: ctx.ip,
                        userAgent: ctx.userAgent,
                    },
                })
                .returning();

            if (!submission) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to submit form." });
            }

            const answerRows = validatedAnswers
                .filter((answer) => answer.value !== null)
                .map((answer) => ({
                    submissionId: submission.id,
                    fieldId: answer.field.id,
                    fieldKey: answer.field.labelKey,
                    value: answer.value,
                }));

            if (answerRows.length > 0) {
                await db.insert(formSubmissionAnswersTable).values(answerRows);
            }

            await db
                .update(formsTable)
                .set({ submissionCount: sql`${formsTable.submissionCount} + 1` })
                .where(eq(formsTable.id, form.id));

            return {
                submissionId: submission.id,
                message: "Thanks for submitting the form.",
            };
        }),

    listResponses: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/responses"), tags: TAGS } })
        .input(responseListInputModel)
        .output(listResponsesOutputModel)
        .query(async ({ input, ctx }) => {
            await ensureCreatorForm(input.formId, ctx.user.id);

            const submissions = await db
                .select()
                .from(formSubmissionsTable)
                .where(eq(formSubmissionsTable.formId, input.formId))
                .orderBy(desc(formSubmissionsTable.submittedAt))
                .limit(input.limit ?? 50);

            if (submissions.length === 0) return [];

            const answers = await db
                .select()
                .from(formSubmissionAnswersTable)
                .where(
                    inArray(
                        formSubmissionAnswersTable.submissionId,
                        submissions.map((submission) => submission.id),
                    ),
                );

            return submissions.map((submission) => ({
                id: submission.id,
                formId: submission.formId,
                respondentEmail: submission.respondentEmail,
                status: submission.status,
                submittedAt: toIso(submission.submittedAt),
                answers: answers
                    .filter((answer) => answer.submissionId === submission.id)
                    .map((answer) => ({
                        fieldId: answer.fieldId,
                        fieldKey: answer.fieldKey,
                        value: answer.value,
                    })),
            }));
        }),

    analytics: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/analytics"), tags: TAGS } })
        .input(responseListInputModel.pick({ formId: true }))
        .output(analyticsOutputModel)
        .query(async ({ input, ctx }) => {
            const form = await ensureCreatorForm(input.formId, ctx.user.id);
            const subPlan = await getUserSubscriptionPlan(ctx.user.id);

            const [total] = await db
                .select({ value: count() })
                .from(formSubmissionsTable)
                .where(eq(formSubmissionsTable.formId, form.id));

            const rows = await db
                .select({
                    date: sql<string>`to_char(${formSubmissionsTable.submittedAt}, 'YYYY-MM-DD')`,
                    value: count(),
                })
                .from(formSubmissionsTable)
                .where(eq(formSubmissionsTable.formId, form.id))
                .groupBy(sql`to_char(${formSubmissionsTable.submittedAt}, 'YYYY-MM-DD')`)
                .orderBy(sql`to_char(${formSubmissionsTable.submittedAt}, 'YYYY-MM-DD')`);

            const totalSubmissions = total?.value ?? 0;
            const responseLimit = subPlan.submissionLimit;

            return {
                formId: form.id,
                totalSubmissions,
                completionRate: totalSubmissions > 0 ? 1 : 0,
                responseLimit,
                remainingResponses: Math.max(responseLimit - totalSubmissions, 0),
                responsesByDay: rows.map((row) => ({
                    date: row.date,
                    count: row.value,
                })),
            };
        }),

    seedMissions: authenticatedProcedure
        .meta({ openapi: { method: "POST", path: getPath("/seed"), tags: TAGS } })
        .input(z.void().optional())
        .output(z.object({ success: z.boolean(), count: z.number() }))
        .mutation(async ({ ctx }) => {
            const ownerId = ctx.user.id;

            const oldForms = await db
                .select({ id: formsTable.id })
                .from(formsTable)
                .where(
                    and(
                        eq(formsTable.ownerId, ownerId),
                        inArray(formsTable.slug, [
                            "customer-satisfaction-survey",
                            "product-feature-requests",
                            "candidate-job-application",
                        ]),
                    ),
                );

            if (oldForms.length > 0) {
                const oldFormIds = oldForms.map((f) => f.id);
                const oldFields = await db
                    .select({ id: formFieldsTable.id })
                    .from(formFieldsTable)
                    .where(inArray(formFieldsTable.formId, oldFormIds));

                if (oldFields.length > 0) {
                    const oldFieldIds = oldFields.map((f) => f.id);
                    await db
                        .delete(formFieldOptionsTable)
                        .where(inArray(formFieldOptionsTable.fieldId, oldFieldIds));
                    await db.delete(formFieldsTable).where(inArray(formFieldsTable.formId, oldFormIds));
                }

                const oldSubmissions = await db
                    .select({ id: formSubmissionsTable.id })
                    .from(formSubmissionsTable)
                    .where(inArray(formSubmissionsTable.formId, oldFormIds));

                if (oldSubmissions.length > 0) {
                    const oldSubIds = oldSubmissions.map((s) => s.id);
                    await db
                        .delete(formSubmissionAnswersTable)
                        .where(inArray(formSubmissionAnswersTable.submissionId, oldSubIds));
                    await db
                        .delete(formSubmissionsTable)
                        .where(inArray(formSubmissionsTable.formId, oldFormIds));
                }

                await db.delete(formsTable).where(inArray(formsTable.id, oldFormIds));
            }

            const seedForm = async (
                title: string,
                slug: string,
                description: string,
                visibility: "PUBLIC" | "UNLISTED",
                fieldsData: Array<{
                    label: string;
                    type: FieldType;
                    isRequired: boolean;
                    selectMode?: SelectMode;
                    options?: string[];
                    validation?: Record<string, unknown>;
                }>,
                submissionsData: Array<{
                    email: string;
                    daysAgo: number;
                    answers: Record<string, AnswerValue>;
                }>,
            ) => {
                const [form] = await db
                    .insert(formsTable)
                    .values({
                        ownerId,
                        title,
                        slug,
                        description,
                        status: "PUBLISHED",
                        visibility,
                        isAcceptingSubmissions: true,
                        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                    })
                    .returning();

                if (!form) return;

                let totalSubCount = 0;

                for (let i = 0; i < fieldsData.length; i++) {
                    const f = fieldsData[i]!;
                    const labelKey = normalizeKey(f.label);

                    const [field] = await db
                        .insert(formFieldsTable)
                        .values({
                            formId: form.id,
                            label: f.label,
                            labelKey,
                            type: f.type,
                            order: i,
                            isRequired: f.isRequired,
                            selectMode: f.selectMode ?? null,
                            validation: f.validation ?? {},
                        })
                        .returning();

                    if (field && f.options && f.options.length > 0) {
                        await db.insert(formFieldOptionsTable).values(
                            f.options.map((opt, idx) => ({
                                fieldId: field.id,
                                label: opt,
                                value: slugify(opt),
                                order: idx,
                                isDefault: false,
                            })),
                        );
                    }
                }

                const dbFields = await getFormFields(form.id);

                for (const sub of submissionsData) {
                    const submittedAt = new Date(Date.now() - sub.daysAgo * 24 * 60 * 60 * 1000);
                    const [submission] = await db
                        .insert(formSubmissionsTable)
                        .values({
                            formId: form.id,
                            respondentEmail: sub.email,
                            status: "COMPLETED",
                            submittedAt,
                        })
                        .returning();

                    if (submission) {
                        totalSubCount++;
                        const answerRows: any[] = [];
                        for (const f of dbFields) {
                            const val = sub.answers[f.labelKey];
                            if (val !== undefined && val !== null) {
                                let finalVal = val;
                                if (f.type === "SELECT") {
                                    if (f.selectMode === "MULTIPLE" && Array.isArray(val)) {
                                        finalVal = val.map((v) => slugify(v));
                                    } else if (typeof val === "string") {
                                        finalVal = slugify(val);
                                    }
                                }

                                answerRows.push({
                                    submissionId: submission.id,
                                    fieldId: f.id,
                                    fieldKey: f.labelKey,
                                    value: finalVal,
                                });
                            }
                        }

                        if (answerRows.length > 0) {
                            await db.insert(formSubmissionAnswersTable).values(answerRows);
                        }
                    }
                }

                await db
                    .update(formsTable)
                    .set({ submissionCount: totalSubCount })
                    .where(eq(formsTable.id, form.id));
            };

            // 1. Customer Satisfaction Survey
            await seedForm(
                "Customer Satisfaction Survey",
                "customer-satisfaction-survey",
                "Analyze customer support performance, channel effectiveness, and general support satisfaction ratings.",
                "PUBLIC",
                [
                    { label: "Customer Full Name", type: "TEXT", isRequired: true },
                    {
                        label: "Preferred support channel",
                        type: "SELECT",
                        isRequired: true,
                        selectMode: "SINGLE",
                        options: ["Email", "Live Chat", "Phone", "Discord", "Self-Service Docs"],
                    },
                    {
                        label: "Support experience rating",
                        type: "RATING",
                        isRequired: true,
                        validation: { min: 1, max: 5 },
                    },
                    { label: "Would you recommend our product to others?", type: "YES_NO", isRequired: false },
                ],
                [
                    {
                        email: "john.doe@company.com",
                        daysAgo: 3,
                        answers: {
                            customer_full_name: "John Doe",
                            preferred_support_channel: "Email",
                            support_experience_rating: 5,
                            would_you_recommend_our_product_to_others: true,
                        },
                    },
                    {
                        email: "sarah.smith@enterprise.net",
                        daysAgo: 2,
                        answers: {
                            customer_full_name: "Sarah Smith",
                            preferred_support_channel: "Live Chat",
                            support_experience_rating: 4,
                            would_you_recommend_our_product_to_others: true,
                        },
                    },
                    {
                        email: "boaster@fnatic.com",
                        daysAgo: 2,
                        answers: {
                            customer_full_name: "James Boaster",
                            preferred_support_channel: "Phone",
                            support_experience_rating: 5,
                            would_you_recommend_our_product_to_others: true,
                        },
                    },
                    {
                        email: "tenz@sentinels.gg",
                        daysAgo: 1,
                        answers: {
                            customer_full_name: "Tyson TenZ",
                            preferred_support_channel: "Live Chat",
                            support_experience_rating: 4,
                            would_you_recommend_our_product_to_others: true,
                        },
                    },
                    {
                        email: "yay@bleed.gg",
                        daysAgo: 0,
                        answers: {
                            customer_full_name: "Jacob Yay",
                            preferred_support_channel: "Email",
                            support_experience_rating: 3,
                            would_you_recommend_our_product_to_others: false,
                        },
                    },
                ],
            );

            // 2. Product Feature Request Questionnaire
            await seedForm(
                "Product Feature Request Questionnaire",
                "product-feature-requests",
                "Vote on upcoming features, UI customization preferences, and product roadmap items.",
                "PUBLIC",
                [
                    { label: "Business Email Address", type: "EMAIL", isRequired: true },
                    {
                        label: "Priority roadmap area",
                        type: "SELECT",
                        isRequired: true,
                        selectMode: "SINGLE",
                        options: ["Analytics Dashboard", "Integration Extensions", "Custom Themes", "Team Workspaces"],
                    },
                    {
                        label: "Preferred incentive rewards",
                        type: "SELECT",
                        isRequired: true,
                        selectMode: "MULTIPLE",
                        options: ["Beta Access Priority", "Free Upgrade Credits", "Community Sprays", "Premium API Limits"],
                    },
                    {
                        label: "Product design satisfaction",
                        type: "RATING",
                        isRequired: false,
                        validation: { min: 1, max: 5 },
                    },
                ],
                [
                    {
                        email: "client.a@industry.com",
                        daysAgo: 3,
                        answers: {
                            business_email_address: "client.a@industry.com",
                            priority_roadmap_area: "Custom Themes",
                            preferred_incentive_rewards: ["Beta Access Priority", "Premium API Limits"],
                            product_design_satisfaction: 4,
                        },
                    },
                    {
                        email: "admin@growthops.io",
                        daysAgo: 1,
                        answers: {
                            business_email_address: "admin@growthops.io",
                            priority_roadmap_area: "Analytics Dashboard",
                            preferred_incentive_rewards: ["Free Upgrade Credits", "Premium API Limits"],
                            product_design_satisfaction: 5,
                        },
                    },
                    {
                        email: "dev@saasflow.net",
                        daysAgo: 0,
                        answers: {
                            business_email_address: "dev@saasflow.net",
                            priority_roadmap_area: "Team Workspaces",
                            preferred_incentive_rewards: ["Free Upgrade Credits"],
                            product_design_satisfaction: 5,
                        },
                    },
                ],
            );

            // 3. Candidate Job Application
            await seedForm(
                "Candidate Job Application",
                "candidate-job-application",
                "Collect software developer application details, resume links, and engineering profile statements.",
                "UNLISTED",
                [
                    { label: "Applicant Full Name", type: "TEXT", isRequired: true },
                    { label: "Professional summary statement", type: "LONG_TEXT", isRequired: true },
                    { label: "Resume deck presentation link", type: "FILE_URL", isRequired: false },
                    {
                        label: "Primary tech stack category",
                        type: "SELECT",
                        isRequired: true,
                        selectMode: "SINGLE",
                        options: ["React & Next.js", "Node.js & tRPC", "Postgres & Drizzle", "Kubernetes & Docker"],
                    },
                ],
                [
                    {
                        email: "coder.v@cybernet.net",
                        daysAgo: 2,
                        answers: {
                            applicant_full_name: "Vincent Coder",
                            professional_summary_statement: "Experienced full-stack engineer specialized in Next.js applications and relational schemas.",
                            resume_deck_presentation_link: "https://arasaka.co.jp/deck.pdf",
                            primary_tech_stack_category: "React & Next.js",
                        },
                    },
                    {
                        email: "staff.reed@security.gov",
                        daysAgo: 0,
                        answers: {
                            applicant_full_name: "Solomon Reed",
                            professional_summary_statement: "Systems architect focused on Docker deployment grids and Postgres query validation.",
                            resume_deck_presentation_link: "https://dogtown.crypt/deck.pdf",
                            primary_tech_stack_category: "Kubernetes & Docker",
                        },
                    },
                ],
            );

            return { success: true, count: 3 };
        }),
});
