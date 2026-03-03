## CSS Grid 原理和基本語法

### 什麼是 CSS Grid

**CSS Grid** 是一個二維佈局系統，可以同時控制行（row）和列（column）。與 Flexbox（一維佈局）不同，Grid 專為複雜的網格佈局設計。

**核心概念：**
- **Grid Container（網格容器）**：設置 `display: grid` 的元素
- **Grid Item（網格項目）**：Grid Container 的直接子元素
- **Grid Line（網格線）**：劃分網格的線
- **Grid Track（網格軌道）**：兩條網格線之間的空間（行或列）
- **Grid Cell（網格單元）**：行和列的交集
- **Grid Area（網格區域）**：一個或多個網格單元組成的矩形區域

### Grid vs Flexbox

| 特性 | Grid | Flexbox |
|------|------|---------|
| **維度** | 二維（行 + 列） | 一維（行或列） |
| **適用場景** | 複雜網格佈局 | 單方向排列 |
| **控制方式** | 同時控制行和列 | 一次只控制一個方向 |
| **重疊** | ✅ 支援 | ❌ 不支援 |

**選擇建議：**
- **Grid**：整體頁面佈局、複雜網格、需要精確控制位置
- **Flexbox**：組件內部佈局、單方向排列、對齊和分佈

### 基本語法

#### 1. 創建 Grid Container

```css
.container {
  display: grid;
  /* 或 */
  display: inline-grid; /* 行內網格 */
}
```

#### 2. 定義列（Columns）

```css
.container {
  display: grid;
  
  /* 方式一：固定寬度 */
  grid-template-columns: 200px 200px 200px;
  
  /* 方式二：使用 fr（fraction，分數單位）*/
  grid-template-columns: 1fr 2fr 1fr; /* 1:2:1 的比例 */
  
  /* 方式三：混合使用 */
  grid-template-columns: 200px 1fr 100px;
  
  /* 方式四：重複 */
  grid-template-columns: repeat(3, 1fr); /* 等於 1fr 1fr 1fr */
  grid-template-columns: repeat(3, 200px);
  
  /* 方式五：自動填充 */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  /* 自動創建盡可能多的列，每列至少 200px，最多 1fr */
}
```

#### 3. 定義行（Rows）

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  
  /* 定義行 */
  grid-template-rows: 100px 200px 100px;
  
  /* 或使用 fr */
  grid-template-rows: 1fr 2fr 1fr;
  
  /* 或重複 */
  grid-template-rows: repeat(3, 1fr);
}
```

#### 4. 網格間距（Gap）

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  
  /* 行間距和列間距相同 */
  gap: 20px;
  
  /* 分別設置 */
  row-gap: 20px;    /* 行間距 */
  column-gap: 30px; /* 列間距 */
  
  /* 舊語法（不推薦） */
  grid-gap: 20px;
  grid-row-gap: 20px;
  grid-column-gap: 30px;
}
```

### 網格線和區域

#### 網格線編號

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

/* 
網格線編號（從 1 開始）：

列線：   1    2    3    4
        │    │    │    │
行線：1 ─┼────┼────┼────┼─
        │    │    │    │
     2 ─┼────┼────┼────┼─
        │    │    │    │
     3 ─┼────┼────┼────┼─
        │    │    │    │
     4 ─┼────┼────┼────┼─

也可以從右到左、從下到上使用負數：
-1 = 最後一條線
-2 = 倒數第二條線
*/
```

#### 使用網格線定位項目

```css
.item {
  /* 從第 1 列線到第 3 列線（跨越 2 列）*/
  grid-column-start: 1;
  grid-column-end: 3;
  
  /* 簡寫 */
  grid-column: 1 / 3;
  
  /* 從第 2 行線到第 4 行線（跨越 2 行）*/
  grid-row-start: 2;
  grid-row-end: 4;
  
  /* 簡寫 */
  grid-row: 2 / 4;
  
  /* 同時設置 */
  grid-area: 2 / 1 / 4 / 3;
  /* grid-area: row-start / col-start / row-end / col-end */
}
```

#### 使用 span 關鍵字

```css
.item {
  /* 從第 1 列開始，跨越 2 列 */
  grid-column: 1 / span 2;
  
  /* 從第 2 行開始，跨越 3 行 */
  grid-row: 2 / span 3;
  
  /* 等價於 */
  grid-column: 1 / 3;
  grid-row: 2 / 5;
}
```

### 命名網格線和區域

#### 命名網格線

```css
.container {
  display: grid;
  grid-template-columns: [start] 200px [main-start] 1fr [main-end] 200px [end];
  grid-template-rows: [header-start] 100px [header-end main-start] 1fr [main-end footer-start] 100px [footer-end];
}

.item {
  /* 使用命名線 */
  grid-column: start / end;
  grid-row: header-start / footer-end;
}
```

#### 命名網格區域

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 100px 1fr 100px;
  
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
}

.header {
  grid-area: header;
}

.sidebar {
  grid-area: sidebar;
}

.main {
  grid-area: main;
}

.aside {
  grid-area: aside;
}

.footer {
  grid-area: footer;
}
```

**視覺化：**

```
┌─────────┬─────────┬─────────┐
│ header  │ header  │ header  │
├─────────┼─────────┼─────────┤
│ sidebar │  main   │  aside  │
├─────────┼─────────┼─────────┤
│ footer  │ footer  │ footer  │
└─────────┴─────────┴─────────┘
```

### 實際應用範例

#### 範例一：經典佈局（Header, Sidebar, Main, Footer）

```css
.layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  min-height: 100vh;
  gap: 20px;
}

.header {
  grid-area: header;
  background: #333;
  color: white;
  padding: 20px;
}

.sidebar {
  grid-area: sidebar;
  background: #f5f5f5;
  padding: 20px;
}

.main {
  grid-area: main;
  padding: 20px;
}

.footer {
  grid-area: footer;
  background: #333;
  color: white;
  padding: 20px;
}
```

```html
<div class="layout">
  <header class="header">Header</header>
  <aside class="sidebar">Sidebar</aside>
  <main class="main">Main Content</main>
  <footer class="footer">Footer</footer>
</div>
```

#### 範例二：響應式卡片網格

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 響應式調整 */
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr; /* 單列 */
  }
}
```

#### 範例三：複雜網格佈局

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 10px;
}

.gallery-item:nth-child(1) {
  grid-column: 1 / 3; /* 跨越 2 列 */
  grid-row: 1 / 3;    /* 跨越 2 行 */
}

.gallery-item:nth-child(2) {
  grid-column: 3 / 5;
}

.gallery-item:nth-child(3) {
  grid-column: 3;
  grid-row: 2 / 4;
}
```

### 對齊方式

#### 項目對齊（Item Alignment）

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 100px);
  
  /* 行內對齊（水平） */
  justify-items: start;    /* 左對齊 */
  justify-items: center;    /* 居中 */
  justify-items: end;       /* 右對齊 */
  justify-items: stretch;   /* 拉伸（默認） */
  
  /* 塊級對齊（垂直） */
  align-items: start;        /* 上對齊 */
  align-items: center;      /* 居中 */
  align-items: end;         /* 下對齊 */
  align-items: stretch;     /* 拉伸（默認） */
  
  /* 簡寫 */
  place-items: center;      /* align-items 和 justify-items */
}
```

#### 單個項目對齊

```css
.item {
  /* 單個項目的對齊 */
  justify-self: center;     /* 水平居中 */
  align-self: center;       /* 垂直居中 */
  
  /* 簡寫 */
  place-self: center;        /* align-self 和 justify-self */
}
```

#### 容器對齊（Content Alignment）

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 200px);
  grid-template-rows: repeat(2, 100px);
  
  /* 當網格總尺寸小於容器時，控制整個網格的位置 */
  justify-content: center;  /* 水平居中整個網格 */
  align-content: center;    /* 垂直居中整個網格 */
  
  /* 簡寫 */
  place-content: center;
}
```

### 自動放置（Auto-placement）

#### 默認行為

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  
  /* 默認：按順序自動放置 */
  grid-auto-flow: row;      /* 先填滿行，再換行（默認） */
  grid-auto-flow: column;  /* 先填滿列，再換列 */
  grid-auto-flow: dense;   /* 密集模式，嘗試填補空隙 */
}
```

**視覺化：**

```
grid-auto-flow: row（默認）
┌───┬───┬───┐
│ 1 │ 2 │ 3 │
├───┼───┼───┤
│ 4 │ 5 │ 6 │
└───┴───┴───┘

grid-auto-flow: column
┌───┬───┐
│ 1 │ 4 │
├───┼───┤
│ 2 │ 5 │
├───┼───┤
│ 3 │ 6 │
└───┴───┘
```

#### 自動行/列大小

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  
  /* 自動創建的行的大小 */
  grid-auto-rows: 100px;        /* 固定高度 */
  grid-auto-rows: minmax(100px, auto); /* 最小 100px，最大自動 */
  
  /* 自動創建的列的大小 */
  grid-auto-columns: 200px;
}
```

### 進階功能

#### 1. minmax() 函數

```css
.container {
  display: grid;
  
  /* 每列最小 200px，最大 1fr */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  
  /* 每行最小 100px，最大自動 */
  grid-template-rows: minmax(100px, auto);
}
```

#### 2. fit-content() 函數

```css
.container {
  display: grid;
  
  /* 列寬根據內容，但不超過 300px */
  grid-template-columns: fit-content(300px) 1fr;
}
```

#### 3. subgrid（子網格）

```css
/* 父網格 */
.parent {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

/* 子網格繼承父網格的列 */
.child {
  display: grid;
  grid-column: 1 / 5; /* 跨越所有列 */
  grid-template-columns: subgrid; /* 繼承父網格的列 */
}
```

**注意：** `subgrid` 目前瀏覽器支援有限，需要檢查兼容性。

### 響應式設計

#### 使用 auto-fill / auto-fit

```css
.container {
  display: grid;
  
  /* auto-fill：創建盡可能多的列 */
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  
  /* auto-fit：自動調整列數，填滿容器 */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

**區別：**

```
容器寬度：1000px，每列最小 250px

auto-fill：創建 4 列（250px × 4 = 1000px）
┌──────┬──────┬──────┬──────┐
│ 250px│ 250px│ 250px│ 250px│
└──────┴──────┴──────┴──────┘
（即使只有 2 個項目，也會創建 4 列）

auto-fit：根據項目數量調整
┌──────────┬──────────┐
│   500px  │   500px  │
└──────────┴──────────┘
（只有 2 個項目，創建 2 列，每列 500px）
```

#### 媒體查詢

```css
.container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* 平板 */
@media (max-width: 768px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 手機 */
@media (max-width: 480px) {
  .container {
    grid-template-columns: 1fr;
  }
}
```

### Grid vs Flexbox 實際對比

#### 場景一：導航欄

```css
/* ✅ 使用 Flexbox（單方向排列）*/
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ❌ 不適合用 Grid（過度設計）*/
.nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
```

#### 場景二：卡片網格

```css
/* ✅ 使用 Grid（二維佈局）*/
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* ⚠️ 可以用 Flexbox，但需要更多代碼 */
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.card {
  flex: 1 1 300px; /* 需要計算 */
}
```

#### 場景三：複雜佈局

```css
/* ✅ 使用 Grid（需要精確控制位置）*/
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
}

/* ❌ Flexbox 難以實現這種佈局 */
```

### 常見問題和解決方案

#### 問題一：項目溢出容器

```css
/* ❌ 問題：項目超出容器 */
.container {
  display: grid;
  grid-template-columns: repeat(3, 300px); /* 固定寬度可能溢出 */
}

/* ✅ 解決：使用 fr 或 minmax */
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 自動適應 */
  /* 或 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

#### 問題二：項目對齊問題

```css
/* ❌ 問題：項目大小不一致，對齊混亂 */
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

/* ✅ 解決：使用 align-items 和 justify-items */
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: start;    /* 頂部對齊 */
  justify-items: start;   /* 左對齊 */
}
```

#### 問題三：響應式適配

```css
/* ✅ 使用 auto-fill/auto-fit 自動適配 */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

/* 或使用媒體查詢 */
@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
}
```

### 最佳實踐

#### 1. 優先使用 Grid 進行整體佈局

```css
/* ✅ 頁面整體佈局用 Grid */
.page {
  display: grid;
  grid-template-areas:
    "header"
    "main"
    "footer";
  min-height: 100vh;
}

/* ✅ 組件內部用 Flexbox */
.card {
  display: flex;
  flex-direction: column;
}
```

#### 2. 使用命名區域提高可讀性

```css
/* ✅ 清晰易讀 */
.layout {
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
```

#### 3. 利用 fr 單位實現彈性佈局

```css
/* ✅ 使用 fr 實現比例 */
.container {
  grid-template-columns: 1fr 2fr 1fr; /* 1:2:1 */
}
```

#### 4. 使用 gap 而不是 margin

```css
/* ✅ 使用 gap */
.container {
  display: grid;
  gap: 20px;
}

/* ❌ 避免使用 margin */
.item {
  margin: 10px; /* 會導致間距不一致 */
}
```

### 總結

**CSS Grid 核心要點：**

1. **基本概念**
   - Grid Container 和 Grid Item
   - Grid Line、Track、Cell、Area

2. **基本語法**
   - `display: grid`
   - `grid-template-columns` / `grid-template-rows`
   - `gap`、`grid-area`

3. **定位方式**
   - 網格線編號（1, 2, 3... 或 -1, -2...）
   - `span` 關鍵字
   - 命名區域

4. **對齊方式**
   - `justify-items` / `align-items`（項目對齊）
   - `justify-content` / `align-content`（容器對齊）

5. **響應式**
   - `auto-fill` / `auto-fit`
   - `minmax()`
   - 媒體查詢

6. **適用場景**
   - 整體頁面佈局
   - 複雜網格佈局
   - 需要精確控制位置

**與 Flexbox 的選擇：**
- **Grid**：二維佈局、整體結構
- **Flexbox**：一維佈局、組件內部

CSS Grid 是現代 Web 佈局的重要工具，掌握它可以大幅提升佈局效率和靈活性。
