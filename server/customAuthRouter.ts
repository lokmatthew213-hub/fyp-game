/**
 * Custom authentication router for student/teacher accounts.
 * Students: username = class+number (e.g. "3A22"), password = same as username.
 * Teacher: username = "teacher", password = "teacher".
 *
 * Uses a separate cookie "custom_session" (JSON: { id, username, displayName, role })
 * signed with JWT_SECRET so it survives server restarts.
 */

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getDb } from "./db";
import { publicProcedure, router } from "./_core/trpc";
import { customUsers } from "../drizzle/schema";

const CUSTOM_COOKIE = "custom_session";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

// Cookie options
function cookieOpts(req: { secure?: boolean }) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
}

// Decode custom session from cookie
function decodeSession(token: string | undefined) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      displayName: string;
      role: "student" | "teacher";
    };
  } catch {
    return null;
  }
}

// Seed teacher account if not exists
async function ensureTeacherAccount() {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(customUsers)
    .where(eq(customUsers.username, "teacher"))
    .limit(1);
  if (existing.length === 0) {
    const hash = await bcrypt.hash("teacher", 10);
    await db.insert(customUsers).values({
      username: "teacher",
      passwordHash: hash,
      displayName: "老師",
      role: "teacher",
    });
  }
}

export const customAuthRouter = router({
  /** Return current custom session user (null if not logged in) */
  me: publicProcedure.query(({ ctx }) => {
    const token = ctx.req.cookies?.[CUSTOM_COOKIE];
    return decodeSession(token);
  }),

  /** Login with username + password */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1).max(64).trim(),
        password: z.string().min(1).max(64),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { username, password } = input;

      // Ensure teacher account exists
      await ensureTeacherAccount();

      // Look up user
      const db = await getDb();
      if (!db) throw new Error("資料庫連線失敗，請稍後再試");
      const rows = await db
        .select()
        .from(customUsers)
        .where(eq(customUsers.username, username))
        .limit(1);

      if (rows.length === 0) {
        // Auto-create student account (username = password)
        const isTeacher = username === "teacher";
        if (isTeacher) {
          throw new Error("老師帳號不存在，請聯絡管理員");
        }
        // For students, auto-register: password must match username
        if (password !== username) {
          throw new Error("密碼錯誤。學生密碼與班號學號相同（例如：3A22）");
        }
        const hash = await bcrypt.hash(password, 10);
        const [inserted] = await db!.insert(customUsers).values({
          username,
          passwordHash: hash,
          displayName: username,
          role: "student",
        });
        const newId = (inserted as unknown as { insertId: number }).insertId;
        const payload = { id: newId, username, displayName: username, role: "student" as const };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
        ctx.res.cookie(CUSTOM_COOKIE, token, cookieOpts(ctx.req));
        return payload;
      }

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new Error("密碼錯誤");
      }

      const payload = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
      ctx.res.cookie(CUSTOM_COOKIE, token, cookieOpts(ctx.req));
      return payload;
    }),

  /** Logout */
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(CUSTOM_COOKIE, { path: "/" });
    return { success: true };
  }),
});
