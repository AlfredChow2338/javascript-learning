# lodash.get 實現

動態路徑讀嵌套資料時，`obj.a.b` 在中間層為 `null`/`undefined` 會拋錯。`get` 用 **路徑逐步取值 + 缺省回退**，把「存取失敗」變成可預期的 `defaultValue`。

### 本質：路徑正規化 + 安全遍歷

- **問題**：路徑可能是 `'a.b.c'`、`['a','b']`、或 `'a[0].b'`。
- **手段**：`path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)` 統一成 key 陣列；每層 `result == null` 即返回預設值。
- **結果**：`null` 當成「有值」保留；只有 **`undefined`** 才用 `??` 回退預設值（`0`、`false` 不會被吃掉）。

```javascript
function get(object, path, defaultValue) {
  if (object == null) return defaultValue
  const keys = Array.isArray(path)
    ? path
    : path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
  let result = object
  for (const key of keys) {
    if (result == null) return defaultValue
    result = result[key]
  }
  return result === undefined ? defaultValue : result
}
```

### 與 optional chaining 的分工

- **`obj?.a?.b ?? 'x'`**：路徑寫死、靜態結構清楚時夠用。
- **`get(obj, dynamicPath, 'x')`**：路徑來自 API / 配置字串時才需要。

### 小結

- **問題**：嵌套讀取要防中斷、要預設值語義。
- **手段**：正規化 path + `== null` 短路 + `undefined` 才 fallback。
- **結果**：O(路徑深度) 時間、O(1) 額外空間。
