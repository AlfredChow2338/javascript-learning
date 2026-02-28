## High Traffic Website 設計與實現

### 什麼是高流量網站

高流量網站通常指：
- **日活躍用戶（DAU）**：數百萬到數千萬
- **每秒請求數（QPS）**：數千到數萬
- **峰值流量**：突發流量可能是平均流量的 10-100 倍
- **全球分佈**：需要服務全球用戶

**挑戰：**
- 高並發請求處理
- 低延遲響應
- 高可用性（99.99%+）
- 數據一致性
- 成本控制

### 1. 架構設計原則

#### 水平擴展（Horizontal Scaling）

**核心思想：** 通過增加伺服器數量來處理更多流量，而不是升級單一伺服器。

```javascript
// ❌ 垂直擴展：升級單一伺服器
// 單一伺服器：8 CPU, 32GB RAM
// 升級到：16 CPU, 64GB RAM（成本高，有上限）

// ✅ 水平擴展：增加伺服器數量
// 1 台伺服器 → 10 台伺服器 → 100 台伺服器
// 成本線性增長，擴展性更好
```

**實現方式：**

```javascript
// 無狀態設計：每台伺服器都可以處理任何請求
// Next.js API Route 範例
export default async function handler(req, res) {
  // 不依賴伺服器本地狀態
  // 所有狀態都存儲在共享的數據庫或緩存中
  const session = await getSessionFromRedis(req.cookies.sessionId);
  const data = await fetchDataFromDB();
  
  return res.json(data);
}
```

#### 負載均衡（Load Balancing）

**策略：**

1. **輪詢（Round Robin）**
   ```javascript
   // 簡單輪詢
   const servers = ['server1', 'server2', 'server3'];
   let currentIndex = 0;
   
   function getNextServer() {
     const server = servers[currentIndex];
     currentIndex = (currentIndex + 1) % servers.length;
     return server;
   }
   ```

2. **加權輪詢（Weighted Round Robin）**
   ```javascript
   // 根據伺服器性能分配權重
   const servers = [
     { host: 'server1', weight: 3 }, // 高性能伺服器
     { host: 'server2', weight: 2 },
     { host: 'server3', weight: 1 }  // 低性能伺服器
   ];
   ```

3. **最少連接（Least Connections）**
   ```javascript
   // 將請求分配到當前連接數最少的伺服器
   function selectServer(servers) {
     return servers.reduce((min, server) => 
       server.connections < min.connections ? server : min
     );
   }
   ```

**實際應用（Nginx 配置）：**

```nginx
upstream backend {
  least_conn;  # 最少連接策略
  server app1.example.com weight=3;
  server app2.example.com weight=2;
  server app3.example.com weight=1;
  
  # 健康檢查
  keepalive 32;
}

server {
  listen 80;
  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

#### CDN（Content Delivery Network）

**作用：** 將靜態資源緩存到全球邊緣節點，減少延遲。

```javascript
// Next.js 配置 CDN
// next.config.js
module.exports = {
  assetPrefix: process.env.CDN_URL || '',
  images: {
    domains: ['cdn.example.com'],
    // 使用 CDN 優化圖片
  }
};

// 靜態資源自動使用 CDN
// <img src="/images/logo.png" />
// 實際載入：https://cdn.example.com/images/logo.png
```

**CDN 策略：**

```javascript
// 1. 靜態資源（長期緩存）
// Cache-Control: public, max-age=31536000, immutable
// 文件名包含 hash，內容改變時文件名也改變
// main.abc123.js → main.def456.js

// 2. HTML（短期緩存或無緩存）
// Cache-Control: public, max-age=0, must-revalidate
// 或使用 CDN 的邊緣緩存（Edge Cache）

// 3. API 回應（根據內容決定）
// Cache-Control: public, max-age=60  // 可緩存的數據
// Cache-Control: private, no-cache    // 用戶特定數據
```

### 2. 前端優化

#### 代碼分割（Code Splitting）

**React/Next.js 實現：**

```jsx
// 路由級別分割（Next.js 自動處理）
// pages/index.js
export default function Home() {
  return <div>Home Page</div>;
}
// 自動分割，只載入當前頁面的代碼

// 組件級別分割
import dynamic from 'next/dynamic';

// 懶加載重組件
const HeavyComponent = dynamic(() => import('../components/Heavy'), {
  loading: () => <div>Loading...</div>,
  ssr: false // 如果不需要 SSR
});

function Page() {
  return (
    <div>
      <LightComponent />
      <HeavyComponent /> {/* 按需載入 */}
    </div>
  );
}
```

**手動分割：**

```javascript
// 使用 React.lazy
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

#### 資源優化

**1. 圖片優化**

```jsx
// Next.js Image 組件自動優化
import Image from 'next/image';

function ProductImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      // 自動優化：
      // - 格式轉換（WebP、AVIF）
      // - 響應式圖片
      // - 懶加載
      // - 佔位符
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

**2. 字體優化**

```javascript
// next.config.js
module.exports = {
  optimizeFonts: true, // 自動優化字體
};

// 使用 next/font
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// 自動：
// - 字體子集化
// - 預載入關鍵字體
// - 減少布局偏移（CLS）
```

**3. Bundle 優化**

```javascript
// 分析 bundle 大小
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}

// 使用 webpack-bundle-analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Next.js 配置
});
```

#### 緩存策略

**1. 瀏覽器緩存**

```javascript
// Service Worker 緩存策略
// public/sw.js
const CACHE_NAME = 'v1';
const STATIC_ASSETS = [
  '/',
  '/styles.css',
  '/main.js',
  '/images/logo.png'
];

// 安裝時緩存靜態資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 緩存優先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果緩存中有，直接返回
      if (response) {
        return response;
      }
      // 否則從網路獲取
      return fetch(event.request).then((response) => {
        // 緩存新的回應
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
```

**2. HTTP 緩存**

```javascript
// Next.js API Route 設定緩存標頭
export default async function handler(req, res) {
  // 靜態數據：長期緩存
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  
  const data = await fetchStaticData();
  return res.json(data);
}

// 動態數據：短期緩存
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, max-age=60');
  
  const userData = await fetchUserData(req.userId);
  return res.json(userData);
}
```

#### 預載入和預取（Preloading & Prefetching）

```jsx
// Next.js 自動預取連結
import Link from 'next/link';

function Navigation() {
  return (
    <nav>
      {/* 滑鼠懸停時自動預取 */}
      <Link href="/products">
        <a>Products</a>
      </Link>
      
      {/* 手動預取 */}
      <Link href="/about" prefetch={false}>
        <a>About</a>
      </Link>
    </nav>
  );
}

// 預載入關鍵資源
import Head from 'next/head';

function Page() {
  return (
    <>
      <Head>
        <link rel="preload" href="/fonts/critical.woff2" as="font" />
        <link rel="prefetch" href="/api/data" as="fetch" />
      </Head>
      {/* ... */}
    </>
  );
}
```

### 3. 後端優化

#### 數據庫優化

**1. 索引優化**

```javascript
// MongoDB 範例
// 為常用查詢創建索引
db.users.createIndex({ email: 1 }); // 單一索引
db.products.createIndex({ category: 1, price: -1 }); // 複合索引

// 查詢時使用索引
db.users.find({ email: 'user@example.com' }); // 使用 email 索引

// ❌ 避免全表掃描
db.users.find({ name: /^John/ }); // 如果沒有索引，會掃描所有文檔
```

**2. 查詢優化**

```javascript
// ❌ 低效：N+1 查詢問題
async function getUsersWithPosts() {
  const users = await db.users.find();
  for (const user of users) {
    user.posts = await db.posts.find({ userId: user.id });
    // 如果有 100 個用戶，會執行 101 次查詢
  }
  return users;
}

// ✅ 高效：使用聚合或 JOIN
async function getUsersWithPosts() {
  // MongoDB 聚合
  const users = await db.users.aggregate([
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'userId',
        as: 'posts'
      }
    }
  ]);
  return users;
}

// 或使用批量查詢
async function getUsersWithPosts() {
  const users = await db.users.find();
  const userIds = users.map(u => u.id);
  const posts = await db.posts.find({ userId: { $in: userIds } });
  
  // 在內存中組裝
  const postsByUser = new Map();
  posts.forEach(post => {
    if (!postsByUser.has(post.userId)) {
      postsByUser.set(post.userId, []);
    }
    postsByUser.get(post.userId).push(post);
  });
  
  return users.map(user => ({
    ...user,
    posts: postsByUser.get(user.id) || []
  }));
}
```

**3. 分頁優化**

```javascript
// ❌ 低效：使用 skip
async function getProducts(page, limit) {
  return await db.products
    .find()
    .skip((page - 1) * limit)
    .limit(limit);
  // skip 越大，性能越差
}

// ✅ 高效：使用游標（Cursor-based）
async function getProducts(lastId, limit) {
  const query = lastId ? { _id: { $gt: lastId } } : {};
  return await db.products
    .find(query)
    .sort({ _id: 1 })
    .limit(limit);
}

// 或使用索引字段
async function getProducts(lastCreatedAt, limit) {
  const query = lastCreatedAt 
    ? { createdAt: { $gt: lastCreatedAt } } 
    : {};
  return await db.products
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
}
```

#### 緩存策略

**1. Redis 緩存**

```javascript
// 多層緩存策略
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// L1: 應用內存緩存（最快）
const memoryCache = new Map();

// L2: Redis 緩存（快速）
async function getCachedData(key) {
  // 先檢查內存緩存
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  
  // 再檢查 Redis
  const cached = await redis.get(key);
  if (cached) {
    const data = JSON.parse(cached);
    memoryCache.set(key, data); // 寫入內存緩存
    return data;
  }
  
  // 緩存未命中，從數據庫獲取
  const data = await fetchFromDatabase(key);
  
  // 寫入緩存
  await redis.setex(key, 3600, JSON.stringify(data)); // 1 小時過期
  memoryCache.set(key, data);
  
  return data;
}
```

**2. 緩存模式**

```javascript
// Cache-Aside（旁路緩存）
async function getUser(userId) {
  // 1. 先檢查緩存
  let user = await redis.get(`user:${userId}`);
  if (user) {
    return JSON.parse(user);
  }
  
  // 2. 緩存未命中，從數據庫獲取
  user = await db.users.findById(userId);
  
  // 3. 寫入緩存
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  
  return user;
}

// Write-Through（寫入時同時更新緩存和數據庫）
async function updateUser(userId, data) {
  const user = await db.users.update(userId, data);
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
}

// Write-Back（延遲寫入數據庫）
const writeBackQueue = [];

async function updateUser(userId, data) {
  // 立即更新緩存
  await redis.set(`user:${userId}`, JSON.stringify(data));
  
  // 異步寫入數據庫
  writeBackQueue.push({ userId, data });
  
  // 批量寫入
  if (writeBackQueue.length >= 100) {
    await flushWriteBackQueue();
  }
}
```

**3. 緩存失效**

```javascript
// 標籤緩存（Tag-based Cache Invalidation）
async function invalidateUserCache(userId) {
  // 刪除所有相關緩存
  const keys = await redis.keys(`user:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// 使用緩存版本號
async function getCachedData(key, version) {
  const cacheKey = `${key}:v${version}`;
  return await redis.get(cacheKey);
}

// 更新時增加版本號
async function updateData(key, data) {
  const newVersion = await redis.incr(`${key}:version`);
  await redis.setex(`${key}:v${newVersion}`, 3600, JSON.stringify(data));
}
```

#### API 設計優化

**1. GraphQL 數據獲取**

```javascript
// 避免過度獲取（Over-fetching）和獲取不足（Under-fetching）
// REST API
GET /api/users/1        // 獲取用戶基本信息
GET /api/users/1/posts  // 獲取用戶的帖子
GET /api/users/1/friends // 獲取用戶的朋友
// 需要 3 次請求

// GraphQL
query {
  user(id: 1) {
    name
    email
    posts {
      title
      content
    }
    friends {
      name
    }
  }
}
// 只需 1 次請求，只獲取需要的字段
```

**2. 批量請求**

```javascript
// ❌ 低效：多個單獨請求
async function getUsersData(userIds) {
  const users = [];
  for (const id of userIds) {
    const user = await fetch(`/api/users/${id}`);
    users.push(user);
  }
  return users;
}

// ✅ 高效：批量請求
async function getUsersData(userIds) {
  // 使用 GraphQL
  const query = `
    query GetUsers($ids: [ID!]!) {
      users(ids: $ids) {
        id
        name
        email
      }
    }
  `;
  
  return await graphqlClient.request(query, { ids: userIds });
}

// 或使用 REST 批量端點
async function getUsersData(userIds) {
  return await fetch('/api/users/batch', {
    method: 'POST',
    body: JSON.stringify({ ids: userIds })
  });
}
```

**3. 響應壓縮**

```javascript
// Next.js 自動壓縮
// next.config.js
module.exports = {
  compress: true, // 啟用 gzip 壓縮
};

// 手動設定壓縮級別
const compression = require('compression');
const app = express();

app.use(compression({
  level: 6, // 壓縮級別（1-9）
  filter: (req, res) => {
    // 只壓縮特定類型的回應
    return /json|text|javascript|css/.test(res.getHeader('content-type'));
  }
}));
```

### 4. 數據庫擴展

#### 讀寫分離（Read Replicas）

```javascript
// 主從數據庫配置
const masterDB = new MongoClient(process.env.MASTER_DB_URL);
const replicaDB = new MongoClient(process.env.REPLICA_DB_URL);

// 寫操作：使用主數據庫
async function createUser(userData) {
  return await masterDB.db('app').collection('users').insertOne(userData);
}

// 讀操作：使用從數據庫
async function getUser(userId) {
  return await replicaDB.db('app').collection('users').findOne({ _id: userId });
}

// 或使用數據庫驅動的讀寫分離
const client = new MongoClient(process.env.DB_URL, {
  readPreference: 'secondaryPreferred' // 優先從從庫讀取
});
```

#### 分片（Sharding）

```javascript
// 水平分片：根據用戶 ID 分片
function getShard(userId) {
  const shardIndex = hash(userId) % NUM_SHARDS;
  return shards[shardIndex];
}

async function getUser(userId) {
  const shard = getShard(userId);
  return await shard.db('app').collection('users').findOne({ _id: userId });
}

// 範圍分片：根據時間分片
function getShardByDate(date) {
  const year = date.getFullYear();
  return shards[year % NUM_SHARDS];
}
```

### 5. 異步處理

#### 消息隊列

```javascript
// 使用 Redis 作為消息隊列
import Bull from 'bull';

// 創建隊列
const emailQueue = new Bull('email', {
  redis: process.env.REDIS_URL
});

// 生產者：添加任務
async function sendEmail(to, subject, body) {
  await emailQueue.add({
    to,
    subject,
    body
  }, {
    attempts: 3, // 重試 3 次
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
}

// 消費者：處理任務
emailQueue.process(async (job) => {
  const { to, subject, body } = job.data;
  await sendEmailViaSMTP(to, subject, body);
});

// 優先級隊列
const highPriorityQueue = new Bull('high-priority');
const normalQueue = new Bull('normal');

// 高優先級任務
await highPriorityQueue.add({ type: 'urgent' }, { priority: 1 });

// 普通任務
await normalQueue.add({ type: 'normal' }, { priority: 10 });
```

#### 事件驅動架構

```javascript
// 使用 EventEmitter
const EventEmitter = require('events');
const eventBus = new EventEmitter();

// 發布事件
async function createOrder(orderData) {
  const order = await db.orders.create(orderData);
  
  // 發布事件，不阻塞主流程
  eventBus.emit('order.created', order);
  
  return order;
}

// 訂閱事件
eventBus.on('order.created', async (order) => {
  // 發送確認郵件
  await sendEmail(order.customerEmail, 'Order Confirmed', ...);
  
  // 更新庫存
  await updateInventory(order.items);
  
  // 記錄日誌
  await logEvent('order.created', order);
});
```

### 6. 監控和日誌

#### 性能監控

```javascript
// 使用 Performance API
function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start}ms`);
  
  // 發送到監控服務
  sendMetric(name, end - start);
  
  return result;
}

// Next.js API Route 監控
export default async function handler(req, res) {
  const start = performance.now();
  
  try {
    const data = await fetchData();
    const duration = performance.now() - start;
    
    // 記錄慢查詢
    if (duration > 1000) {
      logger.warn('Slow query detected', { duration, endpoint: req.url });
    }
    
    return res.json(data);
  } catch (error) {
    logger.error('API error', { error, endpoint: req.url });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### 錯誤追蹤

```javascript
// 使用 Sentry
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% 的請求追蹤
});

// 捕獲錯誤
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'checkout',
      userId: req.userId
    },
    extra: {
      requestData: req.body
    }
  });
  
  throw error;
}
```

#### 日誌聚合

```javascript
// 結構化日誌
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// 使用
logger.info({ userId: 123, action: 'login' }, 'User logged in');
logger.error({ error, userId: 123 }, 'Failed to process payment');

// 發送到日誌聚合服務（如 ELK Stack、Datadog）
```

### 7. 限流（Rate Limiting）

```javascript
// 使用 express-rate-limit
const rateLimit = require('express-rate-limit');

// API 限流
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 最多 100 次請求
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// 更細粒度的限流
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 5, // 最多 5 次
  skipSuccessfulRequests: true, // 成功請求不計入
});

app.use('/api/login', strictLimiter);

// 使用 Redis 實現分佈式限流
const RedisStore = require('rate-limit-redis');
const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

### 8. 實際案例：電商網站架構

```javascript
// 架構設計
/*
┌─────────────┐
│   CDN       │ 靜態資源（圖片、CSS、JS）
└─────────────┘
       │
┌─────────────┐
│ Load Balancer│ 負載均衡
└─────────────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│App 1│ │App 2│ 應用伺服器（無狀態）
└──┬──┘ └──┬──┘
   │       │
┌──▼───────▼──┐
│   Redis     │ 緩存和會話存儲
└─────────────┘
   │       │
┌──▼──┐ ┌──▼──┐
│ DB  │ │ DB  │ 主從數據庫
│Master│ │Slave│
└─────┘ └─────┘
   │
┌──▼──────────┐
│ Message Queue│ 異步任務處理
└─────────────┘
*/

// 產品列表頁面（高流量）
export default async function ProductsPage() {
  // 1. 檢查緩存
  const cacheKey = 'products:list';
  let products = await redis.get(cacheKey);
  
  if (!products) {
    // 2. 從數據庫讀取（使用讀庫）
    products = await replicaDB
      .collection('products')
      .find({ status: 'active' })
      .sort({ popularity: -1 })
      .limit(20)
      .toArray();
    
    // 3. 寫入緩存（5 分鐘）
    await redis.setex(cacheKey, 300, JSON.stringify(products));
  } else {
    products = JSON.parse(products);
  }
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// 下單 API（高並發）
export default async function createOrder(req, res) {
  // 1. 限流檢查
  const rateLimitKey = `order:${req.userId}`;
  const attempts = await redis.incr(rateLimitKey);
  if (attempts === 1) {
    await redis.expire(rateLimitKey, 60); // 1 分鐘
  }
  if (attempts > 5) {
    return res.status(429).json({ error: 'Too many orders' });
  }
  
  // 2. 庫存檢查（使用 Redis 原子操作）
  const inventoryKey = `inventory:${req.body.productId}`;
  const stock = await redis.decr(inventoryKey);
  
  if (stock < 0) {
    await redis.incr(inventoryKey); // 回滾
    return res.status(400).json({ error: 'Out of stock' });
  }
  
  // 3. 創建訂單（異步）
  const order = await db.orders.create({
    userId: req.userId,
    productId: req.body.productId,
    status: 'pending'
  });
  
  // 4. 發送到消息隊列處理
  await orderQueue.add({
    orderId: order.id,
    userId: req.userId,
    productId: req.body.productId
  });
  
  // 5. 立即返回
  return res.json({ orderId: order.id, status: 'processing' });
}
```

### 9. 最佳實踐總結

**架構層面：**
- ✅ 水平擴展，無狀態設計
- ✅ 使用負載均衡分散流量
- ✅ CDN 加速靜態資源
- ✅ 讀寫分離，使用讀庫處理查詢

**前端層面：**
- ✅ 代碼分割，按需載入
- ✅ 資源優化（圖片、字體）
- ✅ 多層緩存策略
- ✅ 預載入關鍵資源

**後端層面：**
- ✅ 數據庫索引優化
- ✅ 查詢優化，避免 N+1
- ✅ 多層緩存（內存 + Redis）
- ✅ 異步處理耗時任務

**運維層面：**
- ✅ 監控和告警
- ✅ 日誌聚合和分析
- ✅ 限流保護
- ✅ 自動擴縮容

**關鍵指標：**
- **響應時間**：< 200ms（P95）
- **可用性**：99.99%+
- **錯誤率**：< 0.1%
- **吞吐量**：根據業務需求

記住：高流量網站的設計是一個持續優化的過程，需要根據實際流量模式和業務需求不斷調整。
