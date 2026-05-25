# Web Component 原理

Web Components 是 **瀏覽器原生** 的組件模型：**Custom Elements**（標籤語意）+ **Shadow DOM**（樣式/DOM 封裝）+ **`<template>` / slot**（結構復用）。取捨是 **框架無關、長期嵌入** ↔ **狀態管理、生態、SSR Story 需自建** — 與 React/Vue **互補**，不是替代。

### 本質一：解決什麼

- **問題**：設計系統要在 React/Vue/Angular/legacy 重複實現；全局 CSS 互相污染。
- **手段**：自定義 `<my-button>` + Shadow 內樣式 **不 leak** + slot 插內容。
- **結果**：npm 發一個 CE，多框架 **當普通 HTML 標籤** 用（需 `customElements.define`）。

### 本質二：Custom Elements

- **`customElements.define('x-foo', class extends HTMLElement)`** — 名稱必 **含連字號**。
- **生命週期**：`connectedCallback` / `disconnectedCallback` / `attributeChangedCallback` — 對應 mount/unmount/props from attrs。
- **Observed attributes**：哪些 attr 變要 callback — 類似 props。
- **與 React**：React 19+ 對 CE 事件/props 改善；舊版常 **ref + imperative API** 或 wrapper。

### 本質三：Shadow DOM

- **`attachShadow({ mode: 'open' })`** — 子樹與外部 DOM/CSS **隔離**。
- **`:host` / `::slotted()`** — 宿主與 slot 內容樣式。
- **mode: 'closed'**：少見；debug 難。
- **誤解**：Shadow 防不住 **全局事件、ARIA 從 light DOM 繼承** — 無障礙仍要設計。

### 本質四：Template 與 Slot

- **`<template>`**：惰性 DOM 片段，clone 進 shadow。
- **`<slot name="...">`**：light DOM 子節點 **投影** 進 shadow — 類似 children/composition。
- **組合模式**：CE 管封裝；slot 管 **內容分發** — 類 compound components。

### 本質五：與框架的邊界

| | Web Component | React/Vue |
|--|---------------|-----------|
| 封裝 | 標準 Shadow | 模組 + CSS modules 等 |
| 狀態 | 類內字段 / 事件 | hooks / reactivity |
| 更新 | attr / 自管 | virtual DOM / compiler |
| SSR | 需 lit/ssr 等方案 | 框架內建 |

- **適合 WC**：跨框架 widget、embed、漸進增強 legacy 頁。
- **不適合全站 WC 取代 React**：路由、data fetching、DX 仍靠框架。

### 常見陷阱

- **忘 define 就使用** — `HTMLElement` 無 upgrade。
- **Shadow 內用 ID 全局 query** — 選不到。
- **attrs 全是 string** — 複雜 props 用 JSON attr 或 property setter。
- **無 `:focus-visible` 等 a11y** — 自定義控件常漏鍵盤。

### 小結

- **問題**：跨棧復用 UI 與樣式隔離。
- **手段**：Custom Elements + Shadow DOM + slot/template。
- **結果**：標準級 embeddable 組件；應用主幹仍多為框架，WC 做邊界清晰的葉子或設計系統原子。
