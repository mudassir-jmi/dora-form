import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    boolean,
    text,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").default(false),
    emailVerificationToken: varchar("email_verification_token", { length: 255 }),
    passwordResetToken: varchar("password_reset_token", { length: 255 }),
    password: varchar("password", { length: 255 }),
    salt: varchar("salt", { length: 255 }),
    profileImageUrl: text("profile_image_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
