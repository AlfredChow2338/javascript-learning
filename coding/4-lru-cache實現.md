## LRU Cache 實現

### 什麼是 LRU Cache

**LRU（Least Recently Used）Cache** 是一種緩存淘汰策略，當緩存容量滿時，會移除最久未使用的項目。它結合了 HashMap 的快速查找和 Doubly Linked List 的快速插入/刪除特性。

**核心特性：**
- **O(1) 時間複雜度**的 `get` 和 `put` 操作
- 自動淘汰最久未使用的項目
- 固定容量限制

### 使用場景

```javascript
// 瀏覽器緩存：最近訪問的頁面保留在內存中
// 數據庫查詢緩存：緩存熱點數據，避免重複查詢
// API 響應緩存：減少網絡請求
// 圖片加載緩存：避免重複加載相同圖片
```

### 實現思路

**數據結構選擇：**
- **HashMap**：用於 O(1) 查找節點
- **Doubly Linked List**：用於 O(1) 插入和刪除，維護使用順序

**操作流程：**
1. **get(key)**：從 HashMap 找到節點，移動到鏈表頭部
2. **put(key, value)**：
   - 如果 key 存在：更新值並移動到頭部
   - 如果 key 不存在：創建新節點，如果容量滿則刪除尾部節點

### 完整實現

```javascript
/**
 * LRU Cache 實現
 * 使用 HashMap + Doubly Linked List
 */
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.cache = new Map() // HashMap: key -> node
    this.head = null // 鏈表頭部（最近使用）
    this.tail = null // 鏈表尾部（最久未使用）
  }

  /**
   * 獲取值
   * @param {*} key
   * @returns {*} value 或 -1（如果不存在）
   */
  get(key) {
    if (!this.cache.has(key)) {
      return -1
    }

    const node = this.cache.get(key)
    // 移動到頭部（標記為最近使用）
    this.moveToHead(node)
    return node.value
  }

  /**
   * 設置值
   * @param {*} key
   * @param {*} value
   */
  put(key, value) {
    if (this.cache.has(key)) {
      // 更新已存在的節點
      const node = this.cache.get(key)
      node.value = value
      this.moveToHead(node)
    } else {
      // 創建新節點
      const newNode = {
        key,
        value,
        prev: null,
        next: null
      }

      if (this.cache.size >= this.capacity) {
        // 容量已滿，刪除尾部節點
        this.removeTail()
      }

      this.addToHead(newNode)
      this.cache.set(key, newNode)
    }
  }

  /**
   * 將節點移動到頭部
   */
  moveToHead(node) {
    // 如果已經是頭部，不需要移動
    if (node === this.head) {
      return
    }

    // 從原位置移除
    this.removeNode(node)
    // 添加到頭部
    this.addToHead(node)
  }

  /**
   * 將節點添加到頭部
   */
  addToHead(node) {
    if (this.head === null) {
      // 第一個節點
      this.head = node
      this.tail = node
    } else {
      node.next = this.head
      this.head.prev = node
      this.head = node
    }
  }

  /**
   * 從鏈表中移除節點
   */
  removeNode(node) {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      // 是頭部節點
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      // 是尾部節點
      this.tail = node.prev
    }

    node.prev = null
    node.next = null
  }

  /**
   * 移除尾部節點（最久未使用）
   */
  removeTail() {
    if (this.tail === null) {
      return
    }

    const tailNode = this.tail
    this.removeNode(tailNode)
    this.cache.delete(tailNode.key)
  }
}
```

### 簡化版本（使用 Map 的特性）

JavaScript 的 `Map` 保持插入順序，可以利用這個特性簡化實現：

```javascript
/**
 * LRU Cache 簡化實現
 * 利用 Map 的插入順序特性
 */
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key) {
    if (!this.cache.has(key)) {
      return -1
    }

    // Map 的 set 操作會更新順序（移動到最後）
    // 但我們需要的是「最近使用」在「最前」
    // 所以先刪除再添加，讓它成為最新的
    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  put(key, value) {
    if (this.cache.has(key)) {
      // 更新：刪除舊的，添加新的（會移動到最後）
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // 容量已滿，刪除第一個（最久未使用）
      // Map 的 keys() 返回迭代器，第一個就是最舊的
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, value)
  }
}
```

**注意：** 這個簡化版本利用了 Map 的特性，但要注意 Map 的迭代順序是「插入順序」，所以最舊的在前面，最新的在後面。這與傳統 LRU 的「最近使用在前」相反，但邏輯上等價。

### 關鍵技術點

**1. Doubly Linked List 的優勢**

```javascript
// 單向鏈表：刪除節點需要 O(n) 時間（需要找到前一個節點）
// 雙向鏈表：刪除節點只需要 O(1) 時間（直接有 prev 指針）
```

**2. HashMap 的作用**

```javascript
// 沒有 HashMap：查找節點需要 O(n) 時間
// 有 HashMap：查找節點只需要 O(1) 時間
this.cache = new Map() // key -> node 的映射
```

**3. 節點結構**

```javascript
{
  key: 'key1',      // 用於從 cache Map 中查找
  value: 'value1',  // 存儲的值
  prev: null,       // 指向前一個節點
  next: null        // 指向下一個節點
}
```

**4. 邊界情況處理**

```javascript
// 空鏈表
if (this.head === null) {
  this.head = node
  this.tail = node
}

// 刪除頭部節點
if (node.prev === null) {
  this.head = node.next
}

// 刪除尾部節點
if (node.next === null) {
  this.tail = node.prev
}
```

### 使用範例

```javascript
// 創建容量為 2 的 LRU Cache
const cache = new LRUCache(2)

// 設置值
cache.put(1, 1)  // cache = {1: 1}
cache.put(2, 2)  // cache = {1: 1, 2: 2}

// 獲取值
cache.get(1)     // 返回 1，cache = {2: 2, 1: 1}（1 移到前面）

// 添加新值，容量已滿，刪除最久未使用的 2
cache.put(3, 3)  // cache = {1: 1, 3: 3}

// 2 已被刪除
cache.get(2)     // 返回 -1（不存在）

// 更新已存在的值
cache.put(1, 10) // cache = {3: 3, 1: 10}（1 移到前面）

// 添加新值，刪除最久未使用的 3
cache.put(4, 4)  // cache = {1: 10, 4: 4}
```

### 完整測試用例

```javascript
// 測試用例 1：基本操作
const cache1 = new LRUCache(2)
cache1.put(1, 1)
cache1.put(2, 2)
console.log(cache1.get(1))    // 1
cache1.put(3, 3)              // 刪除 2
console.log(cache1.get(2))    // -1
cache1.put(4, 4)              // 刪除 1
console.log(cache1.get(1))    // -1
console.log(cache1.get(3))    // 3
console.log(cache1.get(4))    // 4

// 測試用例 2：更新值
const cache2 = new LRUCache(2)
cache2.put(2, 1)
cache2.put(1, 1)
cache2.put(2, 3)              // 更新 2 的值
cache2.put(4, 1)              // 刪除 1
console.log(cache2.get(1))    // -1
console.log(cache2.get(2))    // 3

// 測試用例 3：容量為 1
const cache3 = new LRUCache(1)
cache3.put(2, 1)
console.log(cache3.get(2))    // 1
cache3.put(3, 2)              // 刪除 2
console.log(cache3.get(2))    // -1
console.log(cache3.get(3))    // 2
```

### 進階：支援更多操作

```javascript
class LRUCache {
  // ... 前面的代碼 ...

  /**
   * 獲取當前緩存大小
   */
  size() {
    return this.cache.size
  }

  /**
   * 清空緩存
   */
  clear() {
    this.cache.clear()
    this.head = null
    this.tail = null
  }

  /**
   * 檢查 key 是否存在
   */
  has(key) {
    return this.cache.has(key)
  }

  /**
   * 刪除指定 key
   */
  delete(key) {
    if (!this.cache.has(key)) {
      return false
    }

    const node = this.cache.get(key)
    this.removeNode(node)
    this.cache.delete(key)
    return true
  }

  /**
   * 獲取所有 keys（按使用順序，從最近到最久）
   */
  keys() {
    const keys = []
    let current = this.head
    while (current) {
      keys.push(current.key)
      current = current.next
    }
    return keys
  }

  /**
   * 獲取所有 values（按使用順序，從最近到最久）
   */
  values() {
    const values = []
    let current = this.head
    while (current) {
      values.push(current.value)
      current = current.next
    }
    return values
  }
}
```

### 實際應用場景

**1. 瀏覽器緩存**

```javascript
// 緩存最近訪問的頁面
const pageCache = new LRUCache(10)
pageCache.put('/home', { html: '...', timestamp: Date.now() })
pageCache.put('/about', { html: '...', timestamp: Date.now() })
```

**2. API 響應緩存**

```javascript
// 緩存 API 響應，避免重複請求
const apiCache = new LRUCache(100)

async function fetchUser(userId) {
  if (apiCache.has(userId)) {
    return apiCache.get(userId)
  }

  const response = await fetch(`/api/users/${userId}`)
  const data = await response.json()
  apiCache.put(userId, data)
  return data
}
```

**3. 圖片加載緩存**

```javascript
// 緩存已加載的圖片
const imageCache = new LRUCache(50)

function loadImage(url) {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url))
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.put(url, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}
```

**4. 數據庫查詢緩存**

```javascript
// 緩存數據庫查詢結果
const queryCache = new LRUCache(200)

async function queryDatabase(sql, params) {
  const cacheKey = `${sql}:${JSON.stringify(params)}`
  
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)
  }

  const result = await db.query(sql, params)
  queryCache.put(cacheKey, result)
  return result
}
```

### 時間複雜度分析

**Doubly Linked List + HashMap 實現：**
- **get(key)**：O(1)
  - HashMap 查找：O(1)
  - 鏈表移動節點：O(1)
- **put(key, value)**：O(1)
  - HashMap 查找：O(1)
  - 鏈表插入/刪除：O(1)
- **空間複雜度**：O(capacity)

**Map 簡化版本：**
- **get(key)**：O(1)（平均情況，Map 操作是 O(1)）
- **put(key, value)**：O(1)（平均情況）
- **空間複雜度**：O(capacity)

### 與其他緩存策略的對比

| 策略 | 特點 | 適用場景 |
|------|------|----------|
| **LRU** | 淘汰最久未使用 | 訪問模式有時間局部性 |
| **LFU** | 淘汰使用頻率最低 | 訪問模式有頻率局部性 |
| **FIFO** | 淘汰最先進入的 | 簡單但可能淘汰熱點數據 |
| **Random** | 隨機淘汰 | 簡單但性能不穩定 |

### 常見面試問題

**Q1: 為什麼使用 Doubly Linked List 而不是 Singly Linked List？**

A: 刪除節點時，需要修改前一個節點的 `next` 指針。單向鏈表需要從頭遍歷找到前一個節點（O(n)），而雙向鏈表直接有 `prev` 指針（O(1)）。

**Q2: 為什麼需要 HashMap？**

A: 如果只用鏈表，查找節點需要 O(n) 時間。HashMap 提供 O(1) 的查找時間，讓整體操作達到 O(1)。

**Q3: 如何處理並發訪問？**

A: 可以添加鎖機制，或使用線程安全的數據結構。在 JavaScript 中，由於是單線程，不需要特別處理。

**Q4: 如何實現 TTL（Time To Live）？**

A: 在節點中添加 `expireTime` 字段，在 `get` 時檢查是否過期，過期則刪除並返回 -1。

```javascript
class LRUNode {
  constructor(key, value, ttl) {
    this.key = key
    this.value = value
    this.expireTime = ttl ? Date.now() + ttl : null
    this.prev = null
    this.next = null
  }

  isExpired() {
    return this.expireTime && Date.now() > this.expireTime
  }
}
```

### 結論

LRU Cache 是一個經典的數據結構問題，結合了：
- **HashMap**：O(1) 查找
- **Doubly Linked List**：O(1) 插入/刪除

實現時要注意：
1. 正確維護鏈表的頭尾指針
2. 處理邊界情況（空鏈表、單節點等）
3. 確保所有操作都是 O(1) 時間複雜度
4. 考慮實際應用場景的需求（TTL、統計等）

這是面試中常見的高頻題目，需要熟練掌握實現細節。
