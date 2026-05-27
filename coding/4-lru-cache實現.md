# LRU Cache 實現

容量固定時，要淘汰 **最久沒被用到** 的項目。面試要求 `get` / `put` 均 **O(1)**：單靠 Map 或單向鏈表都不夠，需 **Map（key → node）+ 雙向鏈表（由新到舊）**。

### 本質：查找 O(1) + 移動 O(1)

- **get(key)**：有則取值並把節點移到鏈表頭（最近使用）。
- **put(key, value)**：已有則更新並移頭；否則插頭，若超容量則刪 **tail** 並從 Map 移除。

- **為什麼要雙向鏈表**：刪除任意節點需改 `prev.next` 與 `next.prev`；單向鏈表找前驅是 O(n)。面試畫圖時：`Map` 找 node → 從鏈表摘下 → 插到 head；滿容時刪 `tail` 並 `map.delete(tail.key)`。

### 實務捷徑：ES Map 插入順序

Map 依 **插入順序** 迭代；`get` 時 `delete` 再 `set` 可把項移到「最新」；滿時刪 `map.keys().next().value`（最舊）。

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.cache = new Map()
  }
  get(key) {
    if (!this.cache.has(key)) return -1
    const v = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, v)
    return v
  }
  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key)
    else if (this.cache.size >= this.capacity)
      this.cache.delete(this.cache.keys().next().value)
    this.cache.set(key, value)
  }
}
```

- **取捨**：程式短、面試常過；語意是「最舊 = 最早插入」，與顯式鏈表等價。

### 小結

- **問題**：有限容量下保留「最近有用」的資料。
- **手段**：Map 定位 + 鏈表維護順序（或 Map 刪插模擬）。
- **結果**：get/put 平均 O(1)。
