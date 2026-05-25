# Next.js 的作用

Next.js 不是 React 的替代品，而是 **React 的生產環境框架**：在 React 之上補齊 **路由、渲染策略、構建、邊緣請求、部署約定**。Pure React 只負責 UI 與 client 狀態；Next 回答「**這個 URL 用什麼方式、在哪算、怎麼快取、怎麼上線**」。

### 本質一：為什麼有 RSC 還需要 Next

- **RSC**（見 `react/6-react-server-component原理.md`）：**渲染模型** — 伺服器算樹、減 client bundle、資料貼近 DB。
- **RSC 不管**：file routing、build 管線、`fetch` cache 語意、middleware、API route、image/font 優化、一鍵 deploy。
- **比喻**：RSC 是引擎；Next 是整車（底盤、變速箱、儀表）。可自組 Remix / Waku 等，Next 是 **預集成、約定多** 的預設選項。
- **誤解**：會 RSC 就等於會 Next — App Router 還有 **四層 cache、layout、PPR** 等框架語意（見 `next/4-app-router-vs-page-router.md`）。

### 本質二：Next 實際提供了什麼

- **全端同一 repo**：`route.js` / API Routes 做 BFF；前端頁與後端 handler colocate。
- **多種渲染**：SSG、SSR、ISR、CSR、Streaming、PPR — **按路由選**，不必整站一種（PPR 見 `next/5-partial-prerendering原理.md`）。
- **構建與分割**：Webpack / Turbopack、**按頁 code split**（見 `performance/2-如何優化code-spliting.md`）。
- **內建資源優化**：`next/image`、`next/font`、script 策略 — 少寫一堆 performance boilerplate。
- **請求邊界**：**middleware** 做 auth redirect、header、A/B；在進 page 前攔截。
- **部署約定**：Vercel 親兒、`output: 'standalone'` Docker 等（見 `system-design/5-如何deploy-frontend-application.md`）。

### 本質三：相對 Pure React 的取捨

| 維度 | Pure React（+ Vite/RR） | Next.js |
|------|-------------------------|---------|
| 路由 | 自配 react-router | 目錄即路由 |
| 首屏資料 | 常 `useEffect` + loading | Server Component / GSP 等 |
| SSR/SSG | 需自建或另框架 | 內建 + cache 選項 |
| 配置量 | 彈性高、自建多 | 約定多、零配置取向 |
| 適合 | 純 SPA、強自訂 build | SEO、混合渲染、全端一體 |

- **Next 換來的是約束**：cache 預設、RSC 邊界、部署模型要學；不是「加個 dependency 就完」。
- **Pure React 仍對**：後台 SPA、嵌入 widget、build 流程必須完全自控 — 硬上 Next 可能更重。

### 本質四：什麼時候用 / 不用

**適合：**

- **SEO / 分享預覽** — 要 crawlable HTML（marketing、電商列表、部落格）。
- **首屏要快** — SSG/ISR 或 PPR 殼先出（見 `performance/1-LCP首屏加載怎麼優化.md`）。
- **混合應用** — 公開頁靜態、dashboard CSR/SSR 混用。
- **小團隊全端** — 同一套 TS、同一 deploy，API 不另開 repo。
- **CMS + ISR** — 內容定時更新，不必整站 rebuild。

**不太適合：**

- **純 client 應用、無 SEO** — Vite SPA 更輕。
- **極簡靜態站** — Astro 等可能更貼內容站。
- **與 Next 模型對著幹** — 全頁 client、拒絕 server 資料流，等於只用 half 框架。

### 本質五：和「只會 React」的開發差異

- **心智從 component 升到 route + cache**：同一 `fetch` 在 dev 與 prod、cache 開關下結果可不同。
- **Hydration** 是必過關 — server HTML 與 client 不一致會炸（`next/3-hydration是什麼.md`）。
- **Auth / 秘密** 應走 server、HttpOnly，不是全堆 `localStorage`（`system-design/3-如何設計安全的用戶登入認證流程.md`）。

### 與同目錄筆記的關係

- **`next/4-app-router-vs-page-router.md`**：兩套路由與 cache — 用 Next 必讀的一層。
- **`next/2-next-cache機制.md`**：`fetch` 三模式速查。
- **`react/6-react-server-component原理.md`**：RSC 邊界；Next App Router 是 RSC 的主戰場。

### 小結

- **問題**：Pure React 不管 URL、渲染時機、生產部署與快取。
- **手段**：Next 集成 routing + 多渲染模式 + build/資源優化 + middleware/API + deploy 約定。
- **結果**：適合要 SEO、混合渲染、全端一體的產品；代價是接受框架約定並學 cache/RSC 語意 — 不是每個專案都需要。
