import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const formStatusEnum = pgEnum("form_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const formVisibilityEnum = pgEnum("form_visibility", ["PUBLIC", "UNLISTED"]);

export const fieldTypeEnum = pgEnum("field_type", [
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

export const selectModeEnum = pgEnum("select_mode", ["SINGLE", "MULTIPLE"]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "STARTED",
  "COMPLETED",
  "PARTIAL",
]);

export const formsTable = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => usersTable.id),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description"),
  posterUrl: varchar("poster_url", { length: 512 }),
  status: formStatusEnum("status").notNull().default("DRAFT"),
  visibility: formVisibilityEnum("visibility").notNull().default("UNLISTED"),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  isAcceptingSubmissions: boolean("is_accepting_submissions").notNull().default(false),
  submissionCount: integer("submission_count").notNull().default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const formFieldsTable = pgTable(
  "form_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id),
    label: varchar("label", { length: 160 }).notNull(),
    labelKey: varchar("label_key", { length: 160 }).notNull(),
    description: text("description"),
    placeholder: varchar("placeholder", { length: 255 }),
    isRequired: boolean("is_required").notNull().default(false),
    order: integer("order").notNull(),
    type: fieldTypeEnum("type").notNull(),
    selectMode: selectModeEnum("select_mode"),
    validation: jsonb("validation").$type<Record<string, unknown>>().notNull().default({}),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueFormFieldOrder: unique().on(table.formId, table.order),
    uniqueFormFieldKey: unique().on(table.formId, table.labelKey),
  }),
);

export const formFieldOptionsTable = pgTable(
  "form_field_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => formFieldsTable.id),
    label: varchar("label", { length: 160 }).notNull(),
    value: varchar("value", { length: 160 }).notNull(),
    order: integer("order").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueFieldOptionOrder: unique().on(table.fieldId, table.order),
    uniqueFieldOptionValue: unique().on(table.fieldId, table.value),
  }),
);

export const formSubmissionsTable = pgTable("form_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => formsTable.id),
  status: submissionStatusEnum("status").notNull().default("COMPLETED"),
  respondentEmail: varchar("respondent_email", { length: 255 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  submittedAt: timestamp("submitted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const formSubmissionAnswersTable = pgTable(
  "form_submission_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => formSubmissionsTable.id),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => formFieldsTable.id),
    fieldKey: varchar("field_key", { length: 160 }).notNull(),
    value: jsonb("value").$type<string | number | boolean | string[] | null>().notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueSubmissionFieldAnswer: unique().on(table.submissionId, table.fieldId),
  }),
);

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;
export type SelectFormField = typeof formFieldsTable.$inferSelect;
export type InsertFormField = typeof formFieldsTable.$inferInsert;
export type SelectFormFieldOption = typeof formFieldOptionsTable.$inferSelect;
export type InsertFormFieldOption = typeof formFieldOptionsTable.$inferInsert;
export type SelectFormSubmission = typeof formSubmissionsTable.$inferSelect;
export type InsertFormSubmission = typeof formSubmissionsTable.$inferInsert;
export type SelectFormSubmissionAnswer = typeof formSubmissionAnswersTable.$inferSelect;
export type InsertFormSubmissionAnswer = typeof formSubmissionAnswersTable.$inferInsert;
