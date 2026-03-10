## Service Worker 原理

### 什麼是 Service Worker

**Service Worker** 是瀏覽器提供的 API，是一個在瀏覽器後台運行的腳本，獨立於網頁主線程，可以攔截網絡請求、緩存資源、實現離線功能。

**核心特點：**
- **後台運行**：即使頁面關閉也能運行
- **網絡代理**：可以攔截和處理網絡請求
- **離線支持**：提供離線功能
- **推送通知**：支持後台推送通知
- **獨立線程**：在獨立線程中運行，不阻塞主線程

### 為什麼需要 Service Worker

**問題場景：**
- 網絡不穩定時無法訪問應用
- 重複請求相同資源，浪費帶寬
- 需要後台推送通知
- 需要離線功能

**Service Worker 的優勢：**
- 離線訪問應用
- 提升加載速度（緩存）
- 減少網絡請求
- 支持推送通知
- 更好的用戶體驗

---

## 一、工作原理

### 1.1 生命週期

```
┌─────────────────────────────────────┐
│     Registration (註冊)             │
│  navigator.serviceWorker.register() │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Installation (安裝)              │
│  install 事件                        │
│  - 下載 Service Worker 文件          │
│  - 緩存資源                          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Activation (激活)                │
│  activate 事件                       │
│  - 清理舊緩存                        │
│  - 控制頁面                          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Idle (空閒)                      │
│  - 等待事件                          │
│  - 攔截請求                          │
└─────────────────────────────────────┘
```

### 1.2 線程模型

```
┌─────────────────────────────────────┐
│        Main Thread                  │
│  - DOM 操作                          │
│  - 事件處理                          │
│  - 渲染                              │
└──────────────┬──────────────────────┘
               │
               │ postMessage()
               │
               ▼
┌─────────────────────────────────────┐
│     Service Worker Thread            │
│  - 攔截網絡請求                       │
│  - 緩存管理                          │
│  - 後台任務                          │
│  - 無法訪問 DOM                      │
└─────────────────────────────────────┘
```

### 1.3 作用域（Scope）

**Service Worker 的作用域：**
- Service Worker 只能控制其所在目錄及子目錄的頁面
- 作用域由 Service Worker 文件的位置決定

```javascript
// Service Worker 文件：/sw.js
// 可以控制：
// - /index.html ✅
// - /about/index.html ✅
// - /app/page.html ✅

// 無法控制：
// - /parent/index.html ❌（上一級目錄）
```

---

## 二、基本使用

### 2.1 註冊 Service Worker

```javascript
// 主線程：main.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
```

### 2.2 Service Worker 文件

```javascript
// Service Worker：sw.js

// 安裝事件
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  
  // 等待安裝完成
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/app.js'
      ]);
    })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
  // 清理舊緩存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== 'v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 攔截網絡請求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 如果緩存中有，返回緩存
      if (response) {
        return response;
      }
      
      // 否則從網絡獲取
      return fetch(event.request);
    })
  );
});
```

---

## 三、緩存策略

### 3.1 Cache First（緩存優先）

**策略：** 優先使用緩存，緩存未命中時從網絡獲取。

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 緩存命中
      if (response) {
        return response;
      }
      
      // 緩存未命中，從網絡獲取
      return fetch(event.request).then(response => {
        // 緩存響應
        const responseToCache = response.clone();
        caches.open('v1').then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});
```

**適用場景：**
- 靜態資源（圖片、CSS、JS）
- 不經常更新的內容

### 3.2 Network First（網絡優先）

**策略：** 優先從網絡獲取，網絡失敗時使用緩存。

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 網絡成功，更新緩存
        const responseToCache = response.clone();
        caches.open('v1').then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // 網絡失敗，使用緩存
        return caches.match(event.request);
      })
  );
});
```

**適用場景：**
- 需要最新數據的內容
- API 請求
- 動態內容

### 3.3 Stale While Revalidate（過期重新驗證）

**策略：** 立即返回緩存，同時在後台更新緩存。

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open('v1').then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // 在後台更新緩存
        const fetchPromise = fetch(event.request).then(networkResponse => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        
        // 立即返回緩存（如果有的話）
        return cachedResponse || fetchPromise;
      });
    })
  );
});
```

**適用場景：**
- 需要快速響應的內容
- 可以接受稍微過期的數據

### 3.4 Network Only（僅網絡）

**策略：** 只從網絡獲取，不使用緩存。

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
```

**適用場景：**
- 需要實時數據
- 認證相關請求

### 3.5 Cache Only（僅緩存）

**策略：** 只使用緩存，不訪問網絡。

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});
```

**適用場景：**
- 離線模式
- 完全靜態的資源

---

## 四、實際應用場景

### 4.1 離線應用

```javascript
// Service Worker：sw.js
const CACHE_NAME = 'offline-v1';
const OFFLINE_URL = '/offline.html';

// 安裝時緩存離線頁面
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        OFFLINE_URL,
        '/styles.css',
        '/app.js'
      ]);
    })
  );
  // 立即激活
  self.skipWaiting();
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 網絡成功，緩存響應
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // 網絡失敗，返回離線頁面
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        // 其他請求返回緩存
        return caches.match(event.request);
      })
  );
});
```

### 4.2 圖片緩存

```javascript
// Service Worker：sw.js
const IMAGE_CACHE = 'images-v1';

self.addEventListener('fetch', (event) => {
  // 只處理圖片請求
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request).then(response => {
            // 只緩存成功的響應
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
  }
});
```

### 4.3 API 請求緩存

```javascript
// Service Worker：sw.js
const API_CACHE = 'api-v1';

self.addEventListener('fetch', (event) => {
  // 只處理 API 請求
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 網絡成功，緩存響應
          const responseToCache = response.clone();
          caches.open(API_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // 網絡失敗，使用緩存
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // 緩存也沒有，返回錯誤
            return new Response(
              JSON.stringify({ error: 'Offline' }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
  }
});
```

---

## 五、推送通知

### 5.1 訂閱推送

```javascript
// 主線程：main.js
async function subscribeToPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    
    // 請求通知權限
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('Notification permission denied');
      return;
    }
    
    // 訂閱推送
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    // 發送訂閱信息到服務器
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  }
}

// 轉換 VAPID 公鑰
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### 5.2 接收推送

```javascript
// Service Worker：sw.js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/badge.png',
    tag: data.tag || 'notification',
    data: data.data,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});
```

### 5.3 處理通知點擊

```javascript
// Service Worker：sw.js
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // 如果已經有打開的窗口，聚焦它
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // 否則打開新窗口
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
```

---

## 六、後台同步（Background Sync）

### 6.1 註冊後台同步

```javascript
// 主線程：main.js
async function syncData() {
  if ('serviceWorker' in navigator && 'sync' in self.registration) {
    const registration = await navigator.serviceWorker.ready;
    
    try {
      await registration.sync.register('sync-data');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}
```

### 6.2 處理後台同步

```javascript
// Service Worker：sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // 從 IndexedDB 獲取待同步的數據
    const pendingData = await getPendingDataFromIndexedDB();
    
    // 同步到服務器
    for (const data of pendingData) {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // 標記為已同步
      await markAsSynced(data.id);
    }
  } catch (error) {
    console.error('Sync failed:', error);
    throw error; // 重新觸發同步
  }
}
```

---

## 七、消息傳遞

### 7.1 主線程 → Service Worker

```javascript
// 主線程：main.js
navigator.serviceWorker.ready.then(registration => {
  registration.active.postMessage({
    type: 'SKIP_WAITING'
  });
});
```

### 7.2 Service Worker → 主線程

```javascript
// Service Worker：sw.js
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 向所有客戶端發送消息
self.clients.matchAll().then(clients => {
  clients.forEach(client => {
    client.postMessage({ type: 'UPDATE_AVAILABLE' });
  });
});
```

### 7.3 主線程接收消息

```javascript
// 主線程：main.js
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_AVAILABLE') {
    // 提示用戶更新
    showUpdateNotification();
  }
});
```

---

## 八、更新機制

### 8.1 檢查更新

```javascript
// 主線程：main.js
async function checkForUpdate() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    
    // 檢查更新
    await registration.update();
    
    // 監聽更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 新版本已安裝，提示用戶刷新
          showUpdateNotification();
        }
      });
    });
  }
}

// 定期檢查更新
setInterval(checkForUpdate, 60000); // 每分鐘檢查一次
```

### 8.2 強制更新

```javascript
// Service Worker：sw.js
self.addEventListener('install', (event) => {
  // 跳過等待，立即激活
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 立即控制所有客戶端
  event.waitUntil(
    self.clients.claim().then(() => {
      // 通知所有客戶端
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_ACTIVATED' });
        });
      });
    })
  );
});
```

---

## 九、最佳實踐

### 9.1 緩存版本管理

```javascript
// Service Worker：sw.js
const CACHE_VERSION = 'v2';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/app.js'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 刪除舊版本的緩存
          if (cacheName.startsWith('app-cache-') && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
```

### 9.2 錯誤處理

```javascript
// Service Worker：sw.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            // 只緩存成功的響應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // 返回離線頁面或錯誤響應
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
```

### 9.3 資源清理

```javascript
// Service Worker：sw.js
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

async function cleanOldCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  // 如果緩存超過限制，刪除最舊的
  if (keys.length > MAX_CACHE_SIZE) {
    const oldestKey = keys[0];
    await cache.delete(oldestKey);
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanOldCache());
});
```

---

## 十、限制和注意事項

### 10.1 HTTPS 要求

**Service Worker 只能在 HTTPS 環境下運行（localhost 除外）。**

```javascript
// ✅ 生產環境：必須使用 HTTPS
// https://example.com/sw.js

// ✅ 開發環境：localhost 可以使用 HTTP
// http://localhost:3000/sw.js

// ❌ 其他 HTTP 環境無法使用
// http://example.com/sw.js
```

### 10.2 作用域限制

```javascript
// Service Worker 文件：/sw.js
// 可以控制：/、/about、/app 等
// 無法控制：上一級目錄

// 如果需要控制整個域名，將 Service Worker 放在根目錄
// /sw.js 可以控制整個域名
```

### 10.3 無法訪問的 API

**Service Worker 中無法訪問：**
- ❌ `window` 對象
- ❌ `document` 對象
- ❌ DOM API
- ❌ `localStorage`（可以使用 IndexedDB）

**Service Worker 中可以訪問：**
- ✅ `self`（Service Worker 全局對象）
- ✅ `fetch` API
- ✅ `Cache` API
- ✅ `IndexedDB`
- ✅ `PushManager`
- ✅ `Notification` API

---

## 十一、調試技巧

### 11.1 Chrome DevTools

```javascript
// 在 Service Worker 中使用 console
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  // 在 Chrome DevTools > Application > Service Workers 中查看
});

// 使用 debugger 斷點
self.addEventListener('fetch', (event) => {
  debugger; // 在 DevTools 中暫停
  event.respondWith(fetch(event.request));
});
```

### 11.2 更新和重新註冊

```javascript
// 在 DevTools Console 中執行
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.unregister();
  });
});

// 清除緩存
caches.keys().then(cacheNames => {
  cacheNames.forEach(cacheName => {
    caches.delete(cacheName);
  });
});
```

---

## 十二、常見問題

### Q1: Service Worker 不更新怎麼辦？

**A:** 確保 Service Worker 文件內容改變，瀏覽器會檢測到更新。也可以使用 `skipWaiting()` 強制更新。

### Q2: 如何清除 Service Worker？

**A:** 在 DevTools > Application > Service Workers 中點擊 "Unregister"，或使用代碼：

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

### Q3: Service Worker 可以跨域嗎？

**A:** 不可以，Service Worker 必須與頁面同源。

---

## 總結

**Service Worker 核心要點：**

1. **後台運行**：獨立線程，不阻塞主線程
2. **網絡代理**：可以攔截和處理網絡請求
3. **緩存管理**：提供多種緩存策略
4. **離線支持**：實現離線功能
5. **推送通知**：支持後台推送

**使用建議：**
- 使用合適的緩存策略
- 管理緩存版本
- 處理錯誤情況
- 及時更新 Service Worker

**適用場景：**
- PWA 應用
- 離線功能
- 性能優化
- 推送通知

理解 Service Worker 的原理和使用方法，可以幫助構建更強大、更流暢的 Web 應用。
