# SigNoz 實現和原理

SigNoz 是 **開源 APM / 可觀測平台**，用 **OpenTelemetry（OTel）** 收 **Metrics、Traces、Logs** 三支柱，存 **ClickHouse**，做查詢與告警。取捨是 **自託管成本 vs Datadog 類 SaaS 省運維** — 沒有 tracing，高流量下 **「慢在哪」只能靠猜**。

### 本質一：為什麼要三支柱

- **Metrics**：聚合數字 — QPS、P99、錯誤率；適合 **趨勢與告警**。
- **Traces**：單請求 **跨服務 span 鏈** — 適合 **定位慢點、依賴**。
- **Logs**：離散事件細節 — 適合 **錯誤上下文**；要與 traceId 關聯才有用。
- **因果**：Metrics 報警 → Trace 鑽取 → Log 看 stack；缺一條鏈就斷。

### 本質二：SigNoz 架構（數據怎麼流）

- **App**：OTel SDK 自動/手動 instrumentation（fetch、DB、路由）。
- **OTel Collector**：接收、處理、**採樣**、batch 轉發。
- **SigNoz Query Service + ClickHouse**：存儲與查詢；UI 看 trace waterfall、service graph。
- **與 Jaeger**：Jaeger 偏 trace；SigNoz **三支柱一體** + metrics 面板。

### 本質三：Trace 與採樣

- **Span**：一次操作（HTTP handler、DB query）；**Trace** = span 樹。
- **Context propagation**：`traceparent` header 跨服務串起來 — **漏傳就斷鏈**。
- **Sampling**：全量 trace 成本高；prod 常 **按比例 / 錯誤必采 / 慢請求必采**。
- **前端**：browser OTel 可采 **documentLoad、fetch**；與 RUM/LCP 互補（`performance/1-LCP首屏加載怎麼優化.md`）。

### 本質四：怎麼用來調試

- **慢請求**：trace 看哪個 span 長 — DB N+1、外部 API、鎖。
- **錯誤**：exception 記錄在 span + log；按 service/version 聚合。
- **依賴圖**：誰調誰、流量邊界 — 重構微服務前先看真依賴。
- **告警**：錯誤率、P99 閾值 — 對 SLO，不是對 CPU  alone。

### 本質五：落地取捨

- **自託管**：數據在自己 infra；要維護 Collector、ClickHouse 保留策略。
- **業務 context**：span 加 `userId`、`orderId`（非 PII 濫用）— 排障快。
- **保留期**：trace 7d、metrics 30d 等 — 成本與合規平衡。
- **高流量**：採樣 + 聚合必開；否則存儲與查詢先爆（`web/3-high-traffic-web-practices.md`）。

### 常見陷阱

- **只打 log 不上 trace** — 分散式下無法串請求。
- **100% 採樣上線** — 成本與性能反噬。
- **前後端 trace 未連** — 以為後端慢，其實前端重試。
- **告警無 SLO** — 噪音多，真正 outage 淹沒。

### 小結

- **問題**：微服務/高流量下延遲與錯誤難定位。
- **手段**：OTel 埋點 → Collector → SigNoz；Metrics 告警 + Trace 鑽取 + Log 關聯。
- **結果**：可證據化回答「慢在哪、誰壞了」；成本靠採樣與保留策略控。
