# 如何用 Claude Code agentic 工作流做 AI 代碼量化驗收

`3-怎樣審核驗收AI代碼.md` 要求看需求覆蓋率、交互匹配、異常分支、樣式兼容、冗餘、安全、高危場景，並對照需求／設計／歷史 bug／規範，最後分出**可用、待改、風險無效**代碼。憑感覺掃 diff 做不到；要靠 **固定輸入物 + 只讀多角色審核 + 三類輸出表 + CI**，用 Claude Code 把流程鎖成可重跑。

### 本質一：七個指標各自要什麼「證據」

Agent 產出的不是感想，而是**可核對的證據**（檔案路徑、行號或符號）：

- **需求覆蓋率**：需求條目 ↔ 檔案／元件／路由 對照表，標 **已實現 / 部分 / 缺失**。
- **交互邏輯匹配度**：與設計稿一致的 **狀態機**（loading、empty、error、disabled、無權限）。
- **異常分支覆蓋率**：每條 API、表單、路由的 **失敗路徑** 是否處理、是否有測試。
- **樣式兼容性**：斷點、觸控、iOS 字體 16px、Safari 等 **勾選清單**。
- **冗餘代碼率**：重複元件、未使用 export、可刪檔 **列表**（可接 ESLint / dead code）。
- **安全風險率**：XSS、敏感資料進 storage、CSP、`pnpm audit` **逐項**。
- **高危場景覆蓋**：支付、權限、大列表、上傳等 **專項報告**。

**三類代碼**（可用 / 待改 / 風險無效）是上述證據的匯總，不是主觀標籤；每項要寫 **對不上哪條需求或哪條歷史坑**。

### 本質二：Claude Code 固定五步（與 Plan → Feature 實作對齊）

```text
需求/設計/規範/歷史 bug → Plan（只讀）→ Implement（寫碼）
                              ↓
                    Audit（只讀多子任務）→ Triage（三類代碼表）
                              ↓
                    人工 + CI → 合併
```

- **上下文一次配置**：`CLAUDE.md`（或 `.clauderules`）+ `docs/acceptance/`（`requirements.md`、`design-notes.md`、`regression-checklist.md`、`frontend-standards.md`）。沒有四件套，agent 只能「看起來像對」。
- **Plan 只讀**：先產 **驗收矩陣**（AC 編號 → 預計路徑、七層必查項、本需求是否含高危），再允許寫碼。
- **Implement 按 feature 切片**：每 PR 只一塊，描述貼該片驗收子集；禁止無關重構（同 `2-如何解決AI生成代碼混亂.md` 全局約束）。
- **Audit 只讀多子任務**（可並行），每條結論必須 **檔案:行或符號**；對照 `regression-checklist.md` 逐條勾選。
- **Triage**：主 session 合併四份報告 → **可用 / 待改 / 風險無效** 三表 + 修復建議。

| 子任務 | 做什麼 | 對應指標 |
|--------|--------|----------|
| Spec auditor | 讀需求 + `git diff` + 路由／頁面 | 需求覆蓋、交互匹配 |
| Edge-case auditor | 搜 `catch`、`error`、`loading`、表單 schema | 異常分支、部分交互 |
| Frontend quality | ESLint、tsc、重複、死碼 | 冗餘、規範 |
| Security & perf | XSS、storage、大列表、`audit` | 安全、高危 |

### 本質三：用 Claude Code 機制鎖死可重複跑

- **Slash command**（如 `/audit-ai-pr`）：讀 `docs/acceptance/*` + diff → 跑 4 auditor → 輸出 `AUDIT.md`；有 **風險無效** 可設非 0 退出碼接 CI。
- **Skill**（`ai-code-acceptance`）：內嵌七指標、四件套路徑、三類定義、**禁止無證據通過**。
- **Hooks**：pre-commit 跑 lint／test；若改到 `payment/`、`auth/` 自動提醒 Security auditor。
- **分工**：CI 做機械（ESLint、tsc、test、audit）；agent 做語義（需求↔實作、設計狀態、歷史回歸）；**人**做最終合併決策。
- **MCP（可選）**：Figma → 交互／樣式對照；Jira／Notion → AC；Playwright → 關鍵路徑快照。

### 審核 Prompt 骨架（可做成 command）

```text
你是只讀驗收 agent。輸入：docs/acceptance/*、git diff、PR 描述。

逐項評估並給證據（檔案:行）：
1. 需求覆蓋  2. 交互匹配  3. 異常分支  4. 樣式兼容
5. 冗餘  6. 安全  7. 高危場景

對照 regression-checklist.md。

輸出：可用 / 待改 / 風險無效（含理由與修議）。
禁止改碼。禁止無證據「通過」。
```

### 與 `3-怎樣審核驗收AI代碼.md` 落地段的關係

- **工具批量校驗**（ESLint、樣式、兼容）→ CI + pre-commit；agent **只讀結果**貼進報告。
- **人工復核高危**（支付、表單、權限、大列表）→ Audit 預設 **不可標為可用**，至多「待改」。
- **沉澱提示詞** → 每次「風險無效」原因回寫 `regression-checklist.md` 與 `CLAUDE.md`。
- **上線鏈路**：AI 初稿 → agent+人 Audit → 代碼評審 → 上線；**禁止 AI 原生代碼直上 prod**。

### 小結

- **問題**：AI 快、表面全，邊界／安全／性能常漏；憑感覺審核不可靠。
- **手段**：Claude Code = Plan 驗收矩陣 → 分 feature 實作 → 只讀四角色 Audit → 三類 Triage；四件套文檔 + command／skill + CI。
- **結果**：七指標有可追溯證據；合併變成「合可用、改待改、砍無效」，而非頁面能點就算過。
