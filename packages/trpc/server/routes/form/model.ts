import { z } from "../../schema.js";

export const fieldTypeModel = z.enum([
    "TEXT",
    "LONG_TEXT",
    "NUMBER",
    "EMAIL",
    "YES_NO",
    "CHECKBOX",
    "FILE_URL",
    "SELECT",
    "DATE",
    "RATING",
]);

export const formVisibilityModel = z.enum(["PUBLIC", "UNLISTED"]);
export const formStatusModel = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const selectModeModel = z.enum(["SINGLE", "MULTIPLE"]);

export const fieldValidationModel = z
    .object({
        minLength: z.number().int().min(0).optional(),
        maxLength: z.number().int().min(1).optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        allowedDomains: z.array(z.string().min(1)).optional(),
        minSelected: z.number().int().min(0).optional(),
        maxSelected: z.number().int().min(1).optional(),
        allowedTypes: z.array(z.string().min(1)).optional(),
        maxSizeMb: z.number().positive().optional(),
    })
    .passthrough();

export const fieldOptionInputModel = z.object({
    label: z.string().min(1).max(160),
    value: z.string().min(1).max(160),
    order: z.number().int().min(0),
    isDefault: z.boolean().optional(),
});

export const fieldInputModel = z.object({
    label: z.string().min(1).max(160),
    labelKey: z.string().min(1).max(160).optional(),
    description: z.string().max(1000).optional().nullable(),
    placeholder: z.string().max(255).optional().nullable(),
    isRequired: z.boolean().optional(),
    order: z.number().int().min(0),
    type: fieldTypeModel,
    selectMode: selectModeModel.optional().nullable(),
    validation: fieldValidationModel.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    options: z.array(fieldOptionInputModel).optional(),
});

export const createFormInputModel = z.object({
    title: z.string().max(120),
    description: z.string().max(4000).optional().nullable(),
    posterUrl: z.url().optional().nullable(),
    slug: z.string().min(3).max(140).optional(),
    visibility: formVisibilityModel.optional(),
    fields: z.array(fieldInputModel).optional(),
});

export const updateFormInputModel = z.object({
    id: z.uuid(),
    title: z.string().max(120).optional(),
    description: z.string().max(4000).optional().nullable(),
    posterUrl: z.url().optional().nullable(),
    slug: z.string().min(3).max(140).optional(),
    visibility: formVisibilityModel.optional(),
});

export const formIdInputModel = z.object({
    id: z.uuid(),
});

export const publishFormInputModel = z.object({
    id: z.uuid(),
    visibility: formVisibilityModel.optional(),
});

export const createFieldInputModel = fieldInputModel.extend({
    formId: z.uuid(),
});

export const updateFieldInputModel = fieldInputModel.partial().extend({
    id: z.uuid(),
    formId: z.uuid(),
});

export const deleteFieldInputModel = z.object({
    id: z.uuid(),
    formId: z.uuid(),
});

export const reorderFieldsInputModel = z.object({
    formId: z.uuid(),
    fieldIds: z.array(z.uuid()),
});

export const getPublicFormInputModel = z.object({
    slug: z.string().min(1).max(140),
});

export const listFormsInputModel = z
    .object({
        status: formStatusModel.optional(),
        visibility: formVisibilityModel.optional(),
        limit: z.number().int().min(1).max(100).optional(),
    })
    .optional();

export const listPublicFormsInputModel = z
    .object({
        limit: z.number().int().min(1).max(50).optional(),
    })
    .optional();

export const answerValueModel = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
]);

export const submitFormInputModel = z.object({
    slug: z.string().min(1).max(140),
    respondentEmail: z.email().optional().nullable(),
    honeypot: z.string().max(0).optional(),
    answers: z.array(
        z.object({
            fieldKey: z.string().min(1).max(160),
            value: answerValueModel,
        }),
    ),
});

export const signFileUploadInputModel = z.object({
    slug: z.string().min(1).max(140),
    fieldKey: z.string().min(1).max(160),
    filename: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(120),
    sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
});

export const signFileUploadOutputModel = z.object({
    cloudName: z.string(),
    uploadUrl: z.url(),
    maxSizeBytes: z.number(),
    allowedMimeTypes: z.array(z.string()),
    fields: z.object({
        allowed_formats: z.string(),
        context: z.string(),
        folder: z.string(),
        public_id: z.string(),
        timestamp: z.string(),
        api_key: z.string(),
        signature: z.string(),
    }),
});

export const responseListInputModel = z.object({
    formId: z.uuid(),
    limit: z.number().int().min(1).max(100).optional(),
});

export const formOptionOutputModel = z.object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
    order: z.number(),
    isDefault: z.boolean(),
});

export const formFieldOutputModel = z.object({
    id: z.string(),
    formId: z.string(),
    label: z.string(),
    labelKey: z.string(),
    description: z.string().nullable(),
    placeholder: z.string().nullable(),
    isRequired: z.boolean(),
    order: z.number(),
    type: fieldTypeModel,
    selectMode: selectModeModel.nullable(),
    validation: z.record(z.string(), z.unknown()),
    metadata: z.record(z.string(), z.unknown()),
    options: z.array(formOptionOutputModel),
});

export const formOutputModel = z.object({
    id: z.string(),
    ownerId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    posterUrl: z.string().nullable(),
    status: formStatusModel,
    visibility: formVisibilityModel,
    slug: z.string(),
    isAcceptingSubmissions: z.boolean(),
    submissionCount: z.number(),
    publishedAt: z.string().nullable(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    fields: z.array(formFieldOutputModel),
});

export const publicFormOutputModel = formOutputModel.omit({
    ownerId: true,
    status: true,
    isAcceptingSubmissions: true,
});

export const listFormsOutputModel = z.array(formOutputModel.omit({ fields: true }));
export const listPublicFormsOutputModel = z.array(publicFormOutputModel.omit({ fields: true }));

export const submitFormOutputModel = z.object({
    submissionId: z.string(),
    message: z.string(),
});

export const responseOutputModel = z.object({
    id: z.string(),
    formId: z.string(),
    respondentEmail: z.string().nullable(),
    status: z.enum(["STARTED", "COMPLETED", "PARTIAL"]),
    submittedAt: z.string().nullable(),
    answers: z.array(
        z.object({
            fieldId: z.string(),
            fieldKey: z.string(),
            value: answerValueModel,
        }),
    ),
});

export const listResponsesOutputModel = z.array(responseOutputModel);

export const analyticsOutputModel = z.object({
    formId: z.string(),
    totalSubmissions: z.number(),
    completionRate: z.number(),
    responseLimit: z.number().nullable(),
    remainingResponses: z.number().nullable(),
    responsesByDay: z.array(
        z.object({
            date: z.string(),
            count: z.number(),
        }),
    ),
});

export const dashboardActivityInputModel = z
    .object({
        timezoneOffsetMinutes: z.number().int().min(-840).max(840).optional(),
    })
    .optional();

export const dashboardActivityOutputModel = z.array(
    z.object({
        date: z.string(),
        day: z.string(),
        responses: z.number(),
    }),
);
