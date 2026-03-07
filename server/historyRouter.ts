import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getAllAnswerHistory, getAnswerHistoryByUserId, saveAnswerHistory } from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const historyRouter = router({
  /**
   * Save one AI-judged answer to the history table.
   * Accepts both authenticated and guest players.
   * For authenticated users, userId is taken from the session.
   * For guests, userId is null and playerName is required.
   */
  save: publicProcedure
    .input(
      z.object({
        playerName: z.string().min(1).max(128),
        sentence: z.string().min(1),
        isCorrect: z.boolean(),
        feedback: z.string(),
        strategy: z.enum(["A", "B"]),
        contextCardName: z.string().min(1).max(128),
        contextCardBase: z.number().int().positive(),
        gameMode: z.string().min(1).max(16),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await saveAnswerHistory({
          userId: ctx.user?.id ?? null,
          playerName: input.playerName,
          sentence: input.sentence,
          isCorrect: input.isCorrect ? 1 : 0,
          feedback: input.feedback,
          strategy: input.strategy,
          contextCardName: input.contextCardName,
          contextCardBase: input.contextCardBase,
          gameMode: input.gameMode,
        });
        return { success: true };
      } catch (error) {
        console.error("[historyRouter] Failed to save answer history:", error);
        // Don't throw — saving history is non-critical; game should continue
        return { success: false };
      }
    }),

  /**
   * Get the current user's own answer history (newest first).
   * Requires authentication.
   */
  myHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }).optional())
    .query(async ({ ctx, input }) => {
      const rows = await getAnswerHistoryByUserId(ctx.user.id, input?.limit ?? 100);
      return rows.map(r => ({
        ...r,
        isCorrect: r.isCorrect === 1,
        createdAt: r.createdAt.getTime(),
      }));
    }),

  /**
   * Get all students' answer history. Admin/teacher only.
   */
  allHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const rows = await getAllAnswerHistory(input?.limit ?? 200);
      return rows.map(r => ({
        ...r,
        isCorrect: r.isCorrect === 1,
        createdAt: r.createdAt.getTime(),
      }));
    }),

  /**
   * Get aggregated error analysis for admin/teacher view.
   * Returns top incorrect sentences grouped by context card.
   */
  errorAnalysis: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    const rows = await getAllAnswerHistory(500);
    const incorrect = rows.filter(r => r.isCorrect === 0);

    // Group by contextCardName
    const byCard: Record<string, { count: number; examples: string[] }> = {};
    for (const row of incorrect) {
      if (!byCard[row.contextCardName]) {
        byCard[row.contextCardName] = { count: 0, examples: [] };
      }
      byCard[row.contextCardName].count++;
      if (byCard[row.contextCardName].examples.length < 3) {
        byCard[row.contextCardName].examples.push(row.sentence);
      }
    }

    return Object.entries(byCard)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([cardName, data]) => ({ cardName, ...data }));
  }),
});
