import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Signed-in responder commitments that are associated with a specific request. */
export const responderCommitments = mysqlTable("responderCommitments", {
  id: int("id").autoincrement().primaryKey(),
  needId: varchar("needId", { length: 80 }).notNull(),
  responderId: int("responderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["committed", "withdrawn"]).default("committed").notNull(),
  evidenceKey: varchar("evidenceKey", { length: 768 }),
  evidenceUrl: text("evidenceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  responderNeedUnique: uniqueIndex("responderCommitments_responder_need_unique").on(table.responderId, table.needId),
}));

export type ResponderCommitment = typeof responderCommitments.$inferSelect;
export type InsertResponderCommitment = typeof responderCommitments.$inferInsert;
