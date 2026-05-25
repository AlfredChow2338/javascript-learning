# Service Worker 原理

Service Worker 是 **瀏覽器與網路之間的 programmable proxy**：獨立 worker 線程，**攔截 fetch**，可 **離線 cache、推送、背景同步**。取捨是 **離線與快取控制力** ↔ **HTTPS、生命週期複雜、更新陷阱** — 不是 Web Worker 的替代品（`web/9-web-worker原理.md`）。

### 本質一：它在解決什麼

- **問題**：純 online app 網路抖動即白屏；重複訪問仍全量走 network。
- **機制**：`navigator.serviceWorker.register()` → **install → activate → fetch 監聽**。
- **Scope**：預設 **同 origin 路徑下** 的請求；`/sw.js` 在根則管全站。
- **HTTPS**（localhost 除外）— 防中間人改 SW。

### 本質二：生命週期（搞錯就「不更新」）

1. **Install**：`cache.addAll` 預 cache；`skipWaiting()` 可搶占（慎用）。
2. **Activate**：刪舊 cache；`clients.claim()` 立即控頁。
3. **Fetch**：`event.respondWith(...)` 決定 network 還是 cache。
- **更新**：SW 檔 **byte 變** 才新 install；舊 tab 可長時間仍用舊 SW — 需 **UI 提示 refresh**。

### 本質三：Cache 策略（因果）

| 策略 | 行為 | 何時 |
|------|------|------|
| **Cache First** | 先 cache | 靜態資源、app shell |
| **Network First** | 先網，失敗 cache | 需新鮮、可離線 fallback |
| **Stale-While-Revalidate** | 先 cache 再背景更新 | 可短 stale 的 API/圖 |
| **Network Only** | 不 cache | 敏感、必 live |
| **Cache Only** | 離線包 | 預打包 PWA |

- 與 **HTTP Cache-Control**（`web/5-http-cache原理.md`）疊加 — SW 是 **可程式化** 一層。

### 本質四：PWA 能力邊界

- **Push + Notification**：需 user permission；後端 VAPID。
- **Background Sync**：離線提交表單，恢復網路再送。
- **Message**：頁 ↔ SW `postMessage` 協調 skipWaiting、cache 版本。
- **不能做**：直接 DOM；**不能**替代所有 API — 只是 fetch 代理 + 背景任務。

### 常見陷阱

- **cache 名無版本** — activate 清不乾淨，舊檔永存。
- **cache 了 `index.html` 且 strategy 錯** — 部署後永遠舊 app。
- **開發時 SW 殘留** — 以為 code 沒更新；DevTools Application  unregister。
- **跨域 fetch 預設 opaque** — cache 了也用不了 body。

### 與其他筆記的關係

- **`web/6-解釋critical-rendering-path.md`**：SW 改變資源到達時序。
- **`performance/1-LCP首屏加載怎麼優化.md`**：app shell cache 改善二次載入。

### 小結

- **問題**：弱網與重複訪問仍依賴 live network。
- **手段**：SW 生命週期 + fetch 策略 + 版本化 cache + 更新 UX。
- **結果**：可離線可安裝 PWA；運維要管 HTTPS、cache 與發布同步。
