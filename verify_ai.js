
import { judgeSubmission } from './src/utils/aiJudge.js';

// Mock fetch for testing
global.fetch = async (url, options) => {
    // This is a dummy fetch, we need to use the real one or a better mock
    // But since I can't easily run ESM with fetch in a simple script without setup,
    // I will use a different approach for verification if needed.
};

const contextData = { red: 30, yellow: 50, blue: 20, total: 100 };

async function test() {
    console.log("Starting tests...");

    const cases = [
        { name: "Invalid: Pure Math", sentence: "(30+50)/100 = 80%" },
        { name: "Invalid: Missing '的'", sentence: "紅色 是 全部 30%" },
        { name: "Valid: Simple", sentence: "紅色 是 全部的 的 30%" },
        { name: "Valid: Combined", sentence: "紅色 加 黃色 是 全部的 的 80%" }
    ];

    for (const c of cases) {
        console.log(`Testing: ${c.name}`);
        try {
            const result = await judgeSubmission(c.sentence, contextData);
            console.log(`Result: ${JSON.stringify(result, null, 2)}`);
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

// test();
