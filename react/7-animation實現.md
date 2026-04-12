## React 動畫實現

動畫在 React 裡的難點不是「會不會寫 CSS」，而是**誰在什麼時機改 DOM**、**離場時節點已不存在**、以及**頻繁 setState 是否觸發 layout**。**一句話**：優先用**合成層友善**的屬性（`transform`、`opacity`）表達位移與顯隐；需要 mount/unmount 同步的進出場，用 **Transition Group / AnimatePresence** 一類機制補上「退出階段」；複雜手勢、layout 動畫或彈簧物理再交給函式庫。

### 本質一：分層——從便宜到昂貴

- **純 CSS（transition / @keyframes）**：瀏覽器主導插值，React 只切 class；適合 hover、簡單狀態切換。**取捨**：邏輯分散在 CSS，但效能與可預測性通常最好。
- **react-transition-group**：在 **enter / exit / appear** 階段掛 class，解決「卸載後沒機會播完退出動畫」。**取捨**：API 較底層，列表需 `TransitionGroup` + 穩定 `key`。
- **Framer Motion**：聲明式 `motion.*`、`layout`、`AnimatePresence`（離場動畫）、手勢。**取捨**：能力完整、bundle 較大；需留意減少動效（a11y）。
- **React Spring**：彈簧物理模型驅動數值。**取捨**：手感自然，心智模型是「物理參數」而非時間軸。
- **自訂 hook + rAF**：完全掌控每幀更新。**取捨**：易寫出過度 re-render；適合與 ref、單一狀態批次更新搭配。

### 本質二：為什麼「退出」特別麻煩

- React 條件渲染為 `false` 時，子樹會立刻卸載；**沒有**內建「先播 exit 再卸載」。
- **解法**：要嘛延遲卸載（transition group 模式），要嘛由函式庫在 exit 結束後再 unmount（如 `AnimatePresence`）。誤解這點會覺得「為什麼一關 modal 動畫沒了」。

### 本質三：效能——少觸發 layout、少無效 React 更新

- **優先動 `transform` / `opacity`**（多數情況走合成路徑）；**避免**對 `width`、`height`、`top`、`left`、`margin` 等做連續動畫——易引發 **layout / paint** 重負載。
- **`will-change`**：僅在動畫前後短暫提示，結束後撤掉；濫用會吃掉記憶體與合成策略。
- **`requestAnimationFrame`**：自訂每幀邏輯時對齊螢幕刷新；避免用 `setInterval` 硬幀率驅動 React state（易抖動又耗電）。
- **單次狀態更新**：例如指標跟隨用一個 `position` 物件而非連續 `setX`+`setY`，減少 commit 次數（高頻互動時差異明顯）。
- **能 CSS 做完的迴圈動畫**（如無限旋轉）：通常比每幀 `setState` 省。

### 本質四：可及性與節奏

- **`prefers-reduced-motion: reduce`**：為敏感使用者關閉或縮短動效（媒體查詢或庫內 `useReducedMotion`）；不是錦上添花，是預設該支援。
- **時長經驗值**：微互動約 **100–200ms**，一般過渡 **200–300ms**，較複雜或頁面級 **300–500ms**；過長易覺得遲鈍。
- **緩動**：`ease-out` 常用於入場（快開始、慢停下）；彈簧曲線用物理參數描述而非死盯時間軸。

### 與其他筆記的關係

- **大型列表效能**：動畫再順，若列表層級仍在對上千節點做不必要 reconcile，瓶頸仍在列表策略（windowing、memo），應與 `4-如何optimize大型列表的渲染性能` 一起想。
- **Fiber**：動畫本身不改 reconciler 規則；高頻更新只是更考驗 **更新粒度** 與 **是否觸發 layout**。

### 小結

- **問題**：視覺連續性、離場階段、與主執行緒/layout 的競爭。
- **手段**：CSS 優先；進出場用過渡抽象；進階用 Motion/Spring；效能鎖定 **transform/opacity** 與批次更新。
- **結果**：互動順、bundle 與複雜度可控，並保留 **減少動效** 的預設尊重。
