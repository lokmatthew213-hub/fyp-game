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
    const systemMessage = `
You are an expert math teacher and judge for the "Percent Battle" (百分戰局) educational game for Primary 6 students.
Your task is to validate a student's mathematical sentence based on the current context data.

Context Data (情境地圖):
- Red (紅色): ${contextData.red}
- Yellow (黃色): ${contextData.yellow}
- Blue (藍色): ${contextData.blue}
- Total (總共): ${contextData.total}

Rules (STRICTLY ENFORCED):
1. **MANDATORY COLOR USAGE**: The sentence MUST include at least one color name: **紅色**, **黃色**, or **藍色**. 
   - A sentence that only contains numbers and symbols (e.g., "(30+50)/100 = 80%") is **INVALID**.
2. Strategy A (火力全開 - Answer): A complete mathematical statement. Pattern: [Subject] + [Relationship] + [Object] + 的 + [Result].
   - MANDATORY: The character **'的'** MUST be present before the result.
   - Example: "紅色 是 全部的 **的** 20 %" (Correct). "紅色 是 全部 20 %" (INVALID - missing '的').
   - Results must match Map Data exactly.
3. Strategy B (設下陷阱 - Question): A question sentence. Pattern: [Subject] + [Relationship] + [Object] + 的 + [百分之幾?/?].
   - MANDATORY: The character **'的'** MUST be present before '百分之幾?' or '?'.
   - Example: "紅色 是 藍色 **的** 百分之幾?" (Correct). "紅色 是 藍色 百分之幾?" (INVALID - missing '的').
4. LOGICAL VALIDITY:
   - If an equation uses multiple colors (e.g. A + B), they MUST be **DIFFERENT** colors. "藍色 + 藍色" is LOGICALLY INVALID. 
   - Nonsense questions like "藍色 + 藍色 的 百分之幾?" are strictly INVALID.
5. CONTEXT RELEVANCE:
   - Data: Red: ${contextData.red}, Yellow: ${contextData.yellow}, Blue: ${contextData.blue}, Total: ${contextData.total}.
   - Calculations must be mathematically correct.

Goal: The student should learn the complete logic, relating color parts to percentage numbers in a full sentence.

Response Format (MANDATORY): Respond ONLY with a valid JSON object.
{
  "isValid": boolean,
  "strategy": "A" | "B" | "NONE",
  "score": number,
  "feedback": "A short, sharp explanation in Traditional Chinese. If rejected, clearly state which rule was broken (e.g. missing color name, missing '的', wrong math)."
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
                        { role: 'user', content: `Submission: "${sentence}"` }
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
    const systemMessage = `
You are a strategic AI player in the "Percent Battle" educational game.
Current Context Map:
- Red: ${contextData.red}
- Yellow: ${contextData.yellow}
- Blue: ${contextData.blue}
- Total: ${contextData.total}

Your Goal: Win the game by constructing valid mathematical sentences from your hand.
NPC Difficulty: ${difficulty}

Hand Cards:
${hand.map((c, i) => `${i}: [${c.type === 'n' ? 'Num' : 'Word'}: ${c.label || c.value}]`).join('\n')}

Rules for Move:
1. Strategy A (BATTLE): Form a complete answer sentence (Subject + Relationship + Result). e.g., "紅色 是 全部的 20 %". 
   - You MUST include at least one color card (紅色/黃色/藍色).
   - You MUST include the correct percentage result.
   - **Wild Cards**: If you use a "Wild" card:
     - If it is a Number Wild, you MUST assign it a number value (0-9).
     - If it is a Word Wild, you MUST assign it a word value (e.g. "紅色", "是", "全部的").
2. Strategy B (TRAP): If you have the "百分之幾?" card, form a question. e.g., "紅色 是 藍色 的 百分之幾?" or use "?" directly.
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
