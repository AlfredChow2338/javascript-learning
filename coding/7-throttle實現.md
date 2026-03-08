## Throttle（節流）實現

### 什麼是 Throttle

**Throttle（節流）** 是一種限制函數執行頻率的技術。在指定時間內，無論觸發多少次，函數最多只執行一次。

**核心概念：**
- **固定時間間隔**：在時間窗口內只執行一次
- **持續執行**：時間窗口內持續觸發，函數會定期執行
- **適用場景**：需要定期更新但限制頻率的場景

### Throttle vs Debounce

**關鍵區別：**

```
Throttle（節流）：
時間窗口內只執行一次，持續觸發會定期執行

Debounce（防抖）：
延遲執行，只有停止觸發後才執行
```

**視覺化對比：**

```
用戶操作時間線：|--|--|--|--|--|--|--|--|--|
                 ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑
                 
Throttle (100ms)：
執行時間：|--X--|--X--|--X--|--X--|
          ↑     ↑     ↑     ↑
          每次時間窗口執行一次

Debounce (100ms)：
執行時間：|------------------X|
          ↑                  ↑
          停止觸發後才執行
```

**使用場景對比：**

| 場景 | 使用 Throttle | 使用 Debounce |
|------|--------------|--------------|
| **滾動事件** | ✅ 定期更新位置 | ❌ |
| **窗口大小調整** | ✅ 定期更新布局 | ✅ 也可以 |
| **搜索輸入** | ❌ | ✅ 停止輸入後搜索 |
| **按鈕點擊** | ✅ 防止重複點擊 | ✅ 也可以 |
| **鼠標移動** | ✅ 定期更新 | ❌ |

---

## 一、基礎實現

### 方法 1：時間戳版本（Trailing Edge）

**特點：** 在時間窗口結束時執行

```javascript
/**
 * Throttle 實現（時間戳版本）
 * @param {Function} func - 要節流的函數
 * @param {number} delay - 延遲時間（毫秒）
 * @returns {Function} 節流後的函數
 */
function throttle(func, delay = 200) {
  let lastTime = 0;
  
  return function(...args) {
    const now = Date.now();
    
    // 如果距離上次執行已經過了 delay 時間，執行函數
    if (now - lastTime >= delay) {
      lastTime = now;
      return func.apply(this, args);
    }
  };
}
```

**執行時機：**
```
時間線：0ms    100ms   200ms   300ms   400ms
觸發：  ↑       ↑       ↑       ↑       ↑
執行：  X                  X              X
       ↑                  ↑              ↑
       立即執行         200ms後執行     400ms後執行
```

### 方法 2：定時器版本（Leading Edge）

**特點：** 在時間窗口開始時執行

```javascript
/**
 * Throttle 實現（定時器版本）
 * @param {Function} func - 要節流的函數
 * @param {number} delay - 延遲時間（毫秒）
 * @returns {Function} 節流後的函數
 */
function throttle(func, delay) {
  let timeoutId = null;
  
  return function(...args) {
    // 如果沒有定時器，立即執行並設置定時器
    if (!timeoutId) {
      func.apply(this, args);
      timeoutId = setTimeout(() => {
        timeoutId = null;
      }, delay);
    }
  };
}
```

**執行時機：**
```
時間線：0ms    100ms   200ms   300ms   400ms
觸發：  ↑       ↑       ↑       ↑       ↑
執行：  X              X              X
       ↑              ↑              ↑
       立即執行       立即執行       立即執行
```

### 方法 3：完整版本（Leading + Trailing）

**特點：** 在時間窗口開始和結束時都可以執行

```javascript
/**
 * Throttle 完整實現（支持 leading 和 trailing）
 * @param {Function} func - 要節流的函數
 * @param {number} delay - 延遲時間（毫秒）
 * @param {Object} options - 選項
 * @param {boolean} options.leading - 是否在開始時執行（默認 true）
 * @param {boolean} options.trailing - 是否在結束時執行（默認 true）
 * @returns {Function} 節流後的函數
 */
function throttle(func, delay, options = {}) {
  const { leading = true, trailing = true } = options;
  
  let lastTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastContext = null;
  
  return function(...args) {
    const now = Date.now();
    const context = this;
    
    // 如果 leading 為 false，初始化 lastTime
    if (!leading && lastTime === 0) {
      lastTime = now;
    }
    
    const remaining = delay - (now - lastTime);
    
    // 如果時間已過，執行函數
    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      lastTime = now;
      func.apply(context, args);
      lastArgs = null;
      lastContext = null;
    } 
    // 如果 trailing 為 true，設置定時器在結束時執行
    else if (trailing && !timeoutId) {
      lastArgs = args;
      lastContext = context;
      
      timeoutId = setTimeout(() => {
        lastTime = leading ? Date.now() : 0;
        timeoutId = null;
        
        if (lastArgs) {
          func.apply(lastContext, lastArgs);
          lastArgs = null;
          lastContext = null;
        }
      }, remaining);
    }
  };
}
```

---

## 二、不同執行時機的實現

### 2.1 Leading Edge（開始時執行）

```javascript
function throttleLeading(func, delay) {
  let lastTime = 0;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastTime >= delay) {
      lastTime = now;
      return func.apply(this, args);
    }
  };
}

// 使用範例
const handleScroll = throttleLeading(() => {
  console.log('Scroll position:', window.scrollY);
}, 100);

window.addEventListener('scroll', handleScroll);
// 第一次滾動立即執行，之後每 100ms 最多執行一次
```

### 2.2 Trailing Edge（結束時執行）

```javascript
function throttleTrailing(func, delay) {
  let timeoutId = null;
  let lastArgs = null;
  let lastContext = null;
  
  return function(...args) {
    lastArgs = args;
    lastContext = this;
    
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        func.apply(lastContext, lastArgs);
        lastArgs = null;
        lastContext = null;
      }, delay);
    }
  };
}

// 使用範例
const handleResize = throttleTrailing(() => {
  console.log('Window size:', window.innerWidth, window.innerHeight);
}, 200);

window.addEventListener('resize', handleResize);
// 調整窗口大小時，停止調整後 200ms 執行
```

### 2.3 Leading + Trailing（開始和結束都執行）

```javascript
function throttleBoth(func, delay) {
  let lastTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastContext = null;
  
  return function(...args) {
    const now = Date.now();
    const context = this;
    const remaining = delay - (now - lastTime);
    
    // 開始時執行
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func.apply(context, args);
    } 
    // 結束時執行
    else if (!timeoutId) {
      lastArgs = args;
      lastContext = context;
      
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func.apply(lastContext, lastArgs);
        lastArgs = null;
        lastContext = null;
      }, remaining);
    }
  };
}
```

---

## 三、進階實現

### 3.1 支持取消和立即執行

```javascript
function throttle(func, delay, options = {}) {
  const { leading = true, trailing = true } = options;
  
  let lastTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastContext = null;
  
  const throttled = function(...args) {
    const now = Date.now();
    const context = this;
    
    if (!leading && lastTime === 0) {
      lastTime = now;
    }
    
    const remaining = delay - (now - lastTime);
    
    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      lastTime = now;
      func.apply(context, args);
      lastArgs = null;
      lastContext = null;
    } else if (trailing && !timeoutId) {
      lastArgs = args;
      lastContext = context;
      
      timeoutId = setTimeout(() => {
        lastTime = leading ? Date.now() : 0;
        timeoutId = null;
        
        if (lastArgs) {
          func.apply(lastContext, lastArgs);
          lastArgs = null;
          lastContext = null;
        }
      }, remaining);
    }
  };
  
  // 取消節流
  throttled.cancel = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastTime = 0;
    lastArgs = null;
    lastContext = null;
  };
  
  // 立即執行
  throttled.flush = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    if (lastArgs) {
      func.apply(lastContext, lastArgs);
      lastArgs = null;
      lastContext = null;
    }
  };
  
  return throttled;
}

// 使用範例
const throttledFn = throttle(() => {
  console.log('Executed');
}, 1000);

// 取消
throttledFn.cancel();

// 立即執行
throttledFn.flush();
```

### 3.2 支持返回值

```javascript
function throttle(func, delay) {
  let lastTime = 0;
  let lastResult = undefined;
  let timeoutId = null;
  
  return function(...args) {
    const now = Date.now();
    const context = this;
    
    if (now - lastTime >= delay) {
      // 立即執行
      lastTime = now;
      lastResult = func.apply(context, args);
      return lastResult;
    } else {
      // 返回上次的結果
      return lastResult;
    }
  };
}
```

---

## 四、實際應用場景

### 4.1 滾動事件優化

```javascript
// 問題：滾動事件觸發頻率極高（每秒數百次）
window.addEventListener('scroll', () => {
  // 頻繁執行，導致性能問題
  updateScrollPosition();
});

// ✅ 解決：使用 throttle
const handleScroll = throttle(() => {
  updateScrollPosition();
  updateProgressBar();
  checkLazyLoad();
}, 100); // 每 100ms 最多執行一次

window.addEventListener('scroll', handleScroll);
```

### 4.2 窗口大小調整

```javascript
// 調整窗口大小時，重新計算布局
const handleResize = throttle(() => {
  recalculateLayout();
  updateCharts();
  adjustGrid();
}, 250); // 每 250ms 最多執行一次

window.addEventListener('resize', handleResize);
```

### 4.3 防止重複點擊

```javascript
// 防止用戶快速重複點擊提交按鈕
const handleSubmit = throttle(async (formData) => {
  try {
    await submitForm(formData);
    showSuccessMessage();
  } catch (error) {
    showErrorMessage(error);
  }
}, 2000); // 2 秒內只能提交一次

button.addEventListener('click', () => {
  handleSubmit(formData);
});
```

### 4.4 鼠標移動追蹤

```javascript
// 追蹤鼠標位置，但限制更新頻率
const handleMouseMove = throttle((event) => {
  updateCursorPosition(event.clientX, event.clientY);
  updateTooltip(event);
}, 16); // 約 60fps

document.addEventListener('mousemove', handleMouseMove);
```

### 4.5 API 請求節流

```javascript
// 限制 API 請求頻率
const fetchData = throttle(async (url) => {
  const response = await fetch(url);
  return response.json();
}, 1000); // 每秒最多請求一次

// 多個組件同時請求，會被節流
Promise.all([
  fetchData('/api/users'),
  fetchData('/api/users'), // 會被節流
  fetchData('/api/users')  // 會被節流
]);
```

### 4.6 實時搜索（結合 debounce）

```javascript
// 輸入時使用 debounce，但同時用 throttle 限制最小請求間隔
const search = debounce((query) => {
  throttledSearch(query);
}, 300);

const throttledSearch = throttle(async (query) => {
  const results = await fetch(`/api/search?q=${query}`).then(r => r.json());
  displayResults(results);
}, 1000); // 即使 debounce 觸發，也要限制請求頻率

input.addEventListener('input', (e) => {
  search(e.target.value);
});
```

---

## 五、React 中的使用

### 5.1 使用 useCallback 和 useRef

```javascript
import { useCallback, useRef } from 'react';

function ScrollComponent() {
  const throttleTimer = useRef(null);
  const lastTime = useRef(0);
  
  const handleScroll = useCallback((event) => {
    const now = Date.now();
    const delay = 100;
    
    if (now - lastTime.current >= delay) {
      lastTime.current = now;
      // 執行滾動處理
      updateScrollPosition(event);
    }
  }, []);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, [handleScroll]);
  
  return <div>Content</div>;
}
```

### 5.2 自定義 Hook

```javascript
import { useRef, useCallback } from 'react';

function useThrottle(func, delay) {
  const lastTime = useRef(0);
  const timeoutId = useRef(null);
  
  const throttledFunc = useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastTime.current >= delay) {
      lastTime.current = now;
      func(...args);
    } else {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      
      timeoutId.current = setTimeout(() => {
        lastTime.current = Date.now();
        func(...args);
      }, delay - (now - lastTime.current));
    }
  }, [func, delay]);
  
  return throttledFunc;
}

// 使用
function MyComponent() {
  const handleScroll = useThrottle((event) => {
    console.log('Scroll:', window.scrollY);
  }, 100);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  return <div>Content</div>;
}
```

---

## 六、Throttle vs Debounce 詳細對比

### 執行時機對比

```javascript
// 用戶連續觸發 5 次，每次間隔 50ms，delay = 200ms

// Throttle（每 200ms 執行一次）
時間：  0ms   50ms  100ms 150ms 200ms 250ms
觸發：  ↑     ↑     ↑     ↑     ↑     ↑
執行：  X                    X              X
       立即執行             200ms後執行     400ms後執行
       共執行 3 次

// Debounce（停止觸發後 200ms 執行）
時間：  0ms   50ms  100ms 150ms 200ms 250ms
觸發：  ↑     ↑     ↑     ↑     ↑     ↑
執行：                                    X
                                       停止觸發後執行
       共執行 1 次
```

### 選擇指南

**使用 Throttle 當：**
- ✅ 需要定期更新（如滾動位置）
- ✅ 需要限制執行頻率但保持響應
- ✅ 需要持續監聽事件

**使用 Debounce 當：**
- ✅ 只需要最後一次觸發的結果
- ✅ 停止觸發後才需要執行
- ✅ 避免重複操作（如搜索）

---

## 七、性能優化

### 7.1 使用 requestAnimationFrame

```javascript
// 對於動畫相關的節流，使用 requestAnimationFrame
function throttleRAF(func) {
  let rafId = null;
  
  return function(...args) {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, args);
        rafId = null;
      });
    }
  };
}

// 使用範例：平滑的滾動處理
const handleScroll = throttleRAF(() => {
  updateScrollPosition();
});
```

### 7.2 批量處理

```javascript
// 批量處理多個更新
function throttleBatch(func, delay) {
  let timeoutId = null;
  let batch = [];
  
  return function(...args) {
    batch.push(args);
    
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        func(batch);
        batch = [];
        timeoutId = null;
      }, delay);
    }
  };
}

// 使用範例：批量更新 DOM
const updateDOM = throttleBatch((updates) => {
  // 一次性處理所有更新
  updates.forEach(([element, data]) => {
    updateElement(element, data);
  });
}, 100);
```

---

## 八、測試用例

### 完整測試

```javascript
// 測試基礎 throttle
describe('throttle', () => {
  jest.useFakeTimers();
  
  it('should execute immediately on first call', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);
    
    throttled();
    expect(func).toHaveBeenCalledTimes(1);
  });
  
  it('should throttle multiple calls', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);
    
    throttled();
    throttled();
    throttled();
    
    expect(func).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(100);
    throttled();
    
    expect(func).toHaveBeenCalledTimes(2);
  });
  
  it('should preserve context and arguments', () => {
    const obj = {
      value: 42,
      method: throttle(function(a, b) {
        return this.value + a + b;
      }, 100)
    };
    
    const result = obj.method(1, 2);
    expect(result).toBe(45);
  });
});
```

---

## 九、常見錯誤和解決方案

### 錯誤 1：丟失 this 上下文

```javascript
// ❌ 錯誤：丟失 this
function throttle(func, delay) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      func(...args); // this 可能不正確
    }
  };
}

// ✅ 正確：使用 apply 保持 this
function throttle(func, delay) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      func.apply(this, args); // 保持 this 上下文
    }
  };
}
```

### 錯誤 2：參數丟失

```javascript
// ❌ 錯誤：最後一次調用的參數可能丟失
function throttle(func, delay) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      func.apply(this, args);
    }
    // 如果時間未到，參數丟失
  };
}

// ✅ 正確：保存參數，在 trailing 時執行
function throttle(func, delay) {
  let lastTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastContext = null;
  
  return function(...args) {
    const now = Date.now();
    const context = this;
    const remaining = delay - (now - lastTime);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func.apply(context, args);
    } else if (!timeoutId) {
      lastArgs = args;
      lastContext = context;
      
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func.apply(lastContext, lastArgs);
      }, remaining);
    }
  };
}
```

---

## 十、最佳實踐

### 10.1 選擇合適的 delay

```javascript
// 根據場景選擇 delay
const delays = {
  scroll: 100,        // 滾動：100ms（約 10fps）
  resize: 250,        // 調整大小：250ms
  mousemove: 16,      // 鼠標移動：16ms（60fps）
  click: 1000,        // 點擊：1s（防止重複）
  api: 1000           // API 請求：1s
};
```

### 10.2 結合使用 Throttle 和 Debounce

```javascript
// 場景：搜索輸入
// 1. 使用 debounce 等待用戶停止輸入
// 2. 使用 throttle 限制最小請求間隔

const debouncedSearch = debounce((query) => {
  throttledAPIRequest(query);
}, 300);

const throttledAPIRequest = throttle(async (query) => {
  const results = await searchAPI(query);
  displayResults(results);
}, 1000);

input.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### 10.3 清理資源

```javascript
// 組件卸載時清理 throttle
useEffect(() => {
  const throttledHandler = throttle(handleEvent, 100);
  
  element.addEventListener('event', throttledHandler);
  
  return () => {
    element.removeEventListener('event', throttledHandler);
    // 如果有 cancel 方法，調用它
    if (throttledHandler.cancel) {
      throttledHandler.cancel();
    }
  };
}, []);
```

---

## 總結

**Throttle 核心要點：**

1. **固定時間間隔**：在指定時間內最多執行一次
2. **持續執行**：適合需要定期更新的場景
3. **執行時機**：可以選擇 leading、trailing 或 both
4. **保持上下文**：使用 `apply` 保持 `this` 和參數

**與 Debounce 的區別：**
- **Throttle**：時間窗口內執行一次，持續觸發會定期執行
- **Debounce**：延遲執行，停止觸發後才執行

**使用建議：**
- **滾動、調整大小**：使用 Throttle
- **搜索輸入**：使用 Debounce
- **防止重複點擊**：使用 Throttle
- **API 請求限制**：使用 Throttle

理解 Throttle 的實現原理和適用場景，可以幫助優化高頻事件的處理，提升應用性能。
