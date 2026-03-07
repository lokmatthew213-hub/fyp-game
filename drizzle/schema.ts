import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

// TODO: Add your tables here

/**
 * Records each AI-judged answer submitted during a game session.
 * Allows teachers to review student practice history and error patterns.
 */
export const answerHistory = mysqlTable("answerHistory", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to users table (null for guest/unauthenticated players) */
  userId: int("userId"),
  /** The player's display name at time of submission */
  playerName: varchar("playerName", { length: 128 }).notNull(),
  /** The full sentence submitted (e.g. "紅色 佔 全部 的20%") */
  sentence: text("sentence").notNull(),
  /** Whether the AI judge marked it as correct */
  isCorrect: int("isCorrect").notNull(), // 0 = false, 1 = true
  /** AI feedback text */
  feedback: text("feedback").notNull(),
  /** Strategy used: A (statement) or B (question) */
  strategy: varchar("strategy", { length: 1 }).notNull(),
  /** Name of the context card shown during this round */
  contextCardName: varchar("contextCardName", { length: 128 }).notNull(),
  /** Context card base number */
  contextCardBase: int("contextCardBase").notNull(),
  /** Game mode: solo or battle */
  gameMode: varchar("gameMode", { length: 16 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnswerHistory = typeof answerHistory.$inferSelect;
export type InsertAnswerHistory = typeof answerHistory.$inferInsert;

/**
 * Custom user accounts for students and teachers.
 * Students use their class+number as both username and password (e.g. 3A22).
 * Teacher uses "teacher" / "teacher".
 */
export const customUsers = mysqlTable("customUsers", {
  id: int("id").autoincrement().primaryKey(),
  /** e.g. "3A22" for student, "teacher" for teacher */
  username: varchar("username", { length: 64 }).notNull().unique(),
  /** bcrypt hash of password */
  passwordHash: varchar("passwordHash", { length: 128 }).notNull(),
  /** Display name shown in game */
  displayName: varchar("displayName", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["student", "teacher"]).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomUser = typeof customUsers.$inferSelect;
export type InsertCustomUser = typeof customUsers.$inferInsert;

/**
 * Game rooms for multi-device battles.
 * Room code is a 3-digit string set by the host.
 */
export const gameRooms = mysqlTable("gameRooms", {
  id: int("id").autoincrement().primaryKey(),
  /** 3-digit room code chosen by host */
  roomCode: varchar("roomCode", { length: 8 }).notNull().unique(),
  /** Host's custom user id */
  hostUserId: int("hostUserId").notNull(),
  /** Room status */
  status: mysqlEnum("status", ["waiting", "playing", "finished"]).default("waiting").notNull(),
  /** JSON array of player info (stored as text, default empty array) */
  playersJson: text("playersJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameRoom = typeof gameRooms.$inferSelect;
export type InsertGameRoom = typeof gameRooms.$inferInsert;