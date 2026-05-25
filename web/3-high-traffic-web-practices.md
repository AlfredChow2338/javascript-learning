# High Traffic Website 設計與實現

高流量不是「單機扛更多 QPS」，而是 **峰值可擴、故障可隔離、資料可 eventual、成本可預測**。取捨方向：**無狀態水平擴展 + 多層 cache + 非同步削峰 + 可觀測** — 前端優化只能減 bytes 與請求數，**瓶頸常在 DB、熱 key、同步鏈路**。

### 本質一：架構 — 水平擴展與無狀態

- **問題**：垂直升級有天花板、單點故障；session 粘在某台機器上無法擴。
- **手段**：
  - **Stateless app**：session / 購物車進 **Redis**；任意節點可處理任意請求。
  - **Load Balancer**：輪詢、加權、least connections；健康檢查剔除壞節點。
  - **CDN**：靜態與可 cache HTML 在邊緣（見 `web/5-http-cache原理.md`）。
- **結果**：流量 ×10 時加機器，而非賭單機 CPU。

### 本質二：多層 Cache 削 DB 壓力

- **瀏覽器 / CDN** — 靜態、hash 資源。
- **應用 cache（Redis）** — 熱門商品、配置、session；設 **TTL + 失效策略**。
- **DB 讀寫分離 / replica** — 讀多寫少場景；寫仍走 primary。
- **誤解**：只加 Redis 不設 key 設計 — **熱 key** 仍會打穿單分片。

### 本質三：前端在高流量下的責任

- **減請求、減 bytes**：code split、圖片格式、lazy（`performance/2-如何優化code-spliting.md`）。
- **避免 thundering herd**：客戶端 jitter 重試、熔斷提示；不要一錯就全站 reload。
- **靜態殼 + API**：SSR/SSG 扛首屏，個人化走 API — 與 `next/5-partial-prerendering原理.md` 同族。
- **邊緣**：CDN、HTTP/2、preconnect — 見 `performance/1-LCP首屏加載怎麼優化.md`。

### 本質四：後端削峰與解耦

- **非同步隊列**：下單、發信、報表 — 請求 **ack 快**，重活 worker 做。
- **限流 / 熔斷**：API gateway 或 middleware 按 IP / user / route 限 QPS；保護 DB 與第三方支付。
- **降級**：非核心功能關閉、讀 cache 舊值、排隊頁 — 峰值時 **可用 > 全功能**。

### 本質五：資料層與一致性

- **分庫分表 / sharding**：單表千萬行、寫入瓶頸時才上；先 exhaust 索引與读写分离。
- **一致性取捨**：跨服務 **strong 一致** 成本高；電商庫存常用 **reserve + 异步确认**，接受短暫 oversell 風險需業務補償。
- **Idempotency**：支付、下單 API 必須 **幂等 key**，重試不雙扣。

### 本質六：可觀測與演練

- **Metrics / Traces / Logs** 三支柱 — 見 `web/7-signoz實現和原理.md`。
- **SLO**：可用性、P99 延遲、錯誤率；告警對 **用戶影響**，不是只對 CPU。
- **混沌 / 峰值演練**：提前發現 LB 超時、连接池耗尽、cache 雪崩。

### 常見陷阱

- **只 scale 前端** — API 與 DB 不擴，加 CDN 無用。
- **cache 無 TTL 統一失效** — 同一秒全部 miss → DB 被打穿。
- **同步調用鏈過長** — 一個頁面串 10 個微服務，P99 相乘變慢。
- **忽略部署與回滾** — 見 `system-design/5-如何deploy-frontend-application.md`。

### 與其他筆記的關係

- **`web/5-http-cache原理.md`**：邊緣與瀏覽器 cache 語意。
- **`system-design/1-如何設計高併發frontend-application.md`**（若存在）：前端視角併發；本篇偏 **全站架構**。
- **`web/7-signoz實現和原理.md`**：流量上去後靠什麼定位慢與錯。

### 小結

- **問題**：峰值遠高於平均、全球延遲、DB 成瓶頸。
- **手段**：無狀態擴展、LB、CDN、Redis、隊列、限流、读写分离、可觀測。
- **結果**：容量隨機器線性（理想下）、故障域可控；前端負責少打後端、後端負責不被打穿。
