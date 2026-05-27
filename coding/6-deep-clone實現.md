# Deep Clone 實現

**淺拷貝**只複製第一層；嵌套物件仍共用引用，改副本會污染原資料。**深拷貝**要遞迴複製結構，並處理 **循環引用**（否則 stack overflow）。

### 本質：遞迴 + WeakMap 記已複製節點

- **基本類型 / null**：直接返回。
- **已見過的 object**：`map.get(obj)` 回傳同一副本（切斷環）。
- **Date / RegExp**：`new Date(obj)`、`new RegExp(obj)` 等專用構造。
- **Array / 普通 object**：先 `map.set(原, 空殼)`，再填子屬性。

```javascript
function deepClone(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj
  if (map.has(obj)) return map.get(obj)
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags)

  const clone = Array.isArray(obj) ? [] : {}
  map.set(obj, clone)
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key], map)
  }
  return clone
}
```

- **WeakMap 原因**：鍵是弱引用，不阻止 GC；只服務「拷貝過程」的臨時對照。

### 何時不必自己寫

| 方式 | 適用 | 限制 |
|------|------|------|
| **`structuredClone`** | 現代 runtime、純資料 | 無 function、Symbol、DOM |
| **`JSON.parse(JSON.stringify)`** | 純 JSON 樹 | 無 Date/RegExp/undefined、無環 |
| **lodash `cloneDeep`** | 生產要穩 | 依賴庫 |

### 小結

- **問題**：嵌套 + 環狀結構要獨立副本。
- **手段**：類型分支 + WeakMap 斷環。
- **結果**：面試遞迴版；實務優先 `structuredClone` 或成熟庫。

可執行範例：`script/6-deep-clone.js`
