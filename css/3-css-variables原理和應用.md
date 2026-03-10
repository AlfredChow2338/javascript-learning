/bin/echo '## CSS Variables 原理和應用

### 什麼是 CSS Variables（自定義屬性）

**CSS Variables（Custom Properties）** 是定義在 CSS 中的變量，可以在整個樣式表中重用。語法使用 `--variable-name` 定義，在 `var(--variable-name)` 中使用。

```css
:root {
  --primary-color: #1e90ff;
  --secondary-color: #ff9f1c;
  --border-radius-md: 8px;
}

.button {
  background-color: var(--primary-color);
  border-radius: var(--border-radius-md);
}
```

**特點：**
- **動態性**：可以在運行時通過 JavaScript 修改
- **繼承性**：遵循 CSS 的繼承規則
- **作用域**：可以定義在任意選擇器上
- **與普通變量不同**：不是預處理器（如 SCSS）的編譯期變量，而是運行時變量

---

### CSS Variables vs SCSS 變量

| 特性 | CSS Variables | SCSS 變量 |
|------|---------------|-----------|
| **計算時機** | 運行時 | 編譯時 |
| **是否可被 JS 修改** | ✅ 可以 | ❌ 不可以 |
| **作用域** | CSS 繼承樹 | 文件/導入範圍 |
| **條件/媒體查詢** | 可以在不同媒體查詢中覆蓋 | 需要額外邏輯 |

```scss
// SCSS 變量（編譯時）
$primary-color: #1e90ff;

.button {
  background-color: $primary-color; // 編譯時替換
}
```

```css
/* CSS Variables（運行時） */
:root {
  --primary-color: #1e90ff;
}

.button {
  background-color: var(--primary-color); // 運行時解析
}
```

---

### 作用域與繼承

**1. 定義在 `:root`（全局變量）**

```css
:root {
  --font-size-base: 16px;
  --text-color: #222;
}

body {
  font-size: var(--font-size-base);
  color: var(--text-color);
}
```

**2. 局部變量與覆蓋**

```css
.card {
  --card-padding: 16px;
  padding: var(--card-padding);
}

.card.large {
  --card-padding: 24px; /* 覆蓋局部變量 */
}
```

**3. 繼承規則**

- 在某個元素上定義的 CSS Variable 會被其子元素繼承
- 子元素可以覆蓋父元素的變量

```css
.container {
  --theme-color: #1e90ff;
}

.button {
  color: var(--theme-color); /* 如果在 .container 內，會繼承 */
}

.button.warning {
  --theme-color: #ff4d4f; /* 覆蓋父級定義 */
}
```

---

### var() 語法與後備值（Fallback）

```css
.element {
  color: var(--text-color, #000); /* 如果 --text-color 未定義，使用 #000 */
}
```

**規則：**
- `var(--name, fallback)` 中的 `fallback` 只有在變量未定義或是無效值時才會生效
- 可以嵌套使用 `var()` 作為 `fallback`

```css
.element {
  color: var(--text-color, var(--default-text-color, #000));
}
```

---

### JavaScript 操作 CSS Variables

**1. 操作根節點變量**

```javascript
// 設置根節點變量
const root = document.documentElement;

// 設置變量
root.style.setProperty('--primary-color', '#ff4d4f');

// 讀取變量
const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
console.log(primaryColor); // #ff4d4f
```

**2. 操作特定元素變量**

```javascript
const card = document.querySelector('.card');

// 設置局部變量
card.style.setProperty('--card-padding', '32px');

// 此時只有該 card 的 padding 會變大
```

**3. 動態主題切換（Dark / Light Mode）**

```css
:root {
  --bg-color: #ffffff;
  --text-color: #111827;
}

:root[data-theme="dark"] {
  --bg-color: #0b1120;
  --text-color: #e5e7eb;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```

```javascript
function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
}

// 綁定按鈕
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
```

---

### 與設計系統 / Design Tokens 結合

**1. 定義 Design Tokens**

```css
:root {
  /* 色彩 */
  --color-primary: #1d4ed8;
  --color-primary-soft: #dbeafe;
  --color-success: #16a34a;
  --color-danger: #dc2626;

  /* 字體 */
  --font-family-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;

  /* 間距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
}

.button {
  font-family: var(--font-family-sans);
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-primary);
}

.button--danger {
  background-color: var(--color-danger);
}
```

**2. 按主題覆蓋 Tokens**

```css
:root[data-theme="binance"] {
  --color-primary: #fcd535; /* Binance 黃 */
  --color-primary-soft: #fef3c7;
}
```

---

### Media Query + CSS Variables

**根據螢幕尺寸動態調整變量：**

```css
:root {
  --layout-max-width: 1200px;
}

@media (max-width: 1024px) {
  :root {
    --layout-max-width: 100%;
  }
}

.container {
  max-width: var(--layout-max-width);
  margin: 0 auto;
}
```

**配合 prefers-color-scheme 自動主題：**

```css
:root {
  --bg-color: #ffffff;
  --text-color: #111827;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #020617;
    --text-color: #e5e7eb;
  }
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
```

---

### 常見陷阱

**1. 拼寫錯誤 / 未定義變量**

```css
.element {
  color: var(--text-colr); /* 拼錯，會變成初始值或繼承值 */
}
```

**解決：**
- 使用 `var(--text-color, #000)` 提供後備值
- 在編譯階段使用 Lint 工具檢查

**2. 作用域誤解**

```css
.component {
  --component-color: red;
}

.other {
  color: var(--component-color); /* 取不到，因為不在 .component 作用域內 */
}
```

**解決：**
- 全局變量定義在 `:root`
- 局部變量只在需要覆蓋的地方定義

**3. 與 JS 操作衝突**

- 直接修改行內樣式可能覆蓋由 CSS Variables 控制的樣式
- 建議優先透過修改變量來實現主題切換，而不是改具體屬性

---

### 高級應用：計算和組合

**1. 結合 calc() 使用：**

```css
:root {
  --header-height: 64px;
}

.main {
  min-height: calc(100vh - var(--header-height));
}
```

**2. 動態透明度（使用同一基色）：**

```css
:root {
  --primary-rgb: 37, 99, 235; /* #2563eb */
}

.button {
  background-color: rgba(var(--primary-rgb), 1);
}

.button--soft {
  background-color: rgba(var(--primary-rgb), 0.1);
}
```

---

### 與框架的整合（React / Next.js）

**1. React 中切換主題：**

```tsx
// ThemeProvider.tsx
import { useEffect, useState } from 'react';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**2. Next.js App Router 中設計 Tokens（搭配 Tailwind）：**

- 在 `globals.css` 中定義 CSS Variables
- Tailwind 使用 `var(--color-primary)` 作為色票來源

```css
:root {
  --color-primary: 37 99 235; /* Tailwind 的 rgb 格式 */
}

.btn-primary {
  @apply bg-[rgb(var(--color-primary))] text-white;
}
```

---

### 總結

**CSS Variables 核心優勢：**
- 運行時可變，更適合主題切換、動態樣式
- 與繼承和媒體查詢結合，表達能力強
- 可以作為 Design Tokens 的實現方式

**使用建議：**
- 在 `:root` 定義設計系統級別的 Tokens（色彩、字體、間距）
- 在組件級別定義局部變量（如 `--card-padding`）
- 使用 `data-theme` 或 class 控制主題
- 避免在具體屬性上硬編碼顏色和間距，多用變量替代

理解 CSS Variables 的原理和應用，可以讓樣式系統更一致、更容易維護，也更容易支援主題切換和大型前端應用的設計系統。' > /Users/alfred/Documents/alfredchow2338/javascript-learning/css/3-css-variables原理和應用.md