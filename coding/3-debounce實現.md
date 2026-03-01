## Debounce 實現

### 什麼是 Debounce

**Debounce（防抖）** 是一種限制函數執行頻率的技術。它確保函數在連續觸發時，只在最後一次觸發後等待一段時間才執行。

**核心思想：** 如果函數在短時間內被多次調用，只執行最後一次調用。

### 使用場景

**1. 搜索框輸入**

```javascript
// ❌ 沒有 debounce：每次輸入都發送請求
input.addEventListener('input', (e) => {
  search(e.target.value); // 輸入 "react" 會發送 5 次請求
});

// ✅ 使用 debounce：停止輸入 300ms 後才發送請求
const debouncedSearch = debounce((query) => {
  search(query);
}, 300);

input.addEventListener('input', (e) => {
  debouncedSearch(e.target.value); // 只發送 1 次請求
});
```

**2. 窗口大小調整**

```javascript
// ❌ 沒有 debounce：調整窗口時頻繁觸發
window.addEventListener('resize', () => {
  recalculateLayout(); // 可能觸發數十次
});

// ✅ 使用 debounce：停止調整 200ms 後才執行
const debouncedResize = debounce(() => {
  recalculateLayout();
}, 200);

window.addEventListener('resize', debouncedResize);
```

**3. 按鈕點擊防重複提交**

```javascript
// ✅ 防止用戶快速點擊提交按鈕
const debouncedSubmit = debounce(() => {
  submitForm();
}, 1000);

button.addEventListener('click', debouncedSubmit);
```

### 基本實現

#### 版本一：最簡單的實現

```javascript
function debounce(func, delay) {
  let timeoutId;
  
  return function(...args) {
    // 清除之前的定時器
    clearTimeout(timeoutId);
    
    // 設置新的定時器
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
```

**工作原理：**

```javascript
時間線示例
用戶輸入 "r" → 設置定時器（300ms）
100ms 後輸入 "e" → 清除前一個定時器，設置新定時器（300ms）
150ms 後輸入 "a" → 清除前一個定時器，設置新定時器（300ms）
200ms 後輸入 "c" → 清除前一個定時器，設置新定時器（300ms）
250ms 後輸入 "t" → 清除前一個定時器，設置新定時器（300ms）
停止輸入...
550ms 後（250ms + 300ms）→ 執行函數，發送 "react" 的搜索請求
```

**使用範例：**

```javascript
function search(query) {
  console.log('Searching for:', query);
}

const debouncedSearch = debounce(search, 300);

// 快速連續調用
debouncedSearch('r');
debouncedSearch('re');
debouncedSearch('rea');
debouncedSearch('reac');
debouncedSearch('react');

// 輸出（300ms 後）：
// Searching for: react
// 只執行最後一次
```

#### 版本二：保持 this 上下文

```javascript
function debounce(func, delay) {
  let timeoutId;
  
  return function(...args) {
    const context = this; // 保存 this 上下文
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func.apply(context, args); // 使用保存的上下文
    }, delay);
  };
}
```

**為什麼需要保存 this：**

```javascript
const obj = {
  name: 'MyObject',
  sayHello: debounce(function() {
    console.log('Hello from', this.name);
  }, 100)
};

obj.sayHello(); // 如果沒有保存 this，會輸出 undefined
// 正確輸出：Hello from MyObject
```

### 進階實現

#### 版本三：支援立即執行（Immediate）

**需求：** 第一次調用立即執行，後續調用才 debounce

```javascript
function debounce(func, delay, immediate = false) {
  let timeoutId;
  
  return function(...args) {
    const context = this;
    const callNow = immediate && !timeoutId; // 第一次調用且沒有待執行的定時器
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      timeoutId = null; // 重置，允許下次立即執行
      if (!immediate) {
        func.apply(context, args);
      }
    }, delay);
    
    // 如果設置了 immediate 且是第一次調用，立即執行
    if (callNow) {
      func.apply(context, args);
    }
  };
}
```

**使用範例：**

```javascript
// 立即執行版本
const debouncedSearch = debounce(search, 300, true);

debouncedSearch('r');   // 立即執行：Searching for: r
debouncedSearch('re');  // 取消前一個，300ms 後執行：Searching for: re
debouncedSearch('rea'); // 取消前一個，300ms 後執行：Searching for: rea
```

**應用場景：**
- 搜索框：用戶輸入第一個字符時立即搜索，後續輸入才 debounce
- 按鈕點擊：第一次點擊立即執行，防止重複點擊

#### 版本四：支援取消（Cancel）

```javascript
function debounce(func, delay, immediate = false) {
  let timeoutId;
  
  const debounced = function(...args) {
    const context = this;
    const callNow = immediate && !timeoutId;
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func.apply(context, args);
      }
    }, delay);
    
    if (callNow) {
      func.apply(context, args);
    }
  };
  
  // 添加取消方法
  debounced.cancel = function() {
    clearTimeout(timeoutId);
    timeoutId = null;
  };
  
  return debounced;
}
```

**使用範例：**

```javascript
const debouncedSearch = debounce(search, 300);

debouncedSearch('react');
debouncedSearch('vue');

// 取消待執行的搜索
debouncedSearch.cancel();
// 不會執行搜索
```

#### 版本五：支援刷新（Flush）

**需求：** 立即執行待執行的函數

```javascript
function debounce(func, delay, immediate = false) {
  let timeoutId;
  let lastArgs;
  let lastContext;
  
  const debounced = function(...args) {
    lastContext = this;
    lastArgs = args;
    const callNow = immediate && !timeoutId;
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func.apply(lastContext, lastArgs);
      }
    }, delay);
    
    if (callNow) {
      func.apply(lastContext, lastArgs);
    }
  };
  
  debounced.cancel = function() {
    clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
    lastContext = null;
  };
  
  // 立即執行待執行的函數
  debounced.flush = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (!immediate) {
        func.apply(lastContext, lastArgs);
      }
    }
  };
  
  return debounced;
}
```

**使用範例：**

```javascript
const debouncedSearch = debounce(search, 300);

debouncedSearch('react');
// 300ms 後才會執行

// 立即執行
debouncedSearch.flush();
// 立即輸出：Searching for: react
```

### 完整實現（生產級別）

```javascript
/**
 * 實現 debounce 函數
 * @param {Function} func - 要防抖的函數
 * @param {number} delay - 延遲時間（毫秒）
 * @param {Object} options - 選項
 * @param {boolean} options.immediate - 是否立即執行第一次調用
 * @param {number} options.maxWait - 最大等待時間（類似 throttle）
 * @returns {Function} 防抖後的函數
 */
function debounce(func, delay, options = {}) {
  const { immediate = false, maxWait } = options;
  
  let timeoutId;
  let maxTimeoutId;
  let lastCallTime;
  let lastInvokeTime = 0;
  let lastArgs;
  let lastContext;
  let result;
  
  // 檢查是否應該立即執行
  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    
    // 第一次調用，或超過最大等待時間
    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }
  
  // 執行函數
  function invokeFunc(time) {
    const args = lastArgs;
    const context = lastContext;
    
    lastArgs = lastContext = undefined;
    lastInvokeTime = time;
    result = func.apply(context, args);
    
    return result;
  }
  
  // 開始定時器
  function startTimer(pendingFunc, wait) {
    return setTimeout(pendingFunc, wait);
  }
  
  // 取消定時器
  function cancelTimer(id) {
    clearTimeout(id);
  }
  
  // 延遲執行
  function timerExpired() {
    const time = Date.now();
    
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    
    // 重新計算剩餘時間
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;
    const timeRemaining = maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
    
    // 重新設置定時器
    timeoutId = startTimer(timerExpired, timeRemaining);
  }
  
  // 前導邊緣（立即執行）
  function leadingEdge(time) {
    lastInvokeTime = time;
    timeoutId = startTimer(timerExpired, delay);
    
    if (immediate) {
      return invokeFunc(time);
    }
    
    return result;
  }
  
  // 後導邊緣（延遲執行）
  function trailingEdge(time) {
    timeoutId = undefined;
    
    if (lastArgs) {
      return invokeFunc(time);
    }
    
    lastArgs = lastContext = undefined;
    return result;
  }
  
  // 主函數
  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastContext = this;
    lastCallTime = time;
    
    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }
      
      if (maxWait !== undefined) {
        // 處理 maxWait
        timeoutId = startTimer(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    
    if (timeoutId === undefined) {
      timeoutId = startTimer(timerExpired, delay);
    }
    
    return result;
  }
  
  // 取消
  debounced.cancel = function() {
    if (timeoutId !== undefined) {
      cancelTimer(timeoutId);
    }
    if (maxTimeoutId !== undefined) {
      cancelTimer(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastContext = timeoutId = maxTimeoutId = undefined;
  };
  
  // 刷新（立即執行）
  debounced.flush = function() {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  };
  
  // 檢查是否待執行
  debounced.pending = function() {
    return timeoutId !== undefined;
  };
  
  return debounced;
}
```

### 實際應用範例

#### 範例一：搜索框

```javascript
// HTML
<input type="text" id="search-input" placeholder="Search..." />

// JavaScript
const searchInput = document.getElementById('search-input');

function performSearch(query) {
  if (!query.trim()) return;
  
  fetch(`/api/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(results => {
      displayResults(results);
    });
}

const debouncedSearch = debounce(performSearch, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

#### 範例二：表單驗證

```javascript
const emailInput = document.getElementById('email');

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  if (isValid) {
    emailInput.classList.remove('error');
    emailInput.classList.add('valid');
  } else {
    emailInput.classList.remove('valid');
    emailInput.classList.add('error');
  }
}

const debouncedValidate = debounce(validateEmail, 500);

emailInput.addEventListener('input', (e) => {
  debouncedValidate(e.target.value);
});
```

#### 範例三：React Hook

```jsx
import { useState, useEffect, useRef } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// 使用
function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);
  
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

#### 範例四：窗口調整

```javascript
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // 重新計算布局
  recalculateLayout(width, height);
}

const debouncedResize = debounce(handleResize, 200);

window.addEventListener('resize', debouncedResize);
```

### Debounce vs Throttle

**Debounce（防抖）：**
- 連續觸發時，只在最後一次觸發後等待一段時間才執行
- 適合：搜索框、表單驗證、按鈕防重複點擊

**Throttle（節流）：**
- 連續觸發時，每隔一段時間執行一次
- 適合：滾動事件、鼠標移動、窗口調整

**視覺化對比：**

```
時間線：0ms    100ms   200ms   300ms   400ms   500ms   600ms
觸發：  |------|-------|-------|-------|-------|-------|
       A       B       C       D       E       F       G

Debounce (300ms):
執行：  |-----------------------------------------------X|
       只在最後一次觸發後 300ms 執行（G 之後）

Throttle (300ms):
執行：  |-------X-------X-------X-------X|
       每隔 300ms 執行一次（A, D, G）
```

**實際選擇：**

```javascript
// 搜索框 → 使用 Debounce
// 用戶停止輸入後才搜索
const debouncedSearch = debounce(search, 300);

// 滾動事件 → 使用 Throttle
// 每隔一段時間檢查一次位置
const throttledScroll = throttle(handleScroll, 100);
```

### 測試範例

```javascript
// 測試基本功能
function testBasicDebounce() {
  let callCount = 0;
  
  const func = debounce(() => {
    callCount++;
  }, 100);
  
  // 快速連續調用 5 次
  func();
  func();
  func();
  func();
  func();
  
  // 立即檢查：應該還沒執行
  console.assert(callCount === 0, 'Should not execute immediately');
  
  // 等待 150ms 後檢查
  setTimeout(() => {
    console.assert(callCount === 1, 'Should execute once after delay');
    console.log('Test passed!');
  }, 150);
}

// 測試取消功能
function testCancel() {
  let callCount = 0;
  
  const func = debounce(() => {
    callCount++;
  }, 100);
  
  func();
  func.cancel();
  
  setTimeout(() => {
    console.assert(callCount === 0, 'Should not execute after cancel');
  }, 150);
}

// 測試立即執行
function testImmediate() {
  let callCount = 0;
  
  const func = debounce(() => {
    callCount++;
  }, 100, true);
  
  func(); // 應該立即執行
  console.assert(callCount === 1, 'Should execute immediately');
  
  func(); // 應該被 debounce
  console.assert(callCount === 1, 'Should not execute again immediately');
  
  setTimeout(() => {
    console.assert(callCount === 2, 'Should execute after delay');
  }, 150);
}
```

### 性能考慮

**1. 內存管理**

```javascript
// ✅ 好的做法：在組件卸載時取消
useEffect(() => {
  const debouncedFunc = debounce(handler, 300);
  
  return () => {
    debouncedFunc.cancel(); // 清理定時器
  };
}, []);
```

**2. 避免創建多個 debounce 實例**

```javascript
// ❌ 不好的做法：每次渲染都創建新的 debounce
function Component() {
  const handler = debounce(() => {}, 300); // 每次渲染都創建
  return <button onClick={handler}>Click</button>;
}

// ✅ 好的做法：使用 useMemo 或 useRef
function Component() {
  const handler = useMemo(() => debounce(() => {}, 300), []);
  return <button onClick={handler}>Click</button>;
}
```

### 總結

**Debounce 核心要點：**

1. **工作原理**
   - 清除之前的定時器
   - 設置新的定時器
   - 只在最後一次觸發後執行

2. **關鍵技術**
   - `setTimeout` / `clearTimeout`
   - 保存 `this` 上下文
   - 使用 `apply` 傳遞參數

3. **進階功能**
   - 立即執行（immediate）
   - 取消（cancel）
   - 刷新（flush）

4. **適用場景**
   - 搜索框輸入
   - 表單驗證
   - 窗口調整
   - 按鈕防重複點擊

5. **與 Throttle 的區別**
   - Debounce：最後一次觸發後執行
   - Throttle：每隔一段時間執行一次

Debounce 是前端開發中非常實用的工具函數，正確使用可以大幅提升應用性能和用戶體驗。
