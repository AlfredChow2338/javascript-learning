## HTTP Cache 底層原理

### 為什麼需要 HTTP Cache

HTTP Cache 是 Web 性能優化的核心機制之一。沒有緩存，每次請求都要：
- 建立 TCP 連接
- 發送 HTTP 請求
- 等待伺服器處理
- 接收完整回應
- 解析和渲染

**緩存的好處：**
- ⚡ 減少網路請求（節省帶寬）
- ⚡ 降低伺服器負載
- ⚡ 提升用戶體驗（快速載入）
- ⚡ 降低延遲（從本地或 CDN 讀取）

### HTTP Cache 的層級

```
┌─────────────────────────────────────┐
│  1. Browser Cache                   │  ← 瀏覽器本地緩存
│     (Private Cache)                 │
├─────────────────────────────────────┤
│  2. Proxy Cache                     │  ← 代理伺服器緩存
│     (Shared Cache)                  │
├─────────────────────────────────────┤
│  3. CDN Cache                       │  ← CDN 邊緣節點緩存
│     (Shared Cache)                  │
├─────────────────────────────────────┤
│  4. Origin Server                   │  ← 源伺服器
└─────────────────────────────────────┘
```

**請求流程：**

```
用戶請求 → Browser Cache → Proxy Cache → CDN Cache → Origin Server
          ↓ 命中          ↓ 命中        ↓ 命中      ↓ 必須請求
          直接返回        直接返回      直接返回    生成回應
```

### 核心概念：Cache-Control

`Cache-Control` 是 HTTP/1.1 引入的緩存控制標頭，是最重要的緩存指令。

#### 基本語法

```http
Cache-Control: directive1, directive2, directive3
```

#### 常用指令

**1. max-age（最大緩存時間）**

```http
Cache-Control: max-age=3600
```

**作用：** 指定資源可以被緩存的最大時間（秒）

**範例：**

```http
HTTP/1.1 200 OK
Cache-Control: max-age=3600
Content-Type: text/html

<html>...</html>
```

**解釋：**
- 資源可以被緩存 3600 秒（1 小時）
- 1 小時內，瀏覽器直接使用緩存，不發送請求
- 1 小時後，緩存過期，需要重新驗證

**2. no-cache（必須驗證）**

```http
Cache-Control: no-cache
```

**作用：** 緩存可以存儲，但使用前必須向伺服器驗證

**範例：**

```http
HTTP/1.1 200 OK
Cache-Control: no-cache
ETag: "abc123"

{"data": "..."}
```

**解釋：**
- 瀏覽器會緩存回應
- 每次使用前，發送條件請求驗證
- 如果未改變，返回 304 Not Modified
- 如果改變，返回新的內容

**3. no-store（不緩存）**

```http
Cache-Control: no-store
```

**作用：** 不允許任何緩存存儲回應

**範例：**

```http
HTTP/1.1 200 OK
Cache-Control: no-store
Content-Type: application/json

{"sensitive": "data"}
```

**解釋：**
- 瀏覽器、代理、CDN 都不會緩存
- 每次請求都必須向伺服器獲取
- 適合敏感數據

**4. public / private**

```http
Cache-Control: public, max-age=3600
Cache-Control: private, max-age=3600
```

**作用：**
- `public`：可以被任何緩存存儲（瀏覽器、代理、CDN）
- `private`：只能被瀏覽器緩存，不能被共享緩存存儲

**範例：**

```http
// 公開資源（圖片、CSS、JS）
Cache-Control: public, max-age=31536000

// 用戶特定資源（個人資料）
Cache-Control: private, max-age=3600
```

**5. must-revalidate**

```http
Cache-Control: max-age=3600, must-revalidate
```

**作用：** 緩存過期後，必須向伺服器驗證，不能使用過期緩存

**範例：**

```http
Cache-Control: max-age=3600, must-revalidate
```

**解釋：**
- 3600 秒內：直接使用緩存
- 3600 秒後：必須驗證，不能使用過期緩存
- 如果伺服器不可用，返回錯誤（不使用過期緩存）

**6. stale-while-revalidate**

```http
Cache-Control: max-age=3600, stale-while-revalidate=86400
```

**作用：** 在重新驗證期間，可以使用過期緩存

**範例：**

```http
Cache-Control: max-age=3600, stale-while-revalidate=86400
```

**解釋：**
- 0-3600 秒：使用新鮮緩存
- 3600-86400 秒：使用過期緩存，同時在背景重新驗證
- 86400 秒後：必須重新驗證

**實際應用：**

```javascript
// Next.js API Route
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  // s-maxage: 共享緩存（CDN）的緩存時間
  // stale-while-revalidate: 允許使用過期緩存，同時重新驗證
  return res.json({ data: '...' });
}
```

### 緩存驗證機制

當緩存過期或使用 `no-cache` 時，需要向伺服器驗證緩存是否仍然有效。

#### 1. ETag（Entity Tag）

**工作原理：**

```http
# 首次請求
GET /api/data HTTP/1.1

HTTP/1.1 200 OK
ETag: "abc123"
Cache-Control: no-cache
Content-Type: application/json

{"data": "..."}
```

```http
# 後續請求（帶 If-None-Match）
GET /api/data HTTP/1.1
If-None-Match: "abc123"

# 如果未改變
HTTP/1.1 304 Not Modified
ETag: "abc123"
# 不返回 body，節省帶寬

# 如果改變
HTTP/1.1 200 OK
ETag: "def456"
Content-Type: application/json

{"data": "new data"}
```

**ETag 生成方式：**

```javascript
// 方式一：內容哈希
const crypto = require('crypto');
const content = JSON.stringify(data);
const etag = crypto.createHash('md5').update(content).digest('hex');
// ETag: "5d41402abc4b2a76b9719d911017c592"

// 方式二：版本號
const etag = `"v${version}"`;
// ETag: "v1.2.3"

// 方式三：時間戳 + 內容哈希
const etag = `"${timestamp}-${hash}"`;
```

**實際應用：**

```javascript
// Express.js 範例
app.get('/api/data', (req, res) => {
  const data = { message: 'Hello' };
  const etag = generateETag(data);
  
  // 檢查客戶端 ETag
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // 未改變
  }
  
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'no-cache');
  res.json(data);
});
```

#### 2. Last-Modified / If-Modified-Since

**工作原理：**

```http
# 首次請求
GET /api/data HTTP/1.1

HTTP/1.1 200 OK
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
Cache-Control: no-cache
Content-Type: application/json

{"data": "..."}
```

```http
# 後續請求（帶 If-Modified-Since）
GET /api/data HTTP/1.1
If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT

# 如果未改變
HTTP/1.1 304 Not Modified
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT

# 如果改變
HTTP/1.1 200 OK
Last-Modified: Wed, 21 Oct 2024 08:15:00 GMT
Content-Type: application/json

{"data": "new data"}
```

**實際應用：**

```javascript
// Node.js 範例
app.get('/api/data', (req, res) => {
  const lastModified = new Date('2024-10-21T07:28:00Z');
  
  // 檢查客戶端 Last-Modified
  const ifModifiedSince = req.headers['if-modified-since'];
  if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
    return res.status(304).end(); // 未改變
  }
  
  res.setHeader('Last-Modified', lastModified.toUTCString());
  res.setHeader('Cache-Control', 'no-cache');
  res.json({ data: '...' });
});
```

#### ETag vs Last-Modified

| 特性 | ETag | Last-Modified |
|------|------|---------------|
| **精度** | 精確（內容改變即變） | 秒級（1 秒內多次改變無法區分） |
| **計算成本** | 較高（需要計算哈希） | 較低（只需記錄時間） |
| **可靠性** | 高（不受時區影響） | 低（依賴時鐘同步） |
| **適用場景** | 動態內容、API | 靜態文件 |

**最佳實踐：同時使用兩者**

```http
HTTP/1.1 200 OK
ETag: "abc123"
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
Cache-Control: no-cache
```

### 緩存策略

#### 策略一：強緩存（Strong Caching）

**適用場景：** 靜態資源（圖片、CSS、JS、字體）

```http
Cache-Control: public, max-age=31536000, immutable
```

**特點：**
- 長期緩存（1 年）
- `immutable`：告訴瀏覽器內容不會改變
- 文件名包含 hash，內容改變時文件名也改變

**實際應用：**

```javascript
// webpack 配置
module.exports = {
  output: {
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js'
  }
};

// Next.js 配置
module.exports = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};
```

**請求流程：**

```
1. 首次請求：下載資源，緩存 1 年
2. 後續請求：直接使用緩存，不發送請求
3. 內容更新：文件名改變（hash 改變），視為新資源
```

#### 策略二：協商緩存（Negotiated Caching）

**適用場景：** HTML、API 回應

```http
Cache-Control: no-cache
ETag: "abc123"
```

**特點：**
- 每次使用前驗證
- 如果未改變，返回 304，節省帶寬
- 如果改變，返回新內容

**實際應用：**

```javascript
// Next.js API Route
export default function handler(req, res) {
  const data = await fetchData();
  const etag = generateETag(data);
  
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }
  
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'no-cache');
  res.json(data);
}
```

#### 策略三：混合緩存（Hybrid Caching）

**適用場景：** 可以緩存但需要定期更新的內容

```http
Cache-Control: public, max-age=3600, must-revalidate
```

**特點：**
- 1 小時內直接使用緩存
- 1 小時後必須驗證
- 平衡性能和數據新鮮度

**實際應用：**

```javascript
// 產品列表（每小時更新一次）
res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');

// 用戶資料（需要驗證但可以緩存）
res.setHeader('Cache-Control', 'private, max-age=300, must-revalidate');
```

### 實際應用範例

#### 範例一：靜態資源緩存

```javascript
// Express.js
app.use('/static', express.static('public', {
  maxAge: '1y', // 1 年
  immutable: true,
  etag: true,
  lastModified: true
}));

// 回應標頭：
// Cache-Control: public, max-age=31536000, immutable
// ETag: "abc123"
// Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
```

#### 範例二：API 緩存

```javascript
// Next.js API Route
export default async function handler(req, res) {
  const data = await fetchDataFromDB();
  const etag = generateETag(data);
  
  // 檢查 ETag
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }
  
  // 設定緩存標頭
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  
  res.json(data);
}
```

#### 範例三：HTML 緩存

```javascript
// Next.js 頁面
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      }
    ];
  }
};
```

### 緩存流程圖

#### 強緩存流程

```
請求資源
    │
    ▼
檢查 Cache-Control: max-age
    │
    ├─ 未過期 → 直接使用緩存（200 from cache）
    │
    └─ 已過期 → 發送請求到伺服器
                │
                ├─ 返回新內容（200）
                └─ 更新緩存
```

#### 協商緩存流程

```
請求資源
    │
    ▼
檢查 Cache-Control: no-cache
    │
    ▼
發送條件請求
    │
    ├─ If-None-Match: "abc123"
    └─ If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT
    │
    ▼
伺服器檢查
    │
    ├─ 未改變 → 304 Not Modified（使用緩存）
    └─ 已改變 → 200 OK（返回新內容，更新緩存）
```

### 常見問題和解決方案

#### 問題一：緩存不更新

**原因：** 使用了強緩存，且文件名沒有改變

```http
# ❌ 問題配置
Cache-Control: public, max-age=31536000
# 文件名：app.js（沒有 hash）
```

**解決方案：**

```javascript
// ✅ 使用 contenthash
filename: '[name].[contenthash:8].js'
// 文件名：app.abc12345.js

// 內容改變時，hash 改變，文件名改變
// 瀏覽器視為新資源，自動更新
```

#### 問題二：用戶看不到更新

**原因：** 瀏覽器緩存了舊版本

**解決方案：**

```javascript
// 方式一：版本號查詢參數
<script src="/app.js?v=1.2.3"></script>

// 方式二：ETag 驗證
Cache-Control: no-cache
ETag: "abc123"

// 方式三：縮短 max-age
Cache-Control: public, max-age=3600
```

#### 問題三：CDN 緩存不更新

**原因：** CDN 使用了 `s-maxage`，緩存時間過長

**解決方案：**

```javascript
// ✅ 使用 on-demand revalidation
// 當內容更新時，清除 CDN 緩存
await fetch('https://api.cdn.com/purge', {
  method: 'POST',
  body: JSON.stringify({ url: '/api/data' })
});

// 或使用較短的 s-maxage
Cache-Control: public, s-maxage=60, max-age=3600
```

### 最佳實踐

#### 1. 分層緩存策略

```javascript
// 靜態資源：長期緩存
Cache-Control: public, max-age=31536000, immutable

// HTML：短期緩存 + 驗證
Cache-Control: public, s-maxage=60, stale-while-revalidate=300

// API：驗證緩存
Cache-Control: no-cache, must-revalidate
ETag: "abc123"

// 用戶特定：私有緩存
Cache-Control: private, max-age=300
```

#### 2. 使用 ETag 進行精確驗證

```javascript
// ✅ 推薦：使用 ETag
const etag = generateETag(data);
res.setHeader('ETag', etag);
res.setHeader('Cache-Control', 'no-cache');

// 檢查客戶端 ETag
if (req.headers['if-none-match'] === etag) {
  return res.status(304).end();
}
```

#### 3. 利用 stale-while-revalidate

```javascript
// 提升用戶體驗：允許使用過期緩存，同時重新驗證
Cache-Control: public, max-age=3600, stale-while-revalidate=86400

// 解釋：
// - 0-3600 秒：使用新鮮緩存
// - 3600-86400 秒：使用過期緩存，背景重新驗證
// - 用戶立即看到內容，同時確保數據新鮮
```

#### 4. 區分公開和私有資源

```javascript
// 公開資源（可以被 CDN 緩存）
Cache-Control: public, max-age=3600

// 私有資源（只能被瀏覽器緩存）
Cache-Control: private, max-age=3600
```

### 調試和監控

#### 檢查緩存狀態

```javascript
// 在瀏覽器 DevTools 中
// Network 面板 → 查看 Response Headers
Cache-Control: public, max-age=3600
ETag: "abc123"
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT

// Status 欄位：
// - 200: 從伺服器獲取
// - 200 (from cache): 強緩存命中
// - 304: 協商緩存命中
```

#### 監控緩存命中率

```javascript
// 伺服器端記錄
app.use((req, res, next) => {
  const ifNoneMatch = req.headers['if-none-match'];
  const ifModifiedSince = req.headers['if-modified-since'];
  
  if (ifNoneMatch || ifModifiedSince) {
    // 記錄條件請求
    logConditionalRequest(req.url);
  }
  
  next();
});
```

### 總結

**HTTP Cache 核心要點：**

1. **緩存層級**
   - Browser Cache（私有）
   - Proxy/CDN Cache（共享）
   - Origin Server

2. **緩存控制**
   - `Cache-Control`：主要控制指令
   - `ETag` / `Last-Modified`：驗證機制
   - `public` / `private`：緩存範圍

3. **緩存策略**
   - 強緩存：長期緩存靜態資源
   - 協商緩存：驗證後使用緩存
   - 混合緩存：平衡性能和新鮮度

4. **最佳實踐**
   - 靜態資源使用 contenthash
   - API 使用 ETag 驗證
   - 利用 stale-while-revalidate
   - 區分公開和私有資源

理解 HTTP Cache 原理對於優化 Web 應用性能至關重要，正確的緩存策略可以大幅提升用戶體驗和降低伺服器負載。
