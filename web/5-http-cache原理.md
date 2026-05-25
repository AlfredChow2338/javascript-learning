# HTTP Cache 原理

HTTP cache 讓 **重複請求不必打到 origin**：瀏覽器、代理、CDN 依 **Cache-Control / ETag** 決定用本地副本還是重新驗證。取捨是 **新鮮度 ↔ 延遲與頻寬** — 配錯會「改了 code 用戶仍舊版」或「API 被 CDN 誤 cache」。

### 本質一：請求走哪幾層

- **Browser cache**（private）→ **Proxy / CDN**（shared）→ **Origin**。
- **命中**：該層直接回，跳過後面 — latency 降、origin QPS 降。
- **未命中 / 需驗證**：繼續向上；最終 origin 生成，再 **寫入** 可 cache 的層。

### 本質二：Cache-Control 關鍵指令

- **`max-age=N`**：N 秒內 **直接用**，不問伺服器（強 cache）。
- **`no-cache`**：可存，但 **用前必須驗證**（常配合 ETag → 304）。
- **`no-store`**：任何地方 **不得存** — 敏感、個人化 API。
- **`immutable`**：配合 **contenthash 檔名** — 檔名變即新資源，可 `max-age` 極長。
- **誤解**：`no-cache` ≠ 不 cache — 是 **每次 revalidate**，不是 no-store。

### 本質三：驗證 — ETag 與 304

- **首次**：回 body + `ETag` / `Last-Modified`。
- **再次**：`If-None-Match` / `If-Modified-Since` → 未變則 **304 無 body**，省頻寬。
- **因果**：HTML 常 `no-cache` + ETag；**hash 靜態 JS** 用 `immutable` 不必每次 304 往返。

### 本質四：實務策略（怎麼配）

| 資源 | 典型策略 | 為什麼 |
|------|----------|--------|
| `app.[hash].js` | `max-age=31536000, immutable` | 內容變=檔名變 |
| `index.html` | `no-cache` 或短 max-age | 入口要指向新 hash |
| API 個人化 | `no-store` 或 `private` | 不能共享 cache |
| 公開 JSON | `max-age` + CDN | 可 stale 的目錄資料 |

- **Stale-while-revalidate**：CDN 先回舊、背景更新 — 體感快，短暫不一致可接受時用。

### 本質五：與框架 / 部署的關係

- **Next Data / Full Route Cache** 是 **應用層**；HTTP cache 是 **傳輸層** — 可疊加（`next/2-next-cache機制.md`）。
- **部署**：`index.html` 長 cache 是 **最常見線上 bug**（`system-design/5-如何deploy-frontend-application.md`）。
- **CRP**：cache 命中少 RTT → 更快 DOM/CSS（`web/6-解釋critical-rendering-path.md`）。

### 常見陷阱

- **無 hash 的 `app.js` + 長 max-age** — 永遠舊邏輯。
- **API 被 CDN 默認 cache** — 用戶 A 看到用戶 B 的資料。
- **只清瀏覽器不清 CDN** — 邊緣仍舊。
- **Vary 未設** — 同 URL 不同 `Accept-Encoding` / 語系混 cache。

### 小結

- **問題**：重複下載浪費時間與 origin 容量。
- **手段**：分資源類型設 Cache-Control；hash 靜態 + immutable；HTML/API 分開；ETag 304。
- **結果**：邊緣與瀏覽器扛大部分讀流量；更新靠 **換 hash + 短 cache 入口**。
