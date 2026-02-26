## React Reconciliation 原理

**什麼是 Reconciliation**

Reconciliation（協調）是 React 比較新舊 Virtual DOM 樹，找出差異後只更新必要 DOM 節點的過程。React 不會直接操作真實 DOM，而是先建立 Virtual DOM，透過 diffing algorithm 找出最小變更，再批量更新。

**為什麼需要 Reconciliation**

直接操作 DOM 非常昂貴。如果每次 state 改變都重新渲染整個頁面，效能會很差。Reconciliation 讓 React 只更新「真正改變的部分」，大幅提升效能。

**Diffing Algorithm 的核心原則**

React 的 diffing 有兩個重要假設：

1. **相同類型的元素會產生相似的樹結構**：如果 `<div>` 變成 `<span>`，React 會直接替換整個子樹，而不是嘗試保留。
2. **Key 用來識別哪些元素改變了**：沒有 key 時，React 用位置（index）來比對，這會導致不必要的重新渲染。

```jsx
// ❌ 沒有 key，React 用 index 比對
{items.map((item, index) => <Item data={item} />)}

// ✅ 有 key，React 能正確識別元素
{items.map((item) => <Item key={item.id} data={item} />)}
```

**Reconciliation 的過程**

當 state 改變時，React 會：

1. 建立新的 Virtual DOM 樹
2. 與舊的 Virtual DOM 樹進行深度優先比較
3. 找出差異（diff）
4. 產生最小變更集合
5. 批量更新真實 DOM

**Key 的重要性**

Key 幫助 React 識別哪些元素是「同一個」，哪些是「新的」。如果列表順序改變但沒有 key，React 會誤判，導致不必要的重新建立元件實例，甚至狀態錯亂。

```jsx
// 假設列表從 [A, B, C] 變成 [B, C, A]
// 沒有 key：React 認為第一個元素從 A 變成 B，會重新建立
// 有 key：React 知道 A 只是移動位置，保留實例和狀態
```

**Fiber 架構的優化**

React 16+ 的 Fiber 架構讓 Reconciliation 變成**可中斷的**。React 可以把工作分成小塊，在瀏覽器空閒時執行，避免阻塞主線程，讓 UI 保持流暢。
