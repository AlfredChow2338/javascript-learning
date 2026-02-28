## Web Security Best Practices

### 為什麼需要關注 Web Security

Web 應用面臨各種安全威脅：XSS、CSRF、SQL Injection、敏感數據洩漏等。作為開發者，我們需要在開發過程中就考慮安全性，而不是事後補救。

### 1. XSS (Cross-Site Scripting) 防護

XSS 是最常見的 Web 安全漏洞之一，攻擊者注入惡意腳本到網頁中。

#### 問題範例

```javascript
// ❌ 危險：直接渲染用戶輸入
function UserProfile({ username }) {
  return <div>{username}</div>; // 如果 username 是 '<script>alert("XSS")</script>'
}

// ❌ 危險：使用 dangerouslySetInnerHTML
function Comment({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
  // 如果 content 包含惡意腳本，會被執行
}
```

#### React 的內建防護

React 會自動轉義（escape）所有在 JSX 中渲染的內容：

```jsx
// ✅ 安全：React 自動轉義
function UserProfile({ username }) {
  // React 會將 <script> 轉義成 &lt;script&gt;
  return <div>{username}</div>; // 安全
}

// 即使 username 是 '<script>alert("XSS")</script>'
// React 會顯示為純文字，不會執行
```

#### 需要手動處理的情況

```jsx
// ⚠️ 如果必須使用 HTML，需要清理
import DOMPurify from 'dompurify';

function RichText({ htmlContent }) {
  // 使用 DOMPurify 清理 HTML
  const cleanHTML = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href']
  });
  
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}
```

#### Next.js 中的防護

```jsx
// Next.js 也自動轉義，但要注意 Server Components
// pages/user/[id].js
export default function UserPage({ user }) {
  // ✅ 安全：自動轉義
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}

// ⚠️ 如果從 API 獲取 HTML 內容
export default async function BlogPost({ params }) {
  const post = await fetchPost(params.id);
  
  // 需要清理
  const cleanContent = DOMPurify.sanitize(post.content);
  
  return <article dangerouslySetInnerHTML={{ __html: cleanContent }} />;
}
```

### 2. CSRF (Cross-Site Request Forgery) 防護

CSRF 攻擊利用用戶已登入的身份，在用戶不知情的情況下執行操作。

#### 問題範例

```html
<!-- 惡意網站 -->
<img src="https://bank.com/transfer?to=attacker&amount=1000" />
<!-- 如果用戶已登入 bank.com，這個請求會自動帶上 cookie -->
```

#### 防護方法

**1. CSRF Token**

```javascript
// Next.js API Route
// pages/api/transfer.js
export default async function handler(req, res) {
  // 驗證 CSRF token
  const token = req.headers['x-csrf-token'];
  const sessionToken = req.cookies['csrf-token'];
  
  if (token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  // 處理轉帳邏輯
  // ...
}
```

**2. SameSite Cookie**

```javascript
// Next.js 設定
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Set-Cookie',
            value: 'session=xxx; SameSite=Strict; Secure; HttpOnly'
          }
        ]
      }
    ];
  }
};
```

**3. 使用 Next.js 內建 CSRF 保護**

```javascript
// 使用 next-csrf
import csrf from 'next-csrf';

const { csrfToken } = csrf({
  secret: process.env.CSRF_SECRET
});

// API Route
export default async function handler(req, res) {
  await csrfToken(req, res);
  // 處理請求
}
```

### 3. 輸入驗證和清理

永遠不要信任用戶輸入，必須驗證和清理。

#### 客戶端驗證

```jsx
// ✅ 使用驗證庫
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(100),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
});

function SignupForm() {
  const [errors, setErrors] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const validated = userSchema.parse(data);
      // 發送到伺服器
    } catch (error) {
      setErrors(error.flatten().fieldErrors);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      {errors.email && <span>{errors.email}</span>}
      {/* ... */}
    </form>
  );
}
```

#### 伺服器端驗證（必須）

```javascript
// Next.js API Route
// pages/api/users.js
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(18)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // ✅ 伺服器端驗證
    const validated = createUserSchema.parse(req.body);
    
    // 處理邏輯
    const user = await createUser(validated);
    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### SQL Injection 防護

```javascript
// ❌ 危險：字符串拼接
const query = `SELECT * FROM users WHERE id = ${userId}`;
// 如果 userId 是 "1 OR 1=1"，會返回所有用戶

// ✅ 安全：使用參數化查詢
const query = 'SELECT * FROM users WHERE id = ?';
const result = await db.query(query, [userId]);

// 或使用 ORM（如 Prisma）
const user = await prisma.user.findUnique({
  where: { id: userId }
});
```

### 4. 認證和授權

#### JWT 安全實踐

```javascript
// ❌ 危險：將 JWT 存在 localStorage
localStorage.setItem('token', jwt);
// XSS 攻擊可以讀取 localStorage

// ✅ 安全：使用 HttpOnly Cookie
// pages/api/login.js
export default async function handler(req, res) {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);
  
  if (user) {
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    // 設置 HttpOnly Cookie
    res.setHeader('Set-Cookie', [
      `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
    ]);
    
    return res.status(200).json({ success: true });
  }
  
  return res.status(401).json({ error: 'Invalid credentials' });
}
```

#### 授權檢查

```javascript
// Next.js Middleware
// middleware.js
import { verify } from 'jsonwebtoken';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return Response.redirect(new URL('/login', request.url));
  }
  
  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    // 將用戶信息添加到請求頭
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  } catch (error) {
    return Response.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/api/protected/:path*', '/dashboard/:path*']
};
```

#### 角色基礎訪問控制（RBAC）

```javascript
// utils/auth.js
export function checkPermission(user, requiredRole) {
  const roleHierarchy = {
    admin: 3,
    moderator: 2,
    user: 1
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

// API Route
// pages/api/admin/users.js
export default async function handler(req, res) {
  const user = await getUserFromToken(req);
  
  if (!checkPermission(user, 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // 管理員操作
  const users = await getAllUsers();
  return res.json(users);
}
```

### 5. 敏感數據處理

#### 環境變數

```javascript
// ❌ 危險：將敏感信息提交到 Git
const API_KEY = 'sk-1234567890abcdef';
const DB_PASSWORD = 'password123';

// ✅ 安全：使用環境變數
// .env.local（不要提交到 Git）
API_KEY=sk-1234567890abcdef
DB_PASSWORD=password123

// next.config.js
module.exports = {
  env: {
    API_KEY: process.env.API_KEY
  }
};

// 使用
const apiKey = process.env.API_KEY;
```

#### 不要在客戶端暴露敏感信息

```jsx
// ❌ 危險：在客戶端組件中暴露 API key
'use client';

export default function ApiComponent() {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY; // 會被打包到客戶端
  // 任何人都可以在瀏覽器中看到這個 key
}

// ✅ 安全：使用 Server Component 或 API Route
// app/api/proxy.js
export default async function handler(req, res) {
  const apiKey = process.env.API_KEY; // 只在伺服器端
  const response = await fetch('https://api.example.com/data', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await response.json();
  return res.json(data);
}
```

#### 密碼處理

```javascript
// ❌ 危險：明文存儲密碼
await db.users.create({
  email: 'user@example.com',
  password: 'plaintext-password' // 絕對不要這樣做
});

// ✅ 安全：使用 bcrypt 哈希
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 10);

await db.users.create({
  email: 'user@example.com',
  password: hashedPassword
});

// 驗證
const isValid = await bcrypt.compare(inputPassword, user.password);
```

### 6. Content Security Policy (CSP)

CSP 可以防止 XSS 攻擊，限制資源載入來源。

#### Next.js 中設定 CSP

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 開發環境
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://api.example.com",
              "frame-ancestors 'none'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};
```

#### CSP 配置詳細解釋

**1. `default-src 'self'`**
- **作用**：為所有未明確指定的資源類型設定預設來源
- **`'self'`**：只允許從同源（same origin）載入資源
- **範例**：如果沒有指定 `font-src`，字體會使用這個預設值，只能從同源載入

**2. `script-src 'self' 'unsafe-eval' 'unsafe-inline'`**
- **`'self'`**：允許執行同源的 JavaScript 文件
- **`'unsafe-eval'`**：允許使用 `eval()`、`new Function()`、`setTimeout('code')` 等動態執行代碼
  - ⚠️ **安全風險**：XSS 攻擊者可能利用這個漏洞執行惡意代碼
  - **為什麼需要**：Next.js 開發環境和某些框架需要 eval（如 webpack 的開發模式）
  - **生產環境建議**：移除 `'unsafe-eval'`，使用 nonce 或 hash 代替
- **`'unsafe-inline'`**：允許內聯 `<script>` 標籤和 `onclick` 等事件處理器
  - ⚠️ **安全風險**：允許內聯腳本會降低 XSS 防護效果
  - **為什麼需要**：某些第三方庫或開發工具需要內聯腳本
  - **更好的做法**：使用 `'nonce-{random}'` 或 `'sha256-{hash}'` 來允許特定的內聯腳本

**實際影響：**
```html
<!-- ✅ 允許：同源腳本 -->
<script src="/static/js/app.js"></script>

<!-- ❌ 阻止：外部腳本 -->
<script src="https://evil.com/malicious.js"></script>

<!-- ⚠️ 允許（因為 unsafe-inline）：內聯腳本 -->
<script>alert('XSS')</script> <!-- 這會被執行，有安全風險 -->
```

**3. `style-src 'self' 'unsafe-inline'`**
- **`'self'`**：允許載入同源的 CSS 文件
- **`'unsafe-inline'`**：允許內聯 `<style>` 標籤和 `style` 屬性
  - **為什麼需要**：React 和許多 CSS-in-JS 庫會生成內聯樣式
  - **安全考慮**：內聯樣式相對安全，但最好使用 nonce

**實際影響：**
```html
<!-- ✅ 允許：同源樣式表 -->
<link rel="stylesheet" href="/static/css/app.css">

<!-- ❌ 阻止：外部樣式表 -->
<link rel="stylesheet" href="https://evil.com/style.css">

<!-- ✅ 允許：內聯樣式 -->
<div style="color: red;">Content</div>
```

**4. `img-src 'self' data: https:`**
- **`'self'`**：允許載入同源圖片
- **`data:`**：允許使用 data URI（如 `data:image/png;base64,...`）
  - **用途**：內嵌圖片、圖標等
- **`https:`**：允許從任何 HTTPS 來源載入圖片
  - ⚠️ **安全考慮**：範圍較廣，建議限制到特定域名，如 `https://cdn.example.com`

**實際影響：**
```html
<!-- ✅ 允許：同源圖片 -->
<img src="/images/logo.png">

<!-- ✅ 允許：data URI -->
<img src="data:image/png;base64,iVBORw0KG...">

<!-- ✅ 允許：HTTPS 圖片 -->
<img src="https://cdn.example.com/image.jpg">

<!-- ❌ 阻止：HTTP 圖片 -->
<img src="http://example.com/image.jpg">
```

**5. `font-src 'self'`**
- **作用**：只允許從同源載入字體文件
- **用途**：防止從惡意來源載入字體文件

**實際影響：**
```css
/* ✅ 允許：同源字體 */
@font-face {
  font-family: 'Custom';
  src: url('/fonts/custom.woff2');
}

/* ❌ 阻止：外部字體 */
@font-face {
  font-family: 'Custom';
  src: url('https://evil.com/font.woff2');
}
```

**6. `connect-src 'self' https://api.example.com`**
- **作用**：限制可以發送請求的目標（fetch、XMLHttpRequest、WebSocket 等）
- **`'self'`**：允許向同源發送請求
- **`https://api.example.com`**：允許向指定的 API 端點發送請求
  - **安全好處**：防止惡意腳本將數據發送到攻擊者的伺服器

**實際影響：**
```javascript
// ✅ 允許：同源請求
fetch('/api/users')

// ✅ 允許：指定的 API
fetch('https://api.example.com/data')

// ❌ 阻止：其他外部請求
fetch('https://evil.com/steal-data') // 會被阻止

// ❌ 阻止：WebSocket 連接到未授權的伺服器
const ws = new WebSocket('wss://evil.com') // 會被阻止
```

**7. `frame-ancestors 'none'`**
- **作用**：防止頁面被嵌入到 `<iframe>` 中
- **`'none'`**：不允許任何網站嵌入此頁面
- **安全好處**：防止點擊劫持（Clickjacking）攻擊
  - 攻擊者無法將你的頁面嵌入到他們的網站中，誘騙用戶點擊

**實際影響：**
```html
<!-- ❌ 阻止：其他網站無法嵌入 -->
<iframe src="https://yoursite.com"></iframe>
<!-- 瀏覽器會阻止載入 -->

<!-- 如果需要允許特定網站嵌入 -->
// frame-ancestors 'self' https://trusted-partner.com
```

#### 生產環境的改進建議

```javascript
// next.config.js - 生產環境配置
module.exports = {
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 生產環境移除 unsafe-eval
              isDev 
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
                : "script-src 'self' 'nonce-{NONCE}'", // 使用 nonce
              "style-src 'self' 'unsafe-inline'",
              // 限制圖片來源到特定 CDN
              "img-src 'self' data: https://cdn.example.com",
              "font-src 'self'",
              "connect-src 'self' https://api.example.com",
              "frame-ancestors 'none'",
              // 額外的安全標頭
              "base-uri 'self'", // 限制 <base> 標籤
              "form-action 'self'", // 限制表單提交目標
              "upgrade-insecure-requests" // 自動將 HTTP 升級為 HTTPS
            ].join('; ')
          }
        ]
      }
    ];
  }
};
```

#### CSP 報告（可選）

可以設定 CSP 報告來監控違規行為：

```javascript
"Content-Security-Policy-Report-Only": [
  "default-src 'self'",
  "report-uri /api/csp-report" // 發送違規報告到這個端點
].join('; ')
```

這樣可以測試 CSP 配置，而不會實際阻止資源載入。

#### React 中的 CSP

```jsx
// 使用 nonce 來允許特定腳本
// _document.js (Pages Router) 或 layout.js (App Router)
export default function Document() {
  const nonce = generateNonce(); // 每次請求生成新的 nonce
  
  return (
    <Html>
      <Head>
        <meta httpEquiv="Content-Security-Policy" 
              content={`script-src 'self' 'nonce-${nonce}'`} />
      </Head>
      <body>
        <Main />
        <NextScript nonce={nonce} />
      </body>
    </Html>
  );
}
```

### 7. 依賴管理

#### 定期更新依賴

```bash
# 檢查過時的依賴
npm outdated

# 使用 npm audit 檢查安全漏洞
npm audit

# 自動修復
npm audit fix

# 使用 Dependabot 或 Renovate 自動更新
```

#### 鎖定依賴版本

```json
// package.json
{
  "dependencies": {
    "react": "^18.2.0", // 允許 patch 和 minor 更新
    "lodash": "4.17.21" // 鎖定版本，更安全
  }
}

// package-lock.json 應該提交到 Git
// 確保團隊使用相同版本
```

#### 審查依賴

```javascript
// 檢查依賴的許可證
npm ls --depth=0

// 使用工具檢查依賴
// - Snyk
// - npm audit
// - OWASP Dependency-Check
```

### 8. React 特定安全實踐

#### 安全地處理 URL

```jsx
// ❌ 危險：直接使用用戶輸入的 URL
function Link({ href, children }) {
  return <a href={href}>{children}</a>;
  // 如果 href 是 "javascript:alert('XSS')"，會執行腳本
}

// ✅ 安全：驗證和清理 URL
function Link({ href, children }) {
  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };
  
  const safeHref = isValidUrl(href) ? href : '#';
  
  return <a href={safeHref}>{children}</a>;
}
```

### 9. Next.js 特定安全實踐

#### API Route 安全

```javascript
// pages/api/data.js
export default async function handler(req, res) {
  // ✅ 驗證 HTTP 方法
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // ✅ 驗證認證
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // ✅ 驗證輸入
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }
  
  // ✅ 限制速率（使用 next-rate-limit）
  // ...
  
  // 處理邏輯
  const data = await getData(id);
  return res.json(data);
}
```

#### 中間件安全

```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // ✅ 設定安全標頭
  const response = NextResponse.next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // ✅ 驗證請求來源
  const origin = request.headers.get('origin');
  const allowedOrigins = ['https://example.com'];
  
  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  
  return response;
}
```

#### 圖片安全

```jsx
// ✅ 使用 next/image，自動優化和安全處理
import Image from 'next/image';

function UserAvatar({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={100}
      height={100}
      // 限制允許的域名
      loader={({ src }) => {
        if (!src.startsWith('https://cdn.example.com/')) {
          return '/default-avatar.png';
        }
        return src;
      }}
    />
  );
}
```

### 10. 其他安全實踐

#### HTTPS 強制

```javascript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http'
          }
        ],
        destination: 'https://example.com/:path*',
        permanent: true
      }
    ];
  }
};
```

#### 速率限制

```javascript
// 使用 next-rate-limit
import rateLimit from 'next-rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 分鐘
  uniqueTokenPerInterval: 500 // 每個 IP 最多 500 個請求
});

// pages/api/login.js
export default async function handler(req, res) {
  try {
    await limiter.check(res, 10, 'LOGIN_TOKEN'); // 每分鐘 10 次
  } catch {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // 處理登入
}
```

#### 日誌和監控

```javascript
// utils/logger.js
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['password', 'token', 'apiKey'] // 不記錄敏感信息
});

// 記錄安全事件
logger.warn({
  event: 'failed_login',
  ip: req.ip,
  email: req.body.email
}, 'Failed login attempt');
```

### 11. 安全檢查清單

**開發階段：**
- [ ] 所有用戶輸入都經過驗證和清理
- [ ] 使用參數化查詢防止 SQL Injection
- [ ] 敏感信息使用環境變數
- [ ] 密碼使用 bcrypt 哈希
- [ ] JWT 使用 HttpOnly Cookie
- [ ] 實作 CSRF 保護
- [ ] 設定 CSP 標頭
- [ ] API 端點有認證和授權檢查

**部署階段：**
- [ ] 使用 HTTPS
- [ ] 設定安全標頭（CSP、HSTS、X-Frame-Options 等）
- [ ] 啟用速率限制
- [ ] 設定日誌和監控
- [ ] 定期更新依賴
- [ ] 進行安全審計

**持續維護：**
- [ ] 定期檢查 npm audit
- [ ] 監控異常登入和請求
- [ ] 定期更新依賴
- [ ] 進行滲透測試

### 總結

Web 安全是一個持續的過程，不是一次性的工作。關鍵原則：

1. **永遠不要信任用戶輸入** - 驗證、清理、轉義
2. **最小權限原則** - 只給予必要的權限
3. **深度防禦** - 多層安全措施
4. **保持更新** - 定期更新依賴和框架
5. **監控和日誌** - 及時發現安全問題

記住：安全不是功能，而是基礎設施。在開發的每個階段都要考慮安全性。
