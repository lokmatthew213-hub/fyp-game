const POE_API_KEY = "ltlR246-T-Uo3dZOySLphdQgOl_BEEyFw6FWhHXtIt8";
const POE_ENDPOINT = "/api/poe/chat/completions";
const MODEL_NAME = "gemini-3-flash";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const extractJSON = (text) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (innerError) {
                throw new Error("Found JSON-like block but it is malformed.");
            }
        }
        throw new Error("No JSON found in response.");
    }
};

export const judgeSubmission = async (sentence, contextData, retries = 5) => {
    // Build color description from context data (supports 2 or 3 color segments)
    const colorParts = [];
    if (contextData.red   != null) colorParts.push(`紅色有 ${contextData.red} 格`);
    if (contextData.yellow != null) colorParts.push(`黃色有 ${contextData.yellow} 格`);
    if (contextData.blue  != null) colorParts.push(`藍色有 ${contextData.blue} 格`);
    const colorDesc = colorParts.join('，');
    const totalDesc = contextData.base ?? contextData.total ?? 100;

    const systemMessage = `
你是一個小學數學老師助手，正在判斷學生的百分數卡牌遊戲答案是否正確。請用中文回答。

【情境地圖】
${colorDesc}，總共 ${totalDesc} 格。

【情境數據（供計算核對）】
- 紅色 (Red): ${contextData.red ?? 'N/A'}
- 黃色 (Yellow): ${contextData.yellow ?? 'N/A'}
- 藍色 (Blue): ${contextData.blue ?? 'N/A'}
- 總數 (Total): ${totalDesc}

【判斷標準】
學生需要用手中的卡牌拼出一條完整的百分數算式或問題。

✅ 策略 A（火力全開 — 答案形式）：以下兩種都算合格：

  形式一（算式形式）：A/B × 100%
  例如：「紅色佔全部的 20/100 × 100%」
  例如：「紅色是藍色的 25/10 × 100%」
  例如：「紅色加黃色佔全部的 25/100 × 100%」
  — 如果學生寫了 A/B × 100% 的形式，即使沒有最終答案也算合格

  形式二（答案形式）：必須標明兩個物件的關係 + 百分比結果
  例如：「紅色佔全部的 20%」（必須有兩個物件的關係）
  例如：「紅色是藍色的 250%」
  — 必須包含「的」字在結果前面（例如：「全部的 20%」、「藍色的 250%」）

✅ 策略 B（設下陷阱 — 問題形式）：以下兩種都算合格：

  形式一：包含顏色詞 + 明確的百分數問題
  例如：「紅色是全部的百分之幾？」
  例如：「紅色是藍色的百分之幾？」
  — 必須包含「的」字在「百分之幾？」前面

  形式二：包含顏色詞 + 問號卡（?）
  例如：「紅色 是 藍色 的 ?」
  — 必須有明確的兩個物件關係

❌ 不合格的情況：
- 只說「紅色是 75%」而沒有說明是「佔什麼的」75% ❌
- 完全沒有顏色詞（紅色/黃色/藍色）❌
- 數字計算明顯錯誤（例如 20/100 說成 30%）❌
- 沒有任何數字 ❌
- 同一顏色相加（例如「藍色 + 藍色」）❌
- 問題沒有明確的兩個物件關係（例如「藍色 百分之幾？」）❌

重要提示：
- 小學生用卡牌拼出算式，卡牌可能是橫排的，請靈活判斷
- 數字必須與情境地圖相符
- 如果總數不是 100，學生需要擴分或約分，請接受正確的計算結果
- 如果分子大於分母（答案超過 100%），這是合法的，請接受

請根據以上規則判斷學生提交的句子。

回應格式（必須是純 JSON，不要加 markdown 代碼塊）：
{
  "isValid": true 或 false,
  "strategy": "A" 或 "B" 或 "NONE",
  "score": 數字（合格時為 1，不合格為 0）,
  "feedback": "用友好的中文向小學生解釋判斷結果（2-3 句，說明合格或不合格的原因，不要包含 JSON 或程式碼）"
}
`;

    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(POE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${POE_API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        { role: 'system', content: systemMessage },
                        { role: 'user', content: `學生提交的句子：「${sentence}」` }
                    ]
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const content = data.choices[0].message.content;
            return extractJSON(content);
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            lastError = error;
            if (i < retries - 1) await wait(Math.pow(2, i) * 1000);
        }
    }
    throw lastError || new Error("Failed to communicate with AI Judge");
};

export const getNpcMove = async (hand, contextData, difficulty = 'MEDIUM', retries = 3) => {
    const colorParts = [];
    if (contextData.red   != null) colorParts.push(`Red (紅色): ${contextData.red}`);
    if (contextData.yellow != null) colorParts.push(`Yellow (黃色): ${contextData.yellow}`);
    if (contextData.blue  != null) colorParts.push(`Blue (藍色): ${contextData.blue}`);
    const totalDesc = contextData.base ?? contextData.total ?? 100;

    const systemMessage = `
You are a strategic AI player in the "Percent Battle" (百分戰局) educational game.

Current Context Map:
${colorParts.join('\n')}
- Total (總共): ${totalDesc}

Your Goal: Win the game by constructing valid mathematical sentences from your hand.
NPC Difficulty: ${difficulty}

Hand Cards:
${hand.map((c, i) => `${i}: [${c.type === 'n' ? 'Num' : 'Word'}: ${c.label || c.value}]`).join('\n')}

Rules for Move:
1. Strategy A (BATTLE): Form a complete answer sentence.
   Accepted forms:
   - Form 1 (equation): [Color] + relationship + [Color/全部] + 的 + [A/B × 100%]
     e.g., "紅色 是 全部 的 20/100 × 100%"
   - Form 2 (answer): [Color] + relationship + [Color/全部] + 的 + [X%]
     e.g., "紅色 是 全部 的 20%"
   - MANDATORY: Must include at least one color card (紅色/黃色/藍色)
   - MANDATORY: Must include '的' before the result
   - MANDATORY: Numbers must match the context map
   - FORBIDDEN: Same color added to itself (e.g., "藍色 + 藍色")
   - **Wild Cards**: If you use a "Wild" card:
     - If it is a Number Wild, you MUST assign it a number value (0-9).
     - If it is a Word Wild, you MUST assign it a word value (e.g. "紅色", "是", "全部的").

2. Strategy B (TRAP): Form a valid question sentence.
   Accepted forms:
   - Form 1: [Color] + relationship + [Color/全部] + 的 + 百分之幾？
     e.g., "紅色 是 藍色 的 百分之幾？"
   - Form 2: [Color] + relationship + [Color/全部] + 的 + ?
     e.g., "紅色 是 全部 的 ?"
   - MANDATORY: Must include '的' before 百分之幾？ or ?
   - MANDATORY: Must have two distinct objects

3. DISCARD: If you cannot form Strategy A or B, discard ONE card that is least useful.

Difficulty Behavior:
- **HIGH**: Calculate perfectly. Try to use as many cards as possible to maximize score. Use Wild cards optimally.
- **MEDIUM**: Play normally. You can miss complex 5+ card combinations but find standard 3-4 card sentences.
- **LOW**: Make mistakes occasionally. Prioritize discarding over complex calculations. You might miss an obvious win.

Response Format (MANDATORY JSON):
{
  "action": "BATTLE" | "DISCARD",
  "strategy": "A" | "B" | "NONE",
  "cardIndices": [number],
  "wildValues": { "index_of_wild_card": "assigned_value" }, 
  "reasoning": "Short explanation in English"
}
Example for Wild Card: If card at index 2 is Wild and you want it to be "20", "wildValues": { "2": "20" }
`;

    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(POE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${POE_API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        { role: 'system', content: systemMessage },
                        { role: 'user', content: "Generate your strategic move based on your hand and difficulty." }
                    ]
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const content = data.choices[0].message.content;
            return extractJSON(content);
        } catch (error) {
            console.error(`NPC Move Attempt ${i + 1} failed:`, error);
            lastError = error;
            if (i < retries - 1) await wait(1000);
        }
    }
    return { action: 'DISCARD', cardIndices: [0], reasoning: "API Failure fallback" };
};
