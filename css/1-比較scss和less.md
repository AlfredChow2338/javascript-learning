## SCSS vs LESS 比較

### 基本介紹

**SCSS（Sassy CSS）**
- 基於 Sass（Syntactically Awesome Style Sheets）
- 完全相容 CSS 語法（`.scss` 檔案）
- 也可以用縮排語法（`.sass` 檔案，但較少用）
- 用 Ruby 編寫，後來用 C/C++ 重寫（LibSass，現已棄用），現在主要用 Dart Sass

**LESS（Leaner Style Sheets）**
- 語法接近 CSS
- 用 JavaScript 編寫（Node.js）
- 可以在瀏覽器端或伺服器端編譯

### 語法比較

**變數（Variables）**

SCSS：
```scss
$primary-color: #3498db;
$font-size: 16px;

.button {
  color: $primary-color;
  font-size: $font-size;
}
```

LESS：
```less
@primary-color: #3498db;
@font-size: 16px;

.button {
  color: @primary-color;
  font-size: @font-size;
}
```

**嵌套（Nesting）**

兩者語法相同：
```scss
// SCSS
.nav {
  ul {
    margin: 0;
    li {
      display: inline-block;
    }
  }
}
```

```less
// LESS
.nav {
  ul {
    margin: 0;
    li {
      display: inline-block;
    }
  }
}
```

**Mixins**

SCSS：
```scss
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  @include flex-center;
}

// 帶參數的 mixin
@mixin border-radius($radius) {
  border-radius: $radius;
}

.box {
  @include border-radius(10px);
}
```

LESS：
```less
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  .flex-center();
}

// 帶參數的 mixin
.border-radius(@radius) {
  border-radius: @radius;
}

.box {
  .border-radius(10px);
}
```

**函數（Functions）**

SCSS：
```scss
$base-size: 16px;

@function rem($px) {
  @return $px / $base-size * 1rem;
}

.text {
  font-size: rem(24px); // 1.5rem
}
```

LESS：
```less
@base-size: 16px;

.rem(@px) {
  @return: (@px / @base-size) * 1rem;
}

.text {
  font-size: .rem(24px); // 1.5rem
}
```

### 功能比較

| 功能 | SCSS | LESS |
|------|------|------|
| 變數 | `$variable` | `@variable` |
| Mixins | `@mixin` / `@include` | `.mixin()` |
| 函數 | `@function` | `.function()` |
| 嵌套 | ✅ | ✅ |
| 運算 | ✅ | ✅ |
| 顏色函數 | 豐富 | 較少 |
| 條件語句 | `@if` / `@else` | `.when()` |
| 迴圈 | `@for` / `@each` / `@while` | `.loop()` |
| 模組化 | `@import` / `@use` | `@import` |
| 父選擇器 | `&` | `&` |

### 進階功能對比

**1. 條件語句**

SCSS：
```scss
$theme: 'dark';

.button {
  @if $theme == 'dark' {
    background: #000;
    color: #fff;
  } @else {
    background: #fff;
    color: #000;
  }
}
```

LESS：
```less
@theme: 'dark';

.button {
  & when (@theme = 'dark') {
    background: #000;
    color: #fff;
  }
  & when (@theme = 'light') {
    background: #fff;
    color: #000;
  }
}
```

**2. 迴圈**

SCSS：
```scss
@for $i from 1 through 5 {
  .col-#{$i} {
    width: percentage($i / 5);
  }
}

// 或
@each $color in red, blue, green {
  .text-#{$color} {
    color: $color;
  }
}
```

LESS：
```less
.loop(@counter) when (@counter > 0) {
  .loop((@counter - 1));
  .col-@{counter} {
    width: percentage(@counter / 5);
  }
}
.loop(5);
```

**3. 顏色函數**

SCSS 顏色函數更豐富：
```scss
$color: #3498db;

lighten($color, 20%)    // 變亮
darken($color, 20%)     // 變暗
saturate($color, 20%)   // 增加飽和度
desaturate($color, 20%) // 降低飽和度
mix($color1, $color2, 50%) // 混合顏色
adjust-hue($color, 30deg)  // 調整色相
```

LESS：
```less
@color: #3498db;

lighten(@color, 20%)
darken(@color, 20%)
saturate(@color, 20%)
desaturate(@color, 20%)
mix(@color1, @color2, 50%)
```

**4. 模組化**

SCSS（推薦使用 `@use`，`@import` 已棄用）：
```scss
// _variables.scss
$primary: #3498db;

// main.scss
@use 'variables' as vars;

.button {
  color: vars.$primary;
}
```

LESS：
```less
// variables.less
@primary: #3498db;

// main.less
@import 'variables';

.button {
  color: @primary;
}
```

### 優缺點比較

**SCSS 優點：**
- ✅ 功能更強大（更多內建函數）
- ✅ 語法更接近程式語言（`@if`、`@for`）
- ✅ 社群更大，資源更多
- ✅ 更好的工具支援（VS Code、WebStorm）
- ✅ `@use` 和 `@forward` 提供更好的模組系統
- ✅ 編譯速度較快（Dart Sass）

**SCSS 缺點：**
- ❌ 學習曲線稍陡
- ❌ 某些功能語法較複雜

**LESS 優點：**
- ✅ 語法更簡單直觀
- ✅ 可以在瀏覽器端編譯（較少用）
- ✅ 與 CSS 更接近，容易上手

**LESS 缺點：**
- ❌ 功能較少
- ❌ 社群較小
- ❌ 編譯速度較慢
- ❌ 模組系統較弱

### 實際使用場景

**選擇 SCSS 的情況：**
- 大型專案，需要複雜的樣式邏輯
- 需要豐富的顏色處理功能
- 團隊熟悉程式語言概念
- 使用 Bootstrap（Bootstrap 4+ 使用 SCSS）
- 需要更好的模組化系統

**選擇 LESS 的情況：**
- 小型專案，樣式邏輯簡單
- 團隊不熟悉預處理器
- 使用 Ant Design（Ant Design 使用 LESS）
- 需要在瀏覽器端編譯（較少見）

### 編譯工具

**SCSS：**
```bash
# 使用 Dart Sass（官方推薦）
npm install -g sass
sass input.scss output.css

# 或使用 node-sass（已棄用，不推薦）
npm install -g node-sass
```

**LESS：**
```bash
npm install -g less
lessc input.less output.css
```

### 與現代 CSS 的關係

現代 CSS 已經支援很多預處理器的功能：

```css
/* CSS Variables（原生變數）*/
:root {
  --primary-color: #3498db;
}

.button {
  color: var(--primary-color);
}

/* CSS Nesting（Chrome 112+）*/
.nav {
  & ul {
    margin: 0;
  }
}

/* CSS @import（原生模組化）*/
@import 'variables.css';
```

**但預處理器仍有價值：**
- Mixins（CSS 還沒有）
- 函數和運算（CSS 有 `calc()`，但功能有限）
- 條件語句和迴圈（CSS 沒有）
- 顏色函數（CSS 有，但較少）

### 總結

**SCSS 更適合：**
- 大多數現代專案
- 需要強大功能的場景
- 大型團隊協作

**LESS 更適合：**
- 簡單專案
- 已經在使用 LESS 的專案（如 Ant Design）
- 團隊偏好簡單語法

**趨勢：**
SCSS 是目前的主流選擇，社群更大、工具支援更好、功能更強大。LESS 雖然仍然可用，但新專案通常選擇 SCSS。

**建議：**
如果沒有特殊需求，選擇 **SCSS**。它已經成為業界標準，資源和支援都更完善。
