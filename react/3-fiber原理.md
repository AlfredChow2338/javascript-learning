## React Fiber 原理

### 什麼是 Fiber

Fiber 是 React 16 引入的架構，將渲染工作拆成可中斷、可恢復的小單位。每個 React element對應一個 Fiber 節點，形成 Fiber 樹。

### 為什麼需要 Fiber

React 15 的問題：
* 同步遞迴渲染，無法中斷
* 大更新會阻塞主線程，導致掉幀
* 無法優先處理高優先級更新（如用戶輸入）

Fiber 的解決方案：
* 可中斷的渲染
* 優先級調度
* 時間切片（Time Slicing）

Fiber 節點的結構
每個 Fiber 節點包含：
```jsx
{  
  // 節點資訊  
  type: 'div' | Component,  
  key: 'unique-key',  
  props: {...},    

  // 樹結構  
  child: Fiber | null, // 第一個子節點  
  sibling: Fiber | null, // 下一個兄弟節點  
  return: Fiber | null,  // 父節點    
  
  // 工作狀態  
  alternate: Fiber | null,  // 對應的舊 Fiber（用於 diff）  
  effectTag: 'UPDATE' | 'PLACEMENT' | 'DELETION',  // 調度相關  
  expirationTime: number,  // 過期時間（優先級）  
  memoizedState: any,  // 記憶化的 state  
  memoizedProps: any,  // 記憶化的 props
}
```

**Fiber 的雙緩存機制**

React 維護兩棵 Fiber 樹：
* Current Tree：當前顯示的樹
* WorkInProgress Tree：正在構建的樹

完成後交換，避免視覺閃爍。

**工作循環（Work Loop）**

Fiber 使用可中斷的循環：
```jsx
function workLoop(deadline) {  
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {    

    // 處理一個 Fiber 節點    
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);    
    
    // 如果還有工作，讓出控制權  
    if (nextUnitOfWork) {    
      requestIdleCallback(workLoop);  
    } else {    
      // 完成，提交更新    
      commitRoot();  
    }
  }
}
```

**兩個階段：Render 和 Commit**

第一階段：Render 階段（可中斷）

* 建立 WorkInProgress Tree
* 執行 diff
* 標記副作用（effect）
* 可中斷，不影響 UI

第二階段：Commit 階段（不可中斷）
* 同步執行 DOM 更新
* 執行生命週期與 Hooks
* 必須一次性完成

**優先級調度**

React 根據更新來源分配優先級：
```md
// 優先級從高到低
ImmediatePriority    // 同步，必須立即執行
UserBlockingPriority // 用戶交互（點擊、輸入）
NormalPriority      // 一般更新（useState）
LowPriority         // 低優先級（useTransition）
IdlePriority        // 空閒時執行
```
高優先級更新可中斷低優先級工作。


**時間切片（Time Slicing）**

React 使用 requestIdleCallback（或 scheduler）將工作切成小塊：

* 每個時間切片約 5ms
* 如果瀏覽器需要渲染，React 會讓出控制權
* 確保 60fps（每幀 16.6ms）

**Fiber 的遍歷順序**

使用「子 → 兄弟 → 返回」的順序：
```
     A   
   /   \  
  B     C 
 / \   / \
D   E F   G
```

遍歷順序：A → B → D → E → C → F → G

這樣可以：
* 先處理子節點
* 再處理兄弟節點
* 最後回到父節點

**實際運作範例**

假設有狀態更新：
```jsx
function App() {
  const [count, setCount] = useState(0);  
  return <div>{count}</div>;
}
```

流程：

1. 調度更新：setCount(1) 加入更新隊列
2. 開始 Render：
  * 建立 WorkInProgress Tree
  * 處理 App Fiber → 處理 div Fiber → 處理文字節點
  * 標記需要更新的節點
3. Time slicing結束：讓出控制權給瀏覽器
4. 繼續 Render：完成剩餘工作
5. Commit：同步更新 DOM，顯示新值

**Fiber 的優勢**

1. 可中斷渲染：不阻塞主線程
2. 優先級調度：用戶交互優先
3. 增量渲染：大更新可分批處理
4. 更好的錯誤邊界：可恢復渲染
5. 支援 Concurrent Features：Suspense、useTransition

**與舊架構的對比**

React 15（Stack Reconciler）
* 遞迴調用，無法中斷
* 同步執行，阻塞主線程
* 簡單但效能受限

React 16+（Fiber Reconciler）
* 循環處理，可中斷
* 異步調度，不阻塞
* 複雜但效能更好

Fiber 讓 React 能處理更複雜的應用，同時保持流暢的用戶體驗。
