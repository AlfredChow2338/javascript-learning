## V8 Engine 的 Garbage Collection 原理

### 為什麼需要垃圾回收

JavaScript 是自動管理內存的語言，開發者不需要手動分配和釋放內存。V8 引擎負責自動回收不再使用的對象，避免內存洩漏。

```javascript
// 開發者不需要手動釋放內存
function createData() {
  const data = new Array(1000000).fill(0); // 分配大量內存
  return data;
}

const result = createData();
// 當 result 不再被引用時，V8 會自動回收這 100 萬個元素的內存
```

### 內存分區

V8 將內存分為兩個主要區域，每個區域有不同的管理策略：

#### 新生代（Young Generation）

**用途：**
- 存儲短期存活的對象（如臨時變量和函數作用域內的對象）
- 大小：通常比較小（幾 MB 到數十 MB）
- 特性：新生代的對象通常存活時間很短，因此垃圾回收頻率較高

**實際例子：**

```javascript
function processData() {
  // 這些變數在函數執行完後就不再需要
  const tempArray = [1, 2, 3, 4, 5];
  const tempObject = { name: 'temp', value: 100 };
  const result = tempArray.map(x => x * 2);
  
  return result;
  // 函數結束後，tempArray 和 tempObject 會被快速回收
}

const result = processData();
// result 被返回後，函數內的臨時變數會被新生代 GC 回收
```

#### 老生代（Old Generation）

**用途：**
- 存儲長期存活的對象（如全局對象或被多次引用的對象）
- 大小：通常比新生代大得多（幾百 MB 到幾 GB，具體取決於可用內存）
- 特性：老生代的內存回收頻率較低，但回收過程更複雜和耗時

**實際例子：**

```javascript
// 全局變數會進入老生代
const globalCache = {};

function addToCache(key, value) {
  globalCache[key] = value;
  // 這些對象會長期存活，進入老生代
}

// 多次引用的對象也會進入老生代
const sharedConfig = { apiUrl: 'https://api.example.com' };

function apiCall1() {
  return fetch(sharedConfig.apiUrl + '/users');
}

function apiCall2() {
  return fetch(sharedConfig.apiUrl + '/posts');
}
// sharedConfig 被多個函數引用，會晉升到老生代
```

### 新生代垃圾回收：Scavenger Algorithm

在新生代中，V8 使用 **Scavenger Algorithm（清除算法）**，基於**分代複製垃圾回收（Generational Copying GC）**。

#### 分區設計

新生代內存分為兩個半區：
- **From 空間**：活動對象的初始存儲區
- **To 空間**：用於垃圾回收過程中的臨時存儲區

#### 垃圾回收過程

1. **標記活動對象**：從根對象開始，標記所有被引用的對象
2. **複製到 To 空間**：將 From 空間中的活動對象複製到 To 空間
3. **丟棄未引用對象**：未被引用的對象留在 From 空間，被丟棄
4. **交換空間**：To 空間變成新的 From 空間，舊的 From 空間被清空並充當新的 To 空間

**視覺化過程：**

```
初始狀態：From 空間
[obj1, obj2, obj3, obj4]
 ↑      ↑      ↑      ↑
存活   存活   死亡   存活

步驟 1: 複製活動對象到 To 空間
To 空間: [obj1, obj2, obj4]

步驟 2: 清空 From 空間
From 空間: []

步驟 3: 交換
新的 From 空間: [obj1, obj2, obj4]
新的 To 空間: []
```

#### 晉升到老生代

如果某些對象經歷了多次垃圾回收仍然存活，則認為它們是長期存活的對象，並將其移動到老生代。

```javascript
function createLongLivedObject() {
  const longLived = { data: 'important' };
  
  // 如果這個對象在多次 GC 後仍然存活
  // 它會被晉升到老生代
  return longLived;
}

const persistent = createLongLivedObject();
// persistent 被外部引用，會存活很久
// 經過幾次新生代 GC 後，會被晉升到老生代

// 另一個例子：閉包中的變數
function createClosure() {
  const largeData = new Array(1000000).fill(0);
  
  return function() {
    // largeData 被閉包引用，會長期存活
    return largeData.length;
  };
}

const closure = createClosure();
// largeData 會被晉升到老生代，因為閉包會長期持有引用
```

### 老生代垃圾回收

老生代內存主要存儲長期存活的對象，因此回收過程更複雜。V8 引擎使用以下兩種主要算法：

#### 標記-清除算法（Mark-Sweep Algorithm）

**過程：**

1. **標記階段（Marking Phase）**
   - 從根對象（如全局變量、活動的執行上下文）開始
   - 遍歷所有被引用的對象，並將這些對象標記為「活躍」
   - 使用深度優先或廣度優先遍歷

2. **清除階段（Sweeping Phase）**
   - 遍歷整個內存
   - 釋放未被標記的對象所佔用的內存

**實際例子：**

```javascript
// 根對象
const root = {
  user: {
    name: 'John',
    profile: {
      email: 'john@example.com'
    }
  },
  settings: {
    theme: 'dark'
  }
};

// 標記階段：從 root 開始
// root → user → profile → email (標記為活躍)
// root → settings → theme (標記為活躍)

// 假設有一個未被引用的對象
const orphan = { data: 'unused' };
// orphan 沒有被任何根對象引用，不會被標記

// 清除階段：釋放 orphan 的內存
// user、profile、email、settings、theme 保留
// orphan 被清除
```

**問題：內存碎片**

標記-清除會產生內存碎片：

```javascript
// 內存狀態（簡化示意）
// [obj1][空][obj2][空][obj3][空][obj4]
//   ↑      ↑     ↑     ↑     ↑     ↑
//  存活   碎片  存活  碎片  存活  碎片

// 雖然有足夠的總空間，但沒有足夠大的連續空間
// 無法分配一個大對象
```

#### 標記-壓縮算法（Mark-Compact Algorithm）

**用途：** 解決內存碎片問題

**過程：**

1. **標記階段**：與標記-清除相同，先標記活躍對象
2. **壓縮階段**：將存活的對象移動到內存的一端，釋放出一塊連續的空間

**實際例子：**

```javascript
// 壓縮前（有碎片）
// [obj1][空][obj2][空][obj3][空][obj4]
//   ↑      ↑     ↑     ↑     ↑     ↑
//  存活   碎片  存活  碎片  存活  存活

// 壓縮後（連續空間）
// [obj1][obj2][obj3][obj4][空][空][空]
//   ↑      ↑     ↑     ↑     ↑
//  存活  存活  存活  存活  連續空間

// 現在可以分配大對象了
const largeObject = new Array(1000000);
```

**代碼例子：**

```javascript
// 創建大量對象，然後刪除一些，產生碎片
const objects = [];

// 創建對象
for (let i = 0; i < 1000; i++) {
  objects.push({
    id: i,
    data: new Array(100).fill(i)
  });
}

// 刪除部分對象（產生碎片）
objects.splice(100, 300); // 刪除中間的 300 個
objects.splice(500, 200); // 再刪除 200 個

// 標記-清除：只清除內存，留下碎片
// 標記-壓縮：清除並壓縮，產生連續空間

// 現在可以分配大對象
const largeArray = new Array(100000);
// 標記-壓縮確保有足夠的連續空間
```

### 增量垃圾回收（Incremental GC）

為了避免應用程序在垃圾回收期間完全暫停，V8 將老生代的垃圾回收過程分解為多個小步驟，與應用程序執行交替進行，減少回收的停頓時間（**Stop-the-World** 時間）。

**傳統 GC（會暫停）：**

```javascript
// 時間線
// [應用執行] [GC 暫停 100ms] [應用執行]
//            ↑
//        用戶會感受到卡頓

function heavyComputation() {
  // 執行中...
  const result = [];
  for (let i = 0; i < 10000000; i++) {
    result.push(i * 2);
  }
  // GC 突然暫停 100ms，用戶感受到卡頓
  return result;
}
```

**增量 GC（減少暫停）：**

```javascript
// 時間線
// [應用執行] [GC 5ms] [應用執行] [GC 5ms] [應用執行] [GC 5ms]...
//            ↑         ↑         ↑
//        每次暫停很短，用戶感受不到

// V8 會自動將 GC 工作分成小塊
// 每次只處理一部分，然後讓應用繼續執行
```

**實際影響：**

```javascript
// 沒有增量 GC：用戶點擊按鈕後，頁面凍結 100ms
button.addEventListener('click', () => {
  // 觸發大量對象創建
  const data = new Array(1000000).fill(0).map((_, i) => ({
    id: i,
    value: Math.random()
  }));
  // GC 暫停 100ms，按鈕沒有反應
  updateUI(data);
});

// 有增量 GC：用戶點擊按鈕後，頁面仍然響應
// GC 工作被分成多個 5ms 的小塊
// 用戶感受不到卡頓
```

### 實際優化建議

#### 1. 避免內存洩漏

```javascript
// ❌ 內存洩漏：事件監聽器沒有移除
function createLeak() {
  const button = document.getElementById('btn');
  button.addEventListener('click', () => {
    // 處理邏輯
  });
  // 函數結束，但事件監聽器仍然持有 button 的引用
  // button 無法被 GC 回收
}

// ✅ 正確做法：移除事件監聽器
function createNoLeak() {
  const button = document.getElementById('btn');
  const handler = () => {
    // 處理邏輯
  };
  button.addEventListener('click', handler);
  
  // 需要時移除
  return () => {
    button.removeEventListener('click', handler);
  };
}
```

#### 2. 避免創建不必要的長期引用

```javascript
// ❌ 不必要的長期引用
const cache = {};

function processData(data) {
  // 所有處理過的數據都被緩存
  cache[data.id] = data;
  // 如果數據量很大，會佔用大量老生代內存
}

// ✅ 使用 WeakMap 或限制緩存大小
const cache = new WeakMap(); // WeakMap 不會阻止 GC

function processData(data) {
  cache.set(data, processResult);
  // 當 data 不再被引用時，WeakMap 中的條目也會被自動清除
}
```

#### 3. 及時釋放大對象

```javascript
// ❌ 長期持有大對象
class DataProcessor {
  constructor() {
    this.largeData = new Array(10000000).fill(0);
    // 這個大數組會一直存在
  }
  
  process() {
    // 處理邏輯
  }
}

// ✅ 處理完後釋放
class DataProcessor {
  process() {
    const largeData = new Array(10000000).fill(0);
    // 處理邏輯
    // 函數結束後，largeData 可以被 GC 回收
  }
}
```

#### 4. 使用對象池（Object Pooling）

```javascript
// ❌ 頻繁創建和銷毀對象
function createParticles() {
  for (let i = 0; i < 1000; i++) {
    const particle = {
      x: Math.random(),
      y: Math.random(),
      velocity: { x: 0, y: 0 }
    };
    // 對象很快被創建和銷毀，增加 GC 壓力
  }
}

// ✅ 使用對象池
class ParticlePool {
  constructor(size) {
    this.pool = [];
    for (let i = 0; i < size; i++) {
      this.pool.push({
        x: 0,
        y: 0,
        velocity: { x: 0, y: 0 },
        active: false
      });
    }
  }
  
  acquire() {
    const particle = this.pool.find(p => !p.active);
    if (particle) {
      particle.active = true;
      return particle;
    }
    return null;
  }
  
  release(particle) {
    particle.active = false;
    // 重用對象，減少 GC 壓力
  }
}
```

### 監控和調試

#### 使用 Chrome DevTools

```javascript
// 在 Chrome DevTools 中監控內存使用
// 1. 打開 Performance 面板
// 2. 勾選 Memory
// 3. 開始錄製
// 4. 執行你的代碼
// 5. 停止錄製，查看內存使用情況

// 使用 performance.memory（非標準 API，僅 Chrome）
if (performance.memory) {
  console.log('Used:', performance.memory.usedJSHeapSize / 1048576, 'MB');
  console.log('Total:', performance.memory.totalJSHeapSize / 1048576, 'MB');
  console.log('Limit:', performance.memory.jsHeapSizeLimit / 1048576, 'MB');
}
```

#### 強制觸發 GC（僅開發環境）

```javascript
// 在 Chrome DevTools 中：
// 1. 打開 Memory 面板
// 2. 點擊垃圾桶圖標手動觸發 GC

// 或在 Node.js 中（需要 --expose-gc 標誌）
if (global.gc) {
  global.gc();
}
```

### 總結

**新生代 GC（Scavenger）：**
- 快速、高效
- 只處理短期存活的對象
- 使用複製算法，無碎片問題

**老生代 GC（Mark-Sweep / Mark-Compact）：**
- 處理長期存活的對象
- 更複雜、更耗時
- Mark-Compact 解決碎片問題

**增量 GC：**
- 將 GC 工作分成小塊
- 減少 Stop-the-World 時間
- 提升用戶體驗

**最佳實踐：**
- 避免內存洩漏（及時移除事件監聽器、清理引用）
- 避免不必要的長期引用
- 及時釋放大對象
- 考慮使用對象池減少 GC 壓力
