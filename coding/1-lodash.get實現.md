## lodash.get 實現

### 什麼是 lodash.get

`lodash.get` 是一個安全地從物件中獲取嵌套屬性的函數。它會根據路徑（path）從物件中取值，如果路徑不存在，返回預設值（defaultValue），而不會拋出錯誤。

### 使用場景

```javascript
const obj = {
  user: {
    profile: {
      name: 'John',
      age: 30
    }
  }
}

// ❌ 直接存取可能出錯
obj.user.profile.name  // 如果 user 是 null，會拋錯

// ✅ 使用 get 安全存取
get(obj, 'user.profile.name')  // 'John'
get(obj, 'user.profile.email', 'N/A')  // 'N/A' (預設值)
```

### 實現

```javascript
/**
 * 實現 lodash.get
 * @param {Object} object - 要查詢的物件
 * @param {string|Array} path - 屬性路徑，可以是字串 'a.b.c' 或陣列 ['a', 'b', 'c']
 * @param {*} defaultValue - 如果路徑不存在，返回的預設值
 * @returns {*} 找到的值或預設值
 */
function get(object, path, defaultValue) {
  // 如果 object 是 null 或 undefined，直接返回預設值
  if (object == null) {
    return defaultValue
  }

  // 將路徑轉換成陣列格式
  // 支援 'a.b.c' 或 ['a', 'b', 'c'] 或 'a[0].b'
  const keys = Array.isArray(path) 
    ? path 
    : path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)

  // 遍歷路徑，逐層取值
  let result = object
  for (const key of keys) {
    // 如果中間某層是 null 或 undefined，返回預設值
    if (result == null) {
      return defaultValue
    }
    result = result[key]
  }

  // 如果最終值是 undefined，返回預設值
  return result ?? defaultValue : result
}
```

### 關鍵技術點

**1. 路徑正規化**

```javascript
// 將 'a[0].b[1]' 轉換成 ['a', '0', 'b', '1']
path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
```

- `\[(\d+)\]/g`：匹配 `[數字]` 格式
- `.replace(/\[(\d+)\]/g, '.$1')`：將 `[0]` 轉換成 `.0`
- `.split('.')`：用點號分割
- `.filter(Boolean)`：過濾空字串

**2. 安全存取**

```javascript
if (result == null) {
  return defaultValue
}
```

使用 `== null` 同時檢查 `null` 和 `undefined`，避免在 `null` 或 `undefined` 上存取屬性時拋錯。

**3. undefined vs 預設值**

```javascript
return result ?? defaultValue
```

只有當值是 `undefined` 時才返回預設值。如果值是 `null`、`0`、`false` 等 falsy 值，仍然返回原值。

### 使用範例

```javascript
const obj = {
  user: {
    name: 'John',
    hobbies: ['reading', 'coding'],
    address: {
      city: 'Taipei',
      zip: null
    }
  }
}

// 基本用法
get(obj, 'user.name')  // 'John'
get(obj, 'user.age', 0)  // 0 (預設值)

// 陣列索引
get(obj, 'user.hobbies[0]')  // 'reading'
get(obj, ['user', 'hobbies', 1])  // 'coding'

// 嵌套物件
get(obj, 'user.address.city')  // 'Taipei'
get(obj, 'user.address.country', 'Taiwan')  // 'Taiwan'

// null 值處理
get(obj, 'user.address.zip')  // null (不是 undefined，所以返回 null)
get(obj, 'user.address.zipcode', 'N/A')  // 'N/A' (undefined，返回預設值)

// 不存在的路徑
get(obj, 'user.email', 'no-email')  // 'no-email'
get(obj, 'admin.permissions', [])  // []

// Edge cases
get(null, 'a.b', 'default')  // 'default'
get(undefined, 'a.b', 'default')  // 'default'
get({}, 'a.b.c', 'default')  // 'default'
```

### 進階：支援更複雜的路徑

如果需要支援更複雜的路徑格式（如 `'a["b"].c'`），可以擴展正規化邏輯：

```javascript
function normalizePath(path) {
  if (Array.isArray(path)) {
    return path
  }
  
  // 處理 'a["b"].c' 或 "a['b'].c" 格式
  return path
    .replace(/\["([^"]+)"\]/g, '.$1')  // ["key"] -> .key
    .replace(/\['([^']+)'\]/g, '.$1')   // ['key'] -> .key
    .replace(/\[(\d+)\]/g, '.$1')       // [0] -> .0
    .split('.')
    .filter(Boolean)
}
```

### 與原生可選鏈（Optional Chaining）的對比

ES2020 引入了可選鏈操作符 `?.`，可以簡化部分場景：

```javascript
// 使用可選鏈
obj?.user?.profile?.name ?? 'default'

// 使用 get
get(obj, 'user.profile.name', 'default')
```

**差異：**
- 可選鏈需要明確知道路徑結構，寫法較冗長
- `get` 可以動態傳入路徑，更靈活
- 可選鏈在路徑不存在時返回 `undefined`，需要配合 `??` 使用
- `get` 直接支援預設值，語義更清晰

### 實際應用場景

1. **API 回應處理**：安全地從 API 回應中提取數據
2. **配置讀取**：從配置物件中讀取嵌套設定
3. **表單驗證**：檢查表單數據的特定欄位
4. **狀態管理**：在 Redux/Vuex 中安全存取狀態

### 時間複雜度

- **時間複雜度**：O(n)，n 是路徑的深度
- **空間複雜度**：O(1)，只使用常數額外空間
