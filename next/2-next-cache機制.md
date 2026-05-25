# Next.js Cache 機制

Next 的「快」多半來自 **多層 cache 疊加**，不是單一 magic。搞錯 **哪一層** 在存、**誰失效**，會出現：以為在 SSR 其實在讀舊資料、CMS 更新了但 `<Link>` 返回仍瞬間、或改了 API 卻要硬刷新才對 — 取捨是 **用 cache 換延遲與算力**，但要 **按資料新鮮度分層控制**。

### 本質一：Static / Dynamic 是「結果」，不是手動標籤

- **Static 路由**：build（或首次生成）時可固定輸出，請求間 **重用 Full Route Cache**；仍可用 **`revalidate` 定時更新** — 不是「永遠不能變」。
- **Dynamic 路由**：每次請求（或每次未命中 cache）可能不同 — 觸發因子包括 **`cookies()`、`headers()`**、未 cache 的 **`searchParams`**、`fetch(..., { cache: 'no-store' })`、`export const dynamic = 'force-dynamic'` 等。
- **誤解**：Static = 快但過時、Dynamic = 慢但新 — App Router 可在 **同一頁** 混 `no-store` 與 `revalidate` 的 fetch（見 `next/4-app-router-vs-page-router.md` 的 per-fetch 粒度）。

### 本質二：四層快取（App Router）

| 層 | 存哪 | 管什麼 | 典型失效 |
|----|------|--------|----------|
| **Request Memoization** | 單次 HTTP 請求內 | 同 URL 的 `fetch` / `React.cache()` 只跑一次 | 請求結束即沒 |
| **Data Cache** | 伺服器 | `fetch` 回應 body | `revalidate` 時間到、`revalidateTag`、build |
| **Full Route Cache** | 伺服器 | 整段 RSC payload / HTML | 路由變 dynamic、path/tag revalidate |
| **Router Cache** | 瀏覽器（同 tab） | 已訪問過的 RSC payload，**軟導航** `<Link>` | 時間窗口、refresh、hard reload |

- **因果**：Data Cache 決定 **API 資料新不新**；Full Route 決定 **整頁要不要重算**；Router Cache 只影響 **客戶端切換路由體感**，不改伺服器真實資料。
- **Request Memoization**：layout 與 page 各 fetch 同一 user — 沒這層會 **同請求打兩次 DB**。

### 本質三：`fetch` — Data Cache 的控制杆

- **`cache: 'force-cache'`**（App 裡常是預設）：跨請求重用 — 適合公開、可 stale 的資料。
- **`cache: 'no-store'`**：每次請求都打源 — 個人化、庫存、session 相關。
- **`next: { revalidate: N }`**：ISR 語意 — N 秒內用舊值，過期後 **下一個請求** 觸發背景更新（stale-while-revalidate 體感）。
- **`next: { tags: ['products'] }`**：給 **`revalidateTag('products')`** 用 — CMS 發布時 **精準失效** 一批 fetch，不必等 N 秒。

### 本質四：按需失效 vs 定時

- **定時 `revalidate`**：簡單，但 CMS 剛改完可能 **最多等 N 秒**。
- **`revalidatePath('/products')`**：整條路由相關 cache 標髒。
- **`revalidateTag('products')`**：只動打 tag 的 fetch — **粒度更細**，適合同 tag 多頁共用資料。
- **與 Router Cache**：伺服器資料更新了，**同 tab 軟導航** 可能仍短時間看到 Router Cache — 必要時引導 hard refresh 或縮短 dynamic 段 cache。

### 本質五：和 HTTP / CDN cache 的關係

- **Full Route + 靜態 asset** 可再配合 **CDN**（`Cache-Control`、`immutable` hash 檔）— 那是 **邊緣** 一層，語意見 `web/5-http-cache原理.md`。
- **PPR** 把 **殼** 進 Full Route / CDN、**洞** 請求時 stream — 見 `next/5-partial-prerendering原理.md`。
- **部署**：改程式 ≠ 只清 Data Cache；hash 檔名與 HTML cache 策略見 `system-design/5-如何deploy-frontend-application.md`。

### 常見陷阱

- **以為 `no-store` 在 client 的 fetch 也進 Data Cache** — Data Cache 是 **Server Component / Route Handler 的 `fetch`** 語意。
- **dev 與 prod 不一致** — dev 常關 cache 方便除錯；以 prod 行為為準驗證。
- **只 revalidatePath 卻忘了 tag** — 多 segment 共用資料時 tag 較準。
- **Router Cache 當成「資料已更新」** — 只是 **導航加速**；寫入後要看 API / 伺服器 cache。
- **整頁 dynamic 因一個 `cookies()`** — 能拆到 Suspense 子樹或子 layout 的，保留靜態殼（PPR / 混合 fetch）。

### 與其他筆記的關係

- **`next/4-app-router-vs-page-router.md`**：Pages GSP/GSSP vs App `fetch`、四層 **總覽與遷移**。
- **本篇**：**只深挖 cache 四層 + fetch 選項 + 失效** — 當 App Router 快取字典用。
- **`next/1-next框架的作用.md`**：為何 Next 內建這套，而非 Pure React 自建。

### 小結

- **問題**：SSR/SSG 速度來自 cache，但預設 aggressive，個人化與即時資料易踩雷。
- **手段**：分清四層；用 `force-cache` / `no-store` / `revalidate` / **tags** 按資料選；必要時 `revalidatePath` / `revalidateTag`。
- **結果**：公開內容快、可 CDN；敏感資料 fresh；失效可控 — 而非「全站一種 cache 策略」。
