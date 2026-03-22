import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const waitlistEmailsTable = pgTable("waitlist_emails", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type WaitlistEmail = typeof waitlistEmailsTable.$inferSelect;
