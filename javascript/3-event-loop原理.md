## Event Loop（事件循環）原理

### 為什麼需要 Event Loop

JavaScript 是**單線程**的語言，這意味著它一次只能執行一個任務。但我們需要處理：
- 用戶交互（點擊、輸入）
- 網路請求（API 調用）
- 定時器（setTimeout、setInterval）
- 文件讀寫（Node.js）

如果這些操作都是同步的，瀏覽器會**阻塞**，用戶無法與頁面交互。Event Loop 讓 JavaScript 能夠處理異步操作，同時保持單線程模型。

### Event Loop 的核心組件

```
┌─────────────────────────────────────────┐
│           JavaScript Engine             │
│  ┌───────────────────────────────────┐  │
│  │        Call Stack                 │  │
│  │  - 同步代碼執行的地方                │  │
│  │  - LIFO                           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    │ 異步操作完成
                    ▼
┌─────────────────────────────────────────┐
│         Web APIs / Node.js APIs         │
│  - setTimeout / setInterval             │
│  - fetch / XMLHttpRequest               │
│  - DOM events                           │
│  - fs.readFile (Node.js)                │
└─────────────────────────────────────────┘
                    │
                    │ callback function
                    ▼
┌─────────────────────────────────────────┐
│  Task Queue (Macrotask Queue)           │
│  - setTimeout callback                  │
│  - setInterval callback                 │
│  - I/O callback                         │
└─────────────────────────────────────────┘
                    │
                    │
┌─────────────────────────────────────────┐
│  Microtask Queue                        │
│  - Promise.then / catch / finally       │
│  - queueMicrotask()                     │
│  - MutationObserver                     │
└─────────────────────────────────────────┘
                    │
                    │ Event Loop
                    │ 持續檢查
                    ▼
         ┌──────────────────┐
         │ Call Stack為空嗎? │
         └──────────────────┘
                    │
         ┌──────────┴─────────┐
         │                    │
         是                   否
         │                    │
         ▼                    │
┌─────────────────┐           │
│ exec Microtask  │           │
│ exec Macrotask  │           │
└─────────────────┘           │
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
                 繼續執行
```

### 1. Call Stack（調用堆疊）

**作用：** 存儲函數調用，追蹤當前執行位置。

**特性：**
- LIFO（後進先出）
- 同步執行
- 當堆疊為空時，Event Loop 才會處理隊列

**範例：**

```javascript
function a() {
  console.log('a');
  b();
}

function b() {
  console.log('b');
  c();
}

function c() {
  console.log('c');
}

a();

// 執行過程：
// Call Stack:
// [a]          -> 調用 a
// [a, b]       -> a 調用 b
// [a, b, c]    -> b 調用 c
// [a, b]       -> c 執行完，返回
// [a]          -> b 執行完，返回
// []           -> a 執行完，堆疊為空
```

### 2. Web APIs / Node.js APIs

**作用：** 處理異步操作，不阻塞主線程。

**常見 API：**

```javascript
// 瀏覽器環境
setTimeout(() => {}, 1000);
setInterval(() => {}, 1000);
fetch('https://api.example.com');
addEventListener('click', handler);

// Node.js 環境
setTimeout(() => {}, 1000);
fs.readFile('file.txt', callback);
http.get('https://api.example.com', callback);
```

**執行流程：**

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
}, 1000);

console.log('3');

// 執行順序：
// 1. console.log('1') -> Call Stack，立即執行，打印 1
// 2. setTimeout -> Call Stack，但立即交給 Web API 處理
// 3. console.log('3') -> Call Stack，立即執行，打印 3
// 4. Call Stack 為空
// 5. 1 秒後，Web API 完成，回調函數進入 Task Queue
// 6. Event Loop 檢查 Call Stack 為空，將回調推入 Call Stack
// 7. console.log('2') -> Call Stack，執行，打印 2

// 輸出：1, 3, 2
```

### 3. Task Queue（Macrotask Queue / 宏任務隊列）

**包含：**
- `setTimeout` 回調
- `setInterval` 回調
- I/O 操作回調
- UI 渲染（某些瀏覽器）

**特性：**
- 先進先出（FIFO）
- 每次 Event Loop 只處理一個任務
- 處理完一個任務後，會先檢查 Microtask Queue

### 4. Microtask Queue（微任務隊列）

**包含：**
- `Promise.then()` / `catch()` / `finally()`
- `queueMicrotask()`
- `MutationObserver`（瀏覽器）
- `process.nextTick()`（Node.js，優先級更高）

**特性：**
- 優先級高於 Macrotask
- 每次 Event Loop 會**清空所有** Microtask
- 如果 Microtask 中又產生新的 Microtask，會繼續執行直到清空

### 5. Event Loop 執行順序

**完整流程：**

```
1. 執行 Call Stack 中的同步代碼
2. Call Stack 為空時：
   a. 執行所有 Microtask（直到清空）
   b. 執行一個 Macrotask
   c. 回到步驟 2
```

**詳細範例：**

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

Promise.resolve().then(() => {
  console.log('3');
});

console.log('4');

// 執行過程：
// 時間 0ms:
//   1. console.log('1') -> Call Stack，打印 1
//   2. setTimeout -> Web API，0ms 後回調進入 Macrotask Queue
//   3. Promise.then -> 回調進入 Microtask Queue
//   4. console.log('4') -> Call Stack，打印 4
//   5. Call Stack 為空
//
// 時間 0ms+（Event Loop）:
//   6. 檢查 Microtask Queue，有 Promise 回調
//   7. 執行 Promise 回調，打印 3
//   8. Microtask Queue 為空
//   9. 檢查 Macrotask Queue，有 setTimeout 回調
//   10. 執行 setTimeout 回調，打印 2
//
// 輸出：1, 4, 3, 2
```

### 6. 深入理解：Microtask vs Macrotask

#### 範例一：基本順序

```javascript
console.log('start');

setTimeout(() => {
  console.log('timeout');
}, 0);

Promise.resolve().then(() => {
  console.log('promise');
});

console.log('end');

// 輸出：start, end, promise, timeout
// 解釋：
// 1. 同步代碼：start, end
// 2. Microtask（Promise）：promise
// 3. Macrotask（setTimeout）：timeout
```

#### 範例二：Microtask 會清空所有

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

Promise.resolve().then(() => {
  console.log('3');
  Promise.resolve().then(() => {
    console.log('4');
  });
});

Promise.resolve().then(() => {
  console.log('5');
});

console.log('6');

// 輸出：1, 6, 3, 5, 4, 2
// 解釋：
// 1. 同步：1, 6
// 2. Microtask Queue: [promise3, promise5]
// 3. 執行 promise3，又產生新的 promise4
// 4. Microtask Queue: [promise5, promise4]
// 5. 執行 promise5
// 6. 執行 promise4
// 7. Microtask Queue 為空
// 8. 執行 Macrotask（setTimeout），打印 2
```

#### 範例三：嵌套的異步操作

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  
  Promise.resolve().then(() => {
    console.log('3');
  });
  
  setTimeout(() => {
    console.log('4');
  }, 0);
}, 0);

Promise.resolve().then(() => {
  console.log('5');
});

console.log('6');

// 輸出：1, 6, 5, 2, 3, 4
// 解釋：
// 1. 同步：1, 6
// 2. Microtask：5
// 3. Macrotask（第一個 setTimeout）：2
//    執行時又產生 Microtask（3）和 Macrotask（4）
// 4. 先執行 Microtask：3
// 5. 再執行 Macrotask：4
```

### 7. 實際應用場景

#### 場景一：DOM 更新

```javascript
// React 的 setState 是異步的，使用 Microtask
function Component() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    // count 不會立即更新，因為 setState 是異步的
    
    // 使用函數式更新
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    // 這樣才能正確累加
  };
}
```

#### 場景二：Promise 鏈式調用

```javascript
Promise.resolve()
  .then(() => {
    console.log('1');
    return Promise.resolve();
  })
  .then(() => {
    console.log('2');
  });

Promise.resolve()
  .then(() => {
    console.log('3');
  });

// 輸出：1, 3, 2
// 解釋：
// 第一個 Promise 的 then 執行，打印 1，返回新的 Promise
// 第二個 Promise 的 then 執行，打印 3
// 第一個 Promise 的第二個 then 執行，打印 2
```

#### 場景三：async/await

```javascript
async function async1() {
  console.log('1');
  await async2();
  console.log('2');
}

async function async2() {
  console.log('3');
}

console.log('4');
async1();
console.log('5');

// 輸出：4, 1, 3, 5, 2
// 解釋：
// 1. 同步：4
// 2. 調用 async1，打印 1
// 3. await async2，執行 async2，打印 3
// 4. await 後面的代碼（console.log('2')）進入 Microtask Queue
// 5. 同步：5
// 6. Microtask：2
```

**async/await 本質：**

```javascript
// async/await 是 Promise 的語法糖
async function example() {
  await promise;
  console.log('after await');
}

// 等價於：
function example() {
  return promise.then(() => {
    console.log('after await');
  });
}
```

### 8. 常見陷阱

#### 陷阱一：setTimeout 的延遲不準確

```javascript
console.log('start');
const start = Date.now();

setTimeout(() => {
  console.log('timeout:', Date.now() - start);
}, 100);

// 執行耗時操作
for (let i = 0; i < 1000000000; i++) {
  // 阻塞主線程
}

// 輸出：timeout: 可能 > 100ms
// 原因：setTimeout 只保證「至少」100ms 後執行
// 如果 Call Stack 有任務，會延遲執行
```

#### 陷阱二：無限 Microtask 循環

```javascript
function infiniteMicrotask() {
  Promise.resolve().then(() => {
    console.log('microtask');
    infiniteMicrotask(); // 無限遞迴
  });
}

infiniteMicrotask();
// 會阻塞主線程，因為 Event Loop 會一直執行 Microtask
// 永遠不會執行 Macrotask
```

#### 陷阱三：Promise 和 setTimeout 的順序

```javascript
Promise.resolve().then(() => {
  console.log('promise 1');
  
  setTimeout(() => {
    console.log('timeout in promise');
  }, 0);
  
  Promise.resolve().then(() => {
    console.log('promise 2');
  });
});

// 輸出：promise 1, promise 2, timeout in promise
// 解釋：即使 setTimeout 在 Promise 中，也要等所有 Microtask 執行完
```

### 9. Node.js 的特殊情況

#### process.nextTick

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

process.nextTick(() => {
  console.log('3');
});

Promise.resolve().then(() => {
  console.log('4');
});

// Node.js 輸出：1, 3, 4, 2
// 解釋：
// process.nextTick 優先級最高
// 然後是 Promise（Microtask）
// 最後是 setTimeout（Macrotask）
```

**優先級（Node.js）：**
1. `process.nextTick`（最高）
2. `Promise.then`（Microtask）
3. `setTimeout` / `setImmediate`（Macrotask）

### 10. 性能優化建議

#### 避免阻塞主線程

```javascript
// ❌ 阻塞主線程
function heavyComputation() {
  let sum = 0;
  for (let i = 0; i < 10000000000; i++) {
    sum += i;
  }
  return sum;
}

// ✅ 使用 Web Worker
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ start: 0, end: 10000000000 });
worker.onmessage = (e) => {
  console.log('Result:', e.data);
};

// worker.js
self.onmessage = (e) => {
  const { start, end } = e.data;
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += i;
  }
  self.postMessage(sum);
};
```

#### 使用 requestIdleCallback

```javascript
// 在瀏覽器空閒時執行非關鍵任務
function scheduleWork() {
  requestIdleCallback((deadline) => {
    while (deadline.timeRemaining() > 0) {
      // 執行非關鍵任務
      processData();
    }
    
    // 如果還有工作，再次調度
    if (hasMoreWork()) {
      scheduleWork();
    }
  });
}
```

### 11. 總結

**Event Loop 核心要點：**

1. **JavaScript 是單線程的**
   - 一次只能執行一個任務
   - Event Loop 讓異步操作成為可能

2. **執行順序**
   - 同步代碼（Call Stack）
   - 所有 Microtask（清空為止）
   - 一個 Macrotask
   - 重複

3. **Microtask 優先級高於 Macrotask**
   - Promise.then 會先於 setTimeout 執行
   - Microtask 會全部執行完才執行 Macrotask

4. **常見 Microtask**
   - Promise.then / catch / finally
   - queueMicrotask()
   - MutationObserver

5. **常見 Macrotask**
   - setTimeout / setInterval
   - I/O 操作
   - UI 渲染

**記憶口訣：**
- 同步代碼先執行
- Microtask 優先於 Macrotask
- Microtask 要清空，Macrotask 一次一個

理解 Event Loop 對於調試異步代碼、優化性能和避免常見陷阱至關重要。
