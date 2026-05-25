# Web Security Best Practices

Web 安全不是上線前加一層 middleware 就完成的功能，而是**每一層都假設上一層可能失效**：輸入可能被偽造、腳本可能被注入、Cookie 可能被跨站帶走。取捨方向是**深度防禦 + 最小權限 + 伺服器端為準**。

### 本質一：不信任任何外部輸入

- **問題**：所有來自瀏覽器、URL、header、第三方 API 的資料都可被篡改。
- **客戶端驗證**：只改善 UX，**不能**當安全邊界 — 攻擊者可直接打 API。
- **伺服器端驗證**：型別、長度、格式、業務規則必須在 API / Server Action 重做一遍（如 zod schema）。
- **SQL Injection**：字串拼接 SQL 時，惡意輸入可改寫查詢；**參數化查詢或 ORM** 把資料與指令分離。
- **誤解後果**：只在前端擋非法 email，後端仍可能被注入、越權、刷接口。

### 本質二：XSS — 控制「頁面裡能執行什麼」

- **問題**：攻擊者把惡意 script 混進你渲染的 HTML / URL，在受害者瀏覽器、**同一個 origin** 下執行 — 可讀 Cookie（非 HttpOnly）、發請求、改 DOM。
- **React 預設**：JSX `{value}` 會 escape，`<script>` 變純文字 — 安全。
- **主動破防點**：
  - `dangerouslySetInnerHTML` — 必須先用 **DOMPurify** 等 sanitizer 白名單清理。
  - 用戶控制的 `href` — 拒絕 `javascript:` 等非 http(s) scheme。
- **誤解後果**：以為「用了 React 就不會 XSS」；富文本、第三方 widget、Server 回傳 HTML 仍可能中招。

### 本質三：CSRF — 借使用者的登入態代為操作

- **問題**：使用者已登入 `bank.com`，Cookie 會隨請求自動帶上；惡意頁面可用 `<img>`、`<form>` 觸發**使用者無感**的 state-changing 請求。
- **機制**：Same-Origin Policy 擋的是**讀回應**，不擋**帶 Cookie 發請求**。
- **手段**（可疊加）：
  - **SameSite Cookie**（`Strict` / `Lax`）— 限制跨站請求是否附帶 Cookie。
  - **CSRF Token** — 非 GET 的變更操作要求 header / body 帶與 session 綁定的 token。
  - **自訂 header**（如 `Authorization: Bearer`）— 簡單表單無法設定，可輔助防 CSRF（Cookie 認證仍需 SameSite + token）。
- **誤解後果**：只靠 CORS — CORS 是瀏覽器保護**讀取**，不是 CSRF 的完整解法。

### 本質四：認證 vs 授權

- **認證（Authentication）**：你是誰 — 登入、token 驗證。
- **授權（Authorization）**：你能做什麼 — 每個受保護 API 都要查角色 / 資源歸屬，不能只在 UI 藏按鈕。
- **Token 存放**：
  - `localStorage` 的 JWT — **XSS 可讀**，等同把鑰匙放在攻擊者能觸及的地方。
  - **HttpOnly + Secure + SameSite** Cookie — JS 讀不到，適合 session / refresh token。
- **RBAC**：在 API 層比對 role / permission，middleware 只做第一道門。
- **誤解後果**：「有登入就安全」— 普通用戶仍可呼叫 admin API，若後端未驗授權。

### 本質五：秘密與敏感資料的邊界

- **伺服器專用**：DB 密碼、API key、JWT secret 只存在 server env（`.env.local` 不進 Git）。
- **客戶端可見**：Next.js 的 `NEXT_PUBLIC_*` 會被打包進 bundle — **不是秘密**。
- **第三方 API**：由 **API Route / Server Component** 代為請求，key 不暴露給瀏覽器。
- **密碼**：只存 **bcrypt** 等慢哈希；絕不明文、不用可逆加密當密碼儲存。
- **日誌**：redact `password`、`token`、`apiKey`，避免洩漏寫進 log aggregator。

### 本質六：CSP — 瀏覽器層的資源白名單

- **問題**：就算 XSS 注入成功，CSP 仍限制 script、style、fetch、iframe 的**來源**，縮小損害面。
- **核心指令**（記取捨，非背字典）：
  - `default-src 'self'` — 未列出的資源類型預設同源。
  - `script-src` — 生產環境避免 `'unsafe-eval'` / `'unsafe-inline'`；改用 **nonce** 或 hash 放行特定 inline script。
  - `connect-src` — 限制 `fetch` / WebSocket 目標，防資料外送。
  - `frame-ancestors 'none'` — 防 **Clickjacking**（頁面被 iframe 嵌入誘導點擊）。
- **漸進導入**：先用 `Content-Security-Policy-Report-Only` + `report-uri` 觀察違規，再切 enforce。
- **與 XSS 的關係**：CSP 是**第二道防線**；不能取代 escape / sanitize。

### 本質七：傳輸、標頭、速率與供應鏈

- **HTTPS**：全站強制；Cookie 設 `Secure`；可配 HSTS。
- **安全標頭**（middleware / `next.config` headers）：
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`（或靠 CSP `frame-ancestors`）
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **速率限制**：登入、註冊、重設密碼等端點防暴力破解與濫用。
- **依賴**：`npm audit`、鎖定 `package-lock.json`、Dependabot / Renovate — 漏洞常在**間接依賴**。
- **監控**：異常登入、401/403  spike、CSP 違規報告 — 安全是持續過程，不是 checklist 打勾一次。

### React / Next.js 邊界

- **React**：預設 escape；富文本、URL、`dangerouslySetInnerHTML` 是主要例外。
- **Next.js API Route**：驗 HTTP method → 認證 → 授權 → 驗輸入 → 業務邏輯；變更操作防 CSRF。
- **Middleware**：集中設安全標頭、路由保護；敏感邏輯仍要在 API 內再驗一次。
- **圖片**：`next/image` 的 `remotePatterns` 限制允許域名，避免任意 URL 載入。

### 與認證流程筆記的關係

- 本篇是**威脅模型與防線分工**；Access / Refresh Token 輪換、登出撤銷等完整流程見 `system-design/3-如何設計安全的用戶登入認證流程.md`。
- 分工：該篇講「怎麼設計登入」；本篇講「XSS / CSRF / CSP / 輸入驗證各自擋哪一類風險」。

### 小結

- **問題**：瀏覽器會執行你渲染的內容、自動帶 Cookie、且客戶端完全不可信。
- **手段**：伺服器驗證 + escape/sanitize + SameSite/CSRF token + HttpOnly Cookie + CSP + HTTPS + 依賴與日誌。
- **結果**：單點失效不會整站淪陷；安全隨功能迭代持續維護，而非一次性上線項目。
