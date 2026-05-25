# 如何部署前端應用

前端部署的本質是：**把 source 變成可交付的 artifacts，用正確的 cache / 路由 / 環境邊界服務給使用者，並能自動驗證與回滾**。取捨先分 **靜態 SPA**（`dist` + CDN）vs **SSR / Full-stack**（Node 進程、serverless 或 standalone 容器）— 搞錯模型會在 cache、env、回滾上全線踩坑。

### 本質一：兩種交付模型

| 模型 | 產物 | 典型託管 | 路由 |
|------|------|----------|------|
| **靜態 SPA** | `index.html` + hashed JS/CSS | S3+CloudFront、Netlify、Nginx | `try_files … /index.html` |
| **SSR / Next 等** | HTML/RSC 需 **執行時** | Vercel、K8s + Docker、`output: 'standalone'` | 框架 + 反向代理 |

- **SPA**：build 一次，邊緣只送檔案；API 另域或 BFF。
- **SSR**：每次（或按 cache）在伺服器算 HTML — 要管 **process、scale、冷啟動**，不是只上傳 `dist`。
- **Next 靜態 export**：只有全站可靜態化時才等同 SPA；有 SSR/API 就走平台或容器（見 `next/4-app-router-vs-page-router.md`）。

### 本質二：Build 產出與優化

- **Pipeline**：`lint/test` → `build` → 產物上傳 / 映像推送 — 產物應 **可重現**（lockfile、`npm ci`）。
- **產物特徵**：JS/CSS **`[contenthash]`** 檔名 → 可 `immutable` 長 cache；**`index.html` 短 cache** 或 no-cache，才能推新版 JS。
- **Build 期優化**：minify、tree-shake、code split — 細節見 `performance/2-如何優化code-spliting.md`；用 analyzer 看誰進 bundle，勿部署前才發現。
- **誤解**：production build 仍含 `console`、source map 公開 — 洩漏路徑與邏輯；敏感邏輯不應靠 minify 藏。

### 本質三：環境變數 — build-time vs runtime

- **Build-time 注入**（`REACT_APP_*`、`NEXT_PUBLIC_*`）：值 **打进 client bundle**，等同公開 — 只放 API **base URL**、feature flag 等非秘密。
- **Secrets**：DB、簽名 key **只在 server**（Next API Route、BFF、CI `secrets.*`）— 見 `web/2-web-security-practices.md`。
- **多環境**：dev / staging / prod 各一套 URL 與 flag；staging 應 **類 prod**（HTTPS、同源策略），不是 dev API 換皮。
- **Runtime 配置**（可選）：`window.__CONFIG__` 或 edge 注入 — 同一 artifact 多環境時用；代價是啟動多一步、要防 XSS 改 config。

### 本質四：託管與 CDN

- **平台（Vercel / Netlify / Cloudflare Pages）**：git push → build → 邊緣；SPA 需 **fallback 到 index.html**；headers 在 `vercel.json` / `netlify.toml`。
- **自建 Nginx / Docker**：多階段 Dockerfile（builder → nginx:alpine）；gzip、security headers、`try_files` SPA fallback。
- **CDN**：靜態資源 **assetPrefix** / S3 sync；HTML 與 API **cache 策略分開** — 見 `web/5-http-cache原理.md`。
- **取捨**：平台省維運；自建/K8s 要管 TLS、擴展、健康檢查。

### 本質五：CI/CD 該長什麼樣

- **標準 job 鏈**：test（+ lint）→ build → deploy **staging**（develop）→ deploy **prod**（main，常 **manual approval**）。
- **Artifacts**：build 產物存 artifact / 映像 tag — deploy 拉 **同一包**，避免 prod 現場 rebuild 不一致。
- **閘門**：PR 跑 test；main 才 prod；E2E 可 nightly 或 pre-prod（見 `system-design/2-large-scale-web-app-testing方案.md`）。
- **Secrets**：只在 CI 注入，不寫進 repo；rotate 與 least privilege。

### 本質六：上線後 — 監控、驗證、回滾

- **Deploy 後**：煙霧測（首頁、login、關鍵 API）；可 curl `/health` 或對 **release version** 斷言。
- **RUM / 錯誤**：Sentry、Web Vitals（LCP 等見 `performance/1-LCP首屏加載怎麼優化.md`）— 比「能開首頁」更早發現 regression。
- **回滾**：保留 **上一版 artifact / 映像 tag**，一鍵切流量 — 不是 production 上 `git checkout` 再 build。
- **漸進發布**（進階）：canary / blue-green — 先小流量再全量。

### 常見陷阱

- **`index.html` 長 cache** — 使用者永遠載舊 JS，與新 API 不兼容。
- **SPA 未配 fallback** — 深連刷新 404。
- **把 secret 放 `NEXT_PUBLIC_`** — 任何人 DevTools 可見。
- **staging 與 prod 共用 DB / API key** — 測試污染或誤刪真資料。
- **無回滾包** — 只能 hotfix forward，MTTR 拉長。
- **SSR 當靜態丟 CDN** — 動態路由、API 全掛。

### 與其他筆記的關係

- **`web/5-http-cache原理.md`**：Cache-Control、immutable、協商緩存 — 部署 headers 的理論底。
- **`web/2-web-security-practices.md`**：CSP、HTTPS、headers — 部署層要配。
- **`performance/2-如何優化code-spliting.md`**：build 產物體積與 chunk 策略。
- **`next/4-app-router-vs-page-router.md`**：SSR / static / PPR 決定 **怎麼 deploy Next**。

### 小結

- **問題**：如何把 dev 程式變成穩定、快、可回滾的線上服務。
- **手段**：分清 SPA vs SSR 模型 → 可重現 build + hash 資源 → 環境與 secret 邊界 → CI/CD + CDN cache → 監控與 artifact 回滾。
- **結果**：使用者拿到對的版本與 cache；出問題能快退，而非現場救火 rebuild。
