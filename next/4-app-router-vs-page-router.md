# App Router vs Pages Router

兩者都是 Next 的 **file-based routing**，但心智模型不同：**Pages Router 在「頁」邊界用 `getStaticProps` / `getServerSideProps` 決定渲染策略**；**App Router 預設 Server Component，在組件內 `fetch` + cache 選項決定每一筆資料怎麼存**。新專案選 App；既有 Pages 可增量遷移（`app/` 與 `pages/` 可並存，`app` 優先）。

### 本質一：目錄即路由，檔名即職責

- **Pages**：`pages/index.js` → `/`，`pages/blog/[id].js` → 動態段，`pages/api/users.js` → API。
- **App**：`app/page.js` → `/`，`app/blog/[id]/page.js` → 動態段；**`layout.js`**（嵌套布局）、**`loading.js`**、**`error.js`** 與路由 **colocate**；API 改 **`route.js`**（export `GET` / `POST`）。
- **誤解**：以為只是資料夾改名 — App 多了 **RSC 執行模型** 與 **多層快取**，不是 1:1 語法替換。

### 本質二：資料取得 — 頁級 export vs 組件內 async

| 意圖 | Pages Router | App Router |
|------|--------------|------------|
| 建置時固定 / ISR | `getStaticProps` + `revalidate` | `fetch(..., { next: { revalidate: N } })` 或靜態 page |
| 每請求最新 | `getServerSideProps` | `fetch(..., { cache: 'no-store' })` 或 `dynamic = 'force-dynamic'` |
| 客戶端拉資料 | `useEffect` + API | `'use client'` + 同上，或 Server 先取再傳 props |

- **App 的變化**：同一頁可 **user 不 cache、config cache 1h、stats cache 5min** — 粒度從「整頁 SSG 或 SSR」變成 **per-fetch**。
- **App 獨有**：`revalidatePath` / **`revalidateTag`** 按需失效（Pages 主要靠 path revalidate，無 tag）。
- **Request Memoization**：同一 HTTP 請求內相同 `fetch` / `React.cache()` 只跑一次 — Pages 無此層。

### 本質三：布局、loading、error

- **Pages**：全局包一層 `_app.js`；loading / error 多半手寫或自訂 `_error.js`。
- **App**：**嵌套 `layout.js`**（根 layout 必含 `<html>` / `<body>`）；子路由切換時 **layout 不重掛** — 側欄、header 狀態可保留。
- **`loading.js`**：該 segment 的 Suspense fallback，配合 **Streaming** 先出殼再填內容。
- **`error.js`**：segment 級 Error Boundary，須 **`'use client'`**（要有 `reset` 互動）。
- **取捨**：colocate 好維護；但要理解 **哪一層 layout / loading 包住哪段樹**，否則 loading 範圍會比預期大或小。

### 本質四：App Router = RSC 為預設

- 預設在伺服器執行的組件 **不進 client bundle**；互動、hooks、事件 → **`'use client'`** 邊界。
- Client **不可 import** Server 模組；用 **props / children** 把伺服器算好的結果塞進 Client。
- 詳見 `react/6-react-server-component原理.md`；hydration 與 mismatch 見 `next/3-hydration是什麼.md`。

### 本質五：快取四層（App 完整、Pages 子集）

1. **Request Memoization** — 單次請求內 dedupe（App）。
2. **Data Cache** — `fetch` 結果存伺服器；`force-cache` / `no-store` / `revalidate` / `tags`。
3. **Full Route Cache** — 整段 RSC/HTML 是否可在 build 或請求間重用；觸及 **`cookies()`、`headers()`、`searchParams`（未 cache 的 dynamic）** 等 → 傾向 dynamic。
4. **Router Cache** — 客戶端 **已訪問路由** 的 RSC payload，加速 `<Link>` 返回；靜態段較久、動態段約 **30s** 量級（版本會調）。

- **Pages**：快取語意主要綁在 **GSP / GSSP 整頁**；App 可混用上述四層。
- **fetch 選項速查**：`next/2-next-cache機制.md`。
- **PPR（靜態殼 + 動態洞）**：App 進階，見 `next/5-partial-prerendering原理.md`。

### 本質六：怎麼選、怎麼遷

- **新專案**：App Router（Next 主線、RSC、細粒度 cache、嵌套 layout）。
- **既有 Pages**：不必一次重寫；新功能放 `app/`，舊路由留 `pages/`，API 逐步改 `route.js`。
- **仍留 Pages 的合理理由**：團隊熟 GSP/GSSP、重度依賴 Pages 專用生態或教學資源 — 但長期新特性（PPR、cache tags）偏 App。
- **遷移對照**：`getStaticProps` + `revalidate: 60` ≈ `fetch(..., { next: { revalidate: 60 } })`；`getServerSideProps` ≈ `cache: 'no-store'` 或 `dynamic = 'force-dynamic'`。

### 常見陷阱

- **App 預設 cache 太 aggressive** — 以為會 SSR，其實 `fetch` 預設長 cache；個人化 / 即時資料要顯式 `no-store`。
- **在 Server Component 用 hooks** — 需 `'use client'` 或拆子組件。
- **Client import Server** — 打包或執行模型錯誤。
- **以為 Router Cache = Data Cache** — 前者只加速 **同 tab 內導航**，後者決定 **伺服器回什麼**；改資料後可能要 `revalidateTag` + 硬刷新才一致。
- **全頁 `'use client'`** — 失去 RSC 減 bundle 的意義，等同 Pages + CSR 重包。

### 與其他筆記的關係

- **`next/1-next框架的作用.md`**：Next 整體價值（路由、構建、部署）；本篇只比 **兩套路由 + 快取模型**。
- **`next/2-next-cache機制.md`**：`fetch` 三模式與 Router / Full Route 簡述。
- **`react/6-react-server-component原理.md`**：App 預設渲染模型的邊界與序列化規則。

### 小結

- **問題**：同一框架兩套路由，資料與快取該在哪一層決定。
- **手段**：Pages 用頁級 GSP/GSSP；App 用 RSC + 嵌套 layout + per-fetch cache + 四層快取與 tag 失效。
- **結果**：App 細粒度與 Streaming 更強；Pages 仍可用且可漸進遷移 — 選哪套取決於綠地 vs 存量與團隊是否接受 RSC 邊界。
