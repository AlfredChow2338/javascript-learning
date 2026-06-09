# 熱門常用的 JavaScript Web Frontend Agent Skills

AI 寫前端容易「能跑但醜、能跑但慢、能跑但漏狀態」——問題不在模型能力，而在**沒有固定驗收標準與設計約束**。Skills 是 `SKILL.md` 形式的領域指令包：在相關任務時注入 context，把 agent 從泛用 coding 拉回到**可重複的前端工程與設計紀律**。下面按「設計質量」與「開發質量」分組；本機已裝的標註 ✓。

### 本質一：設計質量 — 避免 AI 味 UI、補 a11y/UX 盲區

- **`frontend-design`（Anthropic）** — 生成 UI 前先定 aesthetic direction（字體、色、動效、空間），明確避開 Inter/Roboto + 千篇一律 card grid；適合 landing、marketing、需要「有記憶點」的介面。
- **`web-design-guidelines` ✓（Vercel）** — 用 100+ 條 Web Interface Guidelines 審 UI：spacing、typography、focus、keyboard、a11y；適合「review my UI / audit design」而非從零生成。
- **`impeccable`** — 分 brand / product 兩模式，用 `bolder`、`quieter`、`layout` 等命令微調已有 UI；適合 dashboard、內部工具這類 product UI。
- **`accesslint` / a11y 類** — 專查 WCAG、對比度、語意標籤；設計稿對了但 HTML 錯了時最有用。
- **`figma-implement-design`** — 設計稿 → 程式碼對齊；減少「看起來像設計、量起來不對」的 drift。

**為什麼要裝：** 沒有 design skill，agent 預設走安全模板 → 全站長一樣；有 skill 才會在**寫碼前**先約束視覺與交互底線。

### 本質二：開發質量 — 性能、架構、可測、可維護

- **`vercel-react-best-practices` ✓** — React/Next 性能規則（fetch 時機、bundle、re-render）；改 list、data fetching、SSR 時觸發。
- **`vercel-composition-patterns` ✓** — compound components、減 boolean prop 爆炸；元件庫或共用 Table/Modal 變複雜時用。
- **`webapp-testing` / Playwright 類** — 真瀏覽器 E2E：loading / empty / error 是否如設計；對照 `3-如何用claude-code-agentic工作流做AI代碼量化驗收.md` 的「交互狀態機」驗收。
- **`code-reviewer` 類** — 只讀審 diff：簡化、冗餘、規範；可接 ESLint / tsc 結果當證據。
- **`create-rule` ✓ / `create-skill` ✓** — 把團隊慣例（目錄結構、命名、禁止 pattern）固化成 rule/skill；否則每個 session 都要重講。

**為什麼要裝：** 前端 bug 常是**狀態與邊界**（空列表、401、慢網路），不是語法；performance + composition + E2E skills 對應不同 failure mode。

### 本質三：工作流 — 讓 skills 真的提升「交付質量」

- **`find-skills` ✓** — `npx skills find [query]` 或 [skills.sh](https://skills.sh/) 搜生態；先找現成 skill 再自建。
- **`babysit` ✓** — PR 評論、CI、衝突 triage；合併前最後一道。
- **`canvas` ✓** — 分析型產出（對照表、audit 結果）用可視 layout，少 dump markdown 表。
- **與 agentic 驗收筆記的關係** — Skills 定義**怎麼寫/怎麼審**；`3-如何用claude-code-agentic工作流做AI代碼量化驗收.md` 定義**七指標 + 三類代碼 + CI**。設計類 skill → 交互匹配、樣式兼容；工程類 skill → 冗餘、高危場景；**兩者疊加**才不是「好看但不能合併」。

### 怎麼選（取捨，不是全裝）

| 你現在的痛 | 優先 skill |
|-----------|-----------|
| UI 像模板、沒個性 | `frontend-design` |
| UI 已有，要對標準 / a11y | `web-design-guidelines` ✓ |
| 大列表、Next 慢 | `vercel-react-best-practices` ✓ |
| 元件 props 失控 | `vercel-composition-patterns` ✓ |
| AI 代碼不敢合 | `webapp-testing` + agentic 驗收流程 |
| 不知道還有什麼 | `find-skills` ✓ → skills.sh |

安裝：`npx skills add <repo> --skill <name>`；詳見 [skills.sh](https://skills.sh/)。

### 小結

- **問題**：AI 前端預設「能跑」但不保設計、性能、狀態、可維護。
- **手段**：按場景掛 design / engineering / workflow 三類 skills，並用固定驗收鎖交付。
- **結果**：同樣 prompt，產出從 demo 級升到**可 review、可測、可合併**的 frontend。
