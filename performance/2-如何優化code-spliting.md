# Code Splitting 優化實現

Code Splitting 的本質是：**首屏只下載、解析、執行「現在就要用」的 JS**，其餘延後或按需拉取。取捨是 **initial bundle 變小 ↔ chunk 數變多、路由切換可能多一次請求與 loading 狀態** — 過度分割會變成 HTTP waterfall，比單一大 bundle 更慢。

### 本質一：為什麼要分割

- **問題**：SPA 預設把路由、重型 widget、整包 `node_modules` 打進同一 entry；使用者只開首頁，卻要付整包 download + parse + compile 的成本。
- **機制**：bundler 遇到 **dynamic `import()`** 或框架約定（Next 每頁一 chunk）時，產出 **async chunk**，執行到該路徑才 fetch。
- **量到的效果**：initial JS 常可降一截；但 **LCP / TTI 是否改善** 要看首屏是否真的少載了 critical path — 用 bundle analyzer 驗證，勿靠感覺（見 `performance/1-LCP首屏加載怎麼優化.md`）。
- **誤解**：分割 vendor 不會 magically 縮小「首屏必須下載的總量」；只是把 **可緩存** 與 **常變的 app code** 拆開，讓改版時少重下。

### 本質二：分割粒度與取捨

| 粒度 | 典型做法 | 何時用 |
|------|----------|--------|
| **路由** | 每頁 `lazy(() => import('./Page'))` | 預設首選；ROI 最高 |
| **組件** | Monaco、Chart、PDF 等重型、條件才出現的 UI | 仍卡在首屏 bundle 時 |
| **Vendor** | `splitChunks` 抽 `node_modules` | 利用長期 cache；app hash 變、vendor 不變 |
| **功能域** | admin / editor 整包按角色延後 | 只有部分用戶會觸發的路徑 |

**不適合分割**（拆了反而更差）：

- Header、Layout、首屏 landing 必需元件 — 會增加請求與 Suspense 閃爍，不減 critical path。
- 很小的 util — chunk 開銷大於收益。
- 到處 `lazy` — 路由切換連續 loading、Error Boundary 爆炸。

### 本質三：React — `lazy` + `Suspense`

- **`React.lazy(() => import('./X'))`**：編譯期標記 async boundary；渲染到該組件時才拉 chunk。
- **`Suspense fallback`**：chunk 未到前的占位 — 用 skeleton 比純 "Loading..." 體感好，但別在列表裡包過多邊界（見 `react/4-如何optimize大型列表的渲染性能.md`）。
- **Error Boundary**：網路失敗、部署後舊 tab 載舊 chunk（404）時要有 retry / 提示；Suspense 只管 loading，不管 error。
- **SSR**：`lazy` 在 Node 端行為與 Next 的 `dynamic` 不同 — 純 React SSR 需額外處理；Next 用 **`next/dynamic`**。

### 本質四：Next.js 邊界

- **頁面級**：App / Pages Router 預設 **一頁一 chunk**，不必手動對每個 route `lazy`。
- **`next/dynamic(importFn, { ssr: false, loading })`**：瀏覽器 API、重型 client-only 組件；`ssr: false` 避免 hydration 與 window 問題。
- **預載**：`<Link prefetch>`（預設）在 viewport / hover 時拉下一頁 JS — 用 **latency 換切換瞬間**；高流量頁可關 `prefetch={false}` 省頻寬。
- **手動預載**：`import('./Heavy')` 可在 `onMouseEnter` 或 feature flag 開啟時提前觸發，與 dynamic 組件並用。

### 本質五：構建層 — Webpack / bundler

- **觸發分割**：源碼裡的 **`import()`**；配置裡的 **`optimization.splitChunks`** 決定 vendor / common 怎麼併、怎麼拆。
- **`cacheGroups`**：把 react、UI lib、其餘 `node_modules` 分組 — 目的在 **cache 壽命**，不是越少檔案越好。
- **`contenthash` 檔名**：內容變才換 URL，配合長 cache；部署後要處理 **舊 chunk 404**（Error Boundary / 強刷策略）。
- **公共依賴重複**：多 chunk 各帶同一份 lodash → 調 `minChunks` / common group 提取 shared chunk。
- **細節**：loader、plugin、完整 webpack 流程見 `web/4-webpack-bundling-原理和配置.md`。

### 本質六：預加載策略與體感

- **`prefetch`**：低優先級，空閒時拉「可能下一步」的 chunk（Next Link、手動 `import()`）。
- **`preload`**：高優先級，給 **當前導航必定要用** 的資源 — 用錯會搶首屏頻寬。
- **loading UX**：路由級統一 fallback + 骨架；避免每個小組件各自 spin。
- **量測**：`webpack-bundle-analyzer` / `@next/bundle-analyzer` 看 **誰進了 initial**；Lighthouse 看 FCP、LCP、TBT 是否真改善。

### 常見陷阱

- **過度分割** → 請求數、`maxInitialRequests` 上限、弱網 waterfall。
- **首屏仍 import 重型庫** → 分割了 route 但 layout 靜態 import 了 chart 庫，analyzer 會露餡。
- **SSR + 純 `lazy`** → 白屏或 hydration mismatch；Next 改用 `dynamic` 並明確 `ssr`。
- **只分割不預載** → 首次點進路由明顯頓；在可預測路徑加 prefetch / hover preload。
- **忽略部署窗口** → 用戶開著舊頁、你發新版，async chunk 404 — 需 global error handler 或版本提示。

### 與首屏優化筆記的關係

- **`performance/1-LCP首屏加載怎麼優化.md`**：DNS、CDN、Critical CSS、SSR 等 **全鏈路**；Code Splitting 是其中 **「減少首屏 JS 體積與解析時間」** 這一段。
- 分割解決「載了用不到的 code」；不取代圖片優化、不取代列表虛擬化、也不取代 memo。

### 小結

- **問題**：單 bundle 讓首屏為未訪問路由與重型組件買單。
- **手段**：路由 / 條件組件 `import()`、vendor 分 cache、Next 頁面 chunk + Link prefetch、splitChunks + contenthash。
- **結果**：initial 更小、改版 cache 更穩；以 analyzer 與 Web Vitals 驗證，並控制 chunk 數與 loading / 錯誤體驗。
