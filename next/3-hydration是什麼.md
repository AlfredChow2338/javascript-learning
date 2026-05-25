# Hydration 是什麼？

Hydration（水合）是 **Client Component** 在瀏覽器裡做的事：伺服器已送出的 HTML 還不能點、不能改 state；React 載入 JS 後 **對齊既有 DOM、掛事件、啟用 hooks**。取捨是 **SSR 的首屏 HTML** ↔ **client 必須再跑一段 JS**；搞錯 server/client 輸出一致性的，會得到 **hydration mismatch**。

### 本質一：Hydration 解決什麼

- **問題**：只有 SSR HTML 時，頁面像靜態文件 — 按鈕無效、表單不更新、無 client state。
- **機制**：React 在 client **reuse** 伺服器產生的 DOM（不是整棵重畫），再補上 interactivity。
- **結果**：使用者先看到內容（SEO、FCP），再變成可互動 SPA。
- **範圍**：**只有 `'use client'` 子樹需要 hydrate**；Server Component 不走這條路（見 `react/6-react-server-component原理.md`）— 誤以為「整頁都在 hydrate」會高估 client JS 成本。

### 本質二：Hydration mismatch 為什麼發生

- **因果**：React 要求 **第一次 client render 的 UI 與 server HTML 一致**；不一致就報 mismatch，常 **整段改 client 重 render**（閃爍、性能、除錯噪音）。
- **典型來源**：
  - **非確定性**：`new Date()`、隨機數、每次不同的 id。
  - **環境差異**：`window` / `localStorage`、viewport 寬度在 server 不存在。
  - **第三方**：瀏覽器插件改 DOM、廣告 script 注入。
  - **錯誤邊界**：server 與 client 分支邏輯不同（`if (typeof window !== 'undefined')` 寫在 render 裡）。
- **誤解**：mismatch 只是 warning — 可能伴隨 **丟棄 server HTML**，等於白做 SSR。

### 本質三：怎麼處理（取捨）

- **Client-only 渲染**：首屏 placeholder（如 `Loading…`），**`useEffect` 後** 再寫入時間 / 隨機內容 — server 與 client 第一次 render 一致。
- **`next/dynamic(..., { ssr: false })`**：問題組件 **完全不 SSR**，只 client mount — 適合地圖、編輯器、強依賴 `window` 的 widget。
- **設計層**：能放 Server 的展示放 Server；**會變、依瀏覽器** 的縮到最小 Client 島。
- **已知 benign 差異**（如 `<html lang>`）：必要時 `suppressHydrationWarning` — **不能** 拿來蓋真正的 logic bug。

### 本質四：Selective Hydration 與 Streaming

- **舊模型**：等 **整頁** hydrate 完才能互動 — 深樹或慢組件拖住全頁。
- **React 18+ / App Router**：**Selective Hydration** — 使用者先點到的 Suspense 邊界 **優先** hydrate；其餘稍後。
- **與框架的關係**：配合 **`loading.js`、Streaming、PPR 的動態洞** — 先出殼與 fallback，再填 client / 動態段（見 `next/5-partial-prerendering原理.md`）。
- **體感**：不是「hydration 變快」，而是 **互動不必等最慢的那一塊**。

### 與其他筆記的關係

- **`next/1-next框架的作用.md`**：Next 為何要做 SSR/RSC — hydration 是 client 側必付的一環。
- **`next/4-app-router-vs-page-router.md`**：Server / Client 邊界與 `loading.js`。
- **`react/6-react-server-component原理.md`**：誰 hydrate、誰不 hydrate。

### 小結

- **問題**：SSR HTML 本身不可互動；client 必須接上 React。
- **手段**：只讓 Client 子樹 hydrate；避免 server/client 非確定性；必要時 client-only 或 `ssr: false`；用 Suspense 做 selective hydration。
- **結果**：首屏與 SEO 保留，互動正確；mismatch 少發，client 工作量可預期。
