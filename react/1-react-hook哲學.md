# React Hook哲學

### 本質一：代數效應在前端的實現

Hooks的設計靈感來源自代數效應 (Algebraic Effect)。

簡單來說，它解決的是一個function如何在不修改自身function signature的情況下，訪問它所在的上下文狀態。

`useState` 和 `useEffect` 本身並不在意具體是哪個組件的狀態，它是向React聲明一個「需求」。

React在調用這個function，根據調用盞和調用順序，將狀態注入給這個hook。

實現了邏輯與UI的徹底解耦。

### 本質二："調用順序"是保證"簡潔性"的代價

#### 為什麼用調用順序，而不是像Vue 3那樣用Key Value Pair？

Vue 3 的 Composition API提供了`ref` 、 `reactive`等API，需要顯式地 `.value` 訪問，

並且可以用一個 `setup()` function統一管理，它更顯式更靈活，可以在conditional statement中使用。

React hook 選擇調用順序，是為了最大程度簡化開發者的心智模型。

開發不需要給每一個hook起一個唯一的鍵名，也不需要記住哪個狀態對應哪個鍵，直接像使用普通變量一樣聲明即可。

這種極簡的API背後，是React通過強制要求 "每次渲染調用順序不變" 這個嚴格規則換來。

### 本質三：Hooks對性能優化的影響

依賴項數組：`useEffect` `useMemo` `useCallback` 的依賴數組，

本質是在告訴React "什麼時候需要重新計算"。

如果依賴設置不當，要麼導致閉包陷阱（引用舊值），要麼導致不必要的重新計算。

#### useMemo useCallback的濫用

這兩個API本身也有開銷，在大多數簡單場景下，創建一個新的函數或對象，其開銷遠小於 `useMemo` 的依賴項比對開銷。

它們的價值在於將引用穩定性傳遞給子組件，結合 `React.memo` 避免子組件無效重渲染。
