# Partial Prerendering（PPR）原理

PPR 要解的是 **「整頁只能 SSG 或 SSR」的二選一**：電商詳情、文章頁往往 **殼與文案可長期 cache**，但 **庫存、價格、個人化區塊必須每請求算**。PPR 的取捨：**build 時把靜態殼預渲染進 Full Route Cache / CDN，請求時只 stream 填 Suspense 裡的動態洞** — 比全頁 SSR 省算力，比全頁 ISR 更能混即時與個人化資料。

### 本質一：傳統策略卡在哪

- **全頁 SSG / ISR**：快、可 CDN；**整頁** 共用一個 revalidate — 庫存、Cookie 個人化無法「只更新一塊」。
- **全頁 SSR**：每請求重算整棵樹 — TTFB 與伺服器負載高，靜態 header、商品圖也白跑一遍。
- **典型矛盾頁**：Header + 商品描述（穩） vs 庫存 + 推薦（變）— 需要的是 **同一 URL 內的混合粒度**，不是再調 ISR 秒數。

### 本質二：PPR 是什麼

- **靜態殼（shell）**：Suspense **外**、且資料可 cache 的 Server Component — **build（或首次生成）時** 寫進 HTML / RSC payload，可走 CDN。
- **動態洞（hole）**：包在 **`<Suspense fallback={...}>`** 內、或觸及 `cookies()` / `no-store` fetch 的子樹 — **請求時** 才算，經 **Streaming** 逐步替換 fallback。
- **使用者體感**：先看到完整版面骨架 + 靜態內容，動態區塊各自 skeleton → 填滿（與 `loading.js`、Selective Hydration 同族，見 `next/3-hydration是什麼.md`）。
- **誤解**：以為 App Router 開 Suspense 就等於 PPR — 一般 Streaming SSR 也能分塊；**PPR 額外把殼在 build 階段固定成可 CDN 的預渲染產物**。

### 本質三：怎麼切靜態 / 動態

- **結構**：靜態區不包 Suspense；每塊動態資料 **獨立 Suspense 子樹** + 有意義的 fallback（skeleton）。
- **資料**：
  - 殼：`fetch(..., { next: { revalidate: N } })` 或可靜態化的來源。
  - 洞：`cache: 'no-store'`、讀 **`cookies()` / `headers()`**、個人化 API。
- **並行**：多個 Suspense 邊界 → 動態 fetch **並行**；若在 page 頂層 `await` 動態資料再 render，**整頁會被拖成 dynamic**，殼也無法預渲染。
- **啟用（Next 15+）**：`next.config` 的 `experimental.ppr: true`（仍屬演進中 API，以官方文件為準）。

### 本質四：請求時發生什麼

1. 邊緣 / CDN 先回 **含 fallback 占位** 的預渲染殼（快）。
2. 伺服器對每個 Suspense 邊界 **按需拉動態 RSC chunk**。
3. 串流把洞內容 **patch** 進已送出的 HTML — 不必等最慢的一條 API 才出首屏。

### 本質五：PPR vs ISR vs 全頁 SSR

| | 快取 / 生成單位 | 即時 / 個人化 | 首屏 |
|--|----------------|---------------|------|
| **ISR** | 整頁 | 等 revalidate 窗口 | CDN 整頁，過期時整頁再生 |
| **全頁 SSR** | 不 cache 整頁 | ✅ | 等全部資料 |
| **PPR** | 殼 cache + 洞 per-request | ✅（僅洞內） | 殼立即 + 洞 stream |

- **選 ISR**：整頁內容同質、更新節奏一致（部落格正文）。
- **選 PPR**：同一頁 **大部分靜態 + 少數必須 live**（商品頁、dashboard 概覽 + 即時指標）。
- **選全頁 SSR**：幾乎整頁都依 request 變、殼沒有 cache 價值。

### 常見陷阱

- **page 頂層 await 動態資料** — 靜態子樹也被拖下水。
- **動態元件不在 Suspense 內** — 無法獨立 stream，fallback 無意義。
- **fallback={null} 濫用** — CLS 與「內容突然冒出」；應匹配最終 layout 的 skeleton。
- **把 PPR 當 Client fetch 替代** — 洞仍在伺服器算；Client 只負責互動，資料邊界應在 Server + Suspense。
- **忽略 Full Route Cache 條件** — 殼若觸及 uncached dynamic API，可能根本 prerender 不出來（見 `next/4-app-router-vs-page-router.md` 快取四層）。

### 與其他筆記的關係

- **`next/4-app-router-vs-page-router.md`**：App Router、Streaming、`loading.js`、Full Route Cache — PPR 是其中的 **「殼動態分離」** 策略。
- **`next/2-next-cache機制.md`**：`fetch` cache 選項決定某段算殼還是洞。
- **`react/6-react-server-component原理.md`**：洞與殼都是 Server Component 樹上的分段，Client 邊界仍遵守 RSC 規則。

### 小結

- **問題**：一頁裡同時有 CDN 級穩定內容與 per-request 資料，整頁 SSG/SSR 都不剛好。
- **手段**：Suspense 劃洞 + cache / no-store 分資料 + build 預渲染殼 + 請求 stream 填洞（PPR）。
- **結果**：首屏接近靜態、動態仍 fresh；代價是結構與 cache 意譖必須設計清楚，且依 Next 版本啟用實驗旗標。
