import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import OpenAI from "openai";

// ─── Poe API Client ───────────────────────────────────────────────────────────
// Using OpenAI SDK format with Poe API base URL (server-side only, key never exposed to frontend)
const getPoeClient = () => {
  const apiKey = process.env.POE_API_KEY;
  if (!apiKey) {
    throw new Error("POE_API_KEY is not configured");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.poe.com/v1",
  });
};

// ─── JSON Extractor ───────────────────────────────────────────────────────────
const extractJSON = (text: string): Record<string, unknown> => {
  try {
    return JSON.parse(text);
  } catch {
    const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    try {
      return JSON.parse(stripped);
    } catch {
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("Found JSON-like block but it is malformed.");
        }
      }
      throw new Error("No JSON found in response.");
    }
  }
};

// ─── Sanitize cardIndices ─────────────────────────────────────────────────────
const sanitizeCardIndices = (raw: unknown, maxIndex: number): number[] => {
  if (!Array.isArray(raw)) return [];
  const result: number[] = [];
  for (const item of raw) {
    const n = typeof item === "number" ? item : parseInt(String(item), 10);
    if (!isNaN(n) && n >= 0 && n <= maxIndex) {
      result.push(n);
    }
  }
  return result;
};

// ─── Input Schemas ────────────────────────────────────────────────────────────
const SegmentSchema = z.object({
  label: z.string(),
  key: z.enum(["red", "yellow", "blue"]),
  value: z.number(),
});

const ContextDataSchema = z.object({
  // Legacy numeric fields (still used for NPC)
  red: z.number().nullable().optional(),
  yellow: z.number().nullable().optional(),
  blue: z.number().nullable().optional(),
  base: z.number().optional(),
  total: z.number().optional(),
  // Full context card info (used by judge for content verification)
  cardName: z.string().optional(),
  cardDescription: z.string().optional(),
  segments: z.array(SegmentSchema).optional(),
});

const CardSchema = z.object({
  type: z.string(),
  value: z.string(),
  label: z.string().optional(),
});

// ─── Game Router ──────────────────────────────────────────────────────────────
export const gameRouter = router({
  /**
   * Judge a student's submitted sentence against the context map.
   * Returns: { isValid, strategy, score, feedback }
   */
  judgeSubmission: publicProcedure
    .input(z.object({
      sentence: z.string(),
      contextData: ContextDataSchema,
    }))
    .mutation(async ({ input }) => {
      const { sentence, contextData } = input;
      const client = getPoeClient();

      const base = contextData.base ?? contextData.total ?? 100;
      const segments = contextData.segments ?? [];

      // Build detailed segment description
      const segmentLines: string[] = [];
      for (const seg of segments) {
        const colorName = seg.key === "red" ? "紅色" : seg.key === "yellow" ? "黃色" : "藍色";
        segmentLines.push(`- ${colorName}：${seg.value} 格（佔全部的 ${seg.value}/${base} = ${Math.round(seg.value / base * 10000) / 100}%）`);
      }
      // Also compute cross-color ratios for validation
      const crossRatioLines: string[] = [];
      for (let i = 0; i < segments.length; i++) {
        for (let j = 0; j < segments.length; j++) {
          if (i !== j) {
            const a = segments[i];
            const b = segments[j];
            const aName = a.key === "red" ? "紅色" : a.key === "yellow" ? "黃色" : "藍色";
            const bName = b.key === "red" ? "紅色" : b.key === "yellow" ? "黃色" : "藍色";
            const pct = Math.round(a.value / b.value * 10000) / 100;
            crossRatioLines.push(`- ${aName} 是 ${bName} 的 ${a.value}/${b.value} = ${pct}%`);
          }
        }
      }

      // Build example correct answers for this context
      const exampleAnswers: string[] = [];
      for (const seg of segments) {
        const colorName = seg.key === "red" ? "紅色" : seg.key === "yellow" ? "黃色" : "藍色";
        const pct = Math.round(seg.value / base * 10000) / 100;
        exampleAnswers.push(`${colorName} 佔 全部 的 ${pct}%`);
      }
      for (let i = 0; i < segments.length; i++) {
        for (let j = 0; j < segments.length; j++) {
          if (i !== j) {
            const a = segments[i];
            const b = segments[j];
            const aName = a.key === "red" ? "紅色" : a.key === "yellow" ? "黃色" : "藍色";
            const bName = b.key === "red" ? "紅色" : b.key === "yellow" ? "黃色" : "藍色";
            const pct = Math.round(a.value / b.value * 10000) / 100;
            exampleAnswers.push(`${aName} 是 ${bName} 的 ${pct}%`);
          }
        }
      }
      // Valid colors in this context
      const validColors = segments.map(s => s.key === "red" ? "紅色" : s.key === "yellow" ? "黃色" : "藍色");

      const systemPrompt = `
你是一個小學數學老師助手，正在判斷學生的百分數卡牌遊戲答案是否正確。請用中文回答。

═══════════════════════════════════════
【當前情境地圖：${contextData.cardName ?? "未知"}】
${contextData.cardDescription ? `說明：${contextData.cardDescription}` : ""}
總格數：${base} 格

【各顏色的實際數量】
${segmentLines.length > 0 ? segmentLines.join("\n") : `- 紅色：${contextData.red ?? "N/A"}\n- 黃色：${contextData.yellow ?? "N/A"}\n- 藍色：${contextData.blue ?? "N/A"}`}

【合法的跨顏色比較】
${crossRatioLines.length > 0 ? crossRatioLines.join("\n") : "（無跨顏色比較）"}
═══════════════════════════════════════

【判斷標準】
學生需要用手中的卡牌拼出一條完整的百分數算式或問題。

✅ 策略 A（火力全開 — 答案形式）：以下兩種都算合格：

  形式一（算式形式）：[顏色] + 佔/是 + [顏色/全部] + 的 + [A/B × 100%]
  例如：「紅色 佔 全部 的 20/100 × 100%」
  例如：「紅色 是 藍色 的 25/10 × 100%」
  — 注意：「/」在這裡是數學分數符號（分子/分母），不是連接詞
  — 「佔」或「是」才是連接詞，學生必須使用「佔」或「是」卡牌

  形式二（答案形式）：必須標明兩個物件的關係 + 百分比結果
  例如：「紅色 佔 全部 的 20%」
  例如：「紅色 是 藍色 的 250%」
  — 必須包含「佔」或「是」作為關係詞
  — 必須包含「的」字在結果前面

✅ 策略 B（設下陷阱 — 問題形式）：以下兩種都算合格：

  形式一：包含顏色詞 + 「佔/是」 + 「的」 + 「百分之幾？」
  例如：「紅色 是 全部 的 百分之幾？」
  例如：「紅色 是 藍色 的 百分之幾？」

  形式二：包含顏色詞 + 「佔/是」 + 「的」 + 問號卡（?）
  例如：「紅色 是 藍色 的 ?」

  ⚠️ 策略 B 的顏色限制：問題中提到的顏色必須存在於當前情境地圖！
  當前情境地圖只有這些顏色：${validColors.join('、')}
  如果問題中提到了情境地圖沒有的顏色，判為不合格。

❌ 不合格的情況：
- 使用「/」作為連接詞（例如「紅色 / 全部 的 百分之幾」）❌ — 「/」只能是數學分數符號
- 缺少「佔」或「是」關係詞（例如「紅色 全部 的 20%」）❌
- 只說「紅色是 75%」而沒有說明是「佔什麼的」75%（缺少第二個物件）❌
- 完全沒有顏色詞（紅色/黃色/藍色）❌
- 數字與情境地圖不符（例如情境只有 20 格紅色，卻說「紅色佔全部的 30%」）❌
- 沒有任何數字（策略 A 必須有數字）❌
- 同一顏色相加（例如「藍色 + 藍色」）❌
- 問題沒有明確的兩個物件關係（例如「藍色 百分之幾？」）❌
- 策略 B 中提到了情境地圖沒有的顏色（例如情境只有紅色和藍色，卻問「黃色 是 全部 的 百分之幾？」）❌

【數字驗證規則】（非常重要！）
- 學生使用的數字必須來自情境地圖的實際數據
- 合法的數字包括：各顏色的格數、總格數、以及正確計算的百分比結果
- 如果總數不是 100，學生需要擴分或約分，請接受正確的計算結果
- 如果分子大於分母（答案超過 100%），這是合法的，請接受
- 如果學生使用了情境地圖中不存在的數字（例如情境沒有 200 格紅色，卻說「紅色佔全部的 200%」），判為不合格

重要提示：
- 小學生用卡牌拼出算式，卡牌可能是橫排的，請靈活判斷語序
- 如果學生的句子語法正確且數字符合情境，即使語序稍有不同也可接受

【本局正確答案範例】（供回饋參考）
${exampleAnswers.slice(0, 4).map((a, i) => `${i + 1}. ${a}`).join('\n')}

回應格式（必須是純 JSON，不要加 markdown 代碼塊）：
{
  "isValid": true 或 false,
  "strategy": "A" 或 "B" 或 "NONE",
  "score": 數字（合格時為 1，不合格為 0）,
  "feedback": "用友好的中文向小學生解釋判斷結果（2-3 句）。如果不合格，必須在回饋末尾加上：『本局正確答案可以是：[從上方範例中選一個最接近的]』"
}
`;

      const response = await client.chat.completions.create({
        model: "gemini-3-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `學生提交的句子：「${sentence}」\n\n請根據上方情境地圖的實際數據判斷這個句子是否正確。` },
        ],
      });

      const content = response.choices[0].message.content ?? "{}";
      const result = extractJSON(content);
      return result as { isValid: boolean; strategy: string; score: number; feedback: string };
    }),

  /**
   * Get NPC's strategic move based on hand and context.
   * Returns: { action, strategy, cardIndices, wildValues, reasoning }
   */
  getNpcMove: publicProcedure
    .input(z.object({
      hand: z.array(CardSchema),
      contextData: ContextDataSchema,
      difficulty: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
    }))
    .mutation(async ({ input }) => {
      const { hand, contextData, difficulty } = input;
      const client = getPoeClient();

      const colorParts: string[] = [];
      if (contextData.red != null) colorParts.push(`Red (紅色): ${contextData.red}`);
      if (contextData.yellow != null) colorParts.push(`Yellow (黃色): ${contextData.yellow}`);
      if (contextData.blue != null) colorParts.push(`Blue (藍色): ${contextData.blue}`);
      const totalDesc = contextData.base ?? contextData.total ?? 100;

      // Build a clear hand description with explicit indices
      const handDesc = hand.map((c, i) => {
        const typeLabel = c.type === "n" ? "Num" : "Word";
        return `Index ${i}: [${typeLabel}: ${c.label || c.value}]`;
      }).join("\n");

      const systemPrompt = `
You are a strategic AI player in the "Percent Battle" (百分戰局) educational game.

Current Context Map:
${colorParts.join("\n")}
- Total (總共): ${totalDesc}

Your Goal: Win the game by constructing valid mathematical sentences from your hand.
NPC Difficulty: ${difficulty}

Hand Cards (use the Index numbers in cardIndices):
${handDesc}

═══════════════════════════════════════
SENTENCE STRUCTURE RULES:
═══════════════════════════════════════

Strategy A (BATTLE — Answer form):
  Form 1 (equation): [Color] + [佔 OR 是] + [Color/全部] + 的 + [Number/Number × 100%]
    Example: 「紅色 佔 全部 的 20/100 × 100%」
    Example: 「紅色 是 藍色 的 25/10 × 100%」

  Form 2 (answer): [Color] + [佔 OR 是] + [Color/全部] + 的 + [X%]
    Example: 「紅色 佔 全部 的 20%」
    Example: 「紅色 是 藍色 的 250%」

Strategy B (TRAP — Question form):
  [Color] + [佔 OR 是] + [Color/全部] + 的 + 百分之幾？ OR ?
    Example: 「紅色 是 全部 的 百分之幾？」

═══════════════════════════════════════
CRITICAL LANGUAGE RULES:
═══════════════════════════════════════
✅ ALLOWED relationship words: 「佔」 or 「是」 ONLY
❌ FORBIDDEN: Using 「/」 as a relationship/connector word between color and object
   — 「/」 is ONLY allowed inside a fraction like 「20/100」
   — WRONG: 「紅色 / 全部 的 百分之幾」
   — CORRECT: 「紅色 佔 全部 的 百分之幾」

MANDATORY requirements:
- Must include at least one color card (紅色/黃色/藍色)
- Must include 「佔」 or 「是」 as the relationship word
- Must include 「的」 before the result
- Numbers must match the context map
- FORBIDDEN: Same color added to itself

═══════════════════════════════════════

Difficulty: ${difficulty === "HIGH" ? "Calculate perfectly, use as many cards as possible." : difficulty === "MEDIUM" ? "Play normally, find standard 3-4 card sentences." : "Make mistakes occasionally, prefer discarding."}

CRITICAL RESPONSE RULES:
- cardIndices MUST be a JSON array of plain integers (e.g. [0, 2, 4])
- NEVER use nested arrays or objects inside cardIndices
- For DISCARD action, cardIndices should have exactly ONE integer (the index to discard)
- wildValues keys must be string representations of the position in the played sequence (e.g. "0", "1")

Response Format (MANDATORY pure JSON, no markdown, no code blocks):
{
  "action": "BATTLE" or "DISCARD",
  "strategy": "A" or "B" or "NONE",
  "cardIndices": [0, 1, 2],
  "wildValues": {},
  "reasoning": "Short explanation"
}
`;

      try {
        const response = await client.chat.completions.create({
          model: "gemini-3-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate your strategic move now. Remember: cardIndices must be a flat array of plain integers only. Use 「佔」 or 「是」 as relationship words, NEVER use 「/」 as a connector." },
          ],
        });

        const content = response.choices[0].message.content ?? "{}";
        const raw = extractJSON(content);

        const maxIdx = hand.length - 1;
        const safeCardIndices = sanitizeCardIndices(raw.cardIndices, maxIdx);

        const action = typeof raw.action === "string" ? raw.action : "DISCARD";
        const strategy = typeof raw.strategy === "string" ? raw.strategy : "NONE";
        const finalIndices = safeCardIndices.length > 0 ? safeCardIndices : [0];

        const rawWild = raw.wildValues;
        const safeWildValues: Record<string, string> = {};
        if (rawWild && typeof rawWild === "object" && !Array.isArray(rawWild)) {
          for (const [k, v] of Object.entries(rawWild)) {
            if (typeof v === "string") safeWildValues[String(k)] = v;
          }
        }

        const reasoning = typeof raw.reasoning === "string" ? raw.reasoning : "AI move";

        return {
          action,
          strategy,
          cardIndices: finalIndices,
          wildValues: safeWildValues,
          reasoning,
        };
      } catch (err) {
        console.error("getNpcMove Poe API error:", err);
        return {
          action: "DISCARD",
          strategy: "NONE",
          cardIndices: [0],
          wildValues: {},
          reasoning: "API Failure fallback - discarding first card",
        };
      }
    }),
});
