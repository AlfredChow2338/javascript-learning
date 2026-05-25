# Webpack Bundling 原理和配置

Webpack 是 **模組打包器**：從 **entry** 出發建 **依賴圖**，用 **loaders** 轉非 JS 資源，用 **plugins** 做分割/壓縮/HTML 注入，輸出瀏覽器可載入的 **bundle**。取捨是 **開發時模組化** ↔ **生產時檔案數與體積** — 不懂 graph 與 hash，cache 與 code split 都配不好。

### 本質一：打包在解決什麼

- **問題**：瀏覽器原生早年只擅長 script；工程要 hundreds of `import`、TS、CSS、圖片。
- **機制**：靜態分析 `import`/`require` → 依賴圖 → 合併/分割成 output 檔。
- **結果**：開發寫模組；上線少請求（或按路由多 chunk）。

### 本質二：核心概念（因果鏈）

- **Entry**：從哪個模組開始 walk graph。
- **Output**：`path`、`filename`、`[contenthash]` — hash 變才換 URL，配 **immutable cache**（`web/5-http-cache原理.md`）。
- **Loader**：**轉譯**（babel-loader）、**鏈式**處理 CSS/資源 — 「非 JS 怎麼變成模組」。
- **Plugin**：在 graph 生命週期鉤子 — 分割、壓縮、DefinePlugin、HtmlWebpackPlugin。
- **Resolve**：`alias`、`extensions` — 決定 `import 'x'` 找哪個檔。

### 本質三：Code Splitting 與 Tree Shaking

- **動態 `import()`** → async chunk，按需載入（細節 `performance/2-如何優化code-spliting.md`）。
- **`splitChunks`**：抽 `node_modules` vendor、共用 module — **cache 壽命** 與 **重複打包** 的平衡。
- **Tree shaking**：`sideEffects: false` + ES module + production mode — **死碼消除**；CommonJS 較難 shake。
- **誤解**：split 越多越好 — chunk 過多 → HTTP waterfall。

### 本質四：開發 vs 生產

- **Dev**：HMR、cheap source map、不 minify — 快反饋。
- **Prod**：Terser、CssMinimizer、`mode: 'production'`、contenthash、analyze bundle。
- **Vite / Turbopack**：dev 用 ESM 原生、prod 仍要 rollup/esbuild 類打包 — **概念仍適用**，工具鏈可換。

### 本質五：與現代框架的關係

- **CRA / Next / Nuxt** 預設 webpack 或 turbopack — 多數 **eject 或 `webpack` 覆写** 才碰完整配置。
- **Next**：框架管 split + RSC 邊界；自訂 webpack 在 `next.config.js` **最後手段**。
- **Micro-frontend**：Module Federation 用 webpack 5 **共享 remote** — 見 `system-design/4-micro-frontend架構.md`（若需）。

### 常見陷阱

- **全進 entry 一個 bundle** — 首屏載入整包 `node_modules`。
- **無 contenthash** — 部署後用戶 cache 舊 JS。
- **loader 順序錯** — CSS/postcss 鏈從右到左/底到頂，配錯 silently 壞。
- **以為 tree shaking 自動清乾淨** — side effect import、polyfill 仍可能全進。

### 小結

- **問題**：工程模組化 vs 瀏覽器載入單位。
- **手段**：entry 圖 + loaders + plugins + split + hash + prod 壓縮。
- **結果**：可 cache 的 vendor、可按路由載入的 app code；配置服務於 **首屏體積與 cache**，不是為配而配。
