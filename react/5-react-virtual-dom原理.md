# React Virtual DOM 是什麼、怎麼運作

口語上的 **Virtual DOM** 多半指：**用一般 JS 物件描述 UI**，再經 **reconciliation** 算出要對真實 DOM（或其他 host）做哪些最小變更。精確來說，React 16+ 內部承載協調的是 **Fiber**，元素樹是「描述」、Fiber 是「工作單位」；兩者一起才對得上現代 React 的行為。

### 本質一：樹上實際是什麼（element 不是 DOM）

- JSX 會變成 **`React.createElement(type, props, …)`**，得到的是 **plain object**：`type`（字串如 `"div"` 或你的函式元件）、`props`（含 `children`）、`key` 等；這層可當成「記憶體裡的 UI 描述」，**還不是**瀏覽器節點。
- **首次 mount**：依這棵描述建立對應的真實 DOM（或 Native 等）。
- **更新**：再 render 出一棵**新的** element 描述，和「上次協調所記住的狀態」比對，決定 reuse / patch / 整棵替換。
- **易誤解**：不是每次把「整棵展開後的 DOM」整份 diff；比對與決策發生在 **Fiber 子鏈表 + 雙緩存** 上，並帶 **effect 標記**，不是單一巨大 JSON DOM clone。

### 本質二：一次更新大致經過什麼（render → reconcile → commit）

- **Render 階段**：跑元件函式（或 class render），產生新的 element / 走 Fiber；**原則上純**、**理想上不寫 DOM**。在 Concurrent 下這段**可中斷、可丟棄重做**，讓主線程有機會處理輸入與繪製。
- **Reconciliation（協調）**：新舊對照後決定：同一位置能否沿用同一 DOM 節點、只改 props？子節點要重排還是替換？**同位置不同 type** → 通常整棵子樹卸載再掛上，成本高。**列表 `key`** → 跨重排時辨識「哪一筆是哪一筆」，錯 key 會誤 reuse、狀態錯位。
- **Commit 階段**：把算好的 **DOM 變更**套用，並依序跑 layout effect、`useEffect` 等。**不可隨便拉長**；重活應拆小更新、丟 transition、或移出主線程等。

一句話：**Virtual DOM / Fiber 決定「要改什麼」；Commit 才真正「改下去」**。

### 本質三：Virtual DOM 並不保證「比手寫 DOM 快」

- 迷思：「有 Virtual DOM 就一定快」— **不成立**。樹很大又常整片 re-render 時，**建立描述 + diff 本身也有成本**。
- React 真正換到的是：**狀態驅動的批次更新**、**用比對減少盲目碰 DOM**、**不必自己寫 diff**。最終效能仍靠元件邊界、memo、列表虛擬化、穩定 key、減少上游不必要 state 等—**機制是協調，槓桿在架構**。

### 與 Concurrent、Scheduler 的關係

- 有 **優先級**（緊急更新 vs transition 等）時，**只有把「算 UI」和「寫 DOM」拆開、並切成可排程單位**，調度才有意義；這依賴 **Fiber + 兩階段**。
- 所以現在講 Virtual DOM，實務上常是：**elements + Fiber + scheduler + commit** 同一條故事線。

### 與同目錄其他筆記的分工

- **協調規則**（同層、type、key）：見 `2-reconciliation原理.md`。
- **為什麼可中斷、雙緩存、兩階段**：見 `3-fiber原理.md`。
- 若面試追問「再深一層」：Fiber 子鏈遍歷、`useEffect` 為何在 paint 之後、與 layout effect 順序—都掛在同一套 render / commit 分割上。

### 小結

- **問題**：直接以命令式碰 DOM 難批次、難推理；大更新又易塞滿主線程。
- **手段**：用 element（＋內部 Fiber）描述 UI，協調出新舊差異，commit 再一次性套用。
- **結果**：可批次、可最小化 DOM 操作、可並發排程；**誤以為「Virtual DOM = 免費效能」則會在大型樹上踩坑**。
