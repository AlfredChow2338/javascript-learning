# WebSocket 原理

WebSocket 在 **單條 TCP** 上提供 **全雙工、持久** 的訊息通道：先走 HTTP **Upgrade（101）** 握手，之後用 **frame** 傳資料，不再每次請求帶完整 HTTP header。取捨是 **低延遲推送** ↔ **連線狀態、重連、擴展與代理配置** — 不需要雙向即時時，HTTP 或 SSE 更簡單。

### 本質一：為什麼不用輪詢 HTTP

- **短輪詢**：延遲高、空請求多。
- **長輪詢**：連接佔用、超時重連複雜。
- **WebSocket**：一次握手，**伺服器可主動 push** — 聊天、報價、協同游標適用。
- **SSE**：單向 server→client、HTTP 友好；只需下行推送時可優先 SSE。

### 本質二：握手與安全

- Client：`Upgrade: websocket`、`Connection: Upgrade`、`Sec-WebSocket-Key`。
- Server：**101 Switching Protocols** + `Sec-WebSocket-Accept`（key 哈希驗證）。
- **生產用 `wss://`**（TLS）；與頁面 **同源策略** 仍適用；反向代理要開 **websocket upgrade** 超時。

### 本質三：連線與訊息模型

- **Frame**：text / binary / ping / pong / close；client 發送 **mask**。
- **API**：`new WebSocket(url)` → `onopen` / `onmessage` / `onclose` / `send()`。
- **無內建 RPC** — 應用層自定 JSON 協議、heartbeat、**重連 + 退避**、**消息序號 / 去重**。

### 本質四：與 Worker / Service Worker 的邊界

- **Web Worker**（`web/9-web-worker原理.md`）：算力線程，**不是**長連網路協議。
- **Service Worker**（`web/10-service-worker原理.md`）：攔 fetch、離線；**不能**替代頁內 WebSocket 客戶端，但可配合 push。
- **協同編輯**：常 WS 傳 op + CRDT/OT；大計算仍放 Worker。

### 何時用 / 不用

**適合**：即時聊天、遊戲狀態、行情、協同、live notification。

**不適合**：一般 CRUD REST、可 cache 的 GET、檔案下載 — 用 HTTP。

### 常見陷阱

- **無 heartbeat** — 中間 NAT/代理 silent drop。
- **無重連狀態同步** — 斷線期間消息丟失未補。
- **把 WS 當 REST** — 無 idempotency、無版本協議易亂序。
- **單機 broadcast 當擴展方案** — 多 instance 需 **Redis pub/sub** 等 fan-out。

### 小結

- **問題**：HTTP 請求-響應難做低延遲雙向 push。
- **手段**：HTTP 升級 + 持久 frame 通道 + 應用層協議與重連。
- **結果**：即時交互；運維要管連線數、sticky、超時與安全（wss、auth）。
