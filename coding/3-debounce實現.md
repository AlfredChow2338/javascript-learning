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

### Throttle 實現

```jsx

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```