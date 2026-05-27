# Flatten Map 實現

嵌套 object / array 要送 **flat query string**、環境變數、或 key-value 儲存時，需把路徑收成單層鍵，例如 `user.pets.0`。

### 本質：DFS + 累積 path 前綴

- **object**：對每個 key，`prefix ? `${prefix}.${key}` : key`，值仍為 object/array 則遞迴。
- **array**：用數字索引 `prefix.0`、`prefix.1`。
- **primitive**：`result[path] = value`。
- **`null` / 葉節點 object**：依需求決定是否當葉子寫入（下面實作將 `null` 當葉子）。

```javascript
function flattenMap(obj, prefix = '', result = {}) {
  if (obj === null || typeof obj !== 'object') {
    if (prefix) result[prefix] = obj
    return result
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      const key = prefix ? `${prefix}.${i}` : String(i)
      flattenMap(item, key, result)
    })
    return result
  }
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    const val = obj[key]
    if (val !== null && typeof val === 'object') flattenMap(val, path, result)
    else result[path] = val
  }
  return result
}
```

```javascript
flattenMap({
  user: { name: 'alfred', pets: ['dog', 'cat'] },
  class: { school: 'cityu', major: { bsc: { dept: 'sdsc' } } },
})
// user.name, user.pets.0, user.pets.1, class.school, class.major.bsc.dept
```

### 反向：unflatten

對 flat key `split('.')`，沿途建 object；若下一段是數字則建 array — 與 `lodash.get` 路徑約定對稱（見 `1-lodash.get實現.md`）。

### 注意

- **鍵名含 `.`**：需跳脫或換分隔符，否則還原歧義。
- **循環引用**：加 `WeakSet`，遇環寫 `[Circular]` 或中止。
- **深樹**：迭代 + stack 可避免遞迴爆棧。

### 小結

- **問題**：嵌套結構要一維 key。
- **手段**：DFS 拼 path。
- **結果**：方便 `URLSearchParams`、配置扁平化。

可執行範例：`script/8-flatten-map.js`
