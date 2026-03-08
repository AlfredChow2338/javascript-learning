## JavaScript this 的原理

### 什麼是 this

**`this`** 是 JavaScript 中的一個關鍵字，它指向函數執行時的上下文對象。`this` 的值不是靜態的，而是在函數被調用時動態決定的。

**核心概念：**
- `this` 的值取決於**函數如何被調用**，而不是函數在哪裡定義
- `this` 在函數執行時才確定，不是定義時確定
- 不同的調用方式會導致 `this` 指向不同的對象

### 為什麼需要 this

**使用場景：**
- 訪問對象的屬性和方法
- 實現方法的重用
- 實現構造函數模式
- 實現事件處理

**範例：**

```javascript
const person = {
  name: 'John',
  greet: function() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

person.greet(); // "Hello, I'm John"
// this 指向 person 對象
```

---

## 一、this 的綁定規則

### 1.1 默認綁定（Default Binding）

**規則：** 在非嚴格模式下，獨立函數調用時，`this` 指向全局對象（瀏覽器中是 `window`，Node.js 中是 `global`）。在嚴格模式下，`this` 為 `undefined`。

```javascript
// 非嚴格模式
function greet() {
  console.log(this); // window (瀏覽器) 或 global (Node.js)
  console.log(this === window); // true (瀏覽器)
}

greet(); // 獨立函數調用

// 嚴格模式
'use strict';
function greet() {
  console.log(this); // undefined
}

greet(); // undefined
```

**關鍵點：**
- 函數獨立調用（不是作為對象的方法）
- 非嚴格模式：`this` = 全局對象
- 嚴格模式：`this` = `undefined`

### 1.2 隱式綁定（Implicit Binding）

**規則：** 當函數作為對象的方法調用時，`this` 指向調用該方法的對象。

```javascript
const person = {
  name: 'John',
  greet: function() {
    console.log(this.name); // this 指向 person
  }
};

person.greet(); // "John"
// this = person
```

**多層對象：**

```javascript
const obj = {
  name: 'Outer',
  inner: {
    name: 'Inner',
    greet: function() {
      console.log(this.name);
    }
  }
};

obj.inner.greet(); // "Inner"
// this 指向最後調用方法的對象（inner）
```

**關鍵點：**
- 函數作為對象的方法調用
- `this` 指向**調用方法的對象**（最後一個點前面的對象）

### 1.3 顯式綁定（Explicit Binding）

**規則：** 使用 `call`、`apply` 或 `bind` 明確指定 `this` 的值。

#### call 和 apply

```javascript
function greet(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const person1 = { name: 'John' };
const person2 = { name: 'Jane' };

// call: 參數逐個傳遞
greet.call(person1, 'Hello', '!'); // "Hello, I'm John!"
// this = person1

// apply: 參數以數組形式傳遞
greet.apply(person2, ['Hi', '.']); // "Hi, I'm Jane."
// this = person2
```

#### bind

```javascript
function greet() {
  console.log(`Hello, I'm ${this.name}`);
}

const person = { name: 'John' };

// bind 返回一個新函數，this 永久綁定
const boundGreet = greet.bind(person);
boundGreet(); // "Hello, I'm John"

// 即使在其他上下文中調用，this 也不會改變
const obj = {
  name: 'Jane',
  method: boundGreet
};
obj.method(); // "Hello, I'm John" (仍然是 person)
```

**關鍵點：**
- `call` 和 `apply`：立即執行，臨時綁定 `this`
- `bind`：返回新函數，永久綁定 `this`

### 1.4 new 綁定（Constructor Binding）

**規則：** 使用 `new` 關鍵字調用函數時，`this` 指向新創建的對象。

```javascript
function Person(name) {
  // this 指向新創建的對象
  this.name = name;
  this.greet = function() {
    console.log(`Hello, I'm ${this.name}`);
  };
}

const person = new Person('John');
person.greet(); // "Hello, I'm John"
// this = person (新創建的對象)
```

**new 關鍵字做了什麼：**

```javascript
// new Person('John') 等價於：
function Person(name) {
  // 1. 創建一個新對象
  const obj = {};
  
  // 2. 將 this 指向新對象
  // this = obj;
  
  // 3. 設置原型鏈
  // Object.setPrototypeOf(obj, Person.prototype);
  
  // 4. 執行函數體
  this.name = name;
  
  // 5. 如果函數沒有返回對象，返回 this
  // return this;
}
```

**關鍵點：**
- `new` 創建新對象
- `this` 指向新創建的對象
- 如果函數返回對象，則返回該對象；否則返回 `this`

---

## 二、綁定優先級

### 優先級順序

```
1. new 綁定（最高優先級）
2. 顯式綁定（call/apply/bind）
3. 隱式綁定（對象方法調用）
4. 默認綁定（獨立函數調用，最低優先級）
```

### 優先級範例

```javascript
function greet() {
  console.log(this.name);
}

const obj1 = { name: 'Obj1' };
const obj2 = { name: 'Obj2' };

// 1. new 綁定 > 顯式綁定
const boundGreet = greet.bind(obj1);
const instance = new boundGreet(); // this 指向新對象，不是 obj1

// 2. 顯式綁定 > 隱式綁定
obj2.greet = greet;
obj2.greet.call(obj1); // "Obj1" (call 的優先級更高)

// 3. 隱式綁定 > 默認綁定
obj2.greet(); // "Obj2" (隱式綁定)
const fn = obj2.greet;
fn(); // undefined 或 window.name (默認綁定，丟失了隱式綁定)
```

---

## 三、特殊情況

### 3.1 箭頭函數的 this

**規則：** 箭頭函數沒有自己的 `this`，它繼承外層作用域的 `this`。

```javascript
const person = {
  name: 'John',
  // 普通函數
  greet: function() {
    console.log(this.name); // this = person
  },
  // 箭頭函數
  greetArrow: () => {
    console.log(this.name); // this = window (外層作用域的 this)
  },
  // 嵌套情況
  nested: function() {
    const inner = () => {
      console.log(this.name); // this = person (繼承外層的 this)
    };
    inner();
  }
};

person.greet(); // "John"
person.greetArrow(); // undefined (window.name)
person.nested(); // "John"
```

**關鍵點：**
- 箭頭函數的 `this` 在定義時確定，不是調用時確定
- 箭頭函數的 `this` 繼承外層作用域
- 箭頭函數不能使用 `call`、`apply`、`bind` 改變 `this`

```javascript
const greet = () => {
  console.log(this.name);
};

const person = { name: 'John' };

greet.call(person); // 無效，this 仍然是 window
greet.bind(person)(); // 無效，this 仍然是 window
```

### 3.2 回調函數中的 this

**問題：** 回調函數中的 `this` 可能不是預期的值。

```javascript
const person = {
  name: 'John',
  greet: function() {
    console.log(this.name);
  }
};

// 問題：回調函數丟失了 this
setTimeout(person.greet, 1000); // undefined (this = window)

// 解決方案 1: 使用箭頭函數
setTimeout(() => {
  person.greet(); // "John"
}, 1000);

// 解決方案 2: 使用 bind
setTimeout(person.greet.bind(person), 1000); // "John"

// 解決方案 3: 使用 call/apply
setTimeout(() => {
  person.greet.call(person); // "John"
}, 1000);
```

### 3.3 事件處理器中的 this

```javascript
// HTML: <button id="btn">Click</button>

const obj = {
  name: 'Button',
  handleClick: function() {
    console.log(this.name); // this 指向 button 元素
  }
};

const btn = document.getElementById('btn');
btn.addEventListener('click', obj.handleClick);
// 點擊時：this = btn (觸發事件的元素)

// 如果需要 this 指向 obj
btn.addEventListener('click', obj.handleClick.bind(obj));
// 或
btn.addEventListener('click', () => {
  obj.handleClick();
});
```

### 3.4 數組方法中的 this

```javascript
const obj = {
  name: 'Array',
  items: [1, 2, 3],
  process: function() {
    // 回調函數中的 this
    this.items.forEach(function(item) {
      console.log(this.name); // this = window (默認綁定)
    });
    
    // 使用箭頭函數
    this.items.forEach(item => {
      console.log(this.name); // this = obj (繼承外層)
    });
    
    // 使用 bind
    this.items.forEach(function(item) {
      console.log(this.name); // this = obj
    }.bind(this));
  }
};

obj.process();
```

---

## 四、常見問題和解決方案

### 問題 1：方法作為回調時丟失 this

```javascript
// ❌ 問題
const obj = {
  name: 'John',
  greet: function() {
    console.log(this.name);
  }
};

const fn = obj.greet;
fn(); // undefined (this = window)

// ✅ 解決方案 1: bind
const boundFn = obj.greet.bind(obj);
boundFn(); // "John"

// ✅ 解決方案 2: 箭頭函數
const obj2 = {
  name: 'John',
  greet: function() {
    console.log(this.name);
  },
  getGreet: function() {
    return () => this.greet(); // 箭頭函數繼承 this
  }
};

const fn2 = obj2.getGreet();
fn2(); // "John"
```

### 問題 2：嵌套函數中的 this

```javascript
// ❌ 問題
const obj = {
  name: 'John',
  outer: function() {
    function inner() {
      console.log(this.name); // this = window
    }
    inner();
  }
};

obj.outer(); // undefined

// ✅ 解決方案 1: 保存 this
const obj2 = {
  name: 'John',
  outer: function() {
    const self = this; // 保存 this
    function inner() {
      console.log(self.name); // 使用保存的 this
    }
    inner();
  }
};

obj2.outer(); // "John"

// ✅ 解決方案 2: 箭頭函數
const obj3 = {
  name: 'John',
  outer: function() {
    const inner = () => {
      console.log(this.name); // 繼承外層的 this
    };
    inner();
  }
};

obj3.outer(); // "John"
```

### 問題 3：構造函數返回對象

```javascript
function Person(name) {
  this.name = name;
  // 如果返回對象，this 指向的對象會被忽略
  return { name: 'Override' };
}

const person = new Person('John');
console.log(person.name); // "Override" (不是 "John")

// 如果返回非對象，this 仍然有效
function Person2(name) {
  this.name = name;
  return 'String'; // 返回非對象，忽略
}

const person2 = new Person2('John');
console.log(person2.name); // "John"
```

---

## 五、call、apply、bind 詳解

### 5.1 call

```javascript
function greet(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const person = { name: 'John' };

// call: 立即執行，this 指向第一個參數
greet.call(person, 'Hello', '!'); // "Hello, I'm John!"
// 參數逐個傳遞
```

**實現原理（簡化版）：**

```javascript
Function.prototype.myCall = function(context, ...args) {
  // 如果 context 是 null 或 undefined，使用全局對象
  context = context || (typeof window !== 'undefined' ? window : global);
  
  // 將函數作為 context 的方法
  const fnSymbol = Symbol('fn');
  context[fnSymbol] = this;
  
  // 調用函數
  const result = context[fnSymbol](...args);
  
  // 刪除臨時方法
  delete context[fnSymbol];
  
  return result;
};
```

### 5.2 apply

```javascript
function greet(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const person = { name: 'John' };

// apply: 立即執行，this 指向第一個參數
greet.apply(person, ['Hello', '!']); // "Hello, I'm John!"
// 參數以數組形式傳遞
```

**實現原理（簡化版）：**

```javascript
Function.prototype.myApply = function(context, argsArray) {
  context = context || (typeof window !== 'undefined' ? window : global);
  
  const fnSymbol = Symbol('fn');
  context[fnSymbol] = this;
  
  // 使用展開運算符傳遞數組參數
  const result = context[fnSymbol](...(argsArray || []));
  
  delete context[fnSymbol];
  
  return result;
};
```

### 5.3 bind

```javascript
function greet(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const person = { name: 'John' };

// bind: 返回新函數，this 永久綁定
const boundGreet = greet.bind(person, 'Hello');
boundGreet('!'); // "Hello, I'm John!"
// 可以部分應用參數
```

**實現原理（簡化版）：**

```javascript
Function.prototype.myBind = function(context, ...bindArgs) {
  const fn = this;
  
  return function(...callArgs) {
    // 如果使用 new 調用，this 指向新對象
    if (new.target) {
      return new fn(...bindArgs, ...callArgs);
    }
    
    // 否則使用綁定的 context
    return fn.apply(context, [...bindArgs, ...callArgs]);
  };
};
```

---

## 六、實際應用場景

### 6.1 方法借用（Method Borrowing）

```javascript
// 借用數組方法處理類數組對象
function printArgs() {
  // arguments 是類數組，沒有 forEach 方法
  // 借用 Array.prototype.forEach
  Array.prototype.forEach.call(arguments, (arg) => {
    console.log(arg);
  });
}

printArgs(1, 2, 3); // 1, 2, 3
```

### 6.2 函數柯里化（Currying）

```javascript
function multiply(a, b, c) {
  return a * b * c;
}

// 使用 bind 實現柯里化
const multiplyBy2 = multiply.bind(null, 2);
const multiplyBy2And3 = multiplyBy2.bind(null, 3);

console.log(multiplyBy2And3(4)); // 24 (2 * 3 * 4)
```

### 6.3 實現繼承

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  console.log(`${this.name} makes a sound`);
};

function Dog(name, breed) {
  // 調用父構造函數
  Animal.call(this, name);
  this.breed = breed;
}

// 設置原型鏈
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.speak = function() {
  console.log(`${this.name} barks`);
};

const dog = new Dog('Buddy', 'Golden Retriever');
dog.speak(); // "Buddy barks"
```

### 6.4 事件委託

```javascript
class EventHandler {
  constructor(element) {
    this.element = element;
    this.handleClick = this.handleClick.bind(this); // 綁定 this
    this.element.addEventListener('click', this.handleClick);
  }

  handleClick(event) {
    console.log('Clicked:', this.element); // this 指向 EventHandler 實例
  }
}
```

---

## 七、嚴格模式 vs 非嚴格模式

### 非嚴格模式

```javascript
function test() {
  console.log(this); // window (瀏覽器)
}

test(); // window

// 全局函數作為方法調用
const obj = {};
obj.fn = test;
obj.fn(); // obj
```

### 嚴格模式

```javascript
'use strict';

function test() {
  console.log(this); // undefined
}

test(); // undefined

// 仍然可以通過對象調用
const obj = {};
obj.fn = test;
obj.fn(); // obj (隱式綁定仍然有效)
```

---

## 八、this 的判斷流程圖

```
函數被調用
    ↓
是否使用 new？
    ├─ 是 → this = 新創建的對象
    └─ 否 ↓
是否使用 call/apply/bind？
    ├─ 是 → this = 指定的對象
    └─ 否 ↓
是否作為對象方法調用？
    ├─ 是 → this = 調用方法的對象
    └─ 否 ↓
是否為箭頭函數？
    ├─ 是 → this = 外層作用域的 this
    └─ 否 ↓
是否為嚴格模式？
    ├─ 是 → this = undefined
    └─ 否 → this = 全局對象
```

---

## 九、最佳實踐

### 9.1 使用箭頭函數保持 this

```javascript
// ✅ 推薦：使用箭頭函數
class Component {
  constructor() {
    this.name = 'Component';
  }

  handleClick = () => {
    console.log(this.name); // this 始終指向 Component 實例
  }
}

// ❌ 不推薦：需要手動綁定
class Component2 {
  constructor() {
    this.name = 'Component';
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    console.log(this.name);
  }
}
```

### 9.2 明確使用 bind

```javascript
// ✅ 明確綁定，避免意外
const obj = {
  name: 'Object',
  method: function() {
    console.log(this.name);
  }
};

const boundMethod = obj.method.bind(obj);
setTimeout(boundMethod, 1000); // 安全
```

### 9.3 避免在回調中丟失 this

```javascript
// ❌ 問題
const obj = {
  items: [1, 2, 3],
  process: function() {
    this.items.forEach(function(item) {
      console.log(this); // window
    });
  }
};

// ✅ 解決
const obj2 = {
  items: [1, 2, 3],
  process: function() {
    this.items.forEach(item => {
      console.log(this); // obj2
    });
  }
};
```

---

## 十、總結

**this 的核心要點：**

1. **動態綁定**：`this` 的值在函數調用時確定，不是定義時確定
2. **綁定規則**：new > 顯式綁定 > 隱式綁定 > 默認綁定
3. **箭頭函數**：沒有自己的 `this`，繼承外層作用域
4. **嚴格模式**：獨立函數調用時 `this` 為 `undefined`

**判斷 this 的步驟：**
1. 是否使用 `new`？→ `this` = 新對象
2. 是否使用 `call/apply/bind`？→ `this` = 指定對象
3. 是否作為對象方法調用？→ `this` = 調用對象
4. 是否為箭頭函數？→ `this` = 外層作用域的 `this`
5. 默認綁定 → `this` = 全局對象（非嚴格）或 `undefined`（嚴格）

**最佳實踐：**
- 使用箭頭函數保持 `this`
- 明確使用 `bind` 綁定
- 避免在回調中丟失 `this`
- 理解不同綁定規則的優先級

理解 `this` 的原理和綁定規則，是掌握 JavaScript 的重要基礎。
