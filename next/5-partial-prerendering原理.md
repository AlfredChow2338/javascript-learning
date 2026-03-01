## Partial Prerendering（部分預渲染）原理

### 背景和問題

#### 傳統渲染策略的困境

在 Next.js 中，我們面臨一個經典的**兩難選擇**：

**SSG（Static Site Generation）的問題：**
```jsx
// 所有內容都在構建時生成
export async function getStaticProps() {
  const data = await fetchData();
  return { props: { data } };
}

// ❌ 問題：
// 1. 用戶特定內容無法預渲染（如個人資料）
// 2. 實時數據無法預渲染（如庫存、價格）
// 3. 必須選擇：要麼全靜態，要麼全動態
```

**SSR（Server-Side Rendering）的問題：**
```jsx
// 每次請求都重新渲染
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

// ❌ 問題：
// 1. 響應時間慢（需要等待數據獲取）
// 2. 伺服器負載高（每次請求都要渲染）
// 3. 無法利用 CDN 緩存
```

**實際場景：**

```jsx
// 一個典型的電商產品頁面
function ProductPage() {
  return (
    <div>
      {/* 靜態部分：可以預渲染 */}
      <Header />           {/* 導航欄 - 不變 */}
      <ProductImages />   {/* 產品圖片 - 不變 */}
      <ProductDescription /> {/* 產品描述 - 不變 */}
      
      {/* 動態部分：需要實時數據 */}
      <StockStatus />      {/* 庫存狀態 - 實時變化 */}
      <Price />            {/* 價格 - 可能變化 */}
      <UserRecommendations /> {/* 個人推薦 - 用戶特定 */}
    </div>
  );
}

// 傳統方案：
// 方案 A：全部 SSG → 動態內容無法更新
// 方案 B：全部 SSR → 靜態內容也要重新渲染，浪費資源
```

### 什麼是 Partial Prerendering（PPR）

**定義：** Partial Prerendering 是一種混合渲染策略，允許在同一個頁面中**同時使用靜態預渲染和動態渲染**。

**核心思想：**
- **靜態部分**：在構建時預渲染，緩存到 CDN
- **動態部分**：在請求時按需渲染，使用 Suspense 邊界

**優勢：**
- ✅ 結合 SSG 的速度和 SSR 的靈活性
- ✅ 減少伺服器負載（只渲染動態部分）
- ✅ 提升首屏載入速度（靜態部分從 CDN 載入）
- ✅ 支援用戶特定和實時數據

### 工作原理

#### 基本架構

```
┌─────────────────────────────────────────┐
│        構建時 (Build Time)               │
│  ┌───────────────────────────────────┐  │
│  │  預渲染static                      │  │
│  │  - Header                         │  │
│  │  - Product Images                 │  │
│  │  - Product Description            │  │
│  │  → Static HTML                    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        請求時 (Request Time)             │
│  ┌───────────────────────────────────┐  │
│  │  1. 載入預渲染的static HTML         │  │
│  │  2. Identify suspense boundary    │  │
│  │  3. on-demand渲染動態部分           │  │
│  │     - StockStatus                 │  │
│  │     - Price                       │  │
│  │     - UserRecommendations         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### 實現機制

**1. Suspense 邊界識別**

```jsx
// app/products/[id]/page.js
import { Suspense } from 'react';

export default function ProductPage({ params }) {
  return (
    <div>
      {/* 靜態部分：預渲染 */}
      <Header />
      <ProductImages productId={params.id} />
      <ProductDescription productId={params.id} />
      
      {/* 動態部分：使用 Suspense */}
      <Suspense fallback={<StockSkeleton />}>
        <StockStatus productId={params.id} />
      </Suspense>
      
      <Suspense fallback={<PriceSkeleton />}>
        <Price productId={params.id} />
      </Suspense>
      
      <Suspense fallback={<RecommendationsSkeleton />}>
        <UserRecommendations productId={params.id} />
      </Suspense>
    </div>
  );
}
```

**2. 靜態和動態組件分離**

```jsx
// 靜態組件：可以預渲染
async function ProductImages({ productId }) {
  // 使用緩存的 fetch
  const product = await fetch(`https://api.example.com/products/${productId}`, {
    next: { revalidate: 3600 } // 緩存 1 小時
  }).then(r => r.json());
  
  return <div>{/* 產品圖片 */}</div>;
}

// 動態組件：需要實時數據
async function StockStatus({ productId }) {
  // 不使用緩存
  const stock = await fetch(`https://api.example.com/products/${productId}/stock`, {
    cache: 'no-store' // 不緩存
  }).then(r => r.json());
  
  return <div>庫存：{stock.quantity}</div>;
}
```

**3. 構建時處理**

```javascript
// Next.js 構建過程
1. 識別靜態組件（沒有 Suspense，使用緩存）
2. 預渲染靜態部分，生成 HTML
3. 標記 Suspense 邊界位置
4. 生成「模板」HTML，包含：
   - 預渲染的靜態內容
   - Suspense 邊界的佔位符
```

**4. 請求時處理**

```javascript
// 用戶請求頁面時
1. 從 CDN 載入預渲染的 HTML（快速）
2. 識別 Suspense 邊界
3. 並行請求動態數據
4. 流式渲染動態部分（Streaming SSR）
5. 逐步填充 Suspense 邊界
```

### 實際範例

#### 範例一：電商產品頁

```jsx
// app/products/[id]/page.js
import { Suspense } from 'react';

// 靜態部分：產品基本信息
async function ProductInfo({ productId }) {
  const product = await fetch(`https://api.example.com/products/${productId}`, {
    next: { revalidate: 3600 } // 緩存 1 小時
  }).then(r => r.json());
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <img src={product.image} alt={product.name} />
    </div>
  );
}

// 動態部分：庫存狀態
async function StockInfo({ productId }) {
  const stock = await fetch(`https://api.example.com/products/${productId}/stock`, {
    cache: 'no-store' // 實時數據
  }).then(r => r.json());
  
  return (
    <div className={stock.inStock ? 'in-stock' : 'out-of-stock'}>
      {stock.inStock ? '有現貨' : '缺貨'}
    </div>
  );
}

// 動態部分：個人化推薦
async function PersonalizedRecommendations({ productId }) {
  // 需要用戶信息，無法預渲染
  const recommendations = await fetch(`https://api.example.com/recommendations`, {
    cache: 'no-store',
    headers: {
      'Cookie': cookies().toString() // 用戶特定
    }
  }).then(r => r.json());
  
  return <RecommendationsList items={recommendations} />;
}

// 主頁面組件
export default function ProductPage({ params }) {
  return (
    <div>
      {/* 靜態部分：預渲染 */}
      <ProductInfo productId={params.id} />
      
      {/* 動態部分：按需渲染 */}
      <Suspense fallback={<div>載入庫存...</div>}>
        <StockInfo productId={params.id} />
      </Suspense>
      
      <Suspense fallback={<div>載入推薦...</div>}>
        <PersonalizedRecommendations productId={params.id} />
      </Suspense>
    </div>
  );
}
```

**構建時：**
```
生成 HTML：
<div>
  <h1>產品名稱</h1>
  <p>產品描述</p>
  <img src="..." />
  
  <!-- Suspense Boundary 1 -->
  <div>載入庫存...</div>
  
  <!-- Suspense Boundary 2 -->
  <div>載入推薦...</div>
</div>
```

**請求時：**
```
1. 立即返回預渲染的 HTML（包含 fallback）
2. 並行請求庫存和推薦數據
3. 流式更新 Suspense 邊界
```

#### 範例二：部落格文章頁

```jsx
// app/blog/[slug]/page.js
import { Suspense } from 'react';
import { cookies } from 'next/headers';

// 靜態部分：文章內容
async function ArticleContent({ slug }) {
  const article = await fetch(`https://api.example.com/articles/${slug}`, {
    next: { revalidate: 86400 } // 緩存 24 小時
  }).then(r => r.json());
  
  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}

// 動態部分：閱讀進度
async function ReadingProgress({ slug }) {
  const userId = cookies().get('userId')?.value;
  if (!userId) return null;
  
  const progress = await fetch(`https://api.example.com/progress/${userId}/${slug}`, {
    cache: 'no-store'
  }).then(r => r.json());
  
  return <ProgressBar progress={progress.percentage} />;
}

// 動態部分：實時評論數
async function CommentCount({ slug }) {
  const count = await fetch(`https://api.example.com/articles/${slug}/comments/count`, {
    next: { revalidate: 60 } // 緩存 1 分鐘
  }).then(r => r.json());
  
  return <div>評論數：{count}</div>;
}

export default function BlogPost({ params }) {
  return (
    <div>
      {/* 靜態：文章內容 */}
      <ArticleContent slug={params.slug} />
      
      {/* 動態：閱讀進度（用戶特定） */}
      <Suspense fallback={null}>
        <ReadingProgress slug={params.slug} />
      </Suspense>
      
      {/* 動態：評論數（實時更新） */}
      <Suspense fallback={<div>載入評論數...</div>}>
        <CommentCount slug={params.slug} />
      </Suspense>
    </div>
  );
}
```

### 與其他渲染策略的對比

#### 性能對比

| 策略 | 首屏載入 | 伺服器負載 | 緩存能力 | 實時數據 |
|------|---------|-----------|---------|---------|
| **SSG** | ⚡⚡⚡ 最快 | ✅ 最低 | ✅ 完全緩存 | ❌ 不支援 |
| **SSR** | 🐌 最慢 | ❌ 最高 | ❌ 無法緩存 | ✅ 完全支援 |
| **ISR** | ⚡⚡ 快 | ✅ 低 | ✅ 部分緩存 | ⚠️ 有限支援 |
| **PPR** | ⚡⚡⚡ 最快 | ✅ 低 | ✅ 部分緩存 | ✅ 完全支援 |

#### 實際場景對比

**場景：電商產品頁（1000 個產品，每秒 1000 次請求）**

**SSG：**
```
構建時：生成 1000 個靜態頁面
請求時：直接從 CDN 返回（0ms）
問題：價格、庫存無法實時更新
```

**SSR：**
```
構建時：不生成任何頁面
請求時：每次都要渲染（200ms）
問題：伺服器負載高，響應慢
```

**PPR：**
```
構建時：生成 1000 個模板（包含靜態部分）
請求時：只渲染動態部分（50ms）
優勢：快速響應 + 實時數據
```

#### ISR vs PPR 詳細對比

ISR（Incremental Static Regeneration）和 PPR（Partial Prerendering）都是 Next.js 的混合渲染策略，但它們的實現方式和適用場景不同。

**ISR 工作原理：**

```jsx
// Page Router
export async function getStaticProps() {
  const data = await fetch('https://api.example.com/data');
  return {
    props: { data },
    revalidate: 60 // 60 秒後重新生成
  };
}

// App Router
async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }
  }).then(r => r.json());
  
  return <div>{/* 整個頁面都是靜態的 */}</div>;
}
```

**ISR 特點：**
- 整個頁面作為一個單元緩存
- 緩存過期後，整個頁面重新生成
- 無法在同一頁面中混合靜態和動態內容
- 適合：內容更新頻率較低的頁面

**PPR 工作原理：**

```jsx
// App Router with PPR
export default function Page() {
  return (
    <div>
      {/* 靜態部分：預渲染並緩存 */}
      <StaticContent />
      
      {/* 動態部分：每次請求都渲染 */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

**PPR 特點：**
- 頁面可以分為靜態和動態部分
- 靜態部分預渲染並緩存
- 動態部分每次請求都渲染
- 適合：需要實時數據但大部分內容是靜態的頁面

**詳細對比表：**

| 特性 | ISR | PPR |
|------|-----|-----|
| **緩存粒度** | 整個頁面 | 頁面部分（靜態/動態分離） |
| **更新機制** | 定時重新生成整個頁面 | 靜態部分緩存，動態部分實時渲染 |
| **實時數據** | ⚠️ 有限（需要等待 revalidate） | ✅ 完全支援（動態部分） |
| **用戶特定內容** | ❌ 不支援 | ✅ 支援（在 Suspense 內） |
| **首屏載入** | ⚡⚡ 快（從 CDN） | ⚡⚡⚡ 最快（靜態部分從 CDN） |
| **伺服器負載** | ✅ 低（緩存期間無負載） | ✅ 低（只渲染動態部分） |
| **緩存失效** | 整個頁面失效 | 只影響動態部分 |
| **適用場景** | 內容更新不頻繁 | 需要混合靜態和動態內容 |

**性能對比：**

```
ISR 請求流程：
1. 檢查緩存是否過期
2. 如果過期 → 重新生成整個頁面（200ms）
3. 如果未過期 → 直接返回（0ms）
問題：緩存過期時，用戶需要等待整個頁面重新生成

PPR 請求流程：
1. 立即返回預渲染的靜態 HTML（0ms）
2. 並行獲取動態數據（50ms）
3. 流式更新動態部分
優勢：用戶立即看到內容，動態部分逐步載入
```

**選擇建議：**

**使用 ISR 當：**
- ✅ 頁面內容更新頻率低（如部落格文章）
- ✅ 不需要實時數據
- ✅ 不需要用戶特定內容
- ✅ 整個頁面可以共享相同的緩存策略

**使用 PPR 當：**
- ✅ 頁面需要混合靜態和動態內容
- ✅ 需要實時數據（如庫存、價格）
- ✅ 需要用戶特定內容（如個人化推薦）
- ✅ 需要細粒度的緩存控制
- ✅ 需要最佳的首屏性能

- **ISR**：適合整個頁面內容更新頻率一致的場景，簡單但靈活性較低
- **PPR**：適合需要混合靜態和動態內容的場景，更靈活但需要正確使用 Suspense

PPR 是 ISR 的進化版本，提供了更細粒度的控制和更好的性能。

### 啟用 Partial Prerendering

#### Next.js 15+ 配置

```javascript
// next.config.js
module.exports = {
  experimental: {
    ppr: true // 啟用 Partial Prerendering
  }
};
```

#### 使用方式

```jsx
// app/products/[id]/page.js
import { Suspense } from 'react';

// 默認啟用 PPR（如果配置了）
export default function ProductPage({ params }) {
  return (
    <div>
      {/* 靜態部分 */}
      <StaticContent />
      
      {/* 動態部分：使用 Suspense */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

### 技術細節

#### 1. Suspense 邊界識別

```jsx
// Next.js 構建時會：
// 1. 掃描所有 Suspense 邊界
// 2. 將 Suspense 內的組件標記為「動態」
// 3. 將 Suspense 外的組件標記為「靜態」

export default function Page() {
  return (
    <div>
      {/* 靜態：在 Suspense 外 */}
      <StaticComponent />
      
      <Suspense>
        {/* 動態：在 Suspense 內 */}
        <DynamicComponent />
      </Suspense>
      
      {/* 靜態：在 Suspense 外 */}
      <AnotherStaticComponent />
    </div>
  );
}
```

#### 2. 數據獲取策略

```jsx
// 靜態組件：使用緩存
async function StaticComponent() {
  const data = await fetch('/api/data', {
    next: { revalidate: 3600 } // 緩存
  });
  // 構建時執行，結果被緩存
}

// 動態組件：不使用緩存
async function DynamicComponent() {
  const data = await fetch('/api/data', {
    cache: 'no-store' // 不緩存
  });
  // 請求時執行
}
```

#### 3. 流式渲染（Streaming）

```jsx
// PPR 使用 React 的 Streaming SSR
// 1. 先發送靜態 HTML
// 2. 動態部分以流的形式逐步發送

// 瀏覽器接收：
// <div>
//   <h1>靜態內容</h1>
//   <!-- Suspense Boundary -->
//   <div>載入中...</div>
// </div>
// 
// 然後接收：
// <script>
//   // 更新 Suspense 邊界
//   replaceBoundary('suspense-1', '<div>動態內容</div>');
// </script>
```

### 優勢和限制

#### 優勢

1. **最佳性能**
   - 靜態部分從 CDN 載入（極快）
   - 動態部分按需渲染（靈活）

2. **降低伺服器負載**
   - 只渲染動態部分
   - 靜態部分完全緩存

3. **更好的用戶體驗**
   - 快速首屏載入
   - 實時數據更新
   - 個人化內容支援

4. **成本效益**
   - 減少伺服器計算
   - 利用 CDN 緩存
   - 降低帶寬成本

#### 限制

1. **需要 Next.js 15+**
   - 目前是實驗性功能
   - 需要 App Router

2. **Suspense 邊界要求**
   - 動態內容必須在 Suspense 內
   - 需要正確的組件結構

3. **複雜度增加**
   - 需要理解靜態/動態分離
   - 調試可能更複雜

### 最佳實踐

#### 1. 明確區分靜態和動態

```jsx
// ✅ 好的做法：明確分離
export default function Page() {
  return (
    <div>
      <StaticHeader />
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />
      </Suspense>
      <StaticFooter />
    </div>
  );
}

// ❌ 不好的做法：混合在一起
export default function Page() {
  const dynamicData = await fetch('/api/data', { cache: 'no-store' });
  return (
    <div>
      <StaticHeader />
      <DynamicContent data={dynamicData} />
      <StaticFooter />
    </div>
  );
}
```

#### 2. 使用合適的 Fallback

```jsx
// ✅ 好的做法：有意義的 fallback
<Suspense fallback={<ProductSkeleton />}>
  <ProductDetails />
</Suspense>

// ❌ 不好的做法：空白或錯誤的 fallback
<Suspense fallback={null}>
  <ProductDetails />
</Suspense>
```

#### 3. 優化數據獲取

```jsx
// ✅ 好的做法：並行獲取
export default function Page() {
  return (
    <div>
      <Suspense fallback={<Skeleton1 />}>
        <Component1 /> {/* 並行請求 */}
      </Suspense>
      <Suspense fallback={<Skeleton2 />}>
        <Component2 /> {/* 並行請求 */}
      </Suspense>
    </div>
  );
}

// ❌ 不好的做法：串行獲取
export default async function Page() {
  const data1 = await fetch('/api/1');
  const data2 = await fetch('/api/2'); // 等待 data1 完成
  return <div>...</div>;
}
```

// 比較ISR和PPR 

### 總結

**Partial Prerendering 核心要點：**

1. **解決的問題**
   - SSG 無法處理動態內容
   - SSR 性能不佳
   - 需要同時支援靜態和動態

2. **工作原理**
   - 構建時預渲染靜態部分
   - 請求時按需渲染動態部分
   - 使用 Suspense 邊界分離

3. **優勢**
   - 最佳性能（CDN + 按需渲染）
   - 降低伺服器負載
   - 支援實時和個人化數據

4. **使用方式**
   - 在 Next.js 15+ 中啟用
   - 使用 Suspense 包裹動態內容
   - 靜態內容使用緩存，動態內容使用 `cache: 'no-store'`

**適用場景：**
- ✅ 電商網站（產品頁）
- ✅ 內容網站（文章頁）
- ✅ 社交媒體（動態 Feed）
- ✅ 儀表板（實時數據）

Partial Prerendering 代表了 Next.js 渲染策略的未來方向，它完美結合了靜態和動態渲染的優勢，為開發者提供了最佳的性能和靈活性。
