## Vibe coding：Cursor、Claude Code 與生成品質

**Vibe coding**（用自然語言描述意圖，讓 AI 幫忙寫／改 code，人類負責方向與驗證）時，工具選 **Cursor** 還是 **Claude Code**、以及 **模型／提示／流程** 怎麼配，會一起影響產出品質。

下文分三部分：**Cursor vs Claude Code 應用定位**、**如何提升代碼生成質量**、以及 **Cursor 內常用模型與用量池**（模型名稱與計價以官方為準：[Cursor Models & Pricing](https://cursor.com/docs/models-and-pricing.md)；Claude Code 總覽見 [Anthropic Claude Code overview](https://docs.anthropic.com/en/docs/claude-code/overview)）。

---

### Cursor 與 Claude Code：應用與定位

兩者可以並用，重疊在「讀 repo、改多檔、跑指令」，差在 **產品形態、模型選擇、自動化場景**。

| 維度 | **Cursor** | **Claude Code** |
| --- | --- | --- |
| **本質** | **AI-first IDE**（VS Code 系）：編輯、搜尋、除錯、Agent 都在同一個 app。 | **Agentic coding 引擎**：同一套能力接到 **終端 CLI**、[VS Code／Cursor 外掛](https://docs.anthropic.com/en/docs/claude-code/overview)、Desktop、瀏覽器等多種 **surface**。 |
| **模型** | 可選 **多家 frontier**（Claude、OpenAI、Gemini、Composer、Auto 等），依方案走 **不同用量池**。 | 以 **Claude** 為主（訂閱／Console 等，[官方說明](https://docs.anthropic.com/en/docs/claude-code/overview)）；重點在 **工具與工作流** 一致，而非切換供應商。 |
| **典型強項** | **整天在編輯器裡寫 code**：inline 補全、Composer／Agent、diff 直接進工作區、和既有 VS Code 生態無縫。 | **終端與自動化**：`claude "..."` 一條指令完成多步；**git**（commit／branch／PR）、**MCP** 接 Jira／Slack、**CI**（GitHub Actions 等）、**排程任務**、**sub-agents** 協作。 |
| **專案級「記憶」** | `.cursor/rules`、`AGENTS.md` 等（依你團隊慣例）約束風格與邊界。 | 根目錄 **[`CLAUDE.md`](https://docs.anthropic.com/en/memory)**：每個 session 會讀；另有 **auto memory**、[**skills / custom commands**](https://docs.anthropic.com/en/skills)、[**hooks**](https://docs.anthropic.com/en/hooks)（例如改檔後自動 format）。 |
| **計費／用量感** | **Auto／Composer 池** vs **API 池**（見下文），換模型會明顯改變消耗速度。 | 與 **Claude 訂閱／API** 綁定；長任務、多 surface 仍共用同一套 Claude Code 能力。 |

**怎麼選場景（簡化）：**

| 場景 | 較順手的一方 |
| --- | --- |
| UI 微調、邊看檔案邊改、重度依賴 IDE 除錯 | **Cursor** 主導 |
| 大範圍重構但要 **terminal 一鍵跑測試／lint**、或要 **pipe log 進 AI** | **Claude Code CLI** 很適合 |
| 要把 **ticket／文件／Slack** 接進開發迴圈 | **Claude Code + MCP** 生態較常談 |
| 團隊已全用 Cursor、只要 Anthropic 模型 | 用 **Cursor 內建 Claude** 即可；若要 **同一套 CLAUDE.md／CLI 習慣** 延伸到 CI，可再加 **Claude Code** |
| 在 **Cursor 裡裝 Claude Code 外掛** | 兩邊並存：編輯器仍是 Cursor，agent 行為依 [Claude Code VS Code／Cursor 整合](https://docs.anthropic.com/en/docs/claude-code/overview) |

---

### 如何提升代碼生成質量（通用，兩邊都適用）

模型再強也救不了 **模糊需求** 與 **無驗證閉環**。下面按「效益／成本」排序。

**1. 把「完成定義」寫成可驗證條件**

- 輸入／輸出、錯誤行為、不要改的 **public API**、要相容的 **版本**。
- 接受測試：「跑 `pnpm test` 須全綠」「只允許改 `src/foo/**`」。

**2. 專案級約束：規則檔 + 範例**

- Cursor：`.cursor/rules` 或專案 rule，寫清 **stack、lint 規則、目錄職責**。
- Claude Code：`CLAUDE.md` 寫 **build／test 指令、架構決策、禁止事項**；複雜流程用 **custom commands**（例如 `/review-pr`）。

**3. 小步迭代，強制人類看 diff**

- 一次改一大包容易混入幻覺；拆成 **「先介面／再實作／再測試」**。
- 每步 **review diff**，比換 frontier 模型更能防回歸。

**4. 讓 AI 接到「真實回饋」**

- 本機跑 **typecheck、unit test、lint**；能跑 **e2e** 更好。
- Cursor Agent / Claude Code 都能跑 terminal：**讓失敗訊息回到下一輪 prompt**，比空談正確。

**5. 縮小 context，但保留「正確的」脈絡**

- 不要整倉無差別塞滿；用 **@ 檔案**、相關模組、或 `CLAUDE.md` 裡的 **地圖式說明**。
- 長 session 容易漂移：**新任務開新 thread** 或總結成短 bullet 再繼續。

**6. 模型／工具的分工**

- **日常**：較省方案（Cursor 的 Auto／Composer 2；或較小／較快模型）做多輪試錯。
- **卡關**：再換 **強 reasoning**（例如 Claude Opus、Premium）處理根因與架構取捨。
- 品質瓶頸常在 **規格與測試**，不在「是否永遠 Opus」。

---

### 先搞懂：Cursor 的兩個「用量池」

個人方案裡有 **兩個分開的 pool**，跟著帳單週期重置：

| 池 | 典型用途 |
| --- | --- |
| **Auto + Composer** | 選 **Auto** 或 **Composer 2** 時，有 **較多 included usage**，適合日常 **agentic coding**、偏省成本。Auto 會由 Cursor 在聰明度／成本／穩定度之間做 routing。 |
| **API** | 手動選 **指定模型**（或 **Premium routing**）時，依該模型的 **API 牌價** 計費；個人方案每月會含一筆 API 額度（階級越高越多），超出可加購。 |

實務上：**天天開 Agent** 的人常會同時在意「要不要改回 Auto／Composer 2 省用量」，以及「難題時切到 Claude Opus / Premium」。

---

### Cursor 裡最常拿來比較的核心模型（依家族）

#### 1. Cursor：**Composer 2**（＋ **Auto**）

- **Composer 2** 是 Cursor **自家**、針對 **agentic coding** 訓練的模型；和 **Auto** 一樣走 **Auto + Composer** 池，牌價上屬於「日常大量使用」取向。
- **Auto**：不固定某一個後端名字，由產品幫你 **balance** 能力與成本；適合 **不想手動試模型**、以迭代速度為優先。
- 取捨：通常 **最省 included pool、適合長開 Agent**；若任務極難或你發現「一直差最後一哩」，再考慮切到下面幾類 frontier。

#### 2. Anthropic：**Claude Sonnet** vs **Claude Opus**

在 Cursor 的 API 表裡會看到 **Claude 4.x / 4.5 / 4.6** 的 **Sonnet** 與 **Opus** 等（部分需 **Max Mode** 或預設隱藏，以你帳戶裡可選為準）。

| 取向 | 大致適合 |
| --- | --- |
| **Sonnet** | **主力開發**：實作、重構、跟 codebase pattern、多檔案修改；多數人的 **daily driver** 候選。 |
| **Opus** | **最難的推理／架構／安全審視**；通常 **更貴、更吃用量**，適合「一般模型已經繞圈」時再上。 |

兩者都可能支援 **Thinking**、**Agent**、圖像等（依 Cursor 當前選項）；**超長輸入** 時注意官方表上 **>200k tokens 可能 2x** 等條款。

#### 3. OpenAI：**GPT-5.x** 與 **GPT-5.x Codex**

- **GPT-5 / GPT-5.2** 等：偏 **通用 frontier**，強調 **agentic / reasoning**（實際可選子變體以選單為準，例如 high reasoning）。
- **GPT-5.x Codex / GPT-5.x Codex Mini** 等：名字帶 **Codex**，偏 **寫 code、跑 agent 流程**；**Mini** 通常更便宜、適合較輕量或高頻次任務。

若你本來就習慣 OpenAI 生態或想對齊某類工具行為，可在 **Sonnet / Codex** 之間 A/B 試同一個 task。

#### 4. Google：**Gemini 3 Pro**、**Flash**

- **Pro**：能力與通用任務平衡，也常拿來做多模態／較重分析。
- **Flash**：延遲與成本通常較友善，適合 **快問快答、大體草稿**。

若你的痛點是 **超長 context** 或 **整倉一起丟給模型**，可優先看 Gemini 系列在 Cursor 裡的 **Max Mode／上限** 與計價。

#### 5. 其他常見選項（視帳戶是否開啟）

- **Grok**（xAI）、**Kimi** 等：多一個 **供應商／性價比** 選項；是否顯示、是否 hidden 以 Cursor 為準。

---

### 用同一套維度快速比（在 Cursor 裡選模型時自問）

| 維度 | 代表問題 |
| --- | --- |
| **Instruction following** | 有沒有遵守「只改這幾個檔」「不要動 public API」？ |
| **Reasoning / debugging** | 給 stack trace 能否 **收斂根因**，還是亂試？ |
| **Context** | 大 repo／長 thread 會不會忘約定？需不需要 **Max Mode**？ |
| **Agent 工具鏈** | terminal / 搜尋 / patch 是否穩（這點 **Composer 2 / frontier** 通常較在意） |
| **用量** | 同樣一輪 Agent，**Opus / Premium** 往往比 **Auto／Composer 2** 快燒完額度 |

---

### 實務上怎麼配（Cursor 場景）

| 場景 | 建議取向 |
| --- | --- |
| 每天大量 Agent、迭代要快 | **Auto** 或 **Composer 2**（吃 Auto + Composer 池） |
| 一般 feature／bug，要穩定多檔修改 | **Claude Sonnet** 或 **GPT-5.x Codex**（擇一當主力） |
| 難重構、資安、演算法／並發這類 | **Claude Opus** 或 **Premium routing**（接受較高用量） |
| 超長檔案／整倉 context | 看 **Gemini Pro** + **Max Mode** 是否划算 |
| 省錢、小改、探索 | **Gemini Flash**、**GPT-5 Mini / Codex Mini** 等輕量型號 |

---

### 一句話

- **工具**：**Cursor** 適合「編輯器裡長時間寫與改」；**Claude Code** 適合「終端／自動化／MCP／CI／同一套 `CLAUDE.md` 跨環境」。兩者可同時用，不必二選一。
- **品質**：**可驗證規格 + 規則檔 + 小步 diff + 測試／lint 閉環**，比單純換最強模型更能穩定產出。
- **Cursor 模型**：日常 **Auto／Composer 2** 顧節奏與用量；卡關再 **Claude Opus** 或 **Premium**。細節以 [Cursor Models & Pricing](https://cursor.com/docs/models-and-pricing.md) 為準。
