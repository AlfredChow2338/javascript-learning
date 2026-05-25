# 大型 Web App 測試策略

大型應用的測試問題不是「有沒有寫 test」，而是 **在有限 CI 時間內，用哪一層換到多少信心**。取捨方向：**大量快且穩的 unit / 少量驗證邊界的 integration / 極少條覆蓋金流與登入的 E2E** — 倒金字塔（E2E 過多）會拖慢回饋、flaky 會讓人忽略紅燈。

### 本質一：測試金字塔為什麼是金字塔

- **問題**：每往上一層，啟動成本、執行時間、環境依賴都上升；全用 E2E 等於每次改 CSS 都跑完整瀏覽器流程。
- **比例（經驗值，非 KPI）**：Unit ~70–80%、Integration ~15–20%、E2E ~5–10% — 重點是 **數量與速度**，不是精確百分比。
- **機制**：下層失敗早、定位準；上層補「多模組 + 真實環境」與「使用者視角」的信心。
- **誤解**：100% coverage ≠ 沒 bug；coverage 是 **漏測提示**，不是品質證明。

### 本質二：三層各自驗什麼

| 層級 | 驗什麼 | 隔離程度 | 典型速度 |
|------|--------|----------|----------|
| **Unit** | 單函數、單組件行為 | Mock 外部 I/O | ms |
| **Integration** | 模組間契約（API + DB、Component + Service） | 部分真實依賴 | s |
| **E2E** | 關鍵用戶路徑（註冊→付費→登出） | 真瀏覽器 + 近真環境 | min |

- **邊界**：Unit 測「邏輯對不對」；Integration 測「接在一起會不會斷」；E2E 測「使用者能不能走完」— **同一條業務不要三層各測一遍相同細節**。

### 本質三：Unit — 快、可重複、可定位

- **測行為，不测實作**：RTL 查使用者看得見的結果（`getByRole` / `getByText`），不要 spy `setState`、不要綁死 DOM 結構 class。
- **AAA**：Arrange → Act → Assert；一個 `it` 一個斷言主題。
- **Mock 邊界**：只 mock **慢、不穩、非本測試主體** 的外部（fetch、第三方 SDK）；mock 過多 = 測的全是假設。
- **邊界條件**：空值、非法輸入、邊界數 — happy path 以外才是 bug 溫床。
- **工具**：Jest / Vitest + **React Testing Library**（React）；Vue Test Utils / `@testing-library/vue`。

### 本質四：Integration — 在「真」與「快」之間

- **適合測**：API route + DB、Repository + 真 DB、表單提交 + mock server 回應鏈。
- **環境**：獨立 **test DB / test container**；`beforeEach` 清資料 — 絕不碰 production。
- **與 E2E 分工**：註冊 API 寫入與讀回 → integration；從註冊頁填表到看到 dashboard → E2E 抽一條即可。
- **工具**：`supertest`（HTTP）、Testcontainers（DB）、MSW（前端攔 API 做組件整合）。

### 本質五：E2E — 少而精、抗 flaky

- **只覆蓋**：營收、合規、無法用下層替代的跨頁流程；細節留給 unit / integration。
- **選擇器**：`data-testid` 或 role — 避免綁 CSS class / 文案常變的 selector。
- **等待**：`waitFor` / `waitForResponse` — **禁止**固定 `sleep(5000)`。
- **隔離**：每測獨立帳號與資料；測試間不共享 state。
- **Page Object**：把 selector 與操作收斂一處，流程可讀、改 UI 少改 N 個 spec。
- **工具**：**Playwright**（多瀏覽器、CI 友好）為現代預設；Cypress 開發體驗好但生態偏 Chromium。

### 本質六：大型專案怎麼跑得動

- **目錄**：unit 可 colocate（`Button.test.tsx` 旁 `Button.tsx`）；integration / e2e 集中 `tests/`。
- **CI 分 job**：unit（每 PR）→ integration（需 DB service）→ e2e（build + start 後跑）— 失敗快的前置。
- **加速**：Jest `maxWorkers`、**`--shard`** 分片、`--onlyChanged` / `--findRelatedTests` 本地與 PR。
- **覆蓋率 gate**：全局 threshold（如 80%）+ **關鍵目錄 100%**（billing、auth utils）；不為數字寫無意義 assert。

### 本質七：快照、視覺、a11y、性能

- **Snapshot**：易 false positive、難 review — 只用在 **穩定、低邏輯** 的 markup；邏輯改測 assert，不要靠 snapshot 扛。
- **Visual regression**：Percy / Chromatic / Playwright `toHaveScreenshot` — 抓 CSS 意外；Storybook 組件級較划算。
- **a11y**：`jest-axe` 在 unit 掃 violations；E2E 可補關鍵頁 keyboard 流程。
- **Performance test**：組件 render budget — 適合 **回歸 guard**，不是取代 Lighthouse / RUM（見 `performance/1-LCP首屏加載怎麼優化.md`）。

### Flaky 與常見陷阱

- **Flaky 根因**：真實時間、未 await 的 async、測試順序污染、共用 DB、外部服務不穩 → **mock 時間**、明確等待、每測清理。
- **一個 E2E 測整條人生** → 拆成可獨立失敗的步驟或下放到 integration。
- **測實作細節** → UI 重構全紅；改測使用者可觀察行為。
- **過度 mock** → 整合問題到 production 才爆。
- **Flaky 不修** → 團隊開始 skip CI；**寧可刪或降級，不要留紅綠跳**.

### 與 AI 代碼驗收的關係

- **`ai/3如何用claude-code-agentic工作流做AI代碼量化驗收.md`**：自動化驗收偏 **靜態分析 + 測試通過率 + 覆蓋 diff**；本筆記是 **人類設計的分層測試策略** — AI 可生成 unit，但 **integration / E2E 的環境與關鍵路徑選擇** 仍需人定義。

### 小結

- **問題**：大型 app 無法靠單一測試類型又快又全。
- **手段**：金字塔分配、RTL 測行為、integration 驗契約、E2E 守金流、CI 分層與分片。
- **結果**：PR 分鐘級回饋 + 發版前對關鍵路徑有信心；coverage 與 snapshot 是工具，不是目的。
