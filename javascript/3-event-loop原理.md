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

### 6.5 為什麼要區分 Microtask 和 Macrotask Queue？

這是 Event Loop 設計中的核心問題。JavaScript 為什麼不只用一個任務隊列，而要區分 Microtask 和 Macrotask？

#### 6.5.1 設計目標：優先級和時機控制

**核心原因：需要不同的執行時機和優先級**

JavaScript 需要處理兩類不同性質的異步任務：

1. **需要立即響應的任務**（Microtask）
   - Promise 回調：需要盡快處理，保證異步操作的連續性
   - DOM 變更觀察：需要在渲染前完成，確保 DOM 狀態一致
   - 狀態更新：需要在用戶看到 UI 前完成

2. **可以延遲的任務**（Macrotask）
   - 定時器：有明確的延遲需求
   - I/O 操作：通常不緊急
   - UI 渲染：需要等待所有同步和微任務完成

#### 6.5.2 如果只有一個隊列會怎樣？

**假設只有一個任務隊列：**

```javascript
// 假設所有異步任務都在同一個隊列
console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

Promise.resolve().then(() => {
  console.log('3');
});

setTimeout(() => {
  console.log('4');
}, 0);

// 如果只有一個隊列，可能的輸出：1, 2, 3, 4
// 但這樣會有問題：
```

**問題一：Promise 響應延遲**

```javascript
// 如果 Promise 和 setTimeout 在同一個隊列
Promise.resolve().then(() => {
  console.log('promise 1');
});

setTimeout(() => {
  console.log('timeout 1');
}, 0);

Promise.resolve().then(() => {
  console.log('promise 2');
});

setTimeout(() => {
  console.log('timeout 2');
}, 0);

// 單一隊列可能的順序：promise 1, timeout 1, promise 2, timeout 2
// 問題：Promise 鏈式調用會被 setTimeout 打斷
// 用戶體驗：異步操作不連續，感覺「卡頓」
```

**問題二：DOM 更新時機錯誤**

```javascript
// 如果沒有 Microtask，DOM 更新可能在不正確的時機執行
button.addEventListener('click', () => {
  // 修改 DOM
  div.textContent = 'Updated';
  
  // 如果 MutationObserver 和 setTimeout 在同一個隊列
  // MutationObserver 可能晚於渲染執行，導致觀察不到變更
  observer.observe(div, { childList: true });
  
  setTimeout(() => {
    // 渲染可能已經發生，但 observer 還沒執行
  }, 0);
});
```

#### 6.5.3 區分隊列的優勢

**優勢一：保證 Promise 的連續性**

```javascript
// 使用 Microtask，Promise 鏈式調用是連續的
Promise.resolve()
  .then(() => {
    console.log('1');
    return Promise.resolve();
  })
  .then(() => {
    console.log('2');
  });

setTimeout(() => {
  console.log('3');
}, 0);

Promise.resolve().then(() => {
  console.log('4');
});

// 輸出：1, 4, 2, 3
// 解釋：
// - Promise 回調（1, 4, 2）都在 Microtask Queue
// - 會連續執行，不會被 setTimeout 打斷
// - 保證異步操作的連續性和可預測性
```

**優勢二：DOM 更新的正確時機**

```javascript
// Microtask 在渲染前執行，保證 DOM 狀態一致
const div = document.createElement('div');
div.textContent = 'Initial';

// MutationObserver 使用 Microtask
const observer = new MutationObserver(() => {
  console.log('DOM changed');
});

observer.observe(div, { childList: true });

// 修改 DOM
div.textContent = 'Updated';

// 執行順序：
// 1. 同步代碼執行完
// 2. Microtask（MutationObserver）執行，觀察到變更
// 3. 瀏覽器渲染
// 4. Macrotask（如果有）執行

// 如果沒有 Microtask，observer 可能在渲染後才執行，觀察不到變更
```

**優勢三：狀態更新的原子性**

```javascript
// React/Vue 等框架使用 Microtask 批量更新狀態
function Component() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount((prev) => prev + 1);  // 狀態更新 1
    setCount((prev) => prev + 1);  // 狀態更新 2
    setCount((prev) => prev + 1);  // 狀態更新 3
    
    // 如果使用 Macrotask，三個更新可能分散執行
    // 使用 Microtask，三個更新會批量處理，只觸發一次渲染
  };
}

// 使用 Microtask 的優勢：
// 1. 批量更新，減少渲染次數
// 2. 在渲染前完成所有狀態更新
// 3. 保證 UI 的一致性
```

#### 6.5.4 執行時機的差異

**Microtask 的執行時機：**
- 在當前執行棧清空後**立即執行**
- 在瀏覽器渲染**之前**執行
- 保證在**同一事件循環**中完成

**Macrotask 的執行時機：**
- 在 Microtask 全部執行完後執行
- 在瀏覽器渲染**之後**執行（可能）
- 可能跨多個事件循環

**視覺化對比：**

```
事件循環時間線：

同步代碼執行
    ↓
Microtask Queue（全部執行）
    ↓
瀏覽器渲染（可能）
    ↓
Macrotask Queue（執行一個）
    ↓
Microtask Queue（全部執行）
    ↓
瀏覽器渲染（可能）
    ↓
Macrotask Queue（執行一個）
    ↓
...
```

#### 6.5.5 實際應用：為什麼 Promise 用 Microtask？

**Promise 的設計目標：**
1. **異步操作的連續性**：Promise 鏈式調用應該連續執行
2. **狀態的一致性**：Promise 狀態變更應該立即生效
3. **錯誤處理的及時性**：錯誤應該盡快傳播

**如果 Promise 使用 Macrotask：**

```javascript
// 假設 Promise 使用 Macrotask
Promise.resolve()
  .then(() => {
    console.log('1');
    return Promise.resolve();
  })
  .then(() => {
    console.log('2');
  });

setTimeout(() => {
  console.log('3');
}, 0);

// 可能的輸出：3, 1, 2
// 問題：
// 1. Promise 鏈被 setTimeout 打斷
// 2. 異步操作不連續，用戶體驗差
// 3. 錯誤處理可能延遲
```

**使用 Microtask 的優勢：**

```javascript
// Promise 使用 Microtask
Promise.resolve()
  .then(() => {
    console.log('1');
    return Promise.resolve();
  })
  .then(() => {
    console.log('2');
  });

setTimeout(() => {
  console.log('3');
}, 0);

// 輸出：1, 2, 3
// 優勢：
// 1. Promise 鏈連續執行
// 2. 異步操作可預測
// 3. 錯誤處理及時
```

#### 6.5.6 性能考慮

**Microtask 的優勢：**
- **低延遲**：立即執行，響應快
- **批量處理**：可以批量處理多個相關任務
- **減少渲染**：在渲染前完成，減少重複渲染

**Macrotask 的優勢：**
- **不阻塞**：可以讓瀏覽器有機會渲染
- **可控延遲**：適合定時任務
- **資源管理**：可以控制任務的執行頻率

**平衡設計：**

```javascript
// 設計原則：
// 1. 緊急任務用 Microtask（Promise、狀態更新）
// 2. 非緊急任務用 Macrotask（定時器、I/O）
// 3. 保證用戶交互的響應性
// 4. 避免阻塞渲染

// 示例：React 的狀態更新
function Component() {
  const [state, setState] = useState(0);
  
  // setState 使用 Microtask，保證：
  // 1. 多個 setState 批量處理
  // 2. 在渲染前完成
  // 3. 狀態更新原子性
  const handleClick = () => {
    setState(1);
    setState(2);
    setState(3);
    // 只觸發一次渲染，最終 state = 3
  };
}
```

#### 6.5.7 總結：為什麼要區分？

**核心原因總結：**

1. **優先級需求**：不同任務有不同的緊急程度
   - Microtask：需要立即響應（Promise、DOM 觀察）
   - Macrotask：可以延遲（定時器、I/O）

2. **執行時機**：不同任務需要在不同時機執行
   - Microtask：渲染前執行，保證狀態一致
   - Macrotask：渲染後執行，不阻塞渲染

3. **用戶體驗**：保證交互的流暢性
   - Microtask：保證異步操作的連續性
   - Macrotask：給瀏覽器渲染的機會

4. **性能優化**：批量處理和減少渲染
   - Microtask：批量處理相關任務
   - Macrotask：控制任務執行頻率

5. **語義清晰**：明確任務的性質和預期行為
   - Microtask：立即、連續、原子性
   - Macrotask：延遲、可中斷、可調度

**設計哲學：**
- **Microtask**：用於需要「立即」處理的任務，保證連續性和一致性
- **Macrotask**：用於可以「延遲」的任務，給系統調度的空間

這種設計讓 JavaScript 能夠在單線程環境下，既保證關鍵任務的及時性，又給瀏覽器渲染和系統調度留出空間，實現了性能和用戶體驗的平衡。

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
