## Critical Rendering Path（關鍵渲染路徑）原理

### 什麼是 Critical Rendering Path

**Critical Rendering Path（CRP）** 是指瀏覽器將 HTML、CSS、JavaScript 轉換成可視化網頁的過程。優化 CRP 可以大幅提升頁面載入速度和用戶體驗。

**核心目標：** 最小化首次內容繪製（First Contentful Paint, FCP）和最大內容繪製（Largest Contentful Paint, LCP）的時間。

### 為什麼重要

**性能指標：**
- **FCP（First Contentful Paint）**：首次內容繪製時間，目標 < 1.8 秒
- **LCP（Largest Contentful Paint）**：最大內容繪製時間，目標 < 2.5 秒
- **TTI（Time to Interactive）**：可交互時間，目標 < 3.8 秒

**用戶體驗：**
- 用戶感知的載入速度
- 首屏內容顯示時間
- 頁面可交互時間

### 渲染流程（完整步驟）

```
1. 下載 HTML
   │
   ├─ 解析 HTML（Parse HTML）
   │   └─ 構建 DOM Tree
   │
   ├─ 下載 CSS
   │   └─ 解析 CSS（Parse CSS）
   │       └─ 構建 CSSOM Tree
   │
   ├─ 合併 DOM + CSSOM
   │   └─ 構建 Render Tree
   │
   ├─ Layout（佈局/重排）
   │   └─ 計算元素位置和大小
   │
   ├─ Paint（繪製）
   │   └─ 填充像素
   │
   └─ Composite（合成）
       └─ 合成圖層，顯示在屏幕上
```

### 詳細步驟解析

#### 步驟一：構建 DOM（Document Object Model）

**過程：**

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <h1>Hello</h1>
  <p>World</p>
</body>
</html>
```

**瀏覽器處理：**

```
1. 接收 HTML 字節流
2. 轉換成字符（Bytes → Characters）
3. 轉換成 Token（Characters → Tokens）
   - <html> → StartTag: html
   - <head> → StartTag: head
   - </head> → EndTag: head
4. 構建 DOM 節點（Tokens → Nodes）
5. 構建 DOM Tree（Nodes → DOM Tree）
```

**DOM Tree 結構：**

```
Document
└── html
    ├── head
    │   └── title
    │       └── "My Page"
    └── body
        ├── h1
        │   └── "Hello"
        └── p
            └── "World"
```

**阻塞因素：**

```html
<!-- ❌ 阻塞 DOM 構建 -->
<script>
  // 同步腳本會阻塞 HTML 解析
  document.write('<div>Content</div>');
</script>

<!-- ✅ 不阻塞 DOM 構建 -->
<script async src="script.js"></script>
<script defer src="script.js"></script>
```

#### 步驟二：構建 CSSOM（CSS Object Model）

**過程：**

```css
body {
  font-size: 16px;
}

h1 {
  color: red;
  font-size: 24px;
}

p {
  color: blue;
}
```

**瀏覽器處理：**

```
1. 接收 CSS 字節流
2. 轉換成字符
3. 轉換成 Token
4. 構建 CSSOM Tree
```

**CSSOM Tree 結構：**

```
StyleSheet
└── body
    └── font-size: 16px
└── h1
    ├── color: red
    └── font-size: 24px
└── p
    └── color: blue
```

**重要特性：**

```css
/* CSS 是渲染阻塞的（Render-blocking）*/
/* 瀏覽器必須等待 CSS 下載和解析完成才能渲染 */

/* ❌ 阻塞渲染 */
<link rel="stylesheet" href="styles.css">

/* ✅ 不阻塞渲染（但可能導致 FOUC）*/
<link rel="stylesheet" href="styles.css" media="print">
<!-- 或使用媒體查詢 -->
<link rel="stylesheet" href="styles.css" media="(max-width: 600px)">
```

#### 步驟三：構建 Render Tree（渲染樹）

**過程：**

```
DOM Tree + CSSOM Tree → Render Tree
```

**規則：**
- 只包含**可見元素**（不包含 `display: none` 的元素）
- 包含元素的**計算樣式**（computed styles）

**範例：**

```html
<!-- DOM -->
<div style="display: none;">Hidden</div>
<p>Visible</p>
<span style="visibility: hidden;">Also Hidden</span>
```

```css
.hidden {
  display: none;
}
```

**Render Tree：**

```
Render Tree
└── p
    └── "Visible"
    /* display: none 的元素不在 Render Tree 中 */
    /* visibility: hidden 的元素在 Render Tree 中，但不顯示 */
```

#### 步驟四：Layout（佈局/重排）

**過程：** 計算每個元素在視口中的確切位置和大小

**範例：**

```css
.container {
  width: 800px;
  display: flex;
}

.item {
  flex: 1;
  height: 100px;
}
```

**Layout 計算：**

```
1. 計算 .container 的位置和大小
   - x: 0, y: 0
   - width: 800px, height: 100px

2. 計算 .item 的位置和大小
   - x: 0, y: 0
   - width: 400px (如果 2 個 item), height: 100px
```

**觸發 Layout 的操作：**

```javascript
// ❌ 觸發 Layout（重排）
element.style.width = '200px';
element.style.height = '100px';
element.offsetWidth; // 讀取佈局信息

// ✅ 只觸發 Paint（重繪）
element.style.color = 'red';
element.style.backgroundColor = 'blue';
```

#### 步驟五：Paint（繪製）

**過程：** 填充像素，繪製每個元素的可視部分

**範例：**

```css
.box {
  width: 100px;
  height: 100px;
  background: red;
  border: 2px solid blue;
  color: white;
}
```

**Paint 過程：**

```
1. 繪製背景（紅色）
2. 繪製邊框（藍色，2px）
3. 繪製文字（白色）
```

#### 步驟六：Composite（合成）

**過程：** 將多個圖層合成，最終顯示在屏幕上

**圖層（Layers）：**

```css
/* 創建新圖層的元素 */
.element {
  transform: translateZ(0); /* 3D 變換 */
  will-change: transform;    /* 提示瀏覽器優化 */
  position: fixed;           /* 固定定位 */
  opacity: 0.5;             /* 透明度 */
}
```

**合成過程：**

```
Layer 1 (背景)
  ↓
Layer 2 (內容)
  ↓
Layer 3 (固定導航)
  ↓
合成 → 顯示在屏幕
```

### 關鍵問題解答

#### 問題一：CSS 是在 DOM 構建之前還是之後渲染的？

**答案：CSS 解析與 DOM 構建是並行的，但 CSS 必須在渲染之前完成。**

**詳細解釋：**

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello</h1>
</body>
</html>
```

**實際執行順序：**

```
時間線：
0ms:    開始下載 HTML
        ↓
50ms:   開始解析 HTML，構建 DOM
        ↓
100ms:  遇到 <link> 標籤，開始下載 CSS（與 DOM 構建並行）
        ↓
150ms:  DOM 構建完成（但等待 CSS）
        ↓
300ms:  CSS 下載完成
        ↓
350ms:  CSSOM 構建完成
        ↓
400ms:  DOM + CSSOM → Render Tree
        ↓
450ms:  Layout → Paint → Composite
        ↓
500ms:  首次渲染
```

**關鍵點：**

1. **DOM 和 CSSOM 構建是並行的**
   - HTML 解析器遇到 `<link>` 時，會並行下載 CSS
   - DOM 構建不等待 CSS 下載完成
   - 但 DOM 構建完成後，會等待 CSSOM 完成

2. **CSS 阻塞渲染，但不阻塞 DOM 構建**
   ```html
   <!-- DOM 會繼續構建 -->
   <link rel="stylesheet" href="styles.css">
   <body>
     <h1>Hello</h1> <!-- 這部分 DOM 會先構建完成 -->
   </body>
   ```

3. **渲染必須等待 CSSOM**
   - 瀏覽器必須有完整的 CSSOM 才能構建 Render Tree
   - 沒有 CSSOM，無法計算樣式，無法渲染

**視覺化：**

```
DOM 構建：    ████████████ (完成)
CSS 下載：    ████████████████████ (較慢)
CSSOM 構建：              ████
渲染：                    ░░░░ (等待 CSSOM)
                          ████ (CSSOM 完成後立即渲染)
```

#### 問題二：HTML 是增量渲染的，CSS 是否也是？

**答案：CSS 不是增量解析的，必須完整解析才能使用。**

**HTML 增量解析：**

```html
<!-- 瀏覽器可以邊下載邊解析 -->
<html>
<head>...</head>  <!-- 解析這部分 -->
<body>
  <h1>Hello</h1>  <!-- 繼續解析這部分 -->
  <p>World</p>    <!-- 繼續解析這部分 -->
</body>
</html>
```

**原因：**
- HTML 是流式（streaming）的
- 瀏覽器可以逐步構建 DOM Tree
- 部分 HTML 可以立即顯示（如果 CSS 已準備好）

**CSS 必須完整解析：**

```css
/* CSS 不能增量解析 */
h1 {
  color: red;
}

/* 後面的規則可能覆蓋前面的 */
h1 {
  color: blue; /* 最終是 blue，不是 red */
}

/* 如果只解析一半，會得到錯誤的樣式 */
```

**原因：**
1. **層疊性（Cascading）**
   - 後面的規則可能覆蓋前面的
   - 必須知道所有規則才能確定最終樣式

2. **選擇器優先級**
   ```css
   .header h1 { color: red; }    /* 優先級：0,1,1 */
   h1 { color: blue; }            /* 優先級：0,0,1 */
   /* 必須比較所有選擇器才能確定 */
   ```

3. **繼承和計算**
   ```css
   body { font-size: 16px; }
   h1 { font-size: 2em; } /* 必須知道 body 的 font-size 才能計算 */
   ```

**實際影響：**

```html
<!-- 場景：CSS 文件很大（100KB）-->
<link rel="stylesheet" href="large-styles.css">

<!-- HTML 已經解析完成，DOM 已構建 -->
<body>
  <h1>Hello</h1> <!-- DOM 已存在，但無法渲染 -->
</body>

<!-- 必須等待整個 CSS 文件下載和解析完成 -->
<!-- 即使 HTML 已經準備好，也要等待 CSS -->
```

**優化策略：**

```html
<!-- ✅ 分離關鍵 CSS 和非關鍵 CSS -->
<!-- 內聯關鍵 CSS（立即可用）-->
<style>
  body { font-family: Arial; }
  h1 { color: #333; }
</style>

<!-- 非關鍵 CSS 延遲載入 -->
<link rel="preload" href="non-critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

#### 問題三：async 和 defer 腳本，哪個會在 HTML 完全渲染後才解釋？

**答案：defer 腳本會在 HTML 完全解析後執行，async 腳本在下載完成後立即執行（可能早於 HTML 完全解析）。**

**詳細對比：**

**async 腳本：**

```html
<script async src="app.js"></script>
```

**執行時機：**
- 下載不阻塞 HTML 解析
- **下載完成後立即執行**（不等待 HTML 解析完成）
- 執行時會阻塞渲染

**時間線：**

```
0ms:    開始下載 HTML
        ↓
50ms:   遇到 <script async>
        ↓
100ms:  開始下載 script（不阻塞 HTML 解析）
        ↓
200ms:  HTML 解析繼續進行
        ↓
300ms:  script 下載完成
        ↓
350ms:  **立即執行 script**（HTML 可能還沒解析完）
        ↓
400ms:  HTML 解析完成
```

**defer 腳本：**

```html
<script defer src="app.js"></script>
```

**執行時機：**
- 下載不阻塞 HTML 解析
- **等待 HTML 完全解析完成後才執行**
- 按順序執行（多個 defer 腳本按出現順序執行）

**時間線：**

```
0ms:    開始下載 HTML
        ↓
50ms:   遇到 <script defer>
        ↓
100ms:  開始下載 script（不阻塞 HTML 解析）
        ↓
200ms:  HTML 解析繼續進行
        ↓
300ms:  script 下載完成（但等待 HTML 解析）
        ↓
400ms:  HTML 解析完成
        ↓
450ms:  **執行 script**（HTML 已完全解析）
```

**實際範例：**

```html
<!DOCTYPE html>
<html>
<head>
  <script async src="analytics.js"></script>
  <script defer src="app.js"></script>
</head>
<body>
  <h1>Hello</h1>
  <p>World</p>
  <!-- 更多內容... -->
</body>
</html>
```

**執行順序：**

```
1. HTML 開始解析
2. 遇到 async script，開始下載（不阻塞）
3. 遇到 defer script，開始下載（不阻塞）
4. HTML 繼續解析
5. async script 下載完成 → **立即執行**（HTML 可能還沒解析完）
6. HTML 解析完成
7. defer script 下載完成 → **執行**（HTML 已完全解析）
```

**關鍵差異：**

| 特性 | async | defer |
|------|-------|-------|
| **下載** | 不阻塞 HTML 解析 | 不阻塞 HTML 解析 |
| **執行時機** | 下載完成後立即 | HTML 解析完成後 |
| **執行順序** | 不保證順序 | 保證順序（按出現順序） |
| **DOM 可用性** | 可能不可用 | 保證可用 |
| **適用場景** | 獨立腳本（如 analytics） | 依賴 DOM 的腳本 |

**使用建議：**

```html
<!-- ✅ async：獨立腳本，不依賴 DOM -->
<script async src="analytics.js"></script>
<script async src="ads.js"></script>

<!-- ✅ defer：依賴 DOM 的腳本 -->
<script defer src="app.js"></script>
<script defer src="components.js"></script>
<!-- 保證按順序執行，DOM 已準備好 -->
```

**實際測試：**

```html
<!DOCTYPE html>
<html>
<head>
  <script async src="async.js"></script>
  <script defer src="defer.js"></script>
</head>
<body>
  <h1>Test</h1>
  <script>
    console.log('Inline script');
  </script>
</body>
</html>
```

```javascript
// async.js
console.log('Async script executed');
console.log('DOM ready?', document.readyState); // 可能是 'loading'

// defer.js
console.log('Defer script executed');
console.log('DOM ready?', document.readyState); // 保證是 'complete'
```

**總結：**
- **async**：下載完成後立即執行，不等待 HTML 解析完成
- **defer**：等待 HTML 完全解析完成後才執行，保證 DOM 可用

### 阻塞資源

#### 渲染阻塞資源（Render-blocking）

**CSS：**

```html
<!-- ❌ 阻塞渲染 -->
<link rel="stylesheet" href="styles.css">

<!-- ✅ 不阻塞渲染 -->
<link rel="stylesheet" href="styles.css" media="print">
<!-- 或 -->
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

**JavaScript：**

```html
<!-- ❌ 阻塞 HTML 解析和渲染 -->
<script src="app.js"></script>

<!-- ✅ 不阻塞 HTML 解析，但阻塞渲染 -->
<script async src="app.js"></script>
<!-- 下載不阻塞，執行時阻塞 -->

<!-- ✅ 不阻塞 HTML 解析，延遲執行 -->
<script defer src="app.js"></script>
<!-- 下載不阻塞，DOM 解析完成後執行 -->
```

**對比：**

| 屬性 | 下載 | 執行時機 | 阻塞 HTML 解析 | 阻塞渲染 |
|------|------|---------|--------------|---------|
| **無屬性** | 阻塞 | 立即 | ✅ | ✅ |
| **async** | 不阻塞 | 下載完成後立即 | ❌ | ✅（執行時） |
| **defer** | 不阻塞 | DOM 解析完成後 | ❌ | ❌ |

### 優化策略

#### 1. 內聯關鍵 CSS（Critical CSS）

**問題：** 外部 CSS 文件會阻塞渲染

```html
<!-- ❌ 阻塞渲染 -->
<link rel="stylesheet" href="styles.css">
```

**解決方案：**

```html
<!-- ✅ 內聯關鍵 CSS -->
<style>
  /* 首屏可見內容的樣式 */
  body { font-family: Arial; }
  .header { background: #333; }
  .hero { padding: 50px; }
</style>

<!-- 非關鍵 CSS 異步載入 -->
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

**自動提取關鍵 CSS：**

```javascript
// 使用工具自動提取
// - critical
// - purgecss
// - uncss

// Next.js 自動優化
// next.config.js
module.exports = {
  // Next.js 會自動內聯關鍵 CSS
};
```

#### 2. 優化 JavaScript 載入

```html
<!-- ❌ 阻塞渲染 -->
<script src="app.js"></script>

<!-- ✅ 使用 defer -->
<script defer src="app.js"></script>

<!-- ✅ 使用 async（如果不需要 DOM）-->
<script async src="analytics.js"></script>

<!-- ✅ 動態載入 -->
<script>
  const script = document.createElement('script');
  script.src = 'app.js';
  document.body.appendChild(script);
</script>
```

#### 3. 預載入關鍵資源

```html
<!-- 預載入關鍵資源 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="hero-image.jpg" as="image">
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="app.js" as="script">

<!-- 預連接（DNS 查找、TCP 握手）-->
<link rel="preconnect" href="https://api.example.com">
<link rel="dns-prefetch" href="https://cdn.example.com">
```

#### 4. 減少重排和重繪

```javascript
// ❌ 觸發多次重排
element.style.width = '100px';
element.style.height = '100px';
element.style.left = '10px';
element.style.top = '10px';

// ✅ 使用 CSS 類（一次重排）
element.classList.add('new-style');

// ✅ 或使用 requestAnimationFrame
requestAnimationFrame(() => {
  element.style.width = '100px';
  element.style.height = '100px';
  element.style.left = '10px';
  element.style.top = '10px';
});

// ✅ 讀取和寫入分離
// 先讀取所有需要的值
const width = element.offsetWidth;
const height = element.offsetHeight;

// 再批量寫入
element.style.width = width + 10 + 'px';
element.style.height = height + 10 + 'px';
```

#### 5. 使用 will-change 提示

```css
/* 提示瀏覽器優化特定屬性 */
.animated {
  will-change: transform;
  /* 瀏覽器會提前創建圖層，優化動畫性能 */
}

/* 動畫結束後移除 */
.animated.animation-complete {
  will-change: auto;
}
```

### 實際優化範例

#### 範例一：優化首屏載入

**Before（未優化）：**

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css"> <!-- 阻塞 -->
  <script src="app.js"></script> <!-- 阻塞 -->
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
```

**渲染時間線：**

```
0ms:    開始下載 HTML
50ms:   下載 HTML 完成
        ↓
100ms:  開始下載 CSS（阻塞渲染）
500ms:  下載 CSS 完成
        ↓
600ms:  開始下載 JS（阻塞渲染）
1000ms: 下載 JS 完成
        ↓
1100ms: 執行 JS
1200ms: 首次渲染
```

**After（優化後）：**

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 內聯關鍵 CSS -->
  <style>
    body { font-family: Arial; margin: 0; }
    h1 { color: #333; font-size: 24px; }
  </style>
  
  <!-- 預載入非關鍵資源 -->
  <link rel="preload" href="styles.css" as="style">
  <link rel="preload" href="app.js" as="script">
</head>
<body>
  <h1>Hello World</h1>
  
  <!-- 非關鍵 CSS 異步載入 -->
  <link rel="stylesheet" href="styles.css" media="print" onload="this.media='all'">
  
  <!-- JS 延遲載入 -->
  <script defer src="app.js"></script>
</body>
</html>
```

**優化後的時間線：**

```
0ms:    開始下載 HTML
50ms:   下載 HTML 完成
        ↓
100ms:  解析 HTML，內聯 CSS 已可用
150ms:  首次渲染（FCP）✅
        ↓
200ms:  開始下載非關鍵 CSS（不阻塞）
300ms:  開始下載 JS（不阻塞）
800ms:  CSS 下載完成
1000ms: JS 下載完成，DOM 解析完成後執行
```

#### 範例二：Next.js 自動優化

```jsx
// Next.js 自動優化 CRP
// 1. 自動內聯關鍵 CSS
// 2. 自動代碼分割
// 3. 自動預載入關鍵資源

import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
        {/* Next.js 自動處理 */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin />
      </Head>
      <h1>Hello World</h1>
    </>
  );
}
```

### 性能指標和測量

#### 使用 Chrome DevTools

```javascript
// Performance 面板
// 1. 打開 DevTools → Performance
// 2. 點擊 Record
// 3. 重新載入頁面
// 4. 停止錄製
// 5. 查看時間線

// 關鍵指標：
// - FCP (First Contentful Paint)
// - LCP (Largest Contentful Paint)
// - TTI (Time to Interactive)
// - TBT (Total Blocking Time)
```

#### 使用 Performance API

```javascript
// 測量 FCP
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === 'first-contentful-paint') {
      console.log('FCP:', entry.startTime, 'ms');
    }
  }
});

observer.observe({ entryTypes: ['paint'] });

// 測量 LCP
const lcpObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.startTime, 'ms');
});

lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
```

#### 使用 Web Vitals

```javascript
// 使用 web-vitals 庫
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getFCP(console.log);
getLCP(console.log);
getCLS(console.log);
getFID(console.log);
getTTFB(console.log);
```

### 常見問題和解決方案

#### 問題一：FOUC（Flash of Unstyled Content）

**原因：** CSS 載入延遲，導致頁面先顯示無樣式內容

**解決方案：**

```html
<!-- 方式一：內聯關鍵 CSS -->
<style>
  /* 關鍵樣式 */
</style>

<!-- 方式二：使用 loading 狀態 -->
<div id="loading">Loading...</div>
<style>
  #loading { display: none; }
  body.loaded #loading { display: block; }
</style>
```

#### 問題二：JavaScript 阻塞渲染

**解決方案：**

```html
<!-- ✅ 使用 defer -->
<script defer src="app.js"></script>

<!-- ✅ 或動態載入 -->
<script>
  window.addEventListener('load', () => {
    const script = document.createElement('script');
    script.src = 'app.js';
    document.body.appendChild(script);
  });
</script>
```

#### 問題三：字體載入阻塞渲染

**解決方案：**

```css
/* ✅ 使用 font-display */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap; /* 立即顯示，字體載入後替換 */
  /* 或 */
  font-display: optional; /* 如果載入慢，使用備用字體 */
}
```

### 最佳實踐總結

**1. 優化 HTML**
- 最小化 HTML 大小
- 避免阻塞腳本
- 使用 defer/async

**2. 優化 CSS**
- 內聯關鍵 CSS
- 延遲載入非關鍵 CSS
- 移除未使用的 CSS

**3. 優化 JavaScript**
- 代碼分割
- 使用 defer/async
- 延遲載入非關鍵腳本

**4. 優化資源載入**
- 使用 preload 預載入關鍵資源
- 使用 preconnect 預連接
- 優化圖片（懶加載、響應式）

**5. 減少重排和重繪**
- 批量讀寫 DOM
- 使用 CSS 類而不是內聯樣式
- 使用 transform 和 opacity 做動畫

**6. 監控性能**
- 使用 Performance API
- 使用 Web Vitals
- 定期檢查 Lighthouse 分數

### 總結

**Critical Rendering Path 核心要點：**

1. **渲染流程**
   - DOM → CSSOM → Render Tree → Layout → Paint → Composite

2. **阻塞資源**
   - CSS：渲染阻塞
   - JavaScript：解析和執行阻塞

3. **優化策略**
   - 內聯關鍵 CSS
   - 延遲載入非關鍵資源
   - 使用 defer/async
   - 減少重排和重繪

4. **性能指標**
   - FCP < 1.8s
   - LCP < 2.5s
   - TTI < 3.8s

5. **工具**
   - Chrome DevTools Performance
   - Lighthouse
   - Web Vitals

理解 Critical Rendering Path 對於優化 Web 性能至關重要，正確的優化可以大幅提升用戶體驗。
