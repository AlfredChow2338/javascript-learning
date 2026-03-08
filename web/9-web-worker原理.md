## Web Worker 原理

### 什麼是 Web Worker

**Web Worker** 是瀏覽器提供的 API，允許在後台線程中運行 JavaScript 代碼，而不阻塞主線程（UI 線程）。

**核心特點：**
- **多線程執行**：在獨立的線程中運行
- **不阻塞主線程**：不會影響頁面響應性
- **消息傳遞**：通過消息與主線程通信
- **獨立環境**：無法直接訪問 DOM 和 window 對象

### 為什麼需要 Web Worker

**問題場景：**
- 複雜計算導致頁面卡頓
- 大量數據處理阻塞 UI
- 需要長時間運行的任務

**Web Worker 的優勢：**
- 保持頁面響應性
- 充分利用多核 CPU
- 並行處理任務

---

## 一、工作原理

### 1.1 線程模型

```
┌─────────────────────────────────────┐
│        Main Thread (UI Thread)      │
│  - DOM的操作                         │
│  - 事件處理                          │
│  - 渲染                              │
└──────────────┬──────────────────────┘
               │
               │ postMessage()
               │ onmessage
               │
               ▼
┌─────────────────────────────────────┐
│        Worker Thread                │
│  - 計算任務                          │
│  - 數據處理                          │
│  - 無法訪問 DOM                      │
└─────────────────────────────────────┘
```

### 1.2 通信機制

**消息傳遞：**
- 主線程和 Worker 通過 `postMessage()` 發送消息
- 通過 `onmessage` 接收消息
- 數據會被序列化（Structured Clone Algorithm）

**序列化限制：**
- ✅ 基本類型（string、number、boolean）
- ✅ 對象、數組
- ✅ TypedArray、ArrayBuffer
- ❌ 函數
- ❌ DOM 節點
- ❌ Error 對象

---

## 二、Worker 類型

### 2.1 Dedicated Worker（專用 Worker）

**特點：**
- 只能被創建它的腳本訪問
- 最常用的 Worker 類型
- 與主線程一對一關係

```javascript
// 主線程：main.js
const worker = new Worker('worker.js');

worker.postMessage({ type: 'start', data: [1, 2, 3] });

worker.onmessage = (event) => {
  console.log('Result:', event.data);
};

worker.onerror = (error) => {
  console.error('Worker error:', error);
};

// Worker 線程：worker.js
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  if (type === 'start') {
    // 處理數據
    const result = data.map(x => x * 2);
    
    // 發送回主線程
    self.postMessage({ type: 'result', data: result });
  }
};
```

### 2.2 Shared Worker（共享 Worker）

**特點：**
- 可以被多個頁面/腳本共享
- 適合多標籤頁通信
- 需要通過 `port` 通信

```javascript
// 主線程
const sharedWorker = new SharedWorker('shared-worker.js');

sharedWorker.port.onmessage = (event) => {
  console.log('Message from shared worker:', event.data);
};

sharedWorker.port.postMessage({ message: 'Hello' });

// Shared Worker：shared-worker.js
let connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);
  
  port.onmessage = (event) => {
    // 廣播給所有連接
    connections.forEach(conn => {
      conn.postMessage(event.data);
    });
  };
};
```

### 2.3 Service Worker

**特點：**
- 主要用於離線和緩存
- 可以攔截網絡請求
- 在後台運行，即使頁面關閉

```javascript
// Service Worker：service-worker.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## 三、基本使用

### 3.1 創建和通信

```javascript
// 主線程
const worker = new Worker('worker.js');

// 發送消息
worker.postMessage('Hello from main thread');

// 接收消息
worker.onmessage = (event) => {
  console.log('Message from worker:', event.data);
};

// 錯誤處理
worker.onerror = (error) => {
  console.error('Worker error:', error);
};

// 終止 Worker
worker.terminate();
```

```javascript
// Worker 線程：worker.js
// 接收消息
self.onmessage = (event) => {
  console.log('Message from main:', event.data);
  
  // 處理任務
  const result = doHeavyWork(event.data);
  
  // 發送回主線程
  self.postMessage(result);
};

function doHeavyWork(data) {
  // 複雜計算
  return data * 2;
}
```

### 3.2 傳遞複雜數據

```javascript
// 主線程
const worker = new Worker('worker.js');

// 傳遞對象
worker.postMessage({
  type: 'process',
  data: {
    numbers: [1, 2, 3, 4, 5],
    operation: 'multiply'
  }
});

// 傳遞 TypedArray
const buffer = new ArrayBuffer(1024);
const view = new Uint8Array(buffer);
worker.postMessage(buffer, [buffer]); // 轉移所有權
```

```javascript
// Worker 線程
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  if (type === 'process') {
    const result = data.numbers.map(n => n * 2);
    self.postMessage({ result });
  }
  
  // 處理 ArrayBuffer
  if (event.data instanceof ArrayBuffer) {
    const view = new Uint8Array(event.data);
    // 處理數據
  }
};
```

### 3.3 錯誤處理

```javascript
// 主線程
const worker = new Worker('worker.js');

worker.onerror = (error) => {
  console.error('Worker error:', error.message);
  console.error('Filename:', error.filename);
  console.error('Line number:', error.lineno);
};

// Worker 線程
self.onmessage = (event) => {
  try {
    // 可能出錯的操作
    const result = riskyOperation(event.data);
    self.postMessage({ success: true, result });
  } catch (error) {
    // 發送錯誤信息
    self.postMessage({ 
      success: false, 
      error: error.message 
    });
  }
};
```

---

## 四、實際應用場景

### 4.1 複雜計算

```javascript
// 主線程
const worker = new Worker('calculator.js');

function calculateLargeSum(numbers) {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      if (event.data.type === 'result') {
        resolve(event.data.result);
      }
    };
    
    worker.onerror = reject;
    worker.postMessage({ type: 'calculate', numbers });
  });
}

// 使用
calculateLargeSum(Array.from({ length: 1000000 }, (_, i) => i))
  .then(result => console.log('Sum:', result));

// Worker：calculator.js
self.onmessage = (event) => {
  const { type, numbers } = event.data;
  
  if (type === 'calculate') {
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    self.postMessage({ type: 'result', result: sum });
  }
};
```

### 4.2 圖像處理

```javascript
// 主線程
const worker = new Worker('image-processor.js');

function processImage(imageData) {
  return new Promise((resolve) => {
    worker.onmessage = (event) => {
      resolve(event.data);
    };
    
    worker.postMessage({ type: 'process', imageData });
  });
}

// Worker：image-processor.js
self.onmessage = (event) => {
  const { type, imageData } = event.data;
  
  if (type === 'process') {
    // 處理圖像數據
    const processed = applyFilter(imageData);
    self.postMessage(processed);
  }
};

function applyFilter(imageData) {
  // 圖像處理邏輯（模糊、銳化等）
  // 這是一個 CPU 密集型操作
  return imageData;
}
```

### 4.3 數據解析

```javascript
// 主線程
const worker = new Worker('parser.js');

function parseLargeJSON(jsonString) {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      if (event.data.type === 'parsed') {
        resolve(event.data.data);
      } else if (event.data.type === 'error') {
        reject(new Error(event.data.error));
      }
    };
    
    worker.postMessage({ type: 'parse', json: jsonString });
  });
}

// Worker：parser.js
self.onmessage = (event) => {
  const { type, json } = event.data;
  
  if (type === 'parse') {
    try {
      const data = JSON.parse(json);
      self.postMessage({ type: 'parsed', data });
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message });
    }
  }
};
```

### 4.4 實時數據處理

```javascript
// 主線程
const worker = new Worker('data-processor.js');

// 持續發送數據
setInterval(() => {
  const data = generateData();
  worker.postMessage({ type: 'data', data });
}, 100);

worker.onmessage = (event) => {
  if (event.data.type === 'processed') {
    updateUI(event.data.result);
  }
};

// Worker：data-processor.js
let buffer = [];

self.onmessage = (event) => {
  const { type, data } = event.data;
  
  if (type === 'data') {
    buffer.push(data);
    
    // 批量處理
    if (buffer.length >= 100) {
      const processed = processBatch(buffer);
      self.postMessage({ type: 'processed', result: processed });
      buffer = [];
    }
  }
};

function processBatch(data) {
  // 批量處理邏輯
  return data.map(item => transform(item));
}
```

---

## 五、高級用法

### 5.1 Worker Pool（線程池）

```javascript
// Worker Pool 實現
class WorkerPool {
  constructor(workerScript, poolSize = navigator.hardwareConcurrency || 4) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];
    this.activeWorkers = 0;
    
    // 初始化 Worker
    for (let i = 0; i < poolSize; i++) {
      this.workers.push({
        worker: new Worker(workerScript),
        busy: false
      });
    }
  }
  
  execute(task) {
    return new Promise((resolve, reject) => {
      const worker = this.getAvailableWorker();
      
      if (worker) {
        this.runTask(worker, task, resolve, reject);
      } else {
        this.queue.push({ task, resolve, reject });
      }
    });
  }
  
  getAvailableWorker() {
    return this.workers.find(w => !w.busy);
  }
  
  runTask(workerObj, task, resolve, reject) {
    workerObj.busy = true;
    this.activeWorkers++;
    
    const cleanup = () => {
      workerObj.busy = false;
      this.activeWorkers--;
      
      // 處理隊列中的下一個任務
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this.runTask(workerObj, next.task, next.resolve, next.reject);
      }
    };
    
    workerObj.worker.onmessage = (event) => {
      resolve(event.data);
      cleanup();
    };
    
    workerObj.worker.onerror = (error) => {
      reject(error);
      cleanup();
    };
    
    workerObj.worker.postMessage(task);
  }
  
  terminate() {
    this.workers.forEach(w => w.worker.terminate());
  }
}

// 使用
const pool = new WorkerPool('worker.js', 4);

// 並行執行多個任務
Promise.all([
  pool.execute({ type: 'task1', data: 1 }),
  pool.execute({ type: 'task2', data: 2 }),
  pool.execute({ type: 'task3', data: 3 }),
  pool.execute({ type: 'task4', data: 4 })
]).then(results => {
  console.log('All tasks completed:', results);
});
```

### 5.2 動態創建 Worker

```javascript
// 使用 Blob URL 動態創建 Worker
function createWorkerFromCode(code) {
  const blob = new Blob([code], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  
  // 清理 URL
  worker.addEventListener('terminate', () => {
    URL.revokeObjectURL(url);
  });
  
  return worker;
}

// 使用
const workerCode = `
  self.onmessage = (event) => {
    const result = event.data * 2;
    self.postMessage(result);
  };
`;

const worker = createWorkerFromCode(workerCode);
worker.postMessage(5);
worker.onmessage = (event) => {
  console.log('Result:', event.data); // 10
};
```

### 5.3 使用 importScripts

```javascript
// Worker 中可以導入其他腳本
// worker.js
importScripts('utils.js', 'helper.js');

self.onmessage = (event) => {
  // 可以使用導入的函數
  const result = processData(event.data);
  self.postMessage(result);
};

// utils.js
function processData(data) {
  return data.map(x => x * 2);
}
```

---

## 六、限制和注意事項

### 6.1 無法訪問的對象

**Worker 中無法訪問：**
- ❌ `window` 對象
- ❌ `document` 對象
- ❌ DOM API
- ❌ `parent` 對象
- ❌ 某些 Web API（如 localStorage）

**Worker 中可以訪問：**
- ✅ `self`（Worker 全局對象）
- ✅ `navigator`
- ✅ `location`（只讀）
- ✅ `XMLHttpRequest` / `fetch`
- ✅ `WebSocket`
- ✅ `IndexedDB`

### 6.2 數據傳遞限制

```javascript
// ❌ 不能傳遞函數
function myFunction() {}
worker.postMessage({ fn: myFunction }); // 錯誤

// ❌ 不能傳遞 DOM 節點
const element = document.getElementById('myDiv');
worker.postMessage({ element }); // 錯誤

// ✅ 可以傳遞可序列化的數據
worker.postMessage({
  numbers: [1, 2, 3],
  text: 'Hello',
  object: { key: 'value' }
});
```

### 6.3 同源限制

```javascript
// ✅ 同源 Worker
const worker = new Worker('/worker.js');

// ❌ 跨域 Worker（需要 CORS）
const worker = new Worker('https://other-domain.com/worker.js');
// 需要服務器設置正確的 CORS 頭部
```

---

## 七、性能優化

### 7.1 使用 Transferable Objects

```javascript
// 轉移所有權，避免複製
const buffer = new ArrayBuffer(1024 * 1024); // 1MB

// 轉移所有權，主線程無法再訪問 buffer
worker.postMessage(buffer, [buffer]);

// 使用 TypedArray
const view = new Uint8Array(buffer);
worker.postMessage(view.buffer, [view.buffer]);
```

### 7.2 批量處理

```javascript
// Worker：批量處理數據
let batch = [];

self.onmessage = (event) => {
  batch.push(event.data);
  
  // 累積到一定數量再處理
  if (batch.length >= 100) {
    const results = processBatch(batch);
    self.postMessage({ type: 'batch', results });
    batch = [];
  }
};
```

### 7.3 使用 Worker Pool

```javascript
// 使用線程池並行處理
const pool = new WorkerPool('worker.js', 4);

const tasks = Array.from({ length: 100 }, (_, i) => i);

// 並行執行
Promise.all(tasks.map(task => pool.execute(task)))
  .then(results => {
    console.log('All tasks completed');
  });
```

---

## 八、最佳實踐

### 8.1 錯誤處理

```javascript
// 主線程
const worker = new Worker('worker.js');

worker.onerror = (error) => {
  console.error('Worker error:', error);
  // 清理資源
  worker.terminate();
  // 降級處理
  fallbackToMainThread();
};
```

### 8.2 資源清理

```javascript
// 組件卸載時清理 Worker
useEffect(() => {
  const worker = new Worker('worker.js');
  
  return () => {
    worker.terminate();
  };
}, []);
```

### 8.3 進度報告

```javascript
// Worker：報告進度
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  if (type === 'process') {
    const total = data.length;
    
    data.forEach((item, index) => {
      processItem(item);
      
      // 每處理 10% 報告一次
      if (index % (total / 10) === 0) {
        self.postMessage({
          type: 'progress',
          progress: (index / total) * 100
        });
      }
    });
    
    self.postMessage({ type: 'complete' });
  }
};
```

---

## 九、與其他技術的對比

### 9.1 Web Worker vs setTimeout/setInterval

| 特性 | Web Worker | setTimeout/setInterval |
|------|-----------|------------------------|
| **執行線程** | 獨立線程 | 主線程 |
| **阻塞** | 不阻塞 UI | 可能阻塞 UI |
| **適用場景** | CPU 密集型任務 | 簡單延遲/定時 |

### 9.2 Web Worker vs WebAssembly

| 特性 | Web Worker | WebAssembly |
|------|-----------|-------------|
| **語言** | JavaScript | 多種語言編譯 |
| **性能** | 較好 | 更好（接近原生） |
| **使用難度** | 簡單 | 較複雜 |
| **適用場景** | 一般計算 | 高性能計算 |

---

## 十、常見問題

### Q1: Worker 可以訪問 localStorage 嗎？

**A:** 不可以，Worker 無法訪問 localStorage。可以使用 IndexedDB 或通過消息傳遞。

### Q2: 如何共享 Worker 之間的數據？

**A:** 使用 SharedWorker 或通過主線程中轉消息。

### Q3: Worker 可以創建子 Worker 嗎？

**A:** 可以，Worker 可以創建嵌套的 Worker。

```javascript
// Worker 中創建子 Worker
const subWorker = new Worker('sub-worker.js');
subWorker.postMessage('Hello from parent worker');
```

---

## 總結

**Web Worker 核心要點：**

1. **多線程執行**：在獨立線程中運行，不阻塞主線程
2. **消息傳遞**：通過 postMessage 和 onmessage 通信
3. **數據序列化**：使用 Structured Clone Algorithm
4. **獨立環境**：無法訪問 DOM 和 window 對象

**使用建議：**
- CPU 密集型任務使用 Worker
- 保持主線程響應性
- 使用 Worker Pool 並行處理
- 及時清理 Worker 資源

**適用場景：**
- 複雜計算
- 圖像處理
- 數據解析
- 實時數據處理

理解 Web Worker 的原理和使用方法，可以幫助構建更流暢、響應更快的 Web 應用。
