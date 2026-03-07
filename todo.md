# 百分戰局 Percent Battle - Manus 遷移 TODO

## 後端
- [x] 建立 game.judgeSubmission tRPC 路由（Poe API AI 判斷）
- [x] 建立 game.getNpcMove tRPC 路由（NPC AI 出牌）
- [x] 將 Poe API key 安全存放在伺服器端（不暴露前端）

## 前端資料
- [x] 複製 decks.js 卡牌資料到 Manus 專案
- [x] 複製 contextCards.js 情境牌資料（10 張）到 Manus 專案

## 前端遊戲
- [x] 將 App.jsx 完整遊戲邏輯移植到 Home.tsx
- [x] 移除前端直接呼叫 Poe API 的程式碼
- [x] 改為呼叫後端 tRPC API（game.judgeSubmission, game.getNpcMove）
- [x] 保留球形計數顯示（每列 5 格）
- [x] 保留手牌縮放控制
- [x] 保留手牌拖曳排序
- [x] 保留 Battle Log 側邊欄
- [x] 保留 10 張情境地圖牌隨機抽取功能

## 測試
- [x] 測試 AI judgeSubmission 功能（策略 A 和 B）- 通過 ✅
- [x] 測試 NPC 出牌功能 - 通過 ✅
- [x] 測試 auth.logout - 通過 ✅

## 部署
- [x] 建立 checkpoint (version: 6e684d2a)
- [x] 發佈上線並提供永久網址

## iPad mini 響應式優化
- [x] 縮小玩家欄（Player Bar）高度和字體 (h-20→h-12)
- [x] 縮小手牌卡牌預設大小 (96×128→72×96, scale 1.0→0.75)
- [x] 縮小出牌槽尺寸 (w-16 h-20→w-11 h-14)
- [x] 縮小按鈕尺寸（Percent Battle 按鈕）
- [x] 縮小情境牌（Context Card）區域 (p-6→p-3, max-w-2xl→max-w-xl)
- [x] 縮小左側欄寬度 (w-64→w-36)
- [x] 縮小主內容區間距 (p-8 gap-8→p-3 gap-3)
- [x] 確保 768px 寬度下所有元素可完整顯示

## AI 判斷功能修復
- [x] 查看後端錯誤日誌：發現直接呼叫 Poe API 在 Manus 平台上失敗
- [x] 修復 gameRouter.ts：改用 Manus 內建 invokeLLM（取代直接呼叫 Poe API）
- [x] 確認前端 tRPC 呼叫正確傳遞參數
- [x] 測試 AI 判斷功能正常運作（3 tests passed）

## 改用 Poe API（Node.js OpenAI SDK 格式）
- [x] 將 POE_API_KEY 加入環境變數
- [x] 修改 gameRouter.ts 使用 openai npm 套件呼叫 https://api.poe.com/v1
- [x] 測試 Poe API 呼叫正常運作（3 tests passed）
- [x] 建立 checkpoint 並發佈

## 修復 NPC 分析策略卡住問題
- [x] 診斷根本原因：superjson 序列化深度限制導致 cardIndices 回傳 "[Max Depth]" 字串
- [x] 修復 gameRouter.ts：加入 sanitizeCardIndices() 函式確保回傳純整數陣列
- [x] 優化 getNpcMove prompt：明確要求 cardIndices 必須是純整數陣列
- [x] 測試修復：3 tests passed，cardIndices 確認為整數陣列
- [x] 儲存 checkpoint

## 修復 AI 裁判和 NPC 出牌問題
- [x] 修復 NPC prompt：禁止使用「/」作為連接詞，只允許「佔」或「是」
- [x] 修復 AI 裁判 prompt：裁判需讀取情境卡實際內容（紅點數、藍點數等），驗證答案是否符合情境
- [x] 前端傳遞完整情境卡資訊（cardName、cardDescription、segments）給裁判
- [x] 測試修復結果：3 tests passed，「/」作連接詞判為不合格，錯誤數字判為不合格，正確答案判為合格

## 三個改進功能
- [x] AI 裁判回饋加入情境卡正確答案範例（不合格時顯示「本局正確答案可以是：...」）
- [x] 策略 B 加入情境卡顏色驗證（問題中的顏色必須存在於當前情境卡）
- [x] NPC 出牌展示動畫（BATTLE 後逐張顯示卡牌進入槽位，每張間隔 0.3 秒）

## 修復情境卡 UI 問題
- [x] 修復雙百圖（200格）點陣超出卡片寬度被截斷的問題（自動調整點大小）
- [x] 將提示文字改為按燈泡按鈕才顯示，預設隱藏

## 新功能：學生作答歷史紀錄 + 情境卡翻轉動畫
- [x] 設計並建立 answer_history 資料庫表（sentence, isCorrect, feedback, contextCardName, userId, createdAt）
- [x] 建立後端 tRPC 程序：saveAnswerHistory（儲存）和 getAnswerHistory（查詢，老師可查所有人，學生只查自己）
- [x] 前端：handlePercentBattle 成功後自動儲存作答紀錄到資料庫
- [x] 加入情境卡翻轉動畫（CSS flip animation，每局開始和換牌時觸發）
- [x] 建立老師查看頁面（/history）：學生紀錄列表、常見錯誤分析
- [x] 在 App.tsx 加入 /history 路由

## 三個新功能
- [x] 自訂登入系統：學生輸入班號+學號（如 3A22）作為帳號和密碼，老師帳號 teacher/teacher
- [x] 建立 custom_users 資料庫表（username, passwordHash, role, displayName）
- [x] 建立後端 tRPC 登入/登出/查詢程序（自訂 JWT session）
- [x] 建立登入頁面（/login），登入後跳轉首頁
- [x] 手牌自動排序按鈕：一鍵將手牌排列為「數字牌在前，文字牌在後」
- [x] 多設備房間對戰：後端 WebSocket 房間管理（最多 4 人，三位數房號）
- [x] 多設備房間對戰：前端開房/加入房間頁面，即時對戰同步

## 修復房間功能問題
- [x] 修復登入狀態無法持久化（加入 cookie-parser 中間件）
- [x] 修復房間頁面：加入 loading 狀態判斷，避免在 loading 時跳轉登入頁
