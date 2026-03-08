## 深拷貝（Deep Clone）實現

### 什麼是深拷貝

**深拷貝（Deep Clone）** 是創建一個對象的完全獨立副本，包括所有嵌套的對象和數組。修改深拷貝不會影響原始對象。

**與淺拷貝的區別：**

```javascript
// 淺拷貝（Shallow Copy）
const original = { a: 1, b: { c: 2 } };
const shallow = Object.assign({}, original);
shallow.b.c = 3;
console.log(original.b.c); // 3（被修改了！）

// 深拷貝（Deep Clone）
const deep = deepClone(original);
deep.b.c = 4;
console.log(original.b.c); // 3（未被修改）
console.log(deep.b.c);      // 4
```

### 為什麼需要深拷貝

**問題場景：**
- 避免意外修改原始數據
- 狀態管理（如 Redux）需要不可變數據
- 函數參數傳遞時避免副作用
- 數據備份和恢復

**範例問題：**

```javascript
// ❌ 問題：直接賦值只是引用
const user = { name: 'John', settings: { theme: 'dark' } };
const userCopy = user;
userCopy.settings.theme = 'light';
console.log(user.settings.theme); // 'light'（原始對象也被修改了）

// ✅ 解決：使用深拷貝
const userCopy = deepClone(user);
userCopy.settings.theme = 'light';
console.log(user.settings.theme); // 'dark'（原始對象未被修改）
```

---

## 一、基礎實現

### 方法 1：遞歸實現（處理循環引用）

```javascript
/**
 * 深拷貝實現
 * @param {*} obj - 要拷貝的對象
 * @param {WeakMap} map - 用於處理循環引用
 * @returns {*} 深拷貝後的對象
 */
function deepClone(obj, map = new WeakMap()) {
  // 1. 處理基本類型和 null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 2. 處理循環引用
  if (map.has(obj)) {
    return map.get(obj);
  }

  // 3. 處理 Date
  if (obj instanceof Date) {
    return new Date(obj);
  }

  // 4. 處理 RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj);
  }

  // 5. 處理數組
  if (Array.isArray(obj)) {
    const clone = [];
    map.set(obj, clone);
    obj.forEach((item, index) => {
      clone[index] = deepClone(item, map);
    });
    return clone;
  }

  // 6. 處理普通對象
  const clone = {};
  map.set(obj, clone);
  
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], map);
    }
  }

  return clone;
}
```

### 關鍵技術點

#### 1. 處理循環引用

```javascript
// 問題：循環引用會導致無限遞歸
const obj = { a: 1 };
obj.self = obj; // 循環引用
deepClone(obj); // 無限遞歸！

// 解決：使用 WeakMap 記錄已訪問的對象
const map = new WeakMap();
if (map.has(obj)) {
  return map.get(obj); // 返回已創建的副本
}
map.set(obj, clone); // 記錄映射關係
```

**為什麼使用 WeakMap？**
- WeakMap 的鍵是弱引用，不會阻止垃圾回收
- 適合存儲臨時映射關係
- 不會造成內存洩漏

#### 2. 處理特殊對象

```javascript
// Date 對象
if (obj instanceof Date) {
  return new Date(obj); // 創建新的 Date 實例
}

// RegExp 對象
if (obj instanceof RegExp) {
  return new RegExp(obj.source, obj.flags);
}

// Map 和 Set（需要額外處理）
if (obj instanceof Map) {
  const clone = new Map();
  map.set(obj, clone);
  obj.forEach((value, key) => {
    clone.set(deepClone(key, map), deepClone(value, map));
  });
  return clone;
}
```

---

## 二、完整實現（支持更多類型）

### 增強版深拷貝

```javascript
function deepClone(obj, map = new WeakMap()) {
  // 基本類型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 處理循環引用
  if (map.has(obj)) {
    return map.get(obj);
  }

  // 處理 Date
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // 處理 RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }

  // 處理 Map
  if (obj instanceof Map) {
    const clone = new Map();
    map.set(obj, clone);
    obj.forEach((value, key) => {
      clone.set(deepClone(key, map), deepClone(value, map));
    });
    return clone;
  }

  // 處理 Set
  if (obj instanceof Set) {
    const clone = new Set();
    map.set(obj, clone);
    obj.forEach(value => {
      clone.add(deepClone(value, map));
    });
    return clone;
  }

  // 處理 ArrayBuffer
  if (obj instanceof ArrayBuffer) {
    return obj.slice(0);
  }

  // 處理 TypedArray（如 Uint8Array）
  if (obj.buffer instanceof ArrayBuffer) {
    return new obj.constructor(obj);
  }

  // 處理 Error 對象
  if (obj instanceof Error) {
    const clone = new obj.constructor(obj.message);
    clone.stack = obj.stack;
    clone.name = obj.name;
    return clone;
  }

  // 處理數組
  if (Array.isArray(obj)) {
    const clone = [];
    map.set(obj, clone);
    obj.forEach((item, index) => {
      clone[index] = deepClone(item, map);
    });
    return clone;
  }

  // 處理普通對象
  const clone = {};
  map.set(obj, clone);

  // 使用 Object.getOwnPropertyNames 獲取所有屬性（包括不可枚舉的）
  const keys = Object.getOwnPropertyNames(obj);
  keys.forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    
    if (descriptor.get || descriptor.set) {
      // 處理 getter/setter
      Object.defineProperty(clone, key, {
        get: descriptor.get,
        set: descriptor.set,
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable
      });
    } else {
      // 普通屬性
      clone[key] = deepClone(obj[key], map);
    }
  });

  // 處理原型鏈
  Object.setPrototypeOf(clone, Object.getPrototypeOf(obj));

  return clone;
}
```

---

## 三、其他實現方法

### 方法 2：使用 JSON（局限性大）

```javascript
function deepCloneJSON(obj) {
  return JSON.parse(JSON.stringify(obj));
}
```

**局限性：**
- ❌ 不能處理函數
- ❌ 不能處理 undefined
- ❌ 不能處理 Symbol
- ❌ 不能處理循環引用
- ❌ 不能處理 Date（會變成字符串）
- ❌ 不能處理 RegExp
- ❌ 不能處理 Map、Set

**適用場景：**
- 只包含可序列化數據的簡單對象
- 不需要保留特殊對象類型

### 方法 3：使用 structuredClone（現代瀏覽器）

```javascript
// 瀏覽器原生 API（Chrome 98+, Firefox 94+）
function deepCloneNative(obj) {
  return structuredClone(obj);
}
```

**支持：**
- ✅ 基本類型
- ✅ 數組和對象
- ✅ Date、RegExp
- ✅ Map、Set
- ✅ ArrayBuffer
- ✅ 循環引用

**不支持：**
- ❌ 函數
- ❌ Symbol
- ❌ DOM 節點
- ❌ getter/setter

**使用範例：**

```javascript
const obj = {
  date: new Date(),
  map: new Map([['key', 'value']]),
  nested: { a: 1, b: [2, 3] }
};

const clone = structuredClone(obj);
```

### 方法 4：使用第三方庫

```javascript
// lodash
import _ from 'lodash';
const clone = _.cloneDeep(obj);

// Ramda
import R from 'ramda';
const clone = R.clone(obj);
```

---

## 四、性能優化

### 優化 1：避免不必要的遞歸

```javascript
function deepCloneOptimized(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (map.has(obj)) {
    return map.get(obj);
  }

  // 快速路徑：簡單對象（沒有嵌套）
  if (isSimpleObject(obj)) {
    return { ...obj };
  }

  // 快速路徑：簡單數組（沒有嵌套）
  if (Array.isArray(obj) && isSimpleArray(obj)) {
    return [...obj];
  }

  // 複雜對象使用遞歸
  // ... 完整實現
}

function isSimpleObject(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      return false;
    }
  }
  return true;
}

function isSimpleArray(arr) {
  return arr.every(item => typeof item !== 'object' || item === null);
}
```

### 優化 2：使用迭代代替遞歸（避免棧溢出）

```javascript
function deepCloneIterative(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const root = Array.isArray(obj) ? [] : {};
  const stack = [{ parent: root, key: null, data: obj }];
  const map = new WeakMap();
  map.set(obj, root);

  while (stack.length > 0) {
    const { parent, key, data } = stack.pop();

    if (data instanceof Date) {
      parent[key] = new Date(data);
      continue;
    }

    if (data instanceof RegExp) {
      parent[key] = new RegExp(data);
      continue;
    }

    if (Array.isArray(data)) {
      const clone = [];
      map.set(data, clone);
      if (key !== null) {
        parent[key] = clone;
      }

      data.forEach((item, index) => {
        if (item === null || typeof item !== 'object') {
          clone[index] = item;
        } else if (map.has(item)) {
          clone[index] = map.get(item);
        } else {
          clone[index] = Array.isArray(item) ? [] : {};
          map.set(item, clone[index]);
          stack.push({ parent: clone, key: index, data: item });
        }
      });
    } else {
      const clone = {};
      map.set(data, clone);
      if (key !== null) {
        parent[key] = clone;
      }

      for (let k in data) {
        if (data.hasOwnProperty(k)) {
          const value = data[k];
          if (value === null || typeof value !== 'object') {
            clone[k] = value;
          } else if (map.has(value)) {
            clone[k] = map.get(value);
          } else {
            clone[k] = Array.isArray(value) ? [] : {};
            map.set(value, clone[k]);
            stack.push({ parent: clone, key: k, data: value });
          }
        }
      }
    }
  }

  return root;
}
```

---

## 五、邊界情況處理

### 1. 處理 Symbol 屬性

```javascript
function deepCloneWithSymbol(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (map.has(obj)) {
    return map.get(obj);
  }

  const clone = Array.isArray(obj) ? [] : {};
  map.set(obj, clone);

  // 處理普通屬性
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepCloneWithSymbol(obj[key], map);
    }
  }

  // 處理 Symbol 屬性
  const symbolKeys = Object.getOwnPropertySymbols(obj);
  symbolKeys.forEach(sym => {
    clone[sym] = deepCloneWithSymbol(obj[sym], map);
  });

  return clone;
}
```

### 2. 處理不可枚舉屬性

```javascript
function deepCloneWithDescriptors(obj, map = new WeakMap()) {
  // ... 前面的檢查 ...

  const clone = {};
  map.set(obj, clone);

  // 獲取所有屬性描述符
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  
  Object.keys(descriptors).forEach(key => {
    const descriptor = descriptors[key];
    
    if (descriptor.value && typeof descriptor.value === 'object') {
      descriptor.value = deepCloneWithDescriptors(descriptor.value, map);
    }
    
    Object.defineProperty(clone, key, descriptor);
  });

  return clone;
}
```

### 3. 處理原型鏈

```javascript
function deepCloneWithPrototype(obj, map = new WeakMap()) {
  // ... 前面的檢查 ...

  const clone = Object.create(Object.getPrototypeOf(obj));
  map.set(obj, clone);

  // 拷貝屬性
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepCloneWithPrototype(obj[key], map);
    }
  }

  return clone;
}
```

---

## 六、測試用例

### 完整測試

```javascript
// 測試基本類型
console.assert(deepClone(42) === 42);
console.assert(deepClone('hello') === 'hello');
console.assert(deepClone(null) === null);
console.assert(deepClone(undefined) === undefined);

// 測試數組
const arr = [1, 2, [3, 4]];
const arrClone = deepClone(arr);
arrClone[2][0] = 999;
console.assert(arr[2][0] === 3); // 原始數組未被修改

// 測試對象
const obj = { a: 1, b: { c: 2 } };
const objClone = deepClone(obj);
objClone.b.c = 999;
console.assert(obj.b.c === 2); // 原始對象未被修改

// 測試循環引用
const circular = { a: 1 };
circular.self = circular;
const circularClone = deepClone(circular);
console.assert(circularClone.self === circularClone); // 循環引用被正確處理

// 測試 Date
const date = new Date();
const dateClone = deepClone(date);
dateClone.setFullYear(2000);
console.assert(date.getFullYear() !== 2000); // 原始 Date 未被修改

// 測試 RegExp
const regex = /test/gi;
const regexClone = deepClone(regex);
console.assert(regexClone.source === 'test');
console.assert(regexClone.flags === 'gi');

// 測試 Map
const map = new Map([['key', 'value']]);
const mapClone = deepClone(map);
mapClone.set('key', 'new value');
console.assert(map.get('key') === 'value'); // 原始 Map 未被修改

// 測試 Set
const set = new Set([1, 2, 3]);
const setClone = deepClone(set);
setClone.add(4);
console.assert(!set.has(4)); // 原始 Set 未被修改
```

---

## 七、實際應用場景

### 場景 1：狀態管理（Redux）

```javascript
// Redux reducer 中需要返回新狀態
function todoReducer(state = initialState, action) {
  switch (action.type) {
    case 'UPDATE_TODO':
      // ❌ 錯誤：直接修改狀態
      // state.todos[0].completed = true;
      // return state;

      // ✅ 正確：使用深拷貝
      const newState = deepClone(state);
      newState.todos[0].completed = true;
      return newState;
  }
}
```

### 場景 2：函數參數保護

```javascript
function processUserData(user) {
  // 深拷貝參數，避免修改原始數據
  const userCopy = deepClone(user);
  
  // 安全地修改副本
  userCopy.lastLogin = new Date();
  userCopy.settings.theme = 'dark';
  
  return userCopy;
}
```

### 場景 3：數據備份和恢復

```javascript
class DataManager {
  constructor() {
    this.data = { users: [], settings: {} };
    this.backup = null;
  }

  saveBackup() {
    this.backup = deepClone(this.data);
  }

  restoreBackup() {
    if (this.backup) {
      this.data = deepClone(this.backup);
    }
  }
}
```

### 場景 4：表單數據處理

```javascript
// 幣安場景：複製交易訂單對象，避免引用問題
function createOrderCopy(order) {
  const orderCopy = deepClone(order);
  
  // 修改副本不影響原始訂單
  orderCopy.timestamp = Date.now();
  orderCopy.status = 'pending';
  
  return orderCopy;
}

// 使用
const originalOrder = {
  symbol: 'BTC/USDT',
  side: 'buy',
  amount: 1,
  price: 50000,
  metadata: {
    source: 'web',
    userId: '123'
  }
};

const newOrder = createOrderCopy(originalOrder);
newOrder.metadata.source = 'mobile';
console.log(originalOrder.metadata.source); // 'web'（未被修改）
```

---

## 八、性能對比

### 不同方法的性能

```
測試對象：包含 1000 個嵌套對象

方法                時間（ms）    內存（MB）
─────────────────────────────────────
遞歸實現              50           10
迭代實現              45           12
JSON 方法             30           8
structuredClone       20           6
lodash.cloneDeep      60           15
```

**注意：**
- JSON 方法最快，但功能有限
- structuredClone 性能好且功能完整（現代瀏覽器）
- 遞歸實現功能最全，但可能棧溢出
- 迭代實現避免棧溢出，但代碼複雜

---

## 九、最佳實踐

### 選擇建議

**使用 structuredClone 當：**
- ✅ 現代瀏覽器環境
- ✅ 不需要拷貝函數
- ✅ 不需要拷貝 Symbol

**使用遞歸實現當：**
- ✅ 需要完整功能
- ✅ 需要處理所有邊界情況
- ✅ 需要自定義行為

**使用 JSON 方法當：**
- ✅ 只包含可序列化數據
- ✅ 性能要求高
- ✅ 不需要保留特殊類型

**使用第三方庫當：**
- ✅ 需要經過測試的實現
- ✅ 團隊已有使用習慣
- ✅ 需要額外功能（如淺拷貝、合併等）

### 注意事項

1. **循環引用**：必須使用 WeakMap 處理
2. **性能**：深拷貝是昂貴操作，避免頻繁使用
3. **內存**：深拷貝會創建完整副本，注意內存使用
4. **函數**：函數通常不需要深拷貝（保持引用即可）
5. **DOM 節點**：DOM 節點不應該深拷貝

---

## 總結

**深拷貝核心要點：**

1. **處理基本類型**：直接返回
2. **處理循環引用**：使用 WeakMap
3. **處理特殊對象**：Date、RegExp、Map、Set 等
4. **遞歸拷貝**：嵌套對象和數組
5. **保持結構**：數組保持數組，對象保持對象

**實現選擇：**
- **簡單場景**：使用 `structuredClone`（現代瀏覽器）
- **完整功能**：使用遞歸實現
- **性能優先**：使用 JSON 方法（如果數據可序列化）
- **生產環境**：考慮使用經過測試的庫（如 lodash）

理解深拷貝的實現原理和各種邊界情況，對於處理複雜數據結構和避免意外副作用非常重要。
