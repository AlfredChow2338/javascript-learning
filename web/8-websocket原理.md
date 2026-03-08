## WebSocket 原理

### 什麼是 WebSocket

**WebSocket** 是一種在單個 TCP 連接上進行全雙工通信的協議，允許服務器和客戶端之間實時、雙向地傳輸數據。

**核心特點：**
- **全雙工通信**：客戶端和服務器可以同時發送數據
- **持久連接**：建立連接後保持打開狀態
- **低延遲**：無需每次請求都建立新連接
- **實時性**：適合實時應用（聊天、遊戲、交易等）

### 為什麼需要 WebSocket

**傳統 HTTP 的問題：**
- 單向通信：客戶端發起請求，服務器響應
- 無狀態：每次請求都是獨立的
- 高開銷：每次請求都需要建立連接

**WebSocket 的優勢：**
- 雙向通信：服務器可以主動推送數據
- 持久連接：一次握手，持續通信
- 低開銷：減少連接建立和 HTTP 頭部開銷

---

## 一、WebSocket 協議原理

### 1.1 握手過程（Handshake）

**HTTP 升級請求：**

```
客戶端 → 服務器
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

**服務器響應：**

```
服務器 → 客戶端
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

**關鍵點：**
- 使用 HTTP 101 狀態碼表示協議升級
- `Sec-WebSocket-Key` 用於安全驗證
- 握手完成後，連接升級為 WebSocket

### 1.2 數據幀格式

WebSocket 使用幀（Frame）傳輸數據：

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+-------------------------------+
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

**關鍵字段：**
- **FIN**：標識是否為最後一幀
- **Opcode**：操作碼（文本、二進制、關閉等）
- **Mask**：是否掩碼（客戶端必須掩碼）
- **Payload**：實際數據

---

## 二、基本使用

### 2.1 客戶端（JavaScript）

```javascript
// 創建 WebSocket 連接
const ws = new WebSocket('wss://example.com/ws');

// 連接打開
ws.onopen = () => {
  console.log('WebSocket connected');
  ws.send('Hello Server');
};

// 接收消息
ws.onmessage = (event) => {
  console.log('Message:', event.data);
};

// 錯誤處理
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// 連接關閉
ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
};

// 發送消息
ws.send('Hello');
ws.send(JSON.stringify({ type: 'message', data: 'Hello' }));

// 關閉連接
ws.close();
```

### 2.2 服務器（Node.js）

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // 接收消息
  ws.on('message', (message) => {
    console.log('Received:', message);
    
    // 發送消息給客戶端
    ws.send(`Echo: ${message}`);
    
    // 廣播給所有客戶端
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // 連接關閉
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

---

## 三、WebSocket vs HTTP

### 3.1 通信模式對比

**HTTP（請求-響應）：**
```
客戶端 → 請求 → 服務器
客戶端 ← 響應 ← 服務器
（每次都需要建立連接）
```

**WebSocket（持久連接）：**
```
客戶端 ←→ 服務器
（一次連接，持續通信）
```

### 3.2 性能對比

| 特性 | HTTP | WebSocket |
|------|------|-----------|
| **連接方式** | 每次請求建立新連接 | 持久連接 |
| **通信方向** | 單向（客戶端發起） | 雙向 |
| **開銷** | 每次都有 HTTP 頭部 | 只有數據幀 |
| **實時性** | 需要輪詢 | 即時推送 |
| **適用場景** | 傳統 Web 應用 | 實時應用 |

### 3.3 使用場景

**適合 WebSocket：**
- 實時聊天
- 在線遊戲
- 股票/加密貨幣價格更新
- 協作編輯
- 實時通知

**適合 HTTP：**
- 傳統 CRUD 操作
- 靜態資源獲取
- RESTful API
- 不需要實時性的場景
