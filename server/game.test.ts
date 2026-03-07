import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

const sampleContextData = {
  red: 20,
  yellow: 30,
  blue: 50,
  base: 100,
};

describe("game.judgeSubmission", () => {
  it("returns a valid result object with required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.game.judgeSubmission({
      sentence: "紅色是全部的20%",
      contextData: sampleContextData,
    });

    expect(result).toHaveProperty("isValid");
    expect(result).toHaveProperty("strategy");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("feedback");
    expect(typeof result.isValid).toBe("boolean");
    expect(["A", "B", "NONE"]).toContain(result.strategy);
    expect(typeof result.score).toBe("number");
    expect(typeof result.feedback).toBe("string");
  }, 30000);
});

describe("game.getNpcMove", () => {
  it("returns a valid NPC move object with required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const sampleHand = [
      { type: "color", value: "red", label: "紅色" },
      { type: "word", value: "是", label: "是" },
      { type: "word", value: "全部", label: "全部" },
      { type: "word", value: "的", label: "的" },
      { type: "n", value: "20", label: "20" },
      { type: "word", value: "%", label: "%" },
    ];

    const result = await caller.game.getNpcMove({
      hand: sampleHand,
      contextData: sampleContextData,
      difficulty: "MEDIUM",
    });

    expect(result).toHaveProperty("action");
    expect(result).toHaveProperty("strategy");
    expect(result).toHaveProperty("cardIndices");
    expect(result).toHaveProperty("wildValues");
    expect(result).toHaveProperty("reasoning");
    expect(["BATTLE", "DISCARD"]).toContain(result.action);
    expect(Array.isArray(result.cardIndices)).toBe(true);
  }, 30000);
});
