# Web Worker 原理

Web Worker 在 **獨立線程** 跑 JS，與 **主線程（UI）** 並行，經 **`postMessage`** 通訊。取捨是 **主線程不卡** ↔ **無 DOM/BOM、序列化開銷、不能共享 mutable 狀態** — 適合 **CPU 重活**，不是萬用多線程。

### 本質一：為什麼需要

- **問題**：大 filter/sort、加解密、圖像處理在主線程跑 → **長 task** 堵死輸入、動畫、CRP。
- **機制**：Worker 內無 `document`/`window`（有 `self`）；計算完 **postMessage** 回主線程更新 UI。
- **結果**：UI 保持 60fps 體感；代價是 **拷貝或 transfer** 資料。

### 本質二：通信與數據

- **`postMessage(data)`**：結構化克隆 — 大物件有成本。
- **Transferable**（`ArrayBuffer`）：**所有權轉移**，零拷貝 — 大 buffer 必用。
- **Dedicated Worker**：一頁一 worker 常見；**Shared Worker** 多 tab 共享（少用）。
- **與 Service Worker 不同**（`web/10-service-worker原理.md`）：SW 攔 network、離線；Worker 純 **算**。

### 本質三：類型與生命週期

- 建立：`new Worker('worker.js')` 或 blob URL。
- 結束：`worker.terminate()` 或 worker 內 `close()` — **防泄漏**。
- **`importScripts`**：worker 內拉庫 — 仍同 origin 限制。
- **Nested Worker**：支援有限；通常 **flat pool** 即可。

### 本質四：何時用 / 不用

**適合**：大陣列運算、CSV/JSON parse、crypto、圖像濾鏡、音訊 DSP。

**不適合**：DOM 操作、小計算（postMessage 開銷 > 收益）、需頻繁 sync 共享狀態。

**Worker Pool**：固定 N 個 worker 排隊任務 — 避免 spawn 風暴。

### 本質五：與 WebAssembly

- 重算力熱點可 **Wasm in Worker** — 近原生速度；JS 做膠水。
- 與 **純 Web Worker**：Wasm 算，Worker 隔離 UI。

### 常見陷阱

- **每任務 new Worker** — 建立成本高。
- **傳大物件不 transfer** — 雙倍記憶體 + 克隆慢。
- **在 worker 裡操作 DOM** — API 不存在。
- **無 error/onerror** — 靜默失敗。

### 與協同 / WS 的關係

- **WebSocket**（`web/8-websocket原理.md`）收消息；**重處理放 Worker**，主線程只 render。
- 協同表格：公式引擎常 Worker；**CRDT 合併** 可在 Worker，UI 只收 patch。

### 小結

- **問題**：主線程 JS 太長會卡互動。
- **手段**：Worker 並行 + postMessage/transfer + pool。
- **結果**：重計算移出 hot path；邊界是無 DOM、顯式消息、注意序列化成本。
