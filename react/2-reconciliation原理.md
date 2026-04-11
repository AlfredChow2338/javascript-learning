# React Reconciliation 原理

Reconciliation（協調）是 React 比較新舊 Virtual DOM 樹，找出差異後只更新必要 DOM 節點的過程。

React 不會直接操作真實 DOM，而是先建立 Virtual DOM，透過 diffing algorithm 找出最小變更，再批量更新。

### 為什麼需要 Reconciliation

直接操作 DOM 非常昂貴。如果每次 state 改變都重新渲染整個頁面，效能會很差。

Reconciliation 讓 React 只更新「真正改變的部分」，大幅提升效能。

### Diffing Algorithm 的核心原則

React 的 diffing 有兩個重要假設：

1. **相同類型的元素會產生相似的樹結構**：如果 `<div>` 變成 `<span>`，React 會直接替換整個子樹，而不是嘗試保留。
2. **Key 用來識別哪些元素改變了**：沒有 key 時，React 用位置（index）來比對，這會導致不必要的重新渲染。

### Reconciliation 的過程

當 state 改變時，React 會：

1. 建立新的 Virtual DOM 樹
2. 與舊的 Virtual DOM 樹進行深度優先比較
3. 找出差異（diff）
4. 產生最小變更集合
5. 批量更新真實 DOM

#### Key 的重要性

Key 幫助 React 識別哪些元素是「同一個」，哪些是「新的」。

如果列表順序改變但沒有 key，React 會誤判，導致不必要的重新建立元件實例，甚至狀態錯亂。

### Fiber 架構的優化

React 16+ 的 Fiber 架構讓 Reconciliation 變成**可中斷的**。React 可以把工作分成小塊，在瀏覽器空閒時執行，避免阻塞主線程，讓 UI 保持流暢。

### Reconciliation 比較新舊 Tree 的技術

1. 深度優先遍歷（DFS）:React 使用深度優先遍歷比較兩棵樹，從根節點開始，逐層向下

2. 節點比較的三種情況:

情況一：節點類型不同 → 直接替換整個子樹，不保留子節點

情況二：節點類型相同（DOM 元素）→ 保留 DOM 節點，只更新屬性（attributes），然後遞迴比較子節點

情況三：節點類型相同（React 組件）→ 保留組件實例，更新 props，然後調用組件的 render 方法，比較 render 結果

3. 子節點列表的比較算法

有 key 的情況（O(n) 時間複雜度，但更精確）：

React 建立 key 映射表：

1. 遍歷新列表，建立 key → 新節點 的映射
2. 遍歷舊列表，檢查每個舊節點：

- 如果 key 在新列表存在 → 移動或更新
- 如果 key 不存在 → 標記為刪除

3. 處理新列表中的新節點

### React 的啟發式規則（heuristics）假設

- 相同位置的相同類型元素通常是同一個
- 移動比刪除+新增更少見
- 這些假設在大多數情況下成立，讓算法保持高效

### 優化策略

React 使用多種優化來提升比較效率：

策略一：同層比較（Tree Diff）

- 只比較同一層級的節點
- 如果父節點不同，不比較子節點，直接替換

策略二：組件類型檢查

- 如果組件類型改變（如 Button → Input），直接替換，不比較 props

策略三：Key 的 Map 優化

- 使用 Map/Set 資料結構，讓 key 查找從 O(n) 降到 O(1)
