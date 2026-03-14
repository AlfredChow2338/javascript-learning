# Code Splitting 優化實現

## 什麼是 Code Splitting

**Code Splitting（代碼分割）** 是一種優化技術，將應用程序的代碼拆分成多個較小的 bundle，按需加載，而不是一次性加載整個應用。

**核心目標：**
- 減少初始 bundle 大小
- 提升首屏加載速度
- 改善用戶體驗
- 優化資源利用

**為什麼需要 Code Splitting：**

```javascript
// ❌ 問題：所有代碼打包在一個 bundle 中
// bundle.js (2MB)
// - 首屏代碼 (200KB)
// - 路由 A (300KB)
// - 路由 B (400KB)
// - 路由 C (500KB)
// - 第三方庫 (600KB)

// 用戶訪問首屏時，需要下載整個 2MB 的 bundle
// 但實際上只需要 200KB 的首屏代碼
```

```javascript
// ✅ 解決：代碼分割
// main.js (200KB) - 首屏代碼
// route-a.js (300KB) - 按需加載
// route-b.js (400KB) - 按需加載
// route-c.js (500KB) - 按需加載
// vendors.js (600KB) - 第三方庫

// 用戶訪問首屏時，只下載 200KB + 600KB = 800KB
// 其他路由代碼在需要時才加載
```

---

## 一、Code Splitting 策略

### 1.1 路由級別分割（Route-based Splitting）

**最常見的分割方式：** 按路由分割代碼

```javascript
// ❌ 未分割：所有路由打包在一起
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
    </Router>
  );
}
```

```javascript
// ✅ 路由級別分割：每個路由單獨打包
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 懶加載路由組件
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**優化效果：**
- 初始 bundle 減少 60-80%
- 首屏加載時間減少 40-60%
- 用戶只下載需要的路由代碼

### 1.2 組件級別分割（Component-based Splitting）

**分割大型組件：** 將不常用的重型組件單獨打包

```javascript
// ❌ 未分割：重型組件包含在主 bundle 中
import MonacoEditor from './components/MonacoEditor';
import Chart from './components/Chart';

function Dashboard() {
  const [showEditor, setShowEditor] = useState(false);
  
  return (
    <div>
      <Chart />
      {showEditor && <MonacoEditor />}
    </div>
  );
}
```

```javascript
// ✅ 組件級別分割：重型組件按需加載
import { lazy, Suspense } from 'react';

const MonacoEditor = lazy(() => import('./components/MonacoEditor'));
const Chart = lazy(() => import('./components/Chart'));

function Dashboard() {
  const [showEditor, setShowEditor] = useState(false);
  
  return (
    <div>
      <Suspense fallback={<div>Loading chart...</div>}>
        <Chart />
      </Suspense>
      {showEditor && (
        <Suspense fallback={<div>Loading editor...</div>}>
          <MonacoEditor />
        </Suspense>
      )}
    </div>
  );
}
```

### 1.3 第三方庫分割（Vendor Splitting）

**分離第三方庫：** 將第三方庫單獨打包，利用瀏覽器緩存

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // React 相關庫
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react-vendor',
          priority: 20,
          reuseExistingChunk: true
        },
        // 其他第三方庫
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

**優化效果：**
- 第三方庫緩存時間長，減少重複下載
- 應用代碼更新時，用戶只需重新下載應用代碼

### 1.4 功能模塊分割（Feature-based Splitting）

**按功能分割：** 將相關功能打包在一起

```javascript
// 管理後台功能
const AdminDashboard = lazy(() => import('./features/admin/Dashboard'));
const AdminUsers = lazy(() => import('./features/admin/Users'));
const AdminSettings = lazy(() => import('./features/admin/Settings'));

// 用戶功能
const UserProfile = lazy(() => import('./features/user/Profile'));
const UserOrders = lazy(() => import('./features/user/Orders'));

// 只有管理員才加載管理功能
function App() {
  const { role } = useAuth();
  
  return (
    <Routes>
      {role === 'admin' && (
        <>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </>
      )}
      <Route path="/profile" element={<UserProfile />} />
    </Routes>
  );
}
```

---

## 二、React 中的 Code Splitting

### 2.1 React.lazy 和 Suspense

**React.lazy：** 動態導入組件

```javascript
import { lazy } from 'react';

// 懶加載組件
const LazyComponent = lazy(() => import('./LazyComponent'));

// lazy() 返回一個 Promise，解析為組件
// 等價於：
const LazyComponent = lazy(() => {
  return import('./LazyComponent').then(module => ({
    default: module.default
  }));
});
```

**Suspense：** 處理加載狀態

```javascript
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

**完整示例：**

```javascript
import { lazy, Suspense, useState } from 'react';

// 懶加載重型組件
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const Chart = lazy(() => import('./Chart'));

function App() {
  const [showHeavy, setShowHeavy] = useState(false);
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>
        Load Heavy Component
      </button>
      <button onClick={() => setShowChart(true)}>
        Load Chart
      </button>
      
      {showHeavy && (
        <Suspense fallback={<div>Loading heavy component...</div>}>
          <HeavyComponent />
        </Suspense>
      )}
      
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <Chart />
        </Suspense>
      )}
    </div>
  );
}
```

### 2.2 錯誤邊界（Error Boundaries）

**處理加載錯誤：** 使用 Error Boundary 捕獲 lazy 組件加載失敗

```javascript
import { Component } from 'react';
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error loading component:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### 2.3 路由級別分割實現

**React Router 完整示例：**

```javascript
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';

// 懶加載所有路由
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
```

---

## 三、Next.js 中的 Code Splitting

### 3.1 next/dynamic

**Next.js 提供的動態導入：** 支持 SSR 和客戶端渲染

```javascript
// ❌ 未分割：組件包含在主 bundle 中
import HeavyComponent from '../components/HeavyComponent';

function Page() {
  return <HeavyComponent />;
}
```

```javascript
// ✅ 使用 next/dynamic：按需加載
import dynamic from 'next/dynamic';

// 客戶端渲染（SSR: false）
const HeavyComponent = dynamic(
  () => import('../components/HeavyComponent'),
  { 
    ssr: false, // 禁用 SSR
    loading: () => <p>Loading...</p> // 加載狀態
  }
);

function Page() {
  return <HeavyComponent />;
}
```

### 3.2 路由級別自動分割

**Next.js 自動分割：** 每個頁面自動分割成獨立的 chunk

```javascript
// pages/index.js - 自動分割為 index.js chunk
export default function Home() {
  return <div>Home</div>;
}

// pages/about.js - 自動分割為 about.js chunk
export default function About() {
  return <div>About</div>;
}

// pages/products/index.js - 自動分割為 products.js chunk
export default function Products() {
  return <div>Products</div>;
}
```

### 3.3 組件級別分割

**條件加載組件：**

```javascript
import dynamic from 'next/dynamic';
import { useState } from 'react';

// 懶加載重型組件
const MonacoEditor = dynamic(
  () => import('../components/MonacoEditor'),
  { 
    ssr: false,
    loading: () => <div>Loading editor...</div>
  }
);

const Chart = dynamic(
  () => import('../components/Chart'),
  { ssr: false }
);

function Dashboard() {
  const [showEditor, setShowEditor] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowEditor(true)}>
        Open Editor
      </button>
      {showEditor && <MonacoEditor />}
      <Chart />
    </div>
  );
}
```

### 3.4 預加載策略

**基於用戶意圖預加載：**

```javascript
import dynamic from 'next/dynamic';
import { useState } from 'react';

const MonacoEditor = dynamic(
  () => import('../components/MonacoEditor'),
  { ssr: false }
);

function EditorButton({ onClick }) {
  const [preloaded, setPreloaded] = useState(false);
  
  // 鼠標懸停時預加載
  const handleMouseEnter = () => {
    if (!preloaded) {
      // 預加載組件
      import('../components/MonacoEditor');
      setPreloaded(true);
    }
  };
  
  return (
    <button
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
    >
      Open Editor
    </button>
  );
}
```

**使用 next/link 自動預加載：**

```javascript
import Link from 'next/link';

// Next.js 會自動預加載 Link 指向的頁面
function Navigation() {
  return (
    <nav>
      <Link href="/about">
        <a>About</a> {/* 懸停時自動預加載 */}
      </Link>
      <Link href="/products">
        <a>Products</a>
      </Link>
    </nav>
  );
}
```

---

## 四、Webpack 配置

### 4.1 SplitChunksPlugin 配置

**基本配置：**

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all', // 'initial' | 'async' | 'all'
      
      // 最小 chunk 大小（字節）
      minSize: 20000,
      
      // 最大 chunk 大小（字節）
      maxSize: 244000,
      
      // 最小共享次數
      minChunks: 1,
      
      // 最大異步請求數
      maxAsyncRequests: 30,
      
      // 最大初始請求數
      maxInitialRequests: 30,
      
      // 自動命名分隔符
      automaticNameDelimiter: '~',
      
      cacheGroups: {
        // 默認組
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        },
        
        // 第三方庫
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

### 4.2 高級配置示例

**分離 React、工具庫、樣式：**

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // React 核心庫
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
          name: 'react-vendor',
          priority: 30,
          reuseExistingChunk: true
        },
        
        // UI 庫
        ui: {
          test: /[\\/]node_modules[\\/](@mui|@chakra-ui|antd)[\\/]/,
          name: 'ui-vendor',
          priority: 25,
          reuseExistingChunk: true
        },
        
        // 工具庫
        utils: {
          test: /[\\/]node_modules[\\/](lodash|moment|date-fns|axios)[\\/]/,
          name: 'utils-vendor',
          priority: 20,
          reuseExistingChunk: true
        },
        
        // 其他第三方庫
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        
        // 公共代碼
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        },
        
        // 樣式文件
        styles: {
          test: /\.(css|scss|sass)$/,
          name: 'styles',
          type: 'css/mini-extract',
          chunks: 'all',
          enforce: true
        }
      }
    }
  }
};
```

### 4.3 動態導入配置

**支持動態導入：**

```javascript
// webpack.config.js
module.exports = {
  // 動態導入的 chunk 命名
  output: {
    chunkFilename: '[name].[contenthash].chunk.js',
    // 或使用函數
    chunkFilename: (pathData) => {
      return pathData.chunk.name === 'main' 
        ? '[name].[contenthash].js' 
        : '[name].[contenthash].chunk.js';
    }
  },
  
  // 優化動態導入
  optimization: {
    splitChunks: {
      chunks: 'async', // 只分割動態導入
      minSize: 20000,
      maxSize: 244000
    }
  }
};
```

---

## 五、優化策略和最佳實踐

### 5.1 識別可分割的模塊

**適合分割的模塊：**

1. **路由頁面**：每個路由單獨打包
2. **重型組件**：Monaco Editor、Chart、PDF Viewer
3. **第三方庫**：大型庫（如 lodash、moment）
4. **功能模塊**：管理後台、用戶中心
5. **條件渲染組件**：彈窗、模態框

**不適合分割的模塊：**

1. **核心組件**：Header、Footer、Navigation
2. **小工具函數**：utils、helpers
3. **共享樣式**：全局 CSS
4. **首屏必需組件**：Landing page 組件

### 5.2 預加載策略

**1. 基於用戶行為預加載：**

```javascript
// 鼠標懸停時預加載
function NavigationLink({ href, children }) {
  const handleMouseEnter = () => {
    // 預加載路由
    import(`./pages${href}`);
  };
  
  return (
    <Link href={href} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}
```

**2. 基於功能標誌預加載：**

```javascript
function FeatureProvider({ children, flags }) {
  useEffect(() => {
    // 功能啟用時預加載
    if (flags.editorEnabled) {
      import('./components/MonacoEditor');
    }
    if (flags.chartEnabled) {
      import('./components/Chart');
    }
  }, [flags]);
  
  return <>{children}</>;
}
```

**3. 使用 `<link rel="prefetch">`：**

```javascript
// 在 HTML 中添加預加載
<link rel="prefetch" href="/_next/static/chunks/about.js" />
<link rel="prefetch" href="/_next/static/chunks/products.js" />
```

### 5.3 加載狀態優化

**提供良好的加載體驗：**

```javascript
// ❌ 簡單的加載提示
<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>

// ✅ 優雅的加載狀態
<Suspense fallback={
  <div className="loading-container">
    <Spinner />
    <p>Loading component...</p>
  </div>
}>
  <LazyComponent />
</Suspense>
```

**骨架屏（Skeleton Screen）：**

```javascript
function ComponentSkeleton() {
  return (
    <div className="skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-content">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </div>
    </div>
  );
}

<Suspense fallback={<ComponentSkeleton />}>
  <LazyComponent />
</Suspense>
```

### 5.4 錯誤處理

**處理加載失敗：**

```javascript
import { lazy, Suspense, useState } from 'react';

function LazyComponentWithRetry() {
  const [retryCount, setRetryCount] = useState(0);
  
  const LazyComponent = lazy(() => 
    import('./LazyComponent')
      .catch(error => {
        console.error('Failed to load component:', error);
        // 可以返回一個錯誤組件
        return { default: () => <div>Failed to load</div> };
      })
  );
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 5.5 Bundle 分析

**使用 webpack-bundle-analyzer：**

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    // 只在分析時啟用
    process.env.ANALYZE && new BundleAnalyzerPlugin()
  ].filter(Boolean)
};
```

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}
```

**Next.js Bundle 分析：**

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Next.js 配置
});
```

---

## 六、性能指標和優化效果

### 6.1 關鍵指標

**測量 Code Splitting 效果：**

1. **Initial Bundle Size（初始 Bundle 大小）**
   - 目標：< 200KB（gzipped）
   - 測量：使用 webpack-bundle-analyzer

2. **Time to Interactive (TTI)**
   - 目標：< 3.5 秒
   - 測量：Chrome DevTools Lighthouse

3. **First Contentful Paint (FCP)**
   - 目標：< 1.8 秒
   - 測量：Chrome DevTools Performance

4. **Largest Contentful Paint (LCP)**
   - 目標：< 2.5 秒
   - 測量：Chrome DevTools Lighthouse

### 6.2 優化前後對比

**示例：電商網站**

```
優化前：
- main.js: 2.5MB (gzipped: 800KB)
- 首屏加載時間: 4.2 秒
- TTI: 5.8 秒

優化後：
- main.js: 450KB (gzipped: 150KB)
- vendors.js: 600KB (gzipped: 200KB)
- route-home.js: 200KB (gzipped: 70KB)
- route-products.js: 300KB (gzipped: 100KB)
- 首屏加載時間: 1.8 秒（減少 57%）
- TTI: 2.5 秒（減少 57%）
```

### 6.3 監控和追蹤

**追蹤 chunk 加載：**

```javascript
// 監控動態導入
const originalImport = window.__webpack_require__;

window.__webpack_require__ = function(...args) {
  const startTime = performance.now();
  const result = originalImport.apply(this, args);
  const endTime = performance.now();
  
  // 記錄加載時間
  console.log(`Chunk loaded in ${endTime - startTime}ms`);
  
  // 發送到分析服務
  if (window.analytics) {
    window.analytics.track('chunk_loaded', {
      chunk: args[0],
      loadTime: endTime - startTime
    });
  }
  
  return result;
};
```

---

## 七、常見問題和解決方案

### 7.1 重複加載問題

**問題：** 多個 chunk 包含相同的依賴

**解決：** 使用 SplitChunksPlugin 提取公共代碼

```javascript
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      common: {
        minChunks: 2, // 至少被 2 個 chunk 使用
        priority: 5,
        reuseExistingChunk: true
      }
    }
  }
}
```

### 7.2 加載順序問題

**問題：** chunk 加載順序不確定

**解決：** 使用 webpack 的 `import()` 預加載

```javascript
// 預加載依賴
const Component = lazy(() => 
  import(/* webpackPreload: true */ './Component')
);
```

### 7.3 SSR 兼容性

**問題：** lazy 組件在 SSR 時出錯

**解決：** 使用 next/dynamic 或條件渲染

```javascript
// Next.js
const Component = dynamic(() => import('./Component'), {
  ssr: false // 禁用 SSR
});

// React
const Component = typeof window !== 'undefined' 
  ? lazy(() => import('./Component'))
  : () => null;
```

### 7.4 緩存失效問題

**問題：** 代碼更新後，用戶仍使用舊版本

**解決：** 使用 contenthash 命名

```javascript
output: {
  filename: '[name].[contenthash].js',
  chunkFilename: '[name].[contenthash].chunk.js'
}
```

---

## 八、總結

### Code Splitting 的核心要點

1. **路由級別分割**：最常見且最有效的方式
2. **組件級別分割**：適用於重型組件
3. **第三方庫分割**：利用瀏覽器緩存
4. **預加載策略**：提升用戶體驗
5. **錯誤處理**：確保穩定性

### 最佳實踐

- ✅ 按路由分割代碼
- ✅ 懶加載重型組件
- ✅ 分離第三方庫
- ✅ 提供優雅的加載狀態
- ✅ 監控和優化 bundle 大小
- ❌ 不要過度分割（增加請求數）
- ❌ 不要分割首屏必需的代碼
- ❌ 不要忽略錯誤處理

通過合理的 Code Splitting 策略，可以顯著提升應用程序的加載性能和用戶體驗。
