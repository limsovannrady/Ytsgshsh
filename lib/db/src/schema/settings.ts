import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const settingsTable = pgTable(
  "settings",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("settings_user_key_idx").on(t.userId, t.key)]
);

export type Setting = typeof settingsTable.$inferSelect;
