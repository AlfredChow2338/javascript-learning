## React Fiber 原理

### 什麼是 Fiber

**Fiber** 是 React 16 引入的新架構，將渲染工作拆成可中斷、可恢復的小單位。每個 React element 對應一個 Fiber 節點，形成 Fiber 樹。

**核心改變：**
- 從**遞歸調用**改為**循環處理**
- 從**同步執行**改為**可中斷的異步調度**
- 從**單一調用棧**改為**鏈表結構**

---

## 一、React 16 之前的架構：Stack Reconciler

### 1.1 Stack Reconciler 的工作原理

**React 15 及之前使用 Stack Reconciler（棧協調器）：**

```javascript
// React 15 的渲染流程（簡化版）
function reconcileChildren(currentChildren, nextChildren) {
  // 遞歸處理每個子節點
  for (let i = 0; i < nextChildren.length; i++) {
    const currentChild = currentChildren[i];
    const nextChild = nextChildren[i];
    
    // 遞歸調用，無法中斷
    reconcile(currentChild, nextChild);
  }
}

function reconcile(current, next) {
  if (current === null) {
    // 創建新節點
    return mountComponent(next);
  } else if (next === null) {
    // 刪除節點
    return unmountComponent(current);
  } else {
    // 更新節點，然後遞歸處理子節點
    updateComponent(current, next);
    reconcileChildren(current.children, next.children); // 遞歸調用
  }
}
```

**關鍵特點：**
- 使用**深度優先遞歸**遍歷整個組件樹
- 調用棧（Call Stack）會不斷增長
- 一旦開始渲染，必須完成整個樹的處理才能返回


### 1.2 Stack Reconciler 的技術細節

**調用棧結構：**

```
調用棧（Call Stack）：
┌─────────────────────┐
│ reconcile(App)      │ ← 最外層
├─────────────────────┤
│ reconcile(Header)    │
├─────────────────────┤
│ reconcile(Nav)       │
├─────────────────────┤
│ reconcile(Link)      │ ← 最深層
└─────────────────────┘
```

**問題：**
- 調用棧是**線性的**，無法保存中間狀態
- 一旦進入遞歸，必須執行到最底層才能返回
- 無法在執行過程中**暫停**和**恢復**

**實際執行流程：**

```javascript
// React 15 的渲染流程
function renderRoot(root) {
  // 1. 開始渲染
  const work = root;
  
  // 2. 遞歸處理整個樹（無法中斷）
  workLoop(work);
  
  // 3. 完成後提交
  commitRoot(root);
}

function workLoop(work) {
  // 遞歸調用，調用棧不斷增長
  if (work.children) {
    work.children.forEach(child => {
      workLoop(child); // 遞歸調用
    });
  }
  
  // 處理當前節點
  processComponent(work);
}
```

---

## 二、為什麼 Stack Reconciler 無法中斷

### 2.1 調用棧的限制

**調用棧（Call Stack）的特性：**
- **後進先出（LIFO）**：最後調用的函數最先返回
- **線性結構**：只能從棧頂操作
- **無法保存中間狀態**：一旦函數返回，局部變量就丟失

**示例：**

```javascript
function reconcileTree(node) {
  // 局部變量
  let processed = 0;
  
  // 遞歸處理子節點
  node.children.forEach(child => {
    reconcileTree(child); // 遞歸調用
    processed++;
  });
  
  // 處理當前節點
  processNode(node);
  
  // 問題：如果在中途需要中斷，無法保存 processed 的狀態
  // 因為調用棧會清空，局部變量會丟失
}
```

**為什麼無法中斷：**
1. **調用棧是線性的**：無法在任意位置暫停
2. **局部變量在棧上**：函數返回後變量就丟失
3. **沒有恢復機制**：無法從中斷點繼續執行

### 2.2 遞歸調用的問題

**深度優先遞歸的執行流程：**

```
時間線：
t0: reconcile(App)
t1:   reconcile(Header)
t2:     reconcile(Nav)
t3:       reconcile(Link) ← 最深層
t4:     reconcile(Nav) ← 返回
t5:   reconcile(Header) ← 返回
t6: reconcile(App) ← 返回
```

**問題：**
- 必須執行到最底層才能開始返回
- 無法在 t2 時暫停，然後在 t5 時恢復
- 整個過程是**原子性的**，要麼全部完成，要麼全部失敗

### 2.3 實際場景的問題

**場景：用戶在渲染過程中點擊按鈕**

```javascript
// React 15 的情況
function App() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState(Array(10000).fill(0));
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Click</button>
      {items.map(item => <Item key={item.id} />)}
    </div>
  );
}
```

**問題：**
1. 渲染 10000 個 Item 需要很長時間
2. 用戶點擊按鈕時，渲染還在進行中
3. **無法中斷**當前的渲染來處理點擊事件
4. 用戶必須等待整個渲染完成才能看到響應

---

## 三、Fiber Reconciler 的解決方案

### 3.1 Fiber 的鏈表結構

**Fiber 節點的完整結構：**

```javascript
{
  // === 節點資訊 ===
  type: 'div' | Component | null,
  key: 'unique-key' | null,
  props: {...},
  stateNode: DOMNode | ComponentInstance,
  
  // === 樹結構（鏈表） ===
  child: Fiber | null,        // 第一個子節點
  sibling: Fiber | null,      // 下一個兄弟節點
  return: Fiber | null,       // 父節點（return 是保留字，實際用 return）
  
  // === 工作狀態 ===
  alternate: Fiber | null,    // 對應的舊 Fiber（用於 diff）
  effectTag: number,          // 副作用標記（UPDATE、PLACEMENT、DELETION）
  expirationTime: number,     // 過期時間（優先級）
  nextEffect: Fiber | null,  // 下一個有副作用的節點
  
  // === 狀態和屬性 ===
  memoizedState: any,         // 記憶化的 state
  memoizedProps: any,         // 記憶化的 props
  pendingProps: any,          // 待處理的 props
  
  // === 工作進度 ===
  updateQueue: UpdateQueue,   // 更新隊列
  mode: number,              // 模式（Concurrent、Blocking、Legacy）
}
```

**關鍵：鏈表結構可以保存狀態**

```javascript
// Fiber 節點是對象，存在堆（Heap）中
const fiberNode = {
  // 所有狀態都保存在對象中
  processed: 0,
  children: [...],
  currentChild: 0,
  // 可以隨時訪問和修改
};
```

### 3.2 為什麼鏈表結構可以中斷

**鏈表 vs 調用棧：**

| 特性 | 調用棧（Stack） | 鏈表（Fiber） |
|------|----------------|---------------|
| **存儲位置** | 棧（Stack） | 堆（Heap） |
| **結構** | 線性，後進先出 | 樹狀，可任意訪問 |
| **狀態保存** | 局部變量，函數返回後丟失 | 對象屬性，持久保存 |
| **中斷能力** | ❌ 無法中斷 | ✅ 可以中斷 |
| **恢復能力** | ❌ 無法恢復 | ✅ 可以恢復 |

**Fiber 的中斷機制：**

```javascript
// Fiber 的工作循環
let nextUnitOfWork = null; // 全局變量，保存當前工作節點

function workLoop(deadline) {  
  // 檢查是否有足夠時間
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {    
    // 處理一個 Fiber 節點    
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);    
  }
    
  // 如果還有工作，但時間不夠了
    if (nextUnitOfWork) {    
    // 中斷：nextUnitOfWork 保存了當前進度
    // 下次調用 workLoop 時，可以從這裡繼續
      requestIdleCallback(workLoop);  
    } else {    
      // 完成，提交更新    
      commitRoot();  
    }
  }

function performUnitOfWork(fiber) {
  // 處理當前節點
  beginWork(fiber);
  
  // 返回下一個要處理的節點
  if (fiber.child) {
    return fiber.child; // 處理子節點
  }
  
  let nextFiber = fiber;
  while (nextFiber) {
    completeWork(nextFiber);
    
    if (nextFiber.sibling) {
      return nextFiber.sibling; // 處理兄弟節點
    }
    
    nextFiber = nextFiber.return; // 返回父節點
  }
  
  return null; // 完成
}
```

**關鍵點：**
1. **`nextUnitOfWork` 是全局變量**：保存在堆中，不會丟失
2. **每次只處理一個節點**：可以隨時檢查時間並中斷
3. **狀態保存在 Fiber 節點中**：`memoizedState`、`memoizedProps` 等
4. **可以從任意節點恢復**：通過 `child`、`sibling`、`return` 指針

### 3.3 Fiber 的遍歷順序

**Fiber 使用「子 → 兄弟 → 返回」的順序：**

```
樹結構：
     A   
   /   \  
  B     C 
 / \   / \
D   E F   G

遍歷順序：
A → B → D → E → C → F → G

執行流程：
1. 處理 A（beginWork）
2. 處理 B（beginWork）
3. 處理 D（beginWork）
4. 完成 D（completeWork）
5. 處理 E（beginWork）
6. 完成 E（completeWork）
7. 完成 B（completeWork）
8. 處理 C（beginWork）
9. 處理 F（beginWork）
10. 完成 F（completeWork）
11. 處理 G（beginWork）
12. 完成 G（completeWork）
13. 完成 C（completeWork）
14. 完成 A（completeWork）
```

**為什麼這樣設計：**
- **beginWork**：從上到下，處理節點並創建子節點
- **completeWork**：從下到上，完成節點處理並標記副作用
- 可以在任意節點**中斷**，因為狀態都保存在 Fiber 節點中

---

## 四、Stack Reconciler vs Fiber Reconciler 詳細對比

### 4.1 架構對比

| 特性 | Stack Reconciler (React 15) | Fiber Reconciler (React 16+) |
|------|------------------------------|------------------------------|
| **數據結構** | 調用棧（Call Stack） | 鏈表（Fiber Tree） |
| **執行方式** | 遞歸調用 | 循環處理 |
| **中斷能力** | ❌ 無法中斷 | ✅ 可以中斷 |
| **優先級調度** | ❌ 不支持 | ✅ 支持 |
| **時間切片** | ❌ 不支持 | ✅ 支持 |
| **錯誤恢復** | ❌ 困難 | ✅ 容易 |
| **並發特性** | ❌ 不支持 | ✅ 支持（Suspense、useTransition） |

### 4.2 執行流程對比

**Stack Reconciler 的執行流程：**

```javascript
// React 15
function reconcileTree(node) {
  // 1. 處理當前節點
  processNode(node);
  
  // 2. 遞歸處理子節點（無法中斷）
  node.children.forEach(child => {
    reconcileTree(child); // 遞歸調用，調用棧增長
  });
  
  // 3. 完成（必須等所有子節點處理完）
}
```

**Fiber Reconciler 的執行流程：**

```javascript
// React 16+
let nextUnitOfWork = null;

function workLoop(deadline) {
  // 1. 檢查時間
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    // 2. 處理一個節點（可以中斷）
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  
  // 3. 如果還有工作，延後執行
  if (nextUnitOfWork) {
    requestIdleCallback(workLoop);
  }
}

function performUnitOfWork(fiber) {
  // 處理當前節點
  beginWork(fiber);
  
  // 返回下一個節點（狀態保存在 fiber 中）
  if (fiber.child) return fiber.child;
  if (fiber.sibling) return fiber.sibling;
  return fiber.return;
}
```

### 4.3 性能對比

**Stack Reconciler 的問題：**

```javascript
// 場景：渲染 10000 個組件
function App() {
  return (
    <div>
      {Array(10000).fill(0).map((_, i) => (
        <Item key={i} />
      ))}
    </div>
  );
}

// React 15 的執行：
// 1. 開始渲染
// 2. 遞歸處理 10000 個 Item（無法中斷）
// 3. 阻塞主線程 100-200ms
// 4. 用戶交互無響應
// 5. 完成渲染
```

**Fiber Reconciler 的優勢：**

```javascript
// React 16+ 的執行：
// 1. 開始渲染
// 2. 處理前 100 個 Item（5ms）
// 3. 檢查時間，讓出控制權
// 4. 瀏覽器渲染（16.6ms）
// 5. 繼續處理下 100 個 Item（5ms）
// 6. 重複直到完成
// 7. 用戶交互始終響應
```

---

## 五、Fiber 的雙緩存機制

### 5.1 為什麼需要雙緩存

**問題：如果直接修改當前樹會怎樣？**

```javascript
// ❌ 錯誤做法：直接修改當前樹
function updateTree(currentTree) {
  // 如果在中途中斷，用戶會看到不完整的 UI
  currentTree.children.forEach(child => {
    updateNode(child); // 如果這裡中斷，UI 會不一致
  });
}
```

**解決方案：雙緩存**

```javascript
// ✅ 正確做法：使用雙緩存
let currentTree = null;      // 當前顯示的樹
let workInProgressTree = null; // 正在構建的樹

function render() {
  // 1. 創建新的 WorkInProgress 樹
  workInProgressTree = createWorkInProgressTree(currentTree);
  
  // 2. 構建新樹（可以中斷）
  buildTree(workInProgressTree);
  
  // 3. 完成後交換
  currentTree = workInProgressTree;
  workInProgressTree = null;
}
```

### 5.2 雙緩存的實現

**Fiber 的雙緩存機制：**

```javascript
// React 內部實現（簡化版）
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 第一次創建
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 重用現有的 Fiber
    workInProgress.pendingProps = pendingProps;
    workInProgress.effectTag = NoEffect;
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }
  
  // 複製其他屬性
  workInProgress.child = current.child;
  workInProgress.sibling = current.sibling;
  workInProgress.return = current.return;
  
  return workInProgress;
}
```

**工作流程：**

```
初始狀態：
Current Tree:     A
                 / \
                B   C

開始更新：
WorkInProgress:  A' (alternate → A)
                 / \
                B'  C'
Current Tree:    A (alternate → A')
                 / \
                B   C

完成後交換：
Current Tree:    A' (顯示這個)
                 / \
                B'  C'
WorkInProgress: null
```

---

## 六、Fiber 的優先級調度

### 6.1 優先級系統

**React 的優先級（從高到低）：**

```javascript
// 優先級定義
const ImmediatePriority = 1;      // 同步，必須立即執行
const UserBlockingPriority = 2;   // 用戶交互（點擊、輸入）
const NormalPriority = 3;          // 一般更新（useState）
const LowPriority = 4;             // 低優先級（useTransition）
const IdlePriority = 5;            // 空閒時執行

// 過期時間計算
function computeExpirationTime(priority) {
  const now = performance.now();
  switch (priority) {
    case ImmediatePriority:
      return now + 1; // 立即過期
    case UserBlockingPriority:
      return now + 250; // 250ms 後過期
    case NormalPriority:
      return now + 5000; // 5s 後過期
    case LowPriority:
      return now + 10000; // 10s 後過期
    case IdlePriority:
      return now + 2147483647; // 最大數值
  }
}
```

### 6.2 優先級調度的實現

**調度器（Scheduler）的工作流程：**

```javascript
// 簡化版的調度器
const taskQueue = [];
const timerQueue = [];

function scheduleCallback(priority, callback) {
  const expirationTime = computeExpirationTime(priority);
  const newTask = {
    callback,
    priority,
    expirationTime,
    id: taskIdCounter++,
  };
  
  if (expirationTime > currentTime) {
    // 延後執行
    pushTimerQueue(newTask);
  } else {
    // 立即執行
    pushTaskQueue(newTask);
  }
  
  // 請求調度
  requestHostCallback(flushWork);
}

function flushWork(hasTimeRemaining, initialTime) {
  // 1. 處理過期的任務
  advanceTimers(currentTime);
  
  // 2. 處理任務隊列
  currentTask = peek(taskQueue);
  
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYieldToHost())) {
      // 時間不夠，中斷
      break;
    }
    
    // 執行任務
    const callback = currentTask.callback;
    if (callback !== null) {
      currentTask.callback = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      
      if (typeof continuationCallback === 'function') {
        // 任務未完成，繼續
        currentTask.callback = continuationCallback;
      } else {
        // 任務完成，移除
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }
    
    currentTask = peek(taskQueue);
  }
  
  // 3. 如果還有任務，繼續調度
  if (currentTask !== null) {
    return true; // 還有工作
  } else {
    // 處理延後任務
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false; // 沒有工作
  }
}
```

### 6.3 高優先級更新中斷低優先級工作

**場景：用戶點擊按鈕時，低優先級渲染正在進行**

```javascript
// 1. 低優先級渲染開始
scheduleCallback(LowPriority, () => {
  // 渲染大量組件
  renderLargeList();
});

// 2. 用戶點擊按鈕（高優先級）
button.onclick = () => {
  scheduleCallback(UserBlockingPriority, () => {
    // 處理點擊事件
    handleClick();
  });
};

// 3. 調度器行為：
// - 中斷當前的低優先級工作
// - 執行高優先級的點擊處理
// - 完成後恢復低優先級工作
```

---

## 七、Fiber 的兩個階段

### 7.1 Render 階段（可中斷）

**Render 階段的工作：**

```javascript
function renderRoot(root) {
  // 1. 準備工作
  prepareFreshStack(root);
  
  // 2. 工作循環（可中斷）
  do {
    try {
      workLoopSync(); // 或 workLoopConcurrent
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  } while (true);
  
  // 3. 完成
  root.finishedWork = root.current.alternate;
  root.finishedExpirationTime = expirationTime;
}

function workLoopSync() {
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

**Render 階段的特點：**
- ✅ **可中斷**：可以隨時讓出控制權
- ✅ **可恢復**：狀態保存在 Fiber 節點中
- ✅ **不影響 UI**：不直接修改 DOM
- ✅ **可以重複執行**：如果被中斷，可以重新開始

### 7.2 Commit 階段（不可中斷）

**Commit 階段的工作：**

```javascript
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  const expirationTime = root.finishedExpirationTime;
  
  // 1. 準備提交
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;
  
  // 2. 三個子階段（必須同步完成）
  
  // 2.1 Before mutation（變更前）
  commitBeforeMutationEffects(root, finishedWork);
  
  // 2.2 Mutation（變更）
  commitMutationEffects(root, finishedWork);
  
  // 2.3 Layout（布局）
  commitLayoutEffects(finishedWork, root, expirationTime);
  
  // 3. 交換樹
  root.current = finishedWork;
}
```

**Commit 階段的特點：**
- ❌ **不可中斷**：必須一次性完成
- ❌ **同步執行**：不能讓出控制權
- ✅ **快速執行**：只處理標記的變更
- ✅ **一致性**：確保 UI 狀態一致

---

## 八、實際應用場景

### 8.1 大列表渲染

**React 15 的問題：**

```javascript
function LargeList() {
  const items = Array(10000).fill(0);
  
  return (
    <div>
      {items.map(item => <Item key={item.id} />)}
    </div>
  );
}

// 問題：渲染 10000 個 Item 會阻塞主線程 100-200ms
// 用戶交互無響應
```

**React 16+ 的解決方案：**

```javascript
function LargeList() {
  const items = Array(10000).fill(0);
  
  return (
    <div>
      {items.map(item => <Item key={item.id} />)}
    </div>
  );
}

// Fiber 會將工作分成小塊：
// - 每 5ms 處理一部分
// - 讓出控制權給瀏覽器
// - 用戶交互始終響應
```

### 8.2 並發特性

**Suspense 和 useTransition：**

```javascript
function App() {
  const [isPending, startTransition] = useTransition();
  
  return (
    <div>
      <button onClick={() => {
        startTransition(() => {
          // 低優先級更新
          setTab('slow-tab');
        });
      }}>
        Switch Tab
      </button>
      
      {isPending && <Spinner />}
      
      <Suspense fallback={<Loading />}>
        <TabContent />
      </Suspense>
    </div>
  );
}

// Fiber 的行為：
// 1. 點擊按鈕（高優先級）
// 2. 顯示 Spinner（立即）
// 3. 切換 Tab（低優先級，可中斷）
// 4. 用戶可以繼續交互
```

---

## 九、總結

### 9.1 核心差異總結

**Stack Reconciler（React 15）：**
- 使用**調用棧**，遞歸執行
- **無法中斷**，必須完成整個樹的處理
- **同步執行**，阻塞主線程
- **簡單但受限**，無法處理複雜場景

**Fiber Reconciler（React 16+）：**
- 使用**鏈表結構**，循環處理
- **可以中斷**，隨時讓出控制權
- **異步調度**，不阻塞主線程
- **複雜但強大**，支持並發特性

### 9.2 為什麼 Fiber 可以中斷

**關鍵原因：**

1. **鏈表結構**：狀態保存在堆（Heap）中，不會丟失
2. **全局變量**：`nextUnitOfWork` 保存當前進度
3. **可恢復**：通過 `child`、`sibling`、`return` 指針可以從任意節點恢復
4. **雙緩存**：WorkInProgress 樹可以隨時丟棄，不影響當前 UI

**對比：**

| 特性 | Stack（無法中斷） | Fiber（可以中斷） |
|------|------------------|------------------|
| **狀態保存** | 調用棧（函數返回後丟失） | 堆（持久保存） |
| **進度追蹤** | 無法追蹤 | `nextUnitOfWork` 追蹤 |
| **恢復機制** | 無法恢復 | 可以從任意節點恢復 |
| **中斷點** | 無 | 每個 Fiber 節點都是中斷點 |

### 9.3 Fiber 的優勢

1. **可中斷渲染**：不阻塞主線程，保持 60fps
2. **優先級調度**：用戶交互優先，提升體驗
3. **增量渲染**：大更新可分批處理
4. **更好的錯誤邊界**：可以恢復渲染
5. **支持並發特性**：Suspense、useTransition、useDeferredValue

Fiber 架構讓 React 能夠處理更複雜的應用，同時保持流暢的用戶體驗，這是 React 16+ 最重要的架構升級。
