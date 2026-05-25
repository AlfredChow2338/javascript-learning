# Critical Rendering Path（關鍵渲染路徑）

CRP 是瀏覽器把 **HTML + CSS + JS** 變成 **像素上屏** 的必經序列：**DOM → CSSOM → Render Tree → Layout → Paint → Composite**。優化 CRP = **縮短 FCP/LCP、減少阻塞** — 不是少寫 div，而是 **控制誰在首屏前必須下載與執行**。

### 本質一：管道各步在做什麼

- **DOM**：解析 HTML 成樹；**同步 script 無 defer/async 會阻塞** parsing。
- **CSSOM**：解析 CSS；**CSS 阻塞 Render Tree**（不含 DOM 的節點不算進 render tree）。
- **Render Tree**：DOM ∩ 可見樣式；`display:none` 不在內。
- **Layout**：算幾何（reflow）；**Paint**：填像素；**Composite**：圖層合成上屏。
- **JS 改 style/ DOM** 可能觸發 layout → paint → composite 鏈（改 `transform`/`opacity` 常只 composite）。

### 本質二：什麼在阻塞首屏

- **Render-blocking CSS**：外部 stylesheet 在 CSSOM 完成前不 paint。
- **Parser-blocking JS**：`<script>` 無 defer/async 停 HTML parse。
- **大 DOM / 深 selector / 同步 layout 讀寫** — JS 讀 `offsetWidth` 再寫 style 會 **強制 sync layout**。
- **大 LCP 元素晚到**：hero 圖、大字體、慢 API 填主內容 — 指標上 LCP 差（`performance/1-LCP首屏加載怎麼優化.md`）。

### 本質三：script 載入取捨

- **`defer`**：HTML parse 完再跑，順序保留 — **一般 app 首選**。
- **`async`**：下載完就跑，順序不保 — analytics 等獨立腳本。
- **模組 `type="module"`**：預設 defer 語意。
- **inline 大段 JS** — 阻塞 parse；能外聯 + defer 則外聯。

### 本質四：CSS 與關鍵資源

- **Critical CSS**：首屏最小樣式 inline 或 preload，其餘延後 — 減 blocking 面。
- **字體**：`font-display: swap` 避免 FOIT；preload 關鍵 woff2。
- **preload / preconnect**：LCP 圖、字體、關鍵 API 域名 — **preload 只給真的 critical**，否則搶頻寬。

### 本質五：減 layout / paint 成本

- **批量 DOM/CSS 變更**；讀寫分離避免 layout thrashing。
- **動畫用 `transform` / `opacity`**，促進 composite layer。
- **content-visibility / contain**（進階）：長頁 off-screen 少算。

### 與其他筆記的關係

- **`web/5-http-cache原理.md`**：少 RTT → 更快拿到阻塞資源。
- **`performance/2-如何優化code-spliting.md`**：少 JS parse/compile 時間 → 更快 TTI。
- **`web/10-service-worker原理.md`**：SW 可 intercept 請求改 CRP 資源到達時序 — 另一層優化。

### 常見陷阱

- **CSS 放 body 底以為不阻塞** — 仍阻塞 render，只是晚發現。
- **defer 的 script 依賴 DOM 前元素** — 順序仍要在 DOM 就緒後。
- **只優化 bundle 不優化 LCP 元素** — Lighthouse LCP 仍差。
- **第三方 script 無 async** — 拖垮整站 CRP。

### 小結

- **問題**：首屏要等 DOM、CSSOM、關鍵 JS 與 LCP 資源。
- **手段**：defer/module、critical CSS、preload LCP、減阻塞 script、減 layout thrashing。
- **結果**：FCP/LCP 提前；互動（TTI）還受 JS 體積與 hydration 影響，CRP 只管 **第一次看見與穩定繪製**。
