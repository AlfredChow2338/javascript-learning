## React Server Component 原理

### 什麼是 React Server Component

**React Server Component (RSC)** 是 React 18+ 引入的新特性，允許組件在服務器上運行，而不是在客戶端瀏覽器中運行。

**核心特點：**
- **服務器端執行**：組件代碼在服務器上運行
- **零客戶端包大小**：Server Component 的代碼不會被打包到客戶端 bundle
- **直接訪問後端資源**：可以直接訪問數據庫、文件系統等
- **自動代碼分割**：只下載需要的 Client Component

### 為什麼需要 Server Component

**傳統 Client Component 的問題：**
- 所有組件代碼都打包到客戶端，bundle 體積大
- 需要通過 API 獲取數據，增加延遲
- 無法直接訪問後端資源（數據庫、文件系統）

**Server Component 的優勢：**
- 減少客戶端 bundle 大小
- 直接訪問後端資源，減少 API 調用
- 更好的 SEO 和首屏性能
- 自動優化數據獲取

---

## 一、Server Component vs Client Component

### 對比

| 特性 | Server Component | Client Component |
|------|-----------------|-----------------|
| **執行位置** | 服務器 | 瀏覽器 |
| **Bundle 大小** | 0（不包含在客戶端） | 包含在客戶端 |
| **交互性** | ❌ 無（無事件處理） | ✅ 有（事件、狀態） |
| **Hooks** | ❌ 不支持 | ✅ 支持 |
| **數據獲取** | ✅ 直接訪問 | ❌ 需要 API |
| **SEO** | ✅ 服務器渲染 | ⚠️ 需要 SSR |

### 標記方式

```javascript
// Server Component（默認）
// app/components/ServerComponent.js
async function ServerComponent() {
  // 可以直接訪問數據庫
  const data = await fetch('https://api.example.com/data');
  const json = await data.json();
  
  return <div>{json.title}</div>;
}

// Client Component（需要 'use client' 指令）
// app/components/ClientComponent.js
'use client';

import { useState } from 'react';

function ClientComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

---

## 二、工作原理

### 2.1 渲染流程

```
┌─────────────────────────────────────┐
│        Server (Node.js)             │
│  ┌───────────────────────────────┐  │
│  │  Server Component             │  │
│  │  - 執行組件邏輯                 │  │
│  │  - 數據庫/API                  │  │
│  │  - Generate RSC Payload       │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   │ RSC Payload (序列化的組件樹)
                   ▼
┌─────────────────────────────────────┐
│        Client (Browser)             │
│  ┌───────────────────────────────┐  │
│  │  React Client                 │  │
│  │  - 接收到 RSC Payload          │  │
│  │  - 反序列化組件tree             │  │
│  │  - 渲染到 DOM                  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2.2 RSC Payload 格式

Server Component 渲染後，會生成一個序列化的組件樹（RSC Payload）：

```javascript
// Server Component 渲染結果
// 轉換為 RSC Payload（簡化版）
{
  "type": "div",
  "props": {
    "children": [
      {
        "type": "h1",
        "props": { "children": "Title" }
      },
      {
        "type": "ClientComponent",
        "props": { "count": 0 },
        "client": true // 標記為 Client Component
      }
    ]
  }
}
```

### 2.3 組件邊界

**關鍵概念：** Server Component 和 Client Component 之間有明確的邊界。

```javascript
// Server Component
async function ServerPage() {
  const data = await fetchData(); // 服務器端執行
  
  return (
    <div>
      <h1>{data.title}</h1>
      {/* Client Component 作為邊界 */}
      <ClientInteractiveComponent data={data} />
    </div>
  );
}

// Client Component
'use client';

function ClientInteractiveComponent({ data }) {
  const [count, setCount] = useState(0); // 客戶端執行
  
  return (
    <button onClick={() => setCount(count + 1)}>
      {data.title} - {count}
    </button>
  );
}
```

**規則：**
- Server Component 可以導入和使用 Client Component
- Client Component **不能**導入 Server Component
- 可以通過 props 將 Server Component 的數據傳遞給 Client Component

---

## 三、使用場景

### 3.1 數據獲取

```javascript
// Server Component：直接訪問數據庫
// app/components/UserList.js
async function UserList() {
  // 直接訪問數據庫，無需 API
  const users = await db.query('SELECT * FROM users');
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 3.2 靜態內容

```javascript
// Server Component：靜態內容
// app/components/Header.js
function Header() {
  return (
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>
  );
}
// 不包含在客戶端 bundle 中
```

### 3.3 組合使用

```javascript
// Server Component
// app/page.js
async function Page() {
  const posts = await fetchPosts();
  
  return (
    <div>
      <Header /> {/* Server Component */}
      <PostList posts={posts} /> {/* Server Component */}
      <LikeButton /> {/* Client Component */}
    </div>
  );
}

// Client Component
// app/components/LikeButton.js
'use client';

import { useState } from 'react';

function LikeButton() {
  const [liked, setLiked] = useState(false);
  
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '❤️' : '🤍'}
    </button>
  );
}
```

---

## 四、限制和注意事項

### 4.1 Server Component 的限制

**不能使用：**
- ❌ Hooks（useState、useEffect 等）
- ❌ 事件處理器（onClick、onChange 等）
- ❌ 瀏覽器 API（window、document 等）
- ❌ 狀態管理（Context、Redux 等）
- ❌ 動態導入（dynamic import）

**可以使用：**
- ✅ async/await
- ✅ 直接訪問數據庫
- ✅ 文件系統操作
- ✅ 環境變量
- ✅ 服務器端 API

### 4.2 Props 限制

**Server Component 傳遞給 Client Component 的 props：**
- ✅ 可序列化的數據（JSON 兼容）
- ❌ 函數（不能傳遞函數）
- ❌ 類實例
- ❌ Symbol

```javascript
// ❌ 錯誤：不能傳遞函數
function ServerComponent() {
  const handleClick = () => console.log('click');
  return <ClientComponent onClick={handleClick} />;
}

// ✅ 正確：傳遞數據
function ServerComponent() {
  const data = { title: 'Hello' };
  return <ClientComponent data={data} />;
}

// Client Component 內部處理事件
'use client';
function ClientComponent({ data }) {
  const handleClick = () => console.log('click');
  return <button onClick={handleClick}>{data.title}</button>;
}
```

### 4.3 導入規則

```javascript
// ❌ 錯誤：Client Component 不能導入 Server Component
'use client';

import { ServerComponent } from './ServerComponent'; // 錯誤！

function ClientComponent() {
  return <ServerComponent />;
}

// ✅ 正確：通過 props 傳遞 Server Component 的結果
'use client';

function ClientComponent({ serverData }) {
  return <div>{serverData}</div>;
}
```

---

## 五、實際應用範例

### 5.1 Next.js App Router 中的使用

```javascript
// app/page.js (Server Component)
async function HomePage() {
  // 服務器端數據獲取
  const products = await fetch('https://api.example.com/products')
    .then(res => res.json());
  
  return (
    <div>
      <h1>Products</h1>
      <ProductList products={products} />
      <CartButton /> {/* Client Component */}
    </div>
  );
}

// app/components/ProductList.js (Server Component)
function ProductList({ products }) {
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

// app/components/CartButton.js (Client Component)
'use client';

import { useState } from 'react';

function CartButton() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Cart ({count})
    </button>
  );
}
```

### 5.2 數據庫查詢

```javascript
// app/components/UserProfile.js (Server Component)
import { db } from '@/lib/db';

async function UserProfile({ userId }) {
  // 直接查詢數據庫
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { posts: true }
  });
  
  if (!user) {
    return <div>User not found</div>;
  }
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <PostList posts={user.posts} />
    </div>
  );
}
```

### 5.3 文件系統操作

```javascript
// app/components/MarkdownContent.js (Server Component)
import fs from 'fs/promises';
import { marked } from 'marked';

async function MarkdownContent({ filePath }) {
  // 直接讀取文件
  const content = await fs.readFile(filePath, 'utf-8');
  const html = marked(content);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}
```

---

## 六、性能優勢

### 6.1 Bundle 大小對比

```javascript
// 傳統方式：所有組件都在客戶端
// Bundle 大小：~500KB

// 使用 Server Component
// Server Component：0KB（不在客戶端）
// Client Component：~100KB（只有交互組件）
// 減少：80% bundle 大小
```

### 6.2 數據獲取對比

```javascript
// 傳統方式：客戶端獲取數據
// 1. 加載 HTML
// 2. 加載 JS bundle
// 3. 執行 JS
// 4. 發起 API 請求
// 5. 等待響應
// 6. 渲染數據
// 總時間：~2-3s

// Server Component：服務器端獲取數據
// 1. 服務器獲取數據
// 2. 服務器渲染組件
// 3. 發送 HTML + RSC Payload
// 4. 客戶端渲染
// 總時間：~0.5-1s
```

---

## 七、最佳實踐

### 7.1 組件劃分策略

```javascript
// ✅ 推薦：將交互邏輯提取到 Client Component
// Server Component：數據獲取和展示
async function ProductPage({ productId }) {
  const product = await getProduct(productId);
  
  return (
    <div>
      <ProductDetails product={product} />
      <AddToCartButton productId={productId} />
    </div>
  );
}

// Client Component：交互邏輯
'use client';

function AddToCartButton({ productId }) {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    await addToCart(productId);
    setLoading(false);
  };
  
  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

### 7.2 數據傳遞

```javascript
// ✅ 推薦：只傳遞需要的數據
async function ServerComponent() {
  const fullData = await fetchFullData();
  
  // 只傳遞 Client Component 需要的數據
  return (
    <ClientComponent 
      title={fullData.title}
      count={fullData.count}
      // 不傳遞不需要的數據
    />
  );
}
```

### 7.3 錯誤處理

```javascript
// Server Component 中的錯誤處理
async function ServerComponent() {
  try {
    const data = await fetchData();
    return <div>{data.title}</div>;
  } catch (error) {
    return <ErrorComponent error={error} />;
  }
}
```

---

## 八、與其他技術的對比

### 8.1 Server Component vs SSR

| 特性 | Server Component | SSR |
|------|-----------------|-----|
| **執行時機** | 每次請求 | 每次請求 |
| **Bundle 大小** | 0（不包含在客戶端） | 包含在客戶端 |
| **交互性** | 需要 Client Component | 需要 hydration |
| **數據獲取** | 組件內直接獲取 | 需要 getServerSideProps |

### 8.2 Server Component vs Static Generation

| 特性 | Server Component | Static Generation |
|------|-----------------|-------------------|
| **執行時機** | 每次請求 | 構建時 |
| **數據更新** | 實時 | 需要重新構建 |
| **適用場景** | 動態內容 | 靜態內容 |

---

## 九、常見問題

### Q1: Server Component 可以嵌套嗎？

**A:** 可以，Server Component 可以嵌套使用。

```javascript
// Server Component
async function Parent() {
  return <Child />;
}

// 也是 Server Component
async function Child() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### Q2: 可以在 Server Component 中使用 Context 嗎？

**A:** 不可以，Server Component 不支持 Context。如果需要共享狀態，使用 props 傳遞。

### Q3: Server Component 支持 Suspense 嗎？

**A:** 支持，可以使用 Suspense 處理異步 Server Component。

```javascript
import { Suspense } from 'react';

function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncServerComponent />
    </Suspense>
  );
}
```

---

## 總結

**React Server Component 核心要點：**

1. **服務器端執行**：組件在服務器上運行，減少客戶端 bundle
2. **零客戶端代碼**：Server Component 代碼不包含在客戶端 bundle
3. **直接數據訪問**：可以直接訪問數據庫、文件系統等
4. **明確邊界**：Server Component 和 Client Component 有明確的邊界

**使用建議：**
- 數據獲取和靜態內容使用 Server Component
- 交互邏輯使用 Client Component
- 通過 props 在兩者之間傳遞數據
- 只傳遞可序列化的數據

**優勢：**
- 減少 bundle 大小
- 提升首屏性能
- 更好的 SEO
- 簡化數據獲取

理解 Server Component 的原理和使用方法，可以幫助構建更高效、性能更好的 React 應用。
