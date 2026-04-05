## Vibe coding 核心模型比較

**Vibe coding**（常見說法來自 flow state：用自然語言描述意圖，讓 AI 幫忙寫／改 code，人類負責方向與驗證）時，選哪一類 **LLM** 會直接影響：一次能不能改對、要不要來回 debug、以及成本與延遲。下面用「可比較的維度」整理，而不是逐家產品背規格表——因為 frontier 模型半年一換，但 trade-off 結構相對穩定。

### 先定義要比較什麼

| 維度 | 代表問題 |
| --- | --- |
| **Instruction following** | 有沒有照你的步驟、檔案邊界、不要動的區域做？ |
| **Reasoning / debugging** | 錯誤 stack trace、跨檔案因果能不能一次收窄？ |
| **Context & recall** | 大 repo、長對話裡會不會「忘記」剛才的約定？ |
| **Tool use** | 會不會穩定用 terminal、grep、apply patch，還是紙上談兵？ |
| **Hallucination** | API、import、型別是否捏造？ |
| **Latency & cost** | 互動節奏與 token 預算（長 context 特別貴）。 |

實務上 **沒有單一「最強」**，而是依任務選 **frontier vs fast**、以及你的 **editor / agent** 有沒有把工具鏈接好。

### 三種「角色」比較（比具體型號穩定）

**1. Frontier reasoning（最貴、最慢、最適合難題）**

- 長鏈推理、重構、安全敏感邏輯、不熟悉的 stack。
- 優點：較少「看似合理但錯在根上」的解法。
- 缺點：latency 高；若沒有清晰 spec，容易 over-engineer。

**2. Balanced coding（多數日常開發的 sweet spot）**

- 實作 feature、改 bug、寫測試、照既有 pattern 延伸。
- 多數 IDE 裡的「預設強模型」落在這一帶。
- 重點看：**與你專案語言／框架的對齊**（同一個模型在不同生態表現可以差很多）。

**3. Fast / cheap（補全、小改、草稿）**

- 命名、格式化、單檔小改、exploration。
- 優點：回應快、便宜。
- 缺點：跨檔案一致性差；容易需要人類補刀。

### Vibe coding 場景怎麼配

| 場景 | 建議取向 |
| --- | --- |
| 新功能從 0 到可 merge | Frontier 或強 balanced + 清楚 acceptance criteria |
| 跟著現有 pattern 加一支 API | Balanced 通常夠；必要時 frontier 看 edge case |
| 只看錯誤訊息找 root cause | 偏 reasoning；順便把 **repro steps** 一併貼上 |
| 大量機械改動（rename、搬檔） | Fast + **強制 review diff**；或 IDE refactor 優先 |
| 資安／金流／權限 | Frontier + 人類 review + 測試；不要省在模型上 |

### 降低「模型差異」帶來的變數

- **把意圖寫成可驗證的條件**（輸入／輸出、不要改的文件、完成定義），比換模型更有效。
- **小步提交**：每輪改動範圍小，任何模型都比較不容易跑偏。
- **讓 AI 能跑測試／linter**：工具鏈一致時，frontier 與 balanced 的差距會縮小（錯誤會被快速打臉）。

### 一句話

**Vibe coding 選模型，本質是在 latency、成本、與「一次做對的機率」之間取捨；** 規格與測試越清楚，越不需要每次都上最貴的 frontier。
