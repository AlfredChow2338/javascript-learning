## MutationObserver 原理

### 什麼是 MutationObserver

**MutationObserver** 是一個用於監聽 DOM 樹變化的 Web API。它可以在 DOM 發生變化時異步通知你，而不會阻塞主線程。

**核心特點：**
- **異步執行**：變化通知是異步的，不會阻塞渲染
- **批量處理**：多個變化會被批量處理
- **高性能**：比舊的 Mutation Events 性能更好
- **精確控制**：可以指定監聽的變化類型

### 為什麼需要 MutationObserver

#### 問題場景

**場景 1：監聽 DOM 變化**

```javascript
// ❌ 問題：需要知道何時 DOM 元素被添加或移除
// 舊方法：使用 Mutation Events（已廢棄）
element.addEventListener('DOMNodeInserted', (event) => {
  console.log('Node inserted:', event.target);
});
// 問題：性能差、會阻塞、已被廢棄
```

**場景 2：第三方庫修改 DOM**

```javascript
// 問題：第三方庫（如廣告、分析工具）會動態修改 DOM
// 需要監聽這些變化並做出響應
```

**場景 3：動態內容監聽**

```javascript
// 問題：SPA 應用中，內容是動態加載的
// 需要監聽內容變化來執行某些操作（如初始化組件）
```

---

## 一、MutationObserver API

### 1.1 基本使用

```javascript
// 創建觀察者
const observer = new MutationObserver((mutations, observer) => {
  // mutations: 變化的數組
  // observer: 觀察者實例
  mutations.forEach(mutation => {
    console.log('Mutation type:', mutation.type);
    console.log('Target:', mutation.target);
  });
});

// 開始觀察
observer.observe(targetElement, {
  // 觀察選項
  childList: true,        // 監聽子節點的添加和移除
  subtree: true,         // 監聽所有後代節點
  attributes: true,      // 監聽屬性變化
  attributeOldValue: true, // 記錄屬性的舊值
  characterData: true,   // 監聽文本內容變化
  characterDataOldValue: true // 記錄文本的舊值
});

// 停止觀察
observer.disconnect();

// 獲取所有未處理的變化
const records = observer.takeRecords();
```

### 1.2 觀察選項（Options）

```javascript
const options = {
  // 子節點變化
  childList: true,        // 監聽子節點的添加和移除
  
  // 屬性變化
  attributes: true,       // 監聽屬性變化
  attributeFilter: ['class', 'id'], // 只監聽指定屬性
  attributeOldValue: true, // 在 mutation.oldValue 中記錄舊值
  
  // 文本內容變化
  characterData: true,    // 監聽文本節點內容變化
  characterDataOldValue: true, // 記錄文本的舊值
  
  // 範圍
  subtree: true          // 監聽所有後代節點，而不只是直接子節點
};
```

---

## 二、MutationObserver 原理

### 2.1 工作流程

```
DOM 變化發生
    ↓
MutationObserver 記錄變化
    ↓
將變化加入微任務隊列（Microtask Queue）
    ↓
當前同步代碼執行完畢
    ↓
執行微任務，觸發回調
    ↓
批量處理所有變化
```

### 2.2 異步執行機制

**關鍵點：** MutationObserver 的回調是在微任務隊列中執行的。

```javascript
// 範例：理解異步執行
const observer = new MutationObserver(() => {
  console.log('MutationObserver callback');
});

observer.observe(document.body, { childList: true });

console.log('1. Before mutation');

// 修改 DOM
document.body.appendChild(document.createElement('div'));

console.log('2. After mutation');

// 輸出順序：
// 1. Before mutation
// 2. After mutation
// MutationObserver callback
```

**為什麼是微任務？**

```javascript
// MutationObserver 與 Promise 同屬微任務
Promise.resolve().then(() => console.log('Promise'));

const observer = new MutationObserver(() => {
  console.log('MutationObserver');
});

observer.observe(document.body, { childList: true });
document.body.appendChild(document.createElement('div'));

// 輸出順序：
// Promise
// MutationObserver
// （都在微任務隊列中，按註冊順序執行）
```

### 2.3 批量處理

**特點：** 多個變化會被批量處理，在同一個回調中通知。

```javascript
const observer = new MutationObserver((mutations) => {
  console.log('Mutations count:', mutations.length);
  // 所有變化都在一個回調中處理
});

observer.observe(document.body, { childList: true });

// 快速連續修改 DOM
document.body.appendChild(document.createElement('div'));
document.body.appendChild(document.createElement('div'));
document.body.appendChild(document.createElement('div'));

// 只會觸發一次回調，mutations.length = 3
```

---

## 三、Mutation 對象結構

### 3.1 Mutation 屬性

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // mutation.type: 變化類型
    // - 'childList': 子節點變化
    // - 'attributes': 屬性變化
    // - 'characterData': 文本內容變化
    
    // mutation.target: 發生變化的節點
    
    // mutation.addedNodes: 添加的節點（NodeList）
    // mutation.removedNodes: 移除的節點（NodeList）
    // mutation.previousSibling: 變化前的前一個兄弟節點
    // mutation.nextSibling: 變化後的後一個兄弟節點
    
    // mutation.attributeName: 變化的屬性名
    // mutation.oldValue: 舊值（如果設置了 attributeOldValue 或 characterDataOldValue）
  });
});
```

### 3.2 不同類型的 Mutation

#### childList 變化

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      console.log('Added nodes:', mutation.addedNodes);
      console.log('Removed nodes:', mutation.removedNodes);
      console.log('Previous sibling:', mutation.previousSibling);
      console.log('Next sibling:', mutation.nextSibling);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 添加節點
const newDiv = document.createElement('div');
document.body.appendChild(newDiv);
// mutation.addedNodes 包含 newDiv

// 移除節點
document.body.removeChild(newDiv);
// mutation.removedNodes 包含 newDiv
```

#### attributes 變化

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'attributes') {
      console.log('Attribute changed:', mutation.attributeName);
      console.log('Old value:', mutation.oldValue);
      console.log('New value:', mutation.target.getAttribute(mutation.attributeName));
    }
  });
});

observer.observe(element, {
  attributes: true,
  attributeOldValue: true,
  attributeFilter: ['class', 'id'] // 只監聽 class 和 id
});

// 修改屬性
element.className = 'new-class';
// 觸發回調，mutation.attributeName = 'class'
```

#### characterData 變化

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'characterData') {
      console.log('Text changed');
      console.log('Old value:', mutation.oldValue);
      console.log('New value:', mutation.target.textContent);
    }
  });
});

const textNode = document.createTextNode('Hello');
observer.observe(textNode, {
  characterData: true,
  characterDataOldValue: true
});

// 修改文本
textNode.textContent = 'World';
// 觸發回調
```

---

## 四、實際應用場景

### 4.1 監聽動態內容加載

```javascript
// 場景：監聽第三方內容動態加載
function observeDynamicContent(container, callback) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 新元素被添加
          callback(node);
        }
      });
    });
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });

  return observer;
}

// 使用：監聽廣告加載
const adObserver = observeDynamicContent(document.body, (element) => {
  if (element.classList.contains('ad')) {
    console.log('Ad loaded:', element);
    // 執行相關操作
  }
});
```

### 4.2 自動初始化組件

```javascript
// 場景：SPA 中動態添加的組件需要初始化
class ComponentAutoInit {
  constructor() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.initComponents(node);
          }
        });
      });
    });
  }

  start() {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  initComponents(element) {
    // 查找需要初始化的組件
    const components = element.querySelectorAll('[data-component]');
    components.forEach(component => {
      const componentName = component.dataset.component;
      this.initializeComponent(componentName, component);
    });
  }

  initializeComponent(name, element) {
    // 根據組件名初始化
    switch(name) {
      case 'modal':
        initModal(element);
        break;
      case 'tooltip':
        initTooltip(element);
        break;
      // ...
    }
  }
}

// 使用
const autoInit = new ComponentAutoInit();
autoInit.start();
```

### 4.3 監聽樣式變化

```javascript
// 場景：監聽元素樣式變化，執行相應操作
function observeStyleChanges(element, callback) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        callback(element);
      }
    });
  });

  observer.observe(element, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  return observer;
}

// 使用：監聽元素顯示/隱藏
const element = document.getElementById('myElement');
observeStyleChanges(element, (el) => {
  const isVisible = el.style.display !== 'none';
  console.log('Visibility changed:', isVisible);
});
```

### 4.4 無限滾動實現

```javascript
// 場景：監聽內容加載，實現無限滾動
class InfiniteScroll {
  constructor(container, loadMoreFn) {
    this.container = container;
    this.loadMoreFn = loadMoreFn;
    this.observer = new MutationObserver(() => {
      this.checkScrollPosition();
    });
  }

  start() {
    this.observer.observe(this.container, {
      childList: true,
      subtree: true
    });
    
    // 同時監聽滾動
    this.container.addEventListener('scroll', () => {
      this.checkScrollPosition();
    });
  }

  checkScrollPosition() {
    const { scrollTop, scrollHeight, clientHeight } = this.container;
    const threshold = 100; // 距離底部 100px 時加載

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      this.loadMoreFn();
    }
  }
}

// 使用
const scrollContainer = document.getElementById('scrollContainer');
const infiniteScroll = new InfiniteScroll(scrollContainer, async () => {
  const items = await loadMoreItems();
  appendItems(items);
});
infiniteScroll.start();
```

### 4.5 表單驗證

```javascript
// 場景：監聽表單輸入變化，實時驗證
function observeFormValidation(form) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 新輸入框被添加，添加驗證
          if (node.tagName === 'INPUT') {
            addValidation(node);
          }
        }
      });
    });
  });

  observer.observe(form, {
    childList: true,
    subtree: true
  });

  return observer;
}
```

---

## 五、性能優化

### 5.1 使用 disconnect 停止觀察

```javascript
// ✅ 正確：不需要時停止觀察
const observer = new MutationObserver(callback);
observer.observe(element, options);

// 完成後停止觀察
observer.disconnect();
```

### 5.2 使用 takeRecords 獲取未處理的變化

```javascript
// 在 disconnect 前獲取未處理的變化
const observer = new MutationObserver(callback);
observer.observe(element, options);

// 停止觀察前處理未處理的變化
const records = observer.takeRecords();
if (records.length > 0) {
  callback(records, observer);
}

observer.disconnect();
```

### 5.3 限制觀察範圍

```javascript
// ❌ 不好：觀察整個文檔
observer.observe(document.body, {
  childList: true,
  subtree: true // 觀察所有後代，性能開銷大
});

// ✅ 更好：只觀察需要的部分
observer.observe(specificContainer, {
  childList: true,
  subtree: false // 只觀察直接子節點
});
```

### 5.4 使用 attributeFilter 過濾屬性

```javascript
// ❌ 不好：監聽所有屬性變化
observer.observe(element, {
  attributes: true
});

// ✅ 更好：只監聽需要的屬性
observer.observe(element, {
  attributes: true,
  attributeFilter: ['class', 'data-state'] // 只監聽這些屬性
});
```

### 5.5 防抖處理回調

```javascript
// 如果變化頻繁，使用防抖
function createDebouncedObserver(callback, delay = 100) {
  let timeoutId = null;
  let pendingMutations = [];

  const debouncedCallback = (mutations, observer) => {
    pendingMutations.push(...mutations);
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(pendingMutations, observer);
      pendingMutations = [];
    }, delay);
  };

  return debouncedCallback;
}

const observer = new MutationObserver(
  createDebouncedObserver((mutations) => {
    console.log('Processed mutations:', mutations.length);
  }, 200)
);
```

---

## 六、與舊方法的對比

### 6.1 Mutation Events（已廢棄）

```javascript
// ❌ Mutation Events（已廢棄，不推薦使用）
element.addEventListener('DOMNodeInserted', (event) => {
  console.log('Node inserted');
});

element.addEventListener('DOMNodeRemoved', (event) => {
  console.log('Node removed');
});

element.addEventListener('DOMAttrModified', (event) => {
  console.log('Attribute modified');
});

// 問題：
// 1. 性能差：同步執行，會阻塞渲染
// 2. 每個變化都觸發事件，開銷大
// 3. 已被廢棄，不建議使用
```

### 6.2 MutationObserver（推薦）

```javascript
// ✅ MutationObserver（推薦）
const observer = new MutationObserver((mutations) => {
  // 異步執行，不阻塞渲染
  // 批量處理，性能更好
});

observer.observe(element, {
  childList: true,
  attributes: true
});

// 優勢：
// 1. 異步執行，不阻塞
// 2. 批量處理，性能好
// 3. 精確控制觀察內容
```

### 6.3 性能對比

```
場景：1000 個 DOM 變化

Mutation Events：
- 觸發 1000 次事件
- 同步執行，阻塞渲染
- 總時間：~500ms

MutationObserver：
- 觸發 1 次回調（批量處理）
- 異步執行，不阻塞
- 總時間：~10ms

性能提升：50 倍
```

---

## 七、進階用法

### 7.1 監聽特定元素

```javascript
// 只監聽特定類型的元素
function observeSpecificElements(container, selector, callback) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 檢查是否匹配選擇器
          if (node.matches && node.matches(selector)) {
            callback(node);
          }
          // 檢查子元素
          const matches = node.querySelectorAll(selector);
          matches.forEach(match => callback(match));
        }
      });
    });
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });

  return observer;
}

// 使用：只監聽 .dynamic-content 元素
observeSpecificElements(
  document.body,
  '.dynamic-content',
  (element) => {
    console.log('Dynamic content added:', element);
  }
);
```

### 7.2 條件觀察

```javascript
// 根據條件決定是否繼續觀察
function conditionalObserver(container, condition, callback) {
  const observer = new MutationObserver((mutations) => {
    if (!condition()) {
      // 條件不滿足，停止觀察
      observer.disconnect();
      return;
    }

    callback(mutations);
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });

  return observer;
}

// 使用：只在特定狀態下觀察
let isActive = true;
const observer = conditionalObserver(
  document.body,
  () => isActive,
  (mutations) => {
    console.log('Processing mutations');
  }
);

// 停止觀察
isActive = false;
```

### 7.3 多觀察者管理

```javascript
// 管理多個觀察者
class ObserverManager {
  constructor() {
    this.observers = new Map();
  }

  observe(key, target, options, callback) {
    // 如果已存在，先停止
    if (this.observers.has(key)) {
      this.observers.get(key).disconnect();
    }

    const observer = new MutationObserver(callback);
    observer.observe(target, options);
    this.observers.set(key, observer);

    return observer;
  }

  disconnect(key) {
    const observer = this.observers.get(key);
    if (observer) {
      observer.disconnect();
      this.observers.delete(key);
    }
  }

  disconnectAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// 使用
const manager = new ObserverManager();

manager.observe('content', document.body, {
  childList: true
}, (mutations) => {
  console.log('Content changed');
});

manager.observe('attributes', document.getElementById('myElement'), {
  attributes: true
}, (mutations) => {
  console.log('Attributes changed');
});

// 停止所有觀察
manager.disconnectAll();
```

---

## 八、React 中的使用

### 8.1 在 useEffect 中使用

```javascript
import { useEffect, useRef } from 'react';

function MyComponent() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            console.log('New element:', node);
          }
        });
      });
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    // 清理
    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={containerRef}>Content</div>;
}
```

### 8.2 自定義 Hook

```javascript
import { useEffect, useRef } from 'react';

function useMutationObserver(callback, options) {
  const targetRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!targetRef.current) return;

    observerRef.current = new MutationObserver(callback);
    observerRef.current.observe(targetRef.current, options);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  return targetRef;
}

// 使用
function MyComponent() {
  const containerRef = useMutationObserver(
    (mutations) => {
      console.log('DOM changed:', mutations);
    },
    {
      childList: true,
      subtree: true
    }
  );

  return <div ref={containerRef}>Content</div>;
}
```

---

## 九、常見問題和解決方案

### Q1: 為什麼回調沒有立即執行？

**A:** MutationObserver 是異步的，回調在微任務隊列中執行。

```javascript
const observer = new MutationObserver(() => {
  console.log('Callback');
});

observer.observe(document.body, { childList: true });
document.body.appendChild(document.createElement('div'));
console.log('After mutation');

// 輸出：
// After mutation
// Callback
```

### Q2: 如何獲取舊值？

**A:** 需要在選項中設置 `attributeOldValue` 或 `characterDataOldValue`。

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    console.log('Old value:', mutation.oldValue);
  });
});

observer.observe(element, {
  attributes: true,
  attributeOldValue: true // 必須設置這個
});
```

### Q3: 如何只監聽特定屬性？

**A:** 使用 `attributeFilter` 選項。

```javascript
observer.observe(element, {
  attributes: true,
  attributeFilter: ['class', 'id'] // 只監聽這些屬性
});
```

### Q4: 如何避免無限循環？

**A:** 在回調中修改 DOM 要小心，可能導致無限循環。

```javascript
// ❌ 可能導致無限循環
const observer = new MutationObserver(() => {
  element.appendChild(document.createElement('div')); // 又觸發變化
});

// ✅ 使用標誌避免
let isUpdating = false;
const observer = new MutationObserver(() => {
  if (isUpdating) return;
  isUpdating = true;
  
  // 修改 DOM
  element.appendChild(document.createElement('div'));
  
  isUpdating = false;
});
```

---

## 十、最佳實踐

### 10.1 及時清理

```javascript
// ✅ 組件卸載時清理
useEffect(() => {
  const observer = new MutationObserver(callback);
  observer.observe(element, options);
  
  return () => {
    observer.disconnect();
  };
}, []);
```

### 10.2 限制觀察範圍

```javascript
// ✅ 只觀察需要的部分
observer.observe(specificContainer, {
  childList: true,
  subtree: false // 盡量設為 false
});
```

### 10.3 使用 attributeFilter

```javascript
// ✅ 只監聽需要的屬性
observer.observe(element, {
  attributes: true,
  attributeFilter: ['class'] // 明確指定
});
```

### 10.4 批量處理變化

```javascript
// ✅ 在回調中批量處理
const observer = new MutationObserver((mutations) => {
  // 收集所有變化
  const changes = mutations.map(m => ({
    type: m.type,
    target: m.target
  }));
  
  // 一次性處理
  processChanges(changes);
});
```

---

## 總結

**MutationObserver 核心要點：**

1. **異步執行**：回調在微任務隊列中執行，不阻塞渲染
2. **批量處理**：多個變化會在同一個回調中通知
3. **精確控制**：可以指定監聽的變化類型和範圍
4. **高性能**：比 Mutation Events 性能好很多

**使用場景：**
- 監聽動態內容加載
- 自動初始化組件
- 實現無限滾動
- 監聽樣式和屬性變化

**最佳實踐：**
- 及時清理觀察者
- 限制觀察範圍
- 使用 attributeFilter 過濾屬性
- 批量處理變化

理解 MutationObserver 的原理和使用方法，可以幫助實現高效的 DOM 變化監聽，提升應用的響應性和性能。
