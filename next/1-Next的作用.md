## Next.js 的作用

### 1. 為什麼已經有 React Server Component 還需要 Next.js？

React Server Component（RSC）只是**渲染機制**，不是完整的框架。RSC 解決了「在伺服器端渲染組件」的問題，但 Next.js 提供了**完整的生產環境解決方案**。

**RSC 只解決了什麼：**
- 在伺服器端執行組件邏輯
- 減少客戶端 bundle 大小
- 直接存取資料庫和檔案系統

**RSC 沒有解決的（Next.js 提供）：**
- 路由系統（file-based routing）
- 構建和打包優化（webpack/turbopack）
- 圖片優化（next/image）
- API Routes（後端 API 端點）
- 中間件（middleware）和請求攔截
- 部署配置（Vercel、Docker 等）
- 開發體驗（熱重載、錯誤處理）

簡單來說，RSC 是「引擎」，Next.js 是「整台車」。你可以用純 React + RSC 自己組裝，但 Next.js 已經把所有東西都整合好了。

### 2. Next.js 的用途和 Value Added

**核心用途：**

**全端框架（Full-Stack Framework）**
Next.js 不只是前端框架，它整合了前端、後端、部署，讓你可以用一個框架完成整個應用。

```jsx
// pages/api/users.js - 後端 API
export default function handler(req, res) {
  res.status(200).json({ users: [...] })
}

// pages/users.js - 前端頁面
export default function Users({ users }) {
  return <div>{users.map(...)}</div>
}
```

**多種渲染策略**
- **SSG（Static Site Generation）**：構建時生成靜態 HTML
- **SSR（Server-Side Rendering）**：每次請求時生成 HTML
- **ISR（Incremental Static Regeneration）**：靜態頁面 + 定時更新
- **CSR（Client-Side Rendering）**：傳統 SPA 模式
- **混合模式**：不同頁面用不同策略

**Value Added：**

1. **零配置開發**：開箱即用的 TypeScript、ESLint、PostCSS、Sass 支援
2. **自動代碼分割**：每個頁面自動分割，只載入需要的代碼
3. **圖片優化**：`next/image` 自動處理 WebP、AVIF、懶加載、響應式圖片
4. **內建效能優化**：Font optimization、Script optimization、Bundle analyzer
5. **開發體驗**：Fast Refresh、錯誤邊界、清晰的錯誤訊息
6. **生產就緒**：一鍵部署到 Vercel，或支援 Docker、Kubernetes

### 3. Next.js 使用的情景

**適合使用 Next.js 的情況：**

**1. 需要 SEO 的網站**
電商、部落格、新聞網站等需要被搜尋引擎索引的內容網站。SSR/SSG 讓爬蟲能直接讀取 HTML。

**2. 需要快速首屏載入**
Marketing 網站、Landing page。SSG 生成的靜態 HTML 載入極快，不需要等待 JavaScript。

**3. 混合應用（Hybrid App）**
部分頁面需要 SSR（如產品頁），部分頁面可以是 CSR（如儀表板）。Next.js 讓你可以按頁面選擇策略。

**4. 全端應用**
需要前端 + 後端 API 的應用。Next.js API Routes 讓你在同一個專案中處理前後端邏輯。

**5. 需要國際化（i18n）**
多語言網站。Next.js 內建 i18n 路由支援，輕鬆實現 `/en/about`、`/zh/about`。

**6. 需要增量更新**
CMS 驅動的網站。ISR 讓你可以定期更新靜態頁面，不需要重新構建整個網站。

**不適合的情況：**
- 純 SPA，不需要 SSR/SSG
- 非常簡單的靜態網站（用 Gatsby、Astro 可能更簡單）
- 需要完全自定義構建流程的專案

### 4. Next.js 比 Pure React 的優勢

**1. 路由系統**

**Pure React：**
```jsx
// 需要安裝 react-router-dom，手動配置
import { BrowserRouter, Routes, Route } from 'react-router-dom'

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Routes>
</BrowserRouter>
```

**Next.js：**
```jsx
// File-based routing，自動生成路由
// pages/index.js → /
// pages/about.js → /about
// 不需要配置
```

**2. 資料獲取**

**Pure React：**
```jsx
// 需要 useEffect + fetch，處理 loading、error
function Page() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
  }, [])
  
  if (loading) return <div>Loading...</div>
  return <div>{data}</div>
}
```

**Next.js：**
```jsx
// Server Component，直接 fetch，無需狀態管理
async function Page() {
  const data = await fetch('/api/data').then(r => r.json())
  return <div>{data}</div>
}
```

**3. 圖片處理**

**Pure React：**
```jsx
// 需要手動優化、懶加載、響應式
<img 
  src="/image.jpg" 
  loading="lazy"
  style={{ width: '100%', height: 'auto' }}
/>
```

**Next.js：**
```jsx
// 自動優化、格式轉換、懶加載
import Image from 'next/image'

<Image 
  src="/image.jpg" 
  width={800} 
  height={600}
  alt="Description"
/>
```

**4. 構建和部署**

**Pure React：**
- 需要配置 webpack/vite
- 需要設定環境變數
- 需要配置部署腳本
- 需要處理路由的 fallback（SPA）

**Next.js：**
- 零配置構建
- 內建環境變數支援
- 一鍵部署（Vercel）
- 自動處理所有路由情況

**5. 效能優化**

**Pure React：**
- 需要手動代碼分割（React.lazy）
- 需要手動優化 bundle
- 需要自己實現 SSR（複雜）

**Next.js：**
- 自動代碼分割（每個頁面）
- 自動 bundle 優化
- 內建 SSR/SSG/ISR

**6. 開發體驗**

**Pure React：**
- 需要配置開發伺服器
- 需要設定熱重載
- 錯誤訊息可能不夠清晰

**Next.js：**
- 開箱即用的開發伺服器
- Fast Refresh（保留狀態的熱重載）
- 清晰的錯誤頁面和堆疊追蹤

**總結**

Next.js 不是 React 的替代品，而是 React 的**生產環境框架**。它把 React 開發中常見的配置、優化、部署問題都解決了，讓開發者專注在業務邏輯上。如果你需要 SEO、快速載入、全端開發，Next.js 是比 Pure React 更好的選擇。
