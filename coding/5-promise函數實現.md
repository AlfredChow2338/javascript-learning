## Promise 函數實現

### 什麼是 Promise

**Promise** 是 JavaScript 中處理異步操作的對象，代表一個異步操作的最終完成或失敗。

**核心概念：**
- **三種狀態**：pending（進行中）、fulfilled（已成功）、rejected（已失敗）
- **狀態轉換**：只能從 pending → fulfilled 或 pending → rejected，且不可逆
- **鏈式調用**：通過 `.then()` 和 `.catch()` 處理結果

### Promise 靜態方法

Promise 提供了多個靜態方法來處理多個 Promise：
- `Promise.all()`：所有 Promise 成功才成功
- `Promise.race()`：第一個完成的 Promise（無論成功或失敗）
- `Promise.allSettled()`：等待所有 Promise 完成（無論成功或失敗）
- `Promise.any()`：第一個成功的 Promise

---

## 一、Promise.all 實現

### 功能說明

**Promise.all()** 接收一個 Promise 數組，當所有 Promise 都成功時返回結果數組，如果任何一個失敗則立即拒絕。

**特點：**
- 所有 Promise 都成功時才 resolve
- 任何一個失敗立即 reject
- 結果順序與輸入順序一致

### 實現

```javascript
Promise.myAll = function(promises) {
  return new Promise((resolve, reject) => {
    // 1. 參數驗證
    if (!Array.isArray(promises)) {
      reject(new TypeError('Arguments must be an array'));
      return;
    }
    
    // 2. 空數組直接 resolve
    if (promises.length === 0) {
      resolve([]);
      return;
    }
    
    const results = [];
    let completed = 0;
    
    // 3. 遍歷所有 Promise
    promises.forEach((promise, index) => {
      // 將非 Promise 值轉換為 Promise
      Promise.resolve(promise)
        .then(value => {
          // 保持結果順序
          results[index] = value;
          completed++;
          
          // 所有 Promise 都完成時 resolve
          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(error => {
          // 任何一個失敗立即 reject
          reject(error);
        });
    });
  });
};
```

### 使用範例

```javascript
// 範例 1：所有成功
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

Promise.myAll([p1, p2, p3])
  .then(results => {
    console.log(results); // [1, 2, 3]
  });

// 範例 2：有失敗的情況
const p4 = Promise.resolve(1);
const p5 = Promise.reject('Error');
const p6 = Promise.resolve(3);

Promise.myAll([p4, p5, p6])
  .then(results => {
    console.log(results);
  })
  .catch(error => {
    console.log(error); // 'Error'
  });

// 範例 3：異步操作
const fetchUser = (id) => fetch(`/api/users/${id}`).then(res => res.json());
const fetchPost = (id) => fetch(`/api/posts/${id}`).then(res => res.json());

Promise.myAll([fetchUser(1), fetchPost(1)])
  .then(([user, post]) => {
    console.log('User:', user);
    console.log('Post:', post);
  });
```

### 關鍵技術點

**1. 保持結果順序**

```javascript
// 使用索引而不是 push，確保順序
results[index] = value; // ✅ 正確
results.push(value);    // ❌ 錯誤（如果 Promise 完成順序不同）
```

**2. 處理非 Promise 值**

```javascript
// Promise.resolve() 會將非 Promise 值轉換為已解決的 Promise
Promise.resolve(42);        // Promise<42>
Promise.resolve(Promise.resolve(42)); // Promise<42>
```

**3. 立即失敗機制**

```javascript
// 任何一個 Promise 失敗，立即 reject，不等待其他 Promise
.catch(error => {
  reject(error); // 立即拒絕，不會等待其他 Promise
});
```

---

## 二、Promise.race 實現

### 功能說明

**Promise.race()** 接收一個 Promise 數組，返回第一個完成（無論成功或失敗）的 Promise 結果。

**特點：**
- 第一個完成的 Promise 決定結果
- 其他 Promise 仍會繼續執行，但結果會被忽略

### 實現

```javascript
Promise.myRace = function(promises) {
  return new Promise((resolve, reject) => {
    // 1. 參數驗證
    if (!Array.isArray(promises)) {
      reject(new TypeError('Arguments must be an array'));
      return;
    }
    
    // 2. 空數組永遠 pending（實際 Promise.race 也是如此）
    if (promises.length === 0) {
      return; // 永遠不會 resolve 或 reject
    }
    
    // 3. 遍歷所有 Promise，第一個完成的決定結果
    promises.forEach(promise => {
      Promise.resolve(promise)
        .then(value => {
          resolve(value); // 第一個成功就 resolve
        })
        .catch(error => {
          reject(error); // 第一個失敗就 reject
        });
    });
  });
};
```

### 使用範例

```javascript
// 範例 1：第一個成功的
const p1 = new Promise(resolve => setTimeout(() => resolve(1), 100));
const p2 = new Promise(resolve => setTimeout(() => resolve(2), 50));
const p3 = new Promise(resolve => setTimeout(() => resolve(3), 200));

Promise.myRace([p1, p2, p3])
  .then(result => {
    console.log(result); // 2（最快完成）
  });

// 範例 2：第一個失敗的
const p4 = new Promise((resolve, reject) => 
  setTimeout(() => reject('Error 1'), 100)
);
const p5 = new Promise((resolve, reject) => 
  setTimeout(() => reject('Error 2'), 50)
);

Promise.myRace([p4, p5])
  .catch(error => {
    console.log(error); // 'Error 2'（最快失敗）
  });

// 範例 3：超時控制
function fetchWithTimeout(url, timeout) {
  const fetchPromise = fetch(url).then(res => res.json());
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), timeout)
  );
  
  return Promise.myRace([fetchPromise, timeoutPromise]);
}

fetchWithTimeout('/api/data', 5000)
  .then(data => console.log(data))
  .catch(error => console.log('Request failed:', error));
```

---

## 三、Promise.allSettled 實現

### 功能說明

**Promise.allSettled()** 接收一個 Promise 數組，等待所有 Promise 完成（無論成功或失敗），返回結果數組。

**特點：**
- 等待所有 Promise 完成
- 不會 reject，總是 resolve
- 結果包含狀態和值/原因

### 實現

```javascript
Promise.myAllSettled = function(promises) {
  return new Promise((resolve) => {
    // 1. 參數驗證
    if (!Array.isArray(promises)) {
      reject(new TypeError('Arguments must be an array'));
      return;
    }
    
    // 2. 空數組直接 resolve
    if (promises.length === 0) {
      resolve([]);
      return;
    }
    
    const results = [];
    let completed = 0;
    
    // 3. 遍歷所有 Promise
    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = {
            status: 'fulfilled',
            value: value
          };
          completed++;
          
          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reason => {
          results[index] = {
            status: 'rejected',
            reason: reason
          };
          completed++;
          
          if (completed === promises.length) {
            resolve(results);
          }
        });
    });
  });
};
```

### 使用範例

```javascript
// 範例 1：混合成功和失敗
const p1 = Promise.resolve(1);
const p2 = Promise.reject('Error 1');
const p3 = Promise.resolve(3);
const p4 = Promise.reject('Error 2');

Promise.myAllSettled([p1, p2, p3, p4])
  .then(results => {
    console.log(results);
    // [
    //   { status: 'fulfilled', value: 1 },
    //   { status: 'rejected', reason: 'Error 1' },
    //   { status: 'fulfilled', value: 3 },
    //   { status: 'rejected', reason: 'Error 2' }
    // ]
  });

// 範例 2：批量請求，需要知道所有結果
async function fetchMultipleUrls(urls) {
  const promises = urls.map(url => fetch(url).then(res => res.json()));
  const results = await Promise.myAllSettled(promises);
  
  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
  
  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);
  
  return { successful, failed };
}
```

---

## 四、Promise.any 實現

### 功能說明

**Promise.any()** 接收一個 Promise 數組，返回第一個成功的 Promise 結果。如果所有 Promise 都失敗，返回 AggregateError。

**特點：**
- 第一個成功的 Promise 決定結果
- 所有都失敗時才 reject
- ES2021 引入

### 實現

```javascript
Promise.myAny = function(promises) {
  return new Promise((resolve, reject) => {
    // 1. 參數驗證
    if (!Array.isArray(promises)) {
      reject(new TypeError('Arguments must be an array'));
      return;
    }
    
    // 2. 空數組直接 reject
    if (promises.length === 0) {
      reject(new AggregateError([], 'All promises were rejected'));
      return;
    }
    
    const errors = [];
    let completed = 0;
    let hasResolved = false;
    
    // 3. 遍歷所有 Promise
    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          // 第一個成功就 resolve
          if (!hasResolved) {
            hasResolved = true;
            resolve(value);
          }
        })
        .catch(error => {
          errors[index] = error;
          completed++;
          
          // 所有都失敗時 reject
          if (completed === promises.length && !hasResolved) {
            reject(new AggregateError(errors, 'All promises were rejected'));
          }
        });
    });
  });
};
```

### 使用範例

```javascript
// 範例 1：第一個成功的
const p1 = Promise.reject('Error 1');
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

Promise.myAny([p1, p2, p3])
  .then(result => {
    console.log(result); // 2（第一個成功）
  });

// 範例 2：所有都失敗
const p4 = Promise.reject('Error 1');
const p5 = Promise.reject('Error 2');
const p6 = Promise.reject('Error 3');

Promise.myAny([p4, p5, p6])
  .catch(error => {
    console.log(error); // AggregateError
    console.log(error.errors); // ['Error 1', 'Error 2', 'Error 3']
  });

// 範例 3：多個服務器，使用第一個響應的
function fetchFromServers(urls) {
  const promises = urls.map(url => fetch(url).then(res => res.json()));
  return Promise.myAny(promises);
}

fetchFromServers([
  'https://api1.example.com/data',
  'https://api2.example.com/data',
  'https://api3.example.com/data'
])
  .then(data => console.log('Got data from:', data))
  .catch(error => console.log('All servers failed'));
```

---

## 五、Promise.resolve 實現

### 功能說明

**Promise.resolve()** 將一個值轉換為 Promise。如果值已經是 Promise，則返回該 Promise。

### 實現

```javascript
Promise.myResolve = function(value) {
  // 如果已經是 Promise，直接返回
  if (value instanceof Promise) {
    return value;
  }
  
  // 如果是 thenable 對象（有 then 方法）
  if (value && typeof value.then === 'function') {
    return new Promise((resolve, reject) => {
      value.then(resolve, reject);
    });
  }
  
  // 普通值，創建已解決的 Promise
  return new Promise(resolve => {
    resolve(value);
  });
};
```

### 使用範例

```javascript
// 範例 1：普通值
Promise.myResolve(42)
  .then(value => console.log(value)); // 42

// 範例 2：已經是 Promise
const p = Promise.resolve(1);
Promise.myResolve(p) === p; // true

// 範例 3：thenable 對象
const thenable = {
  then: (resolve, reject) => {
    resolve('resolved');
  }
};
Promise.myResolve(thenable)
  .then(value => console.log(value)); // 'resolved'
```

---

## 六、Promise.reject 實現

### 功能說明

**Promise.reject()** 創建一個立即拒絕的 Promise。

### 實現

```javascript
Promise.myReject = function(reason) {
  return new Promise((resolve, reject) => {
    reject(reason);
  });
};
```

### 使用範例

```javascript
Promise.myReject('Error')
  .catch(error => console.log(error)); // 'Error'
```

---

## 七、完整 Promise 實現（可選）

### 簡化的 Promise 實現

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.onFulfilledCallbacks.forEach(fn => fn());
      }
    };

    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      if (this.state === 'fulfilled') {
        setTimeout(() => {
          try {
            const result = onFulfilled ? onFulfilled(this.value) : this.value;
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } else if (this.state === 'rejected') {
        setTimeout(() => {
          try {
            const result = onRejected ? onRejected(this.reason) : this.reason;
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } else {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const result = onFulfilled ? onFulfilled(this.value) : this.value;
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const result = onRejected ? onRejected(this.reason) : this.reason;
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  static resolve(value) {
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => reject(reason));
  }
}
```

---

## 八、方法對比總結

### 對比表

| 方法 | 成功條件 | 失敗條件 | 返回值 |
|------|---------|---------|--------|
| **Promise.all** | 所有成功 | 任何一個失敗 | 結果數組 |
| **Promise.race** | 第一個完成 | 第一個完成（失敗） | 第一個結果 |
| **Promise.allSettled** | 所有完成 | 不會失敗 | 狀態數組 |
| **Promise.any** | 第一個成功 | 所有都失敗 | 第一個成功結果 |

### 使用場景

**Promise.all：**
- 並行請求多個資源，需要所有結果
- 驗證多個條件都滿足

**Promise.race：**
- 超時控制
- 使用最快的服務器響應

**Promise.allSettled：**
- 需要知道所有請求的結果（無論成功或失敗）
- 批量操作，部分失敗不影響整體

**Promise.any：**
- 多個服務器，使用第一個響應的
- 容錯處理，只要有一個成功即可

### 實際應用範例

```javascript
// 場景 1：並行加載多個資源
async function loadResources() {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);
  
  return { user, posts, comments };
}

// 場景 2：超時控制
function fetchWithTimeout(url, timeout = 5000) {
  return Promise.race([
    fetch(url).then(r => r.json()),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

// 場景 3：批量操作，需要所有結果
async function batchUpdate(items) {
  const results = await Promise.allSettled(
    items.map(item => updateItem(item))
  );
  
  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
  
  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);
  
  return { successful, failed };
}

// 場景 4：多服務器容錯
async function fetchFromBackupServers(urls) {
  try {
    const data = await Promise.any(
      urls.map(url => fetch(url).then(r => r.json()))
    );
    return data;
  } catch (error) {
    console.error('All servers failed:', error.errors);
    throw error;
  }
}
```

---

## 總結

**核心要點：**

1. **Promise.all**：所有成功才成功，任何失敗立即拒絕
2. **Promise.race**：第一個完成的決定結果
3. **Promise.allSettled**：等待所有完成，不會拒絕
4. **Promise.any**：第一個成功，所有失敗才拒絕

**實現關鍵：**
- 使用索引保持結果順序
- 正確處理非 Promise 值（使用 Promise.resolve）
- 適當的錯誤處理
- 狀態管理（pending、fulfilled、rejected）

理解這些 Promise 方法的實現原理，有助於更好地使用它們處理異步操作。
