## Flatten Map 實現

### 什麼是 Flatten Map

**Flatten Map** 是將嵌套對象扁平化的操作，將多層嵌套的對象轉換為單層對象，使用點號路徑作為鍵。

**核心概念：**
- **扁平化對象**：將嵌套結構轉換為單層結構
- **路徑作為鍵**：使用點號分隔的路徑作為新對象的鍵
- **處理數組**：數組元素使用索引（如 `pets.0`, `pets.1`）

### 使用場景

```javascript
const obj = {
  user: {
    name: "alfred",
    pets: ["dog", "cat"]
  },
  class: {
    school: "cityu",
    major: {
      bsc: {
        dept: "sdsc"
      }
    }
  }
};

// 扁平化後
const flattened = flattenMap(obj);
// {
//   "user.name": "alfred",
//   "user.pets.0": "dog",
//   "user.pets.1": "cat",
//   "class.school": "cityu",
//   "class.major.bsc.dept": "sdsc"
// }
```

---

## 一、基礎實現

### 1.1 遞歸實現

```javascript
/**
 * 扁平化對象
 * @param {Object} obj - 要扁平化的對象
 * @param {string} prefix - 前綴（用於構建路徑）
 * @param {Object} result - 結果對象
 * @returns {Object} 扁平化後的對象
 */
function flattenMap(obj, prefix = '', result = {}) {
  // 處理 null 和 undefined
  if (obj == null) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  // 處理數組
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const key = prefix ? `${prefix}.${index}` : `${index}`;
      flattenMap(item, key, result);
    });
    return result;
  }
  
  // 處理對象
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    
    if (keys.length === 0) {
      // 空對象
      if (prefix) {
        result[prefix] = {};
      }
      return result;
    }
    
    keys.forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      // 如果值是對象或數組，遞歸處理
      if (value != null && typeof value === 'object') {
        flattenMap(value, newKey, result);
      } else {
        // 基本類型，直接賦值
        result[newKey] = value;
      }
    });
    
    return result;
  }
  
  // 基本類型
  if (prefix) {
    result[prefix] = obj;
  }
  
  return result;
}
```

### 1.2 使用範例

```javascript
const obj = {
  user: {
    name: "alfred",
    pets: ["dog", "cat"]
  },
  class: {
    school: "cityu",
    major: {
      bsc: {
        dept: "sdsc"
      }
    }
  }
};

console.log(flattenMap(obj));
// {
//   "user.name": "alfred",
//   "user.pets.0": "dog",
//   "user.pets.1": "cat",
//   "class.school": "cityu",
//   "class.major.bsc.dept": "sdsc"
// }
```

---

## 二、進階實現

### 2.1 支持自定義分隔符

```javascript
/**
 * 扁平化對象（支持自定義分隔符）
 * @param {Object} obj - 要扁平化的對象
 * @param {string} separator - 分隔符（默認 '.'）
 * @param {string} prefix - 前綴
 * @param {Object} result - 結果對象
 * @returns {Object} 扁平化後的對象
 */
function flattenMapWithSeparator(obj, separator = '.', prefix = '', result = {}) {
  if (obj == null) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const key = prefix ? `${prefix}${separator}${index}` : `${index}`;
      flattenMapWithSeparator(item, separator, key, result);
    });
    return result;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    
    if (keys.length === 0) {
      if (prefix) {
        result[prefix] = {};
      }
      return result;
    }
    
    keys.forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      
      if (value != null && typeof value === 'object') {
        flattenMapWithSeparator(value, separator, newKey, result);
      } else {
        result[newKey] = value;
      }
    });
    
    return result;
  }
  
  if (prefix) {
    result[prefix] = obj;
  }
  
  return result;
}

// 使用範例
const obj = { a: { b: { c: 1 } } };
flattenMapWithSeparator(obj, '_'); // { "a_b_c": 1 }
flattenMapWithSeparator(obj, '/'); // { "a/b/c": 1 }
```

### 2.2 支持深度限制

```javascript
/**
 * 扁平化對象（支持深度限制）
 * @param {Object} obj - 要扁平化的對象
 * @param {number} maxDepth - 最大深度（默認 Infinity）
 * @param {string} prefix - 前綴
 * @param {Object} result - 結果對象
 * @param {number} currentDepth - 當前深度
 * @returns {Object} 扁平化後的對象
 */
function flattenMapWithDepth(obj, maxDepth = Infinity, prefix = '', result = {}, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  if (obj == null) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const key = prefix ? `${prefix}.${index}` : `${index}`;
      flattenMapWithDepth(item, maxDepth, key, result, currentDepth + 1);
    });
    return result;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    
    if (keys.length === 0) {
      if (prefix) {
        result[prefix] = {};
      }
      return result;
    }
    
    keys.forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value != null && typeof value === 'object' && currentDepth < maxDepth - 1) {
        flattenMapWithDepth(value, maxDepth, newKey, result, currentDepth + 1);
      } else {
        result[newKey] = value;
      }
    });
    
    return result;
  }
  
  if (prefix) {
    result[prefix] = obj;
  }
  
  return result;
}

// 使用範例
const obj = { a: { b: { c: { d: 1 } } } };
flattenMapWithDepth(obj, 2); 
// { "a.b": { c: { d: 1 } } }（只扁平化兩層）
```

### 2.3 迭代實現（避免棧溢出）

```javascript
/**
 * 迭代實現扁平化（避免遞歸棧溢出）
 * @param {Object} obj - 要扁平化的對象
 * @returns {Object} 扁平化後的對象
 */
function flattenMapIterative(obj) {
  const result = {};
  const stack = [{ value: obj, prefix: '' }];
  
  while (stack.length > 0) {
    const { value, prefix } = stack.pop();
    
    if (value == null) {
      if (prefix) {
        result[prefix] = value;
      }
      continue;
    }
    
    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i--) {
        const key = prefix ? `${prefix}.${i}` : `${i}`;
        stack.push({ value: value[i], prefix: key });
      }
      continue;
    }
    
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      
      if (keys.length === 0) {
        if (prefix) {
          result[prefix] = {};
        }
        continue;
      }
      
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        const val = value[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (val != null && typeof val === 'object') {
          stack.push({ value: val, prefix: newKey });
        } else {
          result[newKey] = val;
        }
      }
      continue;
    }
    
    // 基本類型
    if (prefix) {
      result[prefix] = value;
    }
  }
  
  return result;
}
```

---

## 三、邊界情況處理

### 3.1 處理 null 和 undefined

```javascript
/**
 * 安全的扁平化（處理 null/undefined）
 */
function flattenMapSafe(obj, prefix = '', result = {}) {
  // 明確處理 null
  if (obj === null) {
    if (prefix) {
      result[prefix] = null;
    }
    return result;
  }
  
  // 明確處理 undefined
  if (obj === undefined) {
    if (prefix) {
      result[prefix] = undefined;
    }
    return result;
  }
  
  // 其他邏輯...
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const key = prefix ? `${prefix}.${index}` : `${index}`;
      flattenMapSafe(item, key, result);
    });
    return result;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    keys.forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value != null && typeof value === 'object') {
        flattenMapSafe(value, newKey, result);
      } else {
        result[newKey] = value;
      }
    });
    return result;
  }
  
  if (prefix) {
    result[prefix] = obj;
  }
  
  return result;
}

// 使用範例
const obj = { a: null, b: undefined, c: { d: 1 } };
flattenMapSafe(obj);
// { "a": null, "b": undefined, "c.d": 1 }
```

### 3.2 處理日期和特殊對象

```javascript
/**
 * 扁平化對象（處理特殊對象）
 */
function flattenMapAdvanced(obj, prefix = '', result = {}) {
  if (obj == null) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  // 處理 Date
  if (obj instanceof Date) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  // 處理 RegExp
  if (obj instanceof RegExp) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  // 處理其他特殊對象（如 Map、Set）
  if (obj.constructor && obj.constructor !== Object && obj.constructor !== Array) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const key = prefix ? `${prefix}.${index}` : `${index}`;
      flattenMapAdvanced(item, key, result);
    });
    return result;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    keys.forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value != null && typeof value === 'object') {
        flattenMapAdvanced(value, newKey, result);
      } else {
        result[newKey] = value;
      }
    });
    return result;
  }
  
  if (prefix) {
    result[prefix] = obj;
  }
  
  return result;
}
```

---

## 四、實際應用場景

### 4.1 表單數據處理

```javascript
// 場景：處理嵌套表單數據
const formData = {
  user: {
    personal: {
      firstName: 'John',
      lastName: 'Doe'
    },
    contact: {
      email: 'john@example.com',
      phones: ['123-456-7890', '098-765-4321']
    }
  }
};

const flattened = flattenMap(formData);
// {
//   "user.personal.firstName": "John",
//   "user.personal.lastName": "Doe",
//   "user.contact.email": "john@example.com",
//   "user.contact.phones.0": "123-456-7890",
//   "user.contact.phones.1": "098-765-4321"
// }

// 用於構建 URL 查詢參數
const queryString = new URLSearchParams(flattened).toString();
```

### 4.2 API 請求參數

```javascript
// 場景：將嵌套對象轉換為 API 請求參數
const filters = {
  user: {
    role: 'admin',
    status: ['active', 'pending']
  },
  date: {
    from: '2024-01-01',
    to: '2024-12-31'
  }
};

const params = flattenMap(filters);
// {
//   "user.role": "admin",
//   "user.status.0": "active",
//   "user.status.1": "pending",
//   "date.from": "2024-01-01",
//   "date.to": "2024-12-31"
// }

// 構建查詢字符串
const query = Object.entries(params)
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  .join('&');
```

### 4.3 配置對象扁平化

```javascript
// 場景：扁平化配置對象，便於環境變量設置
const config = {
  database: {
    host: 'localhost',
    port: 5432,
    credentials: {
      username: 'admin',
      password: 'secret'
    }
  },
  cache: {
    redis: {
      host: 'redis.example.com',
      port: 6379
    }
  }
};

const flatConfig = flattenMap(config);
// {
//   "database.host": "localhost",
//   "database.port": 5432,
//   "database.credentials.username": "admin",
//   "database.credentials.password": "secret",
//   "cache.redis.host": "redis.example.com",
//   "cache.redis.port": 6379
// }

// 可以轉換為環境變量格式
const envVars = Object.entries(flatConfig)
  .map(([key, value]) => `${key.toUpperCase().replace(/\./g, '_')}=${value}`)
  .join('\n');
```

---

## 五、反向操作：Unflatten

### 5.1 將扁平化對象還原

```javascript
/**
 * 將扁平化對象還原為嵌套對象
 * @param {Object} flatObj - 扁平化的對象
 * @returns {Object} 嵌套對象
 */
function unflattenMap(flatObj) {
  const result = {};
  
  Object.keys(flatObj).forEach(key => {
    const keys = key.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      
      // 檢查是否為數組索引
      if (/^\d+$/.test(k)) {
        const index = parseInt(k, 10);
        if (!Array.isArray(current)) {
          current = [];
        }
        while (current.length <= index) {
          current.push(undefined);
        }
        if (current[index] === undefined) {
          current[index] = {};
        }
        current = current[index];
      } else {
        if (!(k in current)) {
          // 檢查下一個鍵是否為數字，決定創建數組還是對象
          const nextKey = keys[i + 1];
          current[k] = /^\d+$/.test(nextKey) ? [] : {};
        }
        current = current[k];
      }
    }
    
    const lastKey = keys[keys.length - 1];
    if (/^\d+$/.test(lastKey)) {
      const index = parseInt(lastKey, 10);
      if (!Array.isArray(current)) {
        current = [];
      }
      while (current.length <= index) {
        current.push(undefined);
      }
      current[index] = flatObj[key];
    } else {
      current[lastKey] = flatObj[key];
    }
  });
  
  return result;
}

// 使用範例
const flat = {
  "user.name": "alfred",
  "user.pets.0": "dog",
  "user.pets.1": "cat",
  "class.school": "cityu"
};

const nested = unflattenMap(flat);
// {
//   user: {
//     name: "alfred",
//     pets: ["dog", "cat"]
//   },
//   class: {
//     school: "cityu"
//   }
// }
```

---

## 六、測試用例

### 6.1 完整測試

```javascript
describe('flattenMap', () => {
  it('should flatten nested object', () => {
    const obj = {
      user: {
        name: "alfred",
        pets: ["dog", "cat"]
      },
      class: {
        school: "cityu",
        major: {
          bsc: {
            dept: "sdsc"
          }
        }
      }
    };
    
    const result = flattenMap(obj);
    expect(result).toEqual({
      "user.name": "alfred",
      "user.pets.0": "dog",
      "user.pets.1": "cat",
      "class.school": "cityu",
      "class.major.bsc.dept": "sdsc"
    });
  });
  
  it('should handle empty object', () => {
    expect(flattenMap({})).toEqual({});
  });
  
  it('should handle empty array', () => {
    expect(flattenMap({ arr: [] })).toEqual({ "arr": [] });
  });
  
  it('should handle null and undefined', () => {
    const obj = { a: null, b: undefined, c: 1 };
    const result = flattenMap(obj);
    expect(result).toEqual({
      "a": null,
      "b": undefined,
      "c": 1
    });
  });
  
  it('should handle nested arrays', () => {
    const obj = { arr: [[1, 2], [3, 4]] };
    const result = flattenMap(obj);
    expect(result).toEqual({
      "arr.0.0": 1,
      "arr.0.1": 2,
      "arr.1.0": 3,
      "arr.1.1": 4
    });
  });
  
  it('should handle mixed types', () => {
    const obj = {
      string: "hello",
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      nested: { a: 1 }
    };
    
    const result = flattenMap(obj);
    expect(result).toEqual({
      "string": "hello",
      "number": 42,
      "boolean": true,
      "null": null,
      "array.0": 1,
      "array.1": 2,
      "array.2": 3,
      "nested.a": 1
    });
  });
});
```

---

## 七、性能優化

### 7.1 避免字符串拼接

```javascript
/**
 * 優化版：使用數組構建路徑，最後 join
 */
function flattenMapOptimized(obj, prefix = [], result = {}) {
  if (obj == null) {
    if (prefix.length > 0) {
      result[prefix.join('.')] = obj;
    }
    return result;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      flattenMapOptimized(item, [...prefix, index], result);
    });
    return result;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    keys.forEach(key => {
      const value = obj[key];
      const newPrefix = [...prefix, key];
      
      if (value != null && typeof value === 'object') {
        flattenMapOptimized(value, newPrefix, result);
      } else {
        result[newPrefix.join('.')] = value;
      }
    });
    return result;
  }
  
  if (prefix.length > 0) {
    result[prefix.join('.')] = obj;
  }
  
  return result;
}
```

---

## 八、最佳實踐

### 8.1 處理循環引用

```javascript
/**
 * 扁平化對象（處理循環引用）
 */
function flattenMapSafe(obj, prefix = '', result = {}, visited = new WeakSet()) {
  if (obj == null) {
    if (prefix) {
      result[prefix] = obj;
    }
    return result;
  }
  
  // 檢查循環引用
  if (typeof obj === 'object') {
    if (visited.has(obj)) {
      if (prefix) {
        result[prefix] = '[Circular]';
      }
      return result;
    }
    visited.add(obj);
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const key = prefix ? `${prefix}.${index}` : `${index}`;
      flattenMapSafe(item, key, result, visited);
    });
    visited.delete(obj);
    return result;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    keys.forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value != null && typeof value === 'object') {
        flattenMapSafe(value, newKey, result, visited);
      } else {
        result[newKey] = value;
      }
    });
    visited.delete(obj);
    return result;
  }
  
  if (prefix) {
    result[prefix] = obj;
  }
  
  return result;
}
```

### 8.2 過濾特定值

```javascript
/**
 * 扁平化對象（過濾特定值）
 */
function flattenMapWithFilter(obj, prefix = '', result = {}, filterFn = null) {
  if (obj == null) {
    if (prefix && (!filterFn || filterFn(obj, prefix))) {
      result[prefix] = obj;
    }
    return result;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const key = prefix ? `${prefix}.${index}` : `${index}`;
      flattenMapWithFilter(item, key, result, filterFn);
    });
    return result;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    keys.forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value != null && typeof value === 'object') {
        flattenMapWithFilter(value, newKey, result, filterFn);
      } else {
        if (!filterFn || filterFn(value, newKey)) {
          result[newKey] = value;
        }
      }
    });
    return result;
  }
  
  if (prefix && (!filterFn || filterFn(obj, prefix))) {
    result[prefix] = obj;
  }
  
  return result;
}

// 使用範例：過濾 null 和 undefined
const obj = { a: 1, b: null, c: { d: undefined, e: 2 } };
const filtered = flattenMapWithFilter(obj, '', {}, (value) => value != null);
// { "a": 1, "c.e": 2 }
```

---

## 九、完整實現

### 最終版本

```javascript
/**
 * 完整的 flattenMap 實現
 * @param {Object} obj - 要扁平化的對象
 * @param {Object} options - 選項
 * @param {string} options.separator - 分隔符（默認 '.'）
 * @param {number} options.maxDepth - 最大深度（默認 Infinity）
 * @param {Function} options.filter - 過濾函數
 * @param {boolean} options.includeNull - 是否包含 null（默認 true）
 * @returns {Object} 扁平化後的對象
 */
function flattenMap(obj, options = {}) {
  const {
    separator = '.',
    maxDepth = Infinity,
    filter = null,
    includeNull = true
  } = options;
  
  function flatten(value, prefix, depth, visited) {
    // 深度限制
    if (depth >= maxDepth) {
      if (prefix && (!filter || filter(value, prefix))) {
        return { [prefix]: value };
      }
      return {};
    }
    
    // 處理 null 和 undefined
    if (value == null) {
      if (prefix && includeNull && (!filter || filter(value, prefix))) {
        return { [prefix]: value };
      }
      return {};
    }
    
    // 處理循環引用
    if (typeof value === 'object' && visited.has(value)) {
      if (prefix && (!filter || filter('[Circular]', prefix))) {
        return { [prefix]: '[Circular]' };
      }
      return {};
    }
    
    if (typeof value === 'object') {
      visited.add(value);
    }
    
    // 處理數組
    if (Array.isArray(value)) {
      const result = {};
      value.forEach((item, index) => {
        const key = prefix ? `${prefix}${separator}${index}` : `${index}`;
        Object.assign(result, flatten(item, key, depth + 1, visited));
      });
      visited.delete(value);
      return result;
    }
    
    // 處理對象
    if (typeof value === 'object') {
      const result = {};
      const keys = Object.keys(value);
      
      if (keys.length === 0) {
        if (prefix && (!filter || filter({}, prefix))) {
          result[prefix] = {};
        }
        visited.delete(value);
        return result;
      }
      
      keys.forEach(key => {
        const val = value[key];
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        
        if (val != null && typeof val === 'object' && depth < maxDepth - 1) {
          Object.assign(result, flatten(val, newKey, depth + 1, visited));
        } else {
          if (!filter || filter(val, newKey)) {
            result[newKey] = val;
          }
        }
      });
      
      visited.delete(value);
      return result;
    }
    
    // 基本類型
    if (prefix && (!filter || filter(value, prefix))) {
      return { [prefix]: value };
    }
    
    return {};
  }
  
  return flatten(obj, '', 0, new WeakSet());
}

// 使用範例
const obj = {
  user: {
    name: "alfred",
    pets: ["dog", "cat"]
  },
  class: {
    school: "cityu",
    major: {
      bsc: {
        dept: "sdsc"
      }
    }
  }
};

console.log(flattenMap(obj));
// {
//   "user.name": "alfred",
//   "user.pets.0": "dog",
//   "user.pets.1": "cat",
//   "class.school": "cityu",
//   "class.major.bsc.dept": "sdsc"
// }
```

---

## 總結

**Flatten Map 核心要點：**

1. **遞歸處理**：遍歷對象和數組，遞歸處理嵌套結構
2. **路徑構建**：使用點號（或自定義分隔符）構建路徑作為鍵
3. **數組處理**：數組元素使用索引（如 `pets.0`, `pets.1`）
4. **邊界處理**：處理 null、undefined、循環引用等情況

**使用建議：**
- 根據需求選擇合適的實現方式
- 注意性能，大對象使用迭代實現
- 處理邊界情況（null、undefined、循環引用）
- 考慮是否需要過濾特定值

**適用場景：**
- 表單數據處理
- API 請求參數構建
- 配置對象扁平化
- 數據轉換和序列化

理解 Flatten Map 的實現原理，可以幫助更好地處理嵌套對象，簡化數據結構操作。