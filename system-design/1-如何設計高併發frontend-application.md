## 如何設計高併發前端應用

### 什麼是高併發前端應用

**高併發前端應用**通常指：
- **同時在線用戶**：數萬到數十萬
- **實時數據更新**：每秒數千到數萬次更新
- **高頻交互**：用戶頻繁操作，需要即時響應
- **大量數據渲染**：需要渲染數萬條數據而不卡頓

**典型場景：**
- 交易平台（幣安、Coinbase）
- 社交媒體（Twitter、Facebook）
- 實時協作工具（Google Docs、Figma）
- 遊戲平台
- 直播平台

### 核心挑戰

**1. 性能挑戰**
- 大量 DOM 操作導致渲染卡頓
- 頻繁的狀態更新導致重新渲染
- 內存佔用過高
- 網絡請求過多

**2. 數據同步挑戰**
- 多個數據源需要同步
- 實時數據更新
- 數據一致性保證

**3. 用戶體驗挑戰**
- 響應速度要求高
- 不能有明顯的延遲
- 需要流暢的交互

---

## 一、架構設計原則

### 1.1 分層架構

```
┌─────────────────────────────────────┐
│      Presentation Layer             │
│  (UI Components, Views)             │
├─────────────────────────────────────┤
│      State Management Layer         │
│  (Redux, Zustand, Context)          │
├─────────────────────────────────────┤
│      Data Layer                     │
│  (API, WebSocket, Cache)            │
├─────────────────────────────────────┤
│      Infrastructure Layer           │
│  (Error Handling, Monitoring)       │
└─────────────────────────────────────┘
```

### 1.2 模塊化設計

```javascript
// 模塊化架構
class HighConcurrencyApp {
  constructor() {
    // 核心模塊
    this.dataLayer = new DataLayer();
    this.stateManager = new StateManager();
    this.cacheManager = new CacheManager();
    this.wsManager = new WebSocketManager();
    this.errorHandler = new ErrorHandler();
    this.performanceMonitor = new PerformanceMonitor();
  }

  async initialize() {
    // 初始化各個模塊
    await Promise.all([
      this.dataLayer.initialize(),
      this.cacheManager.initialize(),
      this.wsManager.connect(),
      this.performanceMonitor.start()
    ]);
  }
}
```

---

## 二、數據層設計

### 2.1 WebSocket 實時數據流

**為什麼使用 WebSocket：**
- 避免輪詢，減少服務器負載
- 實時雙向通信
- 降低延遲

```javascript
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.subscriptions = new Map();
    this.messageQueue = [];
    this.heartbeatInterval = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('wss://api.example.com/ws');

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // 發送待處理的消息
        this.messageQueue.forEach(msg => this.send(msg));
        this.messageQueue = [];
        
        // 啟動心跳
        this.startHeartbeat();
        
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.errorHandler.handle(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.stopHeartbeat();
        this.reconnect();
      };
    });
  }

  // 訂閱數據流
  subscribe(channel, callback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel).add(callback);

    // 發送訂閱請求
    this.send({
      type: 'subscribe',
      channel: channel
    });
  }

  unsubscribe(channel, callback) {
    const callbacks = this.subscriptions.get(channel);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(channel);
        this.send({
          type: 'unsubscribe',
          channel: channel
        });
      }
    }
  }

  // 處理消息
  handleMessage(data) {
    const { channel, payload } = data;
    const callbacks = this.subscriptions.get(channel);

    if (callbacks) {
      // 使用 requestIdleCallback 優化性能
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          callbacks.forEach(callback => callback(payload));
        });
      } else {
        // 降級到 setTimeout
        setTimeout(() => {
          callbacks.forEach(callback => callback(payload));
        }, 0);
      }
    }
  }

  // 發送消息
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // 連接未建立，加入隊列
      this.messageQueue.push(message);
    }
  }

  // 心跳機制
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // 30 秒
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 自動重連
  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts})`);
        this.connect();
      }, delay);
    }
  }
}
```

### 2.2 數據請求優化

#### 請求去重（Request Deduplication）

```javascript
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  async request(key, requestFn) {
    // 如果已有相同請求在進行，返回同一個 Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // 創建新請求
    const promise = requestFn()
      .finally(() => {
        // 請求完成後移除
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// 使用範例
const deduplicator = new RequestDeduplicator();

async function fetchUserData(userId) {
  return deduplicator.request(
    `user:${userId}`,
    () => fetch(`/api/users/${userId}`).then(r => r.json())
  );
}

// 多個組件同時請求同一用戶數據，只會發送一次請求
```

#### 請求批處理（Request Batching）

```javascript
class RequestBatcher {
  constructor(batchDelay = 50) {
    this.batchDelay = batchDelay;
    this.batch = [];
    this.timeout = null;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.batch.push({ request, resolve, reject });
      
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.flush();
      }, this.batchDelay);
    });
  }

  async flush() {
    if (this.batch.length === 0) return;

    const batch = [...this.batch];
    this.batch = [];

    try {
      // 批量請求
      const requests = batch.map(b => b.request);
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
      });

      const results = await response.json();
      
      // 分發結果
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      // 所有請求都失敗
      batch.forEach(item => item.reject(error));
    }
  }
}

// 使用範例
const batcher = new RequestBatcher();

async function fetchMultipleUsers(userIds) {
  const promises = userIds.map(id =>
    batcher.add({
      url: `/api/users/${id}`,
      method: 'GET'
    })
  );
  return Promise.all(promises);
}
```

### 2.3 數據流管理

```javascript
class DataStreamManager {
  constructor() {
    this.streams = new Map();
    this.buffer = new Map();
    this.batchSize = 100;
    this.batchInterval = 100; // ms
  }

  // 訂閱數據流
  subscribe(streamId, callback) {
    if (!this.streams.has(streamId)) {
      this.streams.set(streamId, {
        callbacks: new Set(),
        buffer: [],
        lastFlush: Date.now()
      });
    }

    const stream = this.streams.get(streamId);
    stream.callbacks.add(callback);

    // 返回取消訂閱函數
    return () => {
      stream.callbacks.delete(callback);
      if (stream.callbacks.size === 0) {
        this.streams.delete(streamId);
      }
    };
  }

  // 接收數據更新
  receive(streamId, data) {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    // 加入緩衝區
    stream.buffer.push(data);

    // 批量處理
    const now = Date.now();
    if (
      stream.buffer.length >= this.batchSize ||
      now - stream.lastFlush >= this.batchInterval
    ) {
      this.flush(streamId);
    }
  }

  // 刷新緩衝區
  flush(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream || stream.buffer.length === 0) return;

    const updates = [...stream.buffer];
    stream.buffer = [];
    stream.lastFlush = Date.now();

    // 通知所有訂閱者
    stream.callbacks.forEach(callback => {
      // 使用 requestIdleCallback 優化
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => callback(updates));
      } else {
        setTimeout(() => callback(updates), 0);
      }
    });
  }
}
```

---

## 三、狀態管理優化

### 3.1 選擇性訂閱

```javascript
// 使用 Zustand 實現選擇性訂閱
import create from 'zustand';

const useStore = create((set, get) => ({
  users: {},
  prices: {},
  orders: {},
  
  updateUser: (userId, userData) => set((state) => ({
    users: { ...state.users, [userId]: userData }
  })),
  
  updatePrice: (symbol, price) => set((state) => ({
    prices: { ...state.prices, [symbol]: price }
  }))
}));

// 組件只訂閱需要的數據
function UserProfile({ userId }) {
  // 只訂閱特定用戶，不會因為其他用戶更新而重新渲染
  const user = useStore(state => state.users[userId]);
  
  return <div>{user?.name}</div>;
}

function PriceDisplay({ symbol }) {
  // 只訂閱特定交易對的價格
  const price = useStore(state => state.prices[symbol]);
  
  return <div>{price}</div>;
}
```

### 3.2 狀態分片（State Sharding）

```javascript
// 將大狀態分割成多個小狀態
const useUserStore = create((set) => ({
  users: {},
  updateUser: (id, data) => set((state) => ({
    users: { ...state.users, [id]: data }
  }))
}));

const usePriceStore = create((set) => ({
  prices: {},
  updatePrice: (symbol, price) => set((state) => ({
    prices: { ...state.prices, [symbol]: price }
  }))
}));

const useOrderStore = create((set) => ({
  orders: {},
  updateOrder: (id, data) => set((state) => ({
    orders: { ...state.orders, [id]: data }
  }))
}));
```

### 3.3 狀態更新優化

```javascript
// 批量更新狀態
class StateUpdater {
  constructor(store) {
    this.store = store;
    this.pendingUpdates = new Map();
    this.updateTimer = null;
  }

  scheduleUpdate(key, updater) {
    this.pendingUpdates.set(key, updater);
    
    if (!this.updateTimer) {
      this.updateTimer = requestAnimationFrame(() => {
        this.flushUpdates();
      });
    }
  }

  flushUpdates() {
    const updates = new Map(this.pendingUpdates);
    this.pendingUpdates.clear();
    this.updateTimer = null;

    // 批量應用更新
    this.store.batch(() => {
      updates.forEach(updater => updater());
    });
  }
}
```

---

## 四、組件渲染優化

### 4.1 虛擬滾動

```javascript
// 使用 react-window 處理大量列表
import { FixedSizeList } from 'react-window';
import { memo } from 'react';

const Row = memo(({ index, style, data }) => {
  const item = data[index];
  return (
    <div style={style}>
      <ItemComponent item={item} />
    </div>
  );
});

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={100}
      width="100%"
      itemData={items}
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 4.2 組件懶加載

```javascript
// 代碼分割和懶加載
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));
const ChartComponent = lazy(() => import('./ChartComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
      <ChartComponent />
    </Suspense>
  );
}
```

### 4.3 渲染節流

```javascript
// 使用 requestAnimationFrame 節流渲染
class RenderThrottler {
  constructor() {
    this.pendingUpdates = new Set();
    this.rafId = null;
  }

  scheduleUpdate(componentId, updateFn) {
    this.pendingUpdates.add({ componentId, updateFn });
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flushUpdates();
      });
    }
  }

  flushUpdates() {
    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();
    this.rafId = null;

    updates.forEach(({ updateFn }) => {
      updateFn();
    });
  }
}
```

---

## 五、緩存策略

### 5.1 多層緩存

```javascript
class MultiLayerCache {
  constructor() {
    // L1: 內存緩存（最快）
    this.memoryCache = new Map();
    
    // L2: IndexedDB（持久化）
    this.indexedDBCache = null;
    
    // L3: Service Worker Cache（網絡層）
    this.serviceWorkerCache = null;
  }

  async get(key) {
    // 1. 檢查內存緩存
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // 2. 檢查 IndexedDB
    const dbValue = await this.indexedDBCache?.get(key);
    if (dbValue) {
      this.memoryCache.set(key, dbValue);
      return dbValue;
    }

    // 3. 檢查 Service Worker Cache
    const swValue = await this.serviceWorkerCache?.get(key);
    if (swValue) {
      this.memoryCache.set(key, swValue);
      await this.indexedDBCache?.set(key, swValue);
      return swValue;
    }

    return null;
  }

  async set(key, value, ttl = 3600000) {
    // 設置所有層
    this.memoryCache.set(key, value);
    await this.indexedDBCache?.set(key, value, ttl);
    await this.serviceWorkerCache?.set(key, value, ttl);
  }
}
```

### 5.2 智能緩存更新

```javascript
class SmartCache {
  constructor() {
    this.cache = new Map();
    this.staleTime = 5 * 60 * 1000; // 5 分鐘
    this.refetchInterval = 10 * 60 * 1000; // 10 分鐘
  }

  async get(key, fetcher) {
    const cached = this.cache.get(key);
    const now = Date.now();

    // 緩存未過期，直接返回
    if (cached && now - cached.timestamp < this.staleTime) {
      return cached.value;
    }

    // 緩存過期但未超過 refetch 時間，返回舊值並後台更新
    if (cached && now - cached.timestamp < this.refetchInterval) {
      // 後台更新
      fetcher().then(value => {
        this.cache.set(key, { value, timestamp: now });
      });
      return cached.value;
    }

    // 需要重新獲取
    const value = await fetcher();
    this.cache.set(key, { value, timestamp: now });
    return value;
  }
}
```

---

## 六、錯誤處理和降級

### 6.1 錯誤邊界

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 報告錯誤到監控系統
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 6.2 降級策略

```javascript
class DegradationManager {
  constructor() {
    this.strategies = new Map();
  }

  // 註冊降級策略
  registerStrategy(condition, strategy) {
    this.strategies.set(condition, strategy);
  }

  // 執行降級
  async execute(key, primaryFn, fallbackFn) {
    try {
      return await primaryFn();
    } catch (error) {
      console.warn(`Primary function failed, using fallback:`, error);
      
      // 檢查是否有自定義降級策略
      const strategy = this.strategies.get(key);
      if (strategy) {
        return await strategy(error);
      }
      
      // 使用默認降級
      return await fallbackFn();
    }
  }
}

// 使用範例
const degradationManager = new DegradationManager();

// WebSocket 失敗時降級到輪詢
degradationManager.registerStrategy('websocket', async (error) => {
  console.log('WebSocket failed, falling back to polling');
  return new PollingManager();
});

// API 失敗時使用緩存
degradationManager.registerStrategy('api', async (error) => {
  return cache.get('fallback-data');
});
```

### 6.3 重試機制

```javascript
class RetryManager {
  async retry(fn, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
      retryCondition = () => true
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // 檢查是否應該重試
        if (!retryCondition(error) || attempt === maxRetries) {
          throw error;
        }

        // 計算延遲
        const delay = exponentialBackoff
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
```

---

## 七、性能監控

### 7.1 性能指標收集

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTime: [],
      apiLatency: [],
      memoryUsage: []
    };
  }

  // 監測組件渲染時間
  measureRender(componentName, renderFn) {
    const start = performance.now();
    const result = renderFn();
    const duration = performance.now() - start;

    this.metrics.renderTime.push({
      component: componentName,
      duration,
      timestamp: Date.now()
    });

    // 如果渲染時間過長，報告
    if (duration > 16) { // 超過一幀時間
      this.reportSlowRender(componentName, duration);
    }

    return result;
  }

  // 監測 API 延遲
  async measureAPI(endpoint, apiFn) {
    const start = performance.now();
    try {
      const result = await apiFn();
      const duration = performance.now() - start;

      this.metrics.apiLatency.push({
        endpoint,
        duration,
        success: true,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.metrics.apiLatency.push({
        endpoint,
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  // 監測內存使用
  measureMemory() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.metrics.memoryUsage.push({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });

      // 內存使用過高時警告
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        console.warn(`High memory usage: ${usagePercent.toFixed(2)}%`);
      }
    }
  }

  // 報告慢渲染
  reportSlowRender(componentName, duration) {
    // 發送到監控系統
    this.sendMetric('slow_render', {
      component: componentName,
      duration,
      timestamp: Date.now()
    });
  }

  // 發送指標
  sendMetric(type, data) {
    // 批量發送，避免過多請求
    if (!this.sendTimer) {
      this.sendTimer = setTimeout(() => {
        fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metrics: this.pendingMetrics
          })
        });
        this.pendingMetrics = [];
        this.sendTimer = null;
      }, 5000);
    }

    this.pendingMetrics.push({ type, data });
  }
}
```

### 7.2 Web Vitals 監測

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals(metric) {
  // 發送到監控系統
  fetch('/api/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      navigationType: metric.navigationType
    }),
    keepalive: true // 確保在頁面卸載時也能發送
  });
}

// 收集所有 Web Vitals
getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

---

## 八、完整架構示例

### 8.1 交易平台架構

```javascript
class TradingPlatform {
  constructor() {
    // 核心模塊
    this.wsManager = new WebSocketManager();
    this.cacheManager = new MultiLayerCache();
    this.stateManager = new StateManager();
    this.requestBatcher = new RequestBatcher();
    this.errorHandler = new ErrorHandler();
    this.performanceMonitor = new PerformanceMonitor();
    
    // 數據流管理
    this.dataStreamManager = new DataStreamManager();
    
    // 降級管理
    this.degradationManager = new DegradationManager();
  }

  async initialize() {
    try {
      // 1. 初始化緩存
      await this.cacheManager.initialize();
      
      // 2. 連接 WebSocket（帶降級）
      await this.degradationManager.execute(
        'websocket',
        () => this.wsManager.connect(),
        () => this.fallbackToPolling()
      );
      
      // 3. 訂閱數據流
      this.subscribeDataStreams();
      
      // 4. 啟動性能監控
      this.performanceMonitor.start();
      
      // 5. 設置錯誤處理
      this.setupErrorHandling();
      
    } catch (error) {
      this.errorHandler.handle(error);
    }
  }

  subscribeDataStreams() {
    // 訂閱價格更新
    this.wsManager.subscribe('ticker', (data) => {
      this.dataStreamManager.receive('prices', data);
    });

    // 訂閱訂單簿更新
    this.wsManager.subscribe('depth', (data) => {
      this.dataStreamManager.receive('orderbook', data);
    });

    // 訂閱交易更新
    this.wsManager.subscribe('trade', (data) => {
      this.dataStreamManager.receive('trades', data);
    });
  }

  // 降級到輪詢
  async fallbackToPolling() {
    console.log('Falling back to polling');
    const pollingManager = new PollingManager();
    await pollingManager.start();
    return pollingManager;
  }

  setupErrorHandling() {
    // 全局錯誤處理
    window.addEventListener('error', (event) => {
      this.errorHandler.handle(event.error);
    });

    // Promise 錯誤處理
    window.addEventListener('unhandledrejection', (event) => {
      this.errorHandler.handle(event.reason);
    });
  }
}
```

### 8.2 React 組件集成

```javascript
// 使用 Context 提供全局服務
const AppContext = createContext();

function AppProvider({ children }) {
  const [platform] = useState(() => new TradingPlatform());

  useEffect(() => {
    platform.initialize();
    return () => {
      platform.cleanup();
    };
  }, []);

  return (
    <AppContext.Provider value={platform}>
      {children}
    </AppContext.Provider>
  );
}

// 使用 Hook 訪問服務
function useTradingPlatform() {
  return useContext(AppContext);
}

// 組件使用
function PriceDisplay({ symbol }) {
  const platform = useTradingPlatform();
  const [price, setPrice] = useState(null);

  useEffect(() => {
    // 訂閱價格更新
    const unsubscribe = platform.dataStreamManager.subscribe(
      'prices',
      (updates) => {
        const symbolUpdate = updates.find(u => u.symbol === symbol);
        if (symbolUpdate) {
          setPrice(symbolUpdate.price);
        }
      }
    );

    return unsubscribe;
  }, [symbol, platform]);

  return <div>{price}</div>;
}
```

---

## 九、性能優化技巧

### 9.1 使用 Web Workers

```javascript
// worker.js
self.onmessage = function(e) {
  const { data, operation } = e.data;

  let result;
  switch(operation) {
    case 'processData':
      result = processLargeDataset(data);
      break;
    case 'calculate':
      result = performHeavyCalculation(data);
      break;
  }

  self.postMessage({ result });
};

// 主線程使用
const worker = new Worker('worker.js');

function processInWorker(data) {
  return new Promise((resolve) => {
    worker.postMessage({ data, operation: 'processData' });
    worker.onmessage = (e) => resolve(e.data.result);
  });
}
```

### 9.2 使用 Intersection Observer

```javascript
// 懶加載圖片和組件
function LazyComponent({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? children : <Placeholder />}
    </div>
  );
}
```

### 9.3 使用 requestIdleCallback

```javascript
// 在空閒時間執行非關鍵任務
function scheduleLowPriorityTask(task) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(task, { timeout: 2000 });
  } else {
    // 降級到 setTimeout
    setTimeout(task, 0);
  }
}

// 使用範例
scheduleLowPriorityTask(() => {
  // 預加載下一頁數據
  preloadNextPage();
  
  // 清理舊數據
  cleanupOldData();
});
```

---

## 十、最佳實踐總結

### 10.1 架構設計檢查清單

✅ **數據層**
- [ ] 使用 WebSocket 獲取實時數據
- [ ] 實現請求去重和批處理
- [ ] 多層緩存策略
- [ ] 數據流管理

✅ **狀態管理**
- [ ] 選擇性訂閱，避免不必要的重新渲染
- [ ] 狀態分片，減少單一 store 的大小
- [ ] 批量更新狀態

✅ **組件優化**
- [ ] 虛擬滾動處理大量數據
- [ ] 組件懶加載
- [ ] 使用 React.memo 和 useMemo
- [ ] 渲染節流

✅ **錯誤處理**
- [ ] 錯誤邊界
- [ ] 降級策略
- [ ] 重試機制

✅ **性能監控**
- [ ] 收集性能指標
- [ ] Web Vitals 監測
- [ ] 錯誤追蹤

### 10.2 性能目標

```
指標                   目標值
─────────────────────────────
FCP (First Contentful Paint)  < 1.8s
LCP (Largest Contentful Paint) < 2.5s
TTI (Time to Interactive)      < 3.8s
FID (First Input Delay)        < 100ms
CLS (Cumulative Layout Shift)  < 0.1
```

### 10.3 擴展性考慮

**水平擴展：**
- 無狀態設計
- CDN 分發
- 負載均衡

**垂直優化：**
- 代碼分割
- 資源優化
- 緩存策略

---

## 總結

**高併發前端應用的核心設計原則：**

1. **分層架構**：清晰的職責分離
2. **數據層優化**：WebSocket、請求優化、緩存
3. **狀態管理**：選擇性訂閱、狀態分片
4. **渲染優化**：虛擬滾動、懶加載、節流
5. **錯誤處理**：降級策略、重試機制
6. **性能監控**：持續監測和優化

**關鍵技術：**
- WebSocket 實時通信
- 多層緩存策略
- 虛擬滾動
- 請求去重和批處理
- 性能監控和錯誤追蹤

理解這些設計原則和技術，可以幫助構建能夠處理高併發的前端應用，提供流暢的用戶體驗。
