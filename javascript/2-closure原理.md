## Closure（閉包）原理

### 經典問題：為什麼打印 10 次 10？

```javascript
function x() {
	for (var i = 0; i < 10; i++) {
		setTimeout(() => {
			console.log(i)
		}, 1000) // 注意：setTimeout 第二個參數應該是延遲時間（毫秒）
	}
} 

x() // 打印 10 次 10
```

**為什麼不是打印 0 到 9？**

這個問題完美展示了 Closure（閉包）的核心概念。讓我們深入分析。

### 什麼是 Closure（閉包）

**定義：** Closure 是指函數能夠「記住」並訪問其外部（詞法）作用域中的變數，即使函數在該作用域之外執行。

**簡單理解：** 內部函數「捕獲」了外部函數的變數，形成一個「閉包」。

### 問題分析：執行流程

讓我們逐步分析上面的代碼：

```javascript
function x() {
	for (var i = 0; i < 10; i++) {
		setTimeout(() => {
			console.log(i) // 這個 i 來自哪裡？
		}, 1000)
	}
}
```

**關鍵點 1：`var` 的函數作用域**

```javascript
// var 的作用域是函數級別，不是塊級別
function x() {
  // i 在整個函數 x 的作用域內
  for (var i = 0; i < 10; i++) {
    // i 在這裡可以訪問
  }
  // i 在這裡也可以訪問！值為 10
  console.log(i); // 10
}
```

**關鍵點 2：閉包捕獲的是「引用」，不是「值」**

```javascript
function x() {
  for (var i = 0; i < 10; i++) {
    // setTimeout 是異步的，不會立即執行
    // 回調函數形成閉包，捕獲變數 i 的「引用」
    setTimeout(() => {
      console.log(i) // 這個 i 指向函數 x 作用域中的同一個 i
    }, 1000)
  }
  // 當循環結束時，i 的值已經是 10
  // 所有 10 個 setTimeout 回調都引用同一個 i，值為 10
}
```

**執行時間線：**

```
時間 0ms:  開始執行函數 x()
時間 0ms:  i = 0，創建第一個 setTimeout（延遲 1000ms）
時間 0ms:  i = 1，創建第二個 setTimeout（延遲 1000ms）
時間 0ms:  i = 2，創建第三個 setTimeout（延遲 1000ms）
...
時間 0ms:  i = 9，創建第十個 setTimeout（延遲 1000ms）
時間 0ms:  i = 10，循環結束，函數 x() 執行完畢
時間 1000ms: 第一個 setTimeout 回調執行，讀取 i，此時 i = 10
時間 1000ms: 第二個 setTimeout 回調執行，讀取 i，此時 i = 10
...
時間 1000ms: 第十個 setTimeout 回調執行，讀取 i，此時 i = 10
```

**視覺化：**

```javascript
// 等價於這樣寫（更容易理解）
function x() {
  var i; // var 提升到函數頂部
  
  for (i = 0; i < 10; i++) {
    // 10 個回調函數都「閉包」了同一個變數 i
    setTimeout(() => {
      console.log(i) // 都引用同一個 i
    }, 1000)
  }
  // 循環結束，i = 10
  // 1 秒後，所有回調執行，讀取的 i 都是 10
}
```

### 解決方案

#### 方案一：使用 `let`（塊級作用域）

```javascript
function x() {
  // let 是塊級作用域，每次循環都創建新的 i
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      console.log(i) // 每個回調閉包了不同的 i
    }, 1000)
  }
}

x() // 打印 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
```

**為什麼 `let` 可以解決？**

```javascript
// let 在每次循環迭代時創建新的綁定
for (let i = 0; i < 10; i++) {
  // 每次迭代，i 都是新的變數
  // 相當於：
  // {
  //   let i = 0;
  //   setTimeout(() => console.log(i), 1000)
  // }
  // {
  //   let i = 1;
  //   setTimeout(() => console.log(i), 1000)
  // }
  // ...
}
```

#### 方案二：使用 IIFE（立即執行函數表達式）

```javascript
function x() {
  for (var i = 0; i < 10; i++) {
    // IIFE 創建新的作用域，捕獲當前的 i 值
    (function(j) {
      setTimeout(() => {
        console.log(j) // j 是 IIFE 的參數，每個 IIFE 有自己的 j
      }, 1000)
    })(i) // 立即執行，傳入當前的 i 值
  }
}

x() // 打印 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
```

**原理：**

```javascript
// 每次循環，IIFE 創建新的作用域
for (var i = 0; i < 10; i++) {
  (function(j) {
    // j 是 IIFE 的參數，每個 IIFE 有自己的 j
    // 閉包捕獲的是 j，不是 i
    setTimeout(() => {
      console.log(j) // j 的值在 IIFE 創建時就固定了
    }, 1000)
  })(i) // 傳入當前的 i 值（0, 1, 2, ...）
}
```

#### 方案三：使用 `bind`

```javascript
function x() {
  function logI(i) {
    console.log(i)
  }
  
  for (var i = 0; i < 10; i++) {
    // bind 創建新函數，預先綁定參數
    setTimeout(logI.bind(null, i), 1000)
  }
}

x() // 打印 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
```

### Closure 的核心機制

#### 1. 詞法作用域（Lexical Scoping）

```javascript
function outer() {
  const x = 10;
  
  function inner() {
    console.log(x); // inner 可以訪問 outer 的變數
  }
  
  return inner;
}

const fn = outer();
fn(); // 10
// 即使 outer 已經執行完畢，inner 仍然可以訪問 x
```

**詞法作用域規則：**
- 函數的作用域在**定義時**確定，不是執行時
- 內部函數可以訪問外部函數的變數
- 外部函數無法訪問內部函數的變數

#### 2. 變數捕獲（Variable Capturing）

```javascript
function createCounter() {
  let count = 0; // 被閉包捕獲的變數
  
  return function() {
    count++; // 修改捕獲的變數
    return count;
  };
}

const counter1 = createCounter();
const counter2 = createCounter();

console.log(counter1()); // 1
console.log(counter1()); // 2
console.log(counter2()); // 1（獨立的閉包）
console.log(counter1()); // 3
```

**每個閉包都有自己捕獲的變數副本：**

```javascript
// counter1 和 counter2 各自閉包了不同的 count
// counter1 的 count: 0 -> 1 -> 2 -> 3
// counter2 的 count: 0 -> 1
```

#### 3. 閉包的生命週期

```javascript
function outer() {
  const data = { value: 42 };
  
  function inner() {
    console.log(data.value);
  }
  
  return inner;
}

const fn = outer();
// outer 執行完畢，但 data 不會被垃圾回收
// 因為 inner 仍然持有對 data 的引用

fn(); // 42
fn = null; // 釋放引用，data 才能被垃圾回收
```

**重要：** 閉包會阻止變數被垃圾回收，直到閉包本身被釋放。

### 實際應用場景

#### 1. 模組模式（Module Pattern）

```javascript
const counterModule = (function() {
  let count = 0; // 私有變數
  
  return {
    increment: function() {
      count++;
    },
    decrement: function() {
      count--;
    },
    getCount: function() {
      return count;
    }
  };
})();

counterModule.increment();
console.log(counterModule.getCount()); // 1
// count 無法直接訪問，實現了封裝
```

#### 2. 函數工廠（Function Factory）

```javascript
function createMultiplier(multiplier) {
  // multiplier 被閉包捕獲
  return function(number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

#### 3. 事件處理器

```javascript
function setupButtons() {
  const buttons = document.querySelectorAll('button');
  
  for (let i = 0; i < buttons.length; i++) {
    // 每個按鈕閉包了不同的 i
    buttons[i].addEventListener('click', function() {
      console.log(`Button ${i} clicked`);
    });
  }
}

// 如果使用 var，所有按鈕都會打印最後一個 i 的值
```

#### 4. 防抖（Debounce）和節流（Throttle）

```javascript
function debounce(func, delay) {
  let timeoutId; // 被閉包捕獲
  
  return function(...args) {
    clearTimeout(timeoutId); // 訪問閉包的 timeoutId
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

const debouncedSearch = debounce(function(query) {
  console.log('Searching for:', query);
}, 300);

// 多次調用，只有最後一次會在 300ms 後執行
debouncedSearch('a');
debouncedSearch('ab');
debouncedSearch('abc'); // 只有這個會執行
```

#### 5. React Hooks 中的閉包

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // 閉包捕獲了 count 的初始值
    const timer = setInterval(() => {
      setCount(count + 1); // 問題：count 永遠是初始值 0
    }, 1000);
    
    return () => clearInterval(timer);
  }, []); // 依賴為空，閉包捕獲的是初始 count
  
  // ✅ 正確做法：使用函數式更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => prev + 1); // 不依賴閉包的 count
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return <div>{count}</div>;
}
```

### 常見陷阱

#### 陷阱一：循環中的閉包（就是開頭的問題）

```javascript
// ❌ 錯誤
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 3, 3, 3
}

// ✅ 解決
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 0, 1, 2
}
```

#### 陷阱二：意外的變數共享

```javascript
// ❌ 錯誤：所有函數共享同一個 i
const functions = [];
for (var i = 0; i < 3; i++) {
  functions.push(() => console.log(i));
}
functions[0](); // 3
functions[1](); // 3
functions[2](); // 3

// ✅ 解決：使用 let 或 IIFE
const functions = [];
for (let i = 0; i < 3; i++) {
  functions.push(() => console.log(i));
}
functions[0](); // 0
functions[1](); // 1
functions[2](); // 2
```

#### 陷阱三：閉包導致內存洩漏

```javascript
// ❌ 問題：閉包持有大對象的引用
function createHandler() {
  const largeData = new Array(1000000).fill(0);
  
  return function(event) {
    // 即使只使用 event，largeData 也不會被回收
    console.log(event.type);
  };
}

// ✅ 解決：不需要的變數不要放在閉包作用域
function createHandler() {
  return function(event) {
    console.log(event.type);
  };
  // largeData 不在閉包作用域，可以被回收
}
```

### 閉包的實現原理

**簡化理解：**

```javascript
function outer() {
  const x = 10;
  
  function inner() {
    console.log(x);
  }
  
  return inner;
}
```

**JavaScript 引擎內部（簡化）：**

```javascript
// 當 outer 執行時，創建執行上下文（Execution Context）
outerExecutionContext = {
  variables: {
    x: 10
  },
  scopeChain: [globalScope]
};

// 當 inner 定義時，記錄其詞法環境（Lexical Environment）
innerLexicalEnvironment = {
  outer: outerExecutionContext, // 指向外部作用域
  // inner 可以通過這個鏈訪問 outer 的變數
};

// 當 outer 執行完畢，outerExecutionContext 不會被銷毀
// 因為 innerLexicalEnvironment 仍然引用它
// 這就是閉包的本質：保持對外部作用域的引用
```

### 總結

**閉包的核心要點：**

1. **閉包是函數和其詞法環境的組合**
   - 函數可以訪問定義時的外部變數
   - 即使外部函數執行完畢，變數仍然存在

2. **閉包捕獲的是「引用」，不是「值」**
   - 如果變數會改變，閉包看到的是最新的值
   - 這就是為什麼 `var` 在循環中會出問題

3. **每個閉包都是獨立的**
   - 不同的閉包捕獲不同的變數副本
   - 修改一個閉包的變數不會影響其他閉包

4. **閉包會阻止垃圾回收**
   - 被閉包引用的變數不會被回收
   - 需要注意內存管理

**回到原始問題：**

```javascript
function x() {
  for (var i = 0; i < 10; i++) {
    setTimeout(() => {
      console.log(i) // 所有回調閉包了同一個 i
    }, 1000)
  }
  // i 最終是 10，所有回調讀取的都是 10
}
```

**解決：使用 `let` 讓每次循環創建新的變數綁定**

```javascript
function x() {
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      console.log(i) // 每個回調閉包了不同的 i
    }, 1000)
  }
}
```

閉包是 JavaScript 最強大的特性之一，理解閉包對於掌握 JavaScript 至關重要。
