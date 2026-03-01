## App Router vs Page Router 與 Cache 原理

### 什麼是 App Router 和 Page Router

**Page Router（Pages Router）**
- Next.js 13 之前的默認路由系統
- 基於文件系統的路由
- 使用 `pages/` 目錄

**App Router（App Router）**
- Next.js 13+ 引入的新路由系統
- 使用 `app/` 目錄
- 基於 React Server Components
- 支援更細粒度的數據獲取和緩存控制

### 目錄結構對比

#### Page Router 結構

```
pages/
  ├── index.js          → /
  ├── about.js          → /about
  ├── blog/
  │   ├── index.js      → /blog
  │   └── [id].js       → /blog/:id
  └── api/
      └── users.js      → /api/users
```

#### App Router 結構

```
app/
  ├── page.js           → /
  ├── layout.js         → 布局組件
  ├── about/
  │   └── page.js       → /about
  ├── blog/
  │   ├── page.js       → /blog
  │   ├── [id]/
  │   │   └── page.js   → /blog/:id
  │   └── layout.js     → /blog 布局
  └── api/
      └── users/
          └── route.js  → /api/users
```

### 核心差異

#### 1. 數據獲取方式

**Page Router：**

```jsx
// pages/blog/[id].js
export async function getStaticProps(context) {
  // SSG：構建時執行
  const post = await fetchPost(context.params.id);
  return {
    props: { post },
    revalidate: 60 // ISR：60 秒後重新生成
  };
}

export async function getServerSideProps(context) {
  // SSR：每次請求時執行
  const post = await fetchPost(context.params.id);
  return {
    props: { post }
  };
}

export default function BlogPost({ post }) {
  return <article>{post.content}</article>;
}
```

**App Router：**

```jsx
// app/blog/[id]/page.js
// Server Component（默認）
async function BlogPost({ params }) {
  // 直接在組件中 fetch，自動緩存
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    next: { revalidate: 60 } // ISR
  }).then(r => r.json());
  
  return <article>{post.content}</article>;
}

export default BlogPost;
```

**關鍵差異：**
- Page Router：需要 `getStaticProps` 或 `getServerSideProps`
- App Router：直接在 Server Component 中 fetch，更簡潔

#### 2. 布局系統

**Page Router：**

```jsx
// pages/_app.js
function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

// 所有頁面共享同一個布局
```

**App Router：**

```jsx
// app/layout.js（根布局）
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

// app/blog/layout.js（嵌套布局）
export default function BlogLayout({ children }) {
  return (
    <div>
      <BlogSidebar />
      {children}
    </div>
  );
}

// 支持嵌套布局，更靈活
```

#### 3. 加載狀態

**Page Router：**

```jsx
// 需要手動實現 loading 狀態
function BlogPost({ post }) {
  if (!post) return <div>Loading...</div>;
  return <article>{post.content}</article>;
}
```

**App Router：**

```jsx
// app/blog/[id]/loading.js
export default function Loading() {
  return <div>Loading post...</div>;
}

// 自動顯示，無需手動處理
```

#### 4. 錯誤處理

**Page Router：**

```jsx
// pages/_error.js
function Error({ statusCode }) {
  return <div>Error {statusCode}</div>;
}
```

**App Router：**

```jsx
// app/blog/[id]/error.js
'use client'; // Error Boundary 必須是 Client Component

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Cache 原理深度解析

Next.js 有**多層緩存系統**，App Router 和 Page Router 的緩存機制略有不同。

#### Next.js 緩存層級

```
┌─────────────────────────────────────┐
│  1. Request Memoization            │  ← 單次請求內緩存
│     (React.cache())                 │
├─────────────────────────────────────┤
│  2. Data Cache                     │  ← fetch() 緩存
│     (Full Route Cache)             │
├─────────────────────────────────────┤
│  3. Full Route Cache                │  ← 完整路由緩存
│     (RSC Payload Cache)             │
├─────────────────────────────────────┤
│  4. Router Cache                    │  ← 客戶端路由緩存
│     (Client-side Cache)            │
└─────────────────────────────────────┘
```

#### 1. Request Memoization（請求記憶化）

**作用：** 在單次請求中，相同的函數調用只執行一次。

**App Router：**

```jsx
// app/products/page.js
async function getProduct(id) {
  const res = await fetch(`https://api.example.com/products/${id}`);
  return res.json();
}

async function ProductPage() {
  // 即使被調用多次，也只會執行一次
  const product1 = await getProduct(1);
  const product2 = await getProduct(1); // 使用緩存
  const product3 = await getProduct(1); // 使用緩存
  
  return <div>{product1.name}</div>;
}
```

**手動使用 React.cache：**

```jsx
import { cache } from 'react';

const getProduct = cache(async (id) => {
  const res = await fetch(`https://api.example.com/products/${id}`);
  return res.json();
});

// 現在 getProduct 會被自動記憶化
```

**Page Router：**
- 不支援 Request Memoization
- 需要手動實現或使用第三方庫

#### 2. Data Cache（數據緩存）

**作用：** 緩存 `fetch()` 請求的結果。

**App Router：**

```jsx
// 默認行為：force-cache（永久緩存）
async function getData() {
  const res = await fetch('https://api.example.com/data');
  // 默認緩存，直到重新構建
  return res.json();
}

// 不緩存
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store' // 每次請求都重新獲取
  });
  return res.json();
}

// ISR：定時重新驗證
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 } // 60 秒後重新驗證
  });
  return res.json();
}

// 時間戳緩存
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600, tags: ['products'] }
  });
  return res.json();
}
```

**Page Router：**

```jsx
// 在 getStaticProps 中
export async function getStaticProps() {
  const res = await fetch('https://api.example.com/data', {
    // 構建時執行，結果被緩存
  });
  const data = await res.json();
  
  return {
    props: { data },
    revalidate: 60 // ISR
  };
}
```

**緩存選項對比：**

| 選項 | App Router | Page Router |
|------|-----------|-------------|
| `cache: 'force-cache'` | ✅ 默認 | ✅ getStaticProps |
| `cache: 'no-store'` | ✅ | ✅ getServerSideProps |
| `next: { revalidate: 60 }` | ✅ | ✅ revalidate |
| `next: { tags: [...] }` | ✅ | ❌ |

#### 3. Full Route Cache（完整路由緩存）

**作用：** 緩存整個路由的渲染結果。

**App Router：**

```jsx
// app/products/page.js
async function ProductsPage() {
  const products = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 }
  }).then(r => r.json());
  
  return (
    <div>
      {products.map(p => <Product key={p.id} product={p} />)}
    </div>
  );
}

// 如果所有數據都是靜態的（沒有動態函數），
// 整個頁面會在構建時預渲染並緩存
```

**緩存條件：**
- 使用 `fetch` 且沒有 `cache: 'no-store'`
- 沒有使用動態函數（`cookies()`, `headers()`, `searchParams`）
- 沒有使用 `dynamic = 'force-dynamic'`

**選擇性退出緩存：**

```jsx
// app/products/page.js
export const dynamic = 'force-dynamic'; // 強制動態渲染
// 或
export const revalidate = 0; // 不緩存

async function ProductsPage() {
  // 每次請求都會重新渲染
}
```

**Page Router：**

```jsx
// pages/products.js
export async function getStaticProps() {
  // 構建時執行，結果被緩存
  return { props: { data } };
}

// 或
export async function getServerSideProps() {
  // 每次請求都執行，不緩存
  return { props: { data } };
}
```

#### 4. Router Cache（路由緩存）

**作用：** 在客戶端緩存已訪問的路由，實現快速導航。

**工作原理：**

```jsx
用戶訪問 /products
1. 首次訪問：從伺服器獲取
2. 緩存到客戶端（Router Cache）
3. 再次訪問：直接從緩存讀取，無需請求伺服器

緩存時間：
- 靜態路由：永久（直到刷新）
- 動態路由：30 秒
- 使用 prefetch：5 分鐘
```

**App Router 和 Page Router 都支援，但行為略有不同：**

**App Router：**
- 更智能的預取策略
- 支持部分預渲染（Partial Prerendering）

**Page Router：**
- 傳統的預取策略
- 預取整個頁面

### 實際緩存範例

#### 範例一：混合緩存策略

```jsx
// app/dashboard/page.js
export const dynamic = 'force-dynamic'; // 不緩存頁面

async function Dashboard() {
  // 用戶數據：不緩存（每次請求都獲取最新）
  const user = await fetch('https://api.example.com/user', {
    cache: 'no-store'
  }).then(r => r.json());
  
  // 配置數據：緩存 1 小時
  const config = await fetch('https://api.example.com/config', {
    next: { revalidate: 3600 }
  }).then(r => r.json());
  
  // 統計數據：緩存 5 分鐘
  const stats = await fetch('https://api.example.com/stats', {
    next: { revalidate: 300 }
  }).then(r => r.json());
  
  return (
    <div>
      <UserProfile user={user} />
      <Config config={config} />
      <Stats stats={stats} />
    </div>
  );
}
```

#### 範例二：On-Demand Revalidation

```jsx
// app/api/revalidate/route.js
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request) {
  const { path, tag } = await request.json();
  
  // 方式一：重新驗證特定路徑
  revalidatePath(path);
  
  // 方式二：重新驗證特定標籤
  revalidateTag(tag);
  
  return Response.json({ revalidated: true });
}

// 使用
// POST /api/revalidate
// { "path": "/products" }
// 或
// { "tag": "products" }
```

**在數據更新時觸發：**

```jsx
// 當產品更新時
async function updateProduct(id, data) {
  await fetch(`https://api.example.com/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  
  // 重新驗證緩存
  await fetch('/api/revalidate', {
    method: 'POST',
    body: JSON.stringify({ path: `/products/${id}` })
  });
}
```

#### 範例三：使用 Cache Tags

```jsx
// app/products/page.js
async function ProductsPage() {
  const products = await fetch('https://api.example.com/products', {
    next: { tags: ['products'] } // 標記緩存
  }).then(r => r.json());
  
  return <ProductsList products={products} />;
}

// app/products/[id]/page.js
async function ProductPage({ params }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`, {
    next: { tags: ['products', `product-${params.id}`] }
  }).then(r => r.json());
  
  return <ProductDetail product={product} />;
}

// 重新驗證所有 products 相關的緩存
revalidateTag('products');
```

### 性能對比

#### App Router 優勢

1. **更細粒度的緩存控制**
   ```jsx
   // 可以為每個 fetch 設置不同的緩存策略
   const user = await fetch('/api/user', { cache: 'no-store' });
   const config = await fetch('/api/config', { next: { revalidate: 3600 } });
   ```

2. **Request Memoization**
   - 自動避免重複請求
   - 減少數據庫查詢

3. **部分預渲染（Partial Prerendering）**
   - 靜態部分預渲染
   - 動態部分按需渲染

4. **更好的開發體驗**
   - 更簡潔的 API
   - 更好的 TypeScript 支持

#### Page Router 優勢

1. **成熟穩定**
   - 已經過大量項目驗證
   - 生態系統完善

2. **更明確的數據獲取**
   - `getStaticProps` / `getServerSideProps` 明確區分
   - 更容易理解

3. **更好的文檔和資源**
   - 更多教程和範例
   - 社區支持更好

### 遷移策略

#### 從 Page Router 遷移到 App Router

```jsx
// Before: pages/blog/[id].js
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.id);
  return {
    props: { post },
    revalidate: 60
  };
}

export default function BlogPost({ post }) {
  return <article>{post.content}</article>;
}

// After: app/blog/[id]/page.js
async function BlogPost({ params }) {
  const post = await fetch(`/api/posts/${params.id}`, {
    next: { revalidate: 60 }
  }).then(r => r.json());
  
  return <article>{post.content}</article>;
}

export default BlogPost;
```

**注意事項：**
- 逐步遷移，可以同時使用兩種路由
- App Router 優先於 Page Router
- API Routes 需要遷移到 `route.js`

### 緩存最佳實踐

#### 1. 合理使用緩存策略

```jsx
// ✅ 用戶特定數據：不緩存
const user = await fetch('/api/user', { cache: 'no-store' });

// ✅ 公開數據：緩存
const products = await fetch('/api/products', {
  next: { revalidate: 3600 }
});

// ✅ 實時數據：短時間緩存
const prices = await fetch('/api/prices', {
  next: { revalidate: 60 }
});
```

#### 2. 使用 Cache Tags 管理相關數據

```jsx
// 所有產品相關的數據使用同一個 tag
fetch('/api/products', { next: { tags: ['products'] } });
fetch('/api/products/categories', { next: { tags: ['products'] } });

// 更新時一次性清除所有相關緩存
revalidateTag('products');
```

#### 3. 監控緩存命中率

```jsx
// 使用 headers 檢查緩存狀態
const res = await fetch('/api/data');
const cacheStatus = res.headers.get('x-cache-status');
// 'HIT' - 緩存命中
// 'MISS' - 緩存未命中
// 'STALE' - 緩存過期
```

### 總結

**App Router vs Page Router：**

| 特性 | App Router | Page Router |
|------|-----------|-------------|
| 數據獲取 | Server Component 中直接 fetch | getStaticProps/getServerSideProps |
| 緩存控制 | 更細粒度 | 頁面級別 |
| Request Memoization | ✅ 支援 | ❌ 不支援 |
| Cache Tags | ✅ 支援 | ❌ 不支援 |
| 布局系統 | 嵌套布局 | 單一布局 |
| 加載狀態 | 自動（loading.js） | 手動處理 |
| 錯誤處理 | 自動（error.js） | _error.js |

**緩存層級：**
1. Request Memoization - 單次請求內
2. Data Cache - fetch() 結果
3. Full Route Cache - 完整路由
4. Router Cache - 客戶端路由

**選擇建議：**
- **新項目**：使用 App Router（未來趨勢）
- **現有項目**：可以逐步遷移
- **需要細粒度緩存控制**：App Router
- **需要穩定性和成熟生態**：Page Router

理解這些緩存機制對於優化 Next.js 應用的性能至關重要。
