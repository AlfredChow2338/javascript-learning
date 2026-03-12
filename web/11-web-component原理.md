## Web Component 原理

### 什麼是 Web Component

**Web Component** 是一套瀏覽器原生標準，允許創建可重用的自定義 HTML 元素，封裝功能和樣式，實現真正的組件化開發。

**核心技術：**
- **Custom Elements（自定義元素）**：定義新的 HTML 標籤
- **Shadow DOM（影子 DOM）**：封裝樣式和結構
- **HTML Templates（HTML 模板）**：定義可重用的模板
- **ES Modules（ES 模塊）**：模塊化組織代碼

**核心特點：**
- **原生支持**：不需要框架，瀏覽器原生支持
- **封裝性**：樣式和結構完全隔離
- **可重用性**：一次定義，到處使用
- **框架無關**：可以在任何框架中使用

### 為什麼需要 Web Component

**問題場景：**
- 不同框架的組件無法直接共享
- 樣式污染和命名衝突
- 需要封裝的、可重用的 UI 組件
- 跨框架的組件庫需求

**Web Component 的優勢：**
- 框架無關，可以在 React、Vue、Angular 中使用
- 樣式完全隔離，不會污染全局
- 原生支持，無需額外依賴
- 標準化，未來兼容性好

---

## 一、Custom Elements（自定義元素）

### 1.1 基本概念

**Custom Elements** 允許定義新的 HTML 標籤，擴展 HTML 的能力。

**兩種類型：**
1. **Autonomous Custom Elements**：完全自定義的元素
2. **Customized Built-in Elements**：擴展現有 HTML 元素

### 1.2 定義自定義元素

**Autonomous Custom Elements：**

```javascript
// 定義自定義元素類
class MyButton extends HTMLElement {
  constructor() {
    super();
    // 初始化邏輯
    this.textContent = 'Click me';
    this.addEventListener('click', this.handleClick);
  }
  
  handleClick() {
    console.log('Button clicked!');
  }
  
  // 生命週期回調
  connectedCallback() {
    console.log('元素被插入到 DOM');
  }
  
  disconnectedCallback() {
    console.log('元素從 DOM 中移除');
  }
  
  adoptedCallback() {
    console.log('元素被移動到新文檔');
  }
  
  static get observedAttributes() {
    return ['disabled', 'label'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`屬性 ${name} 從 ${oldValue} 變為 ${newValue}`);
  }
}

// 註冊自定義元素
customElements.define('my-button', MyButton);
```

**使用：**

```html
<my-button></my-button>
<my-button disabled label="Submit"></my-button>
```

### 1.3 Customized Built-in Elements

**擴展現有元素：**

```javascript
class MyInput extends HTMLInputElement {
  constructor() {
    super();
    this.type = 'text';
    this.placeholder = 'Enter text...';
  }
  
  connectedCallback() {
    this.addEventListener('input', this.handleInput);
  }
  
  handleInput(e) {
    console.log('Input value:', e.target.value);
  }
}

// 註冊時需要指定 extends
customElements.define('my-input', MyInput, { extends: 'input' });
```

**使用：**

```html
<input is="my-input">
```

### 1.4 生命週期回調

**四個生命週期回調：**

```javascript
class LifecycleExample extends HTMLElement {
  // 1. constructor：元素創建時調用
  constructor() {
    super();
    console.log('constructor');
  }
  
  // 2. connectedCallback：元素插入到 DOM 時調用
  connectedCallback() {
    console.log('connectedCallback');
  }
  
  // 3. disconnectedCallback：元素從 DOM 移除時調用
  disconnectedCallback() {
    console.log('disconnectedCallback');
  }
  
  // 4. adoptedCallback：元素被移動到新文檔時調用
  adoptedCallback() {
    console.log('adoptedCallback');
  }
  
  // 5. attributeChangedCallback：觀察的屬性變化時調用
  static get observedAttributes() {
    return ['value'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`attributeChangedCallback: ${name} = ${newValue}`);
  }
}
```

---

## 二、Shadow DOM（影子 DOM）

### 2.1 什麼是 Shadow DOM

**Shadow DOM** 提供封裝的 DOM 樹，與主文檔的 DOM 隔離，樣式和結構不會影響外部，外部也無法訪問內部。

**核心概念：**
- **Shadow Host**：附加 Shadow DOM 的元素
- **Shadow Root**：Shadow DOM 的根節點
- **Shadow Tree**：Shadow DOM 內的 DOM 樹

### 2.2 創建 Shadow DOM

**基本用法：**

```javascript
class ShadowExample extends HTMLElement {
  constructor() {
    super();
    
    // 創建 Shadow Root
    const shadow = this.attachShadow({ mode: 'open' });
    
    // 創建樣式
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        padding: 16px;
        background: #f0f0f0;
      }
      
      .content {
        color: #333;
      }
    `;
    
    // 創建內容
    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = 'Shadow DOM Content';
    
    // 添加到 Shadow Root
    shadow.appendChild(style);
    shadow.appendChild(content);
  }
}

customElements.define('shadow-example', ShadowExample);
```

### 2.3 Shadow DOM 的模式

**兩種模式：**

```javascript
// 1. open 模式：外部可以訪問 Shadow DOM
const shadow = this.attachShadow({ mode: 'open' });
const shadowRoot = this.shadowRoot; // 可以訪問

// 2. closed 模式：外部無法訪問 Shadow DOM
const shadow = this.attachShadow({ mode: 'closed' });
const shadowRoot = this.shadowRoot; // null，無法訪問
```

### 2.4 樣式封裝

**Shadow DOM 的樣式隔離：**

```javascript
class StyledButton extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
      button {
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
      }
      
      button:hover {
        background: #0056b3;
      }
    `;
    
    const button = document.createElement('button');
    button.textContent = 'Click me';
    
    shadow.appendChild(style);
    shadow.appendChild(button);
  }
}

// 外部樣式不會影響 Shadow DOM 內的樣式
// Shadow DOM 內的樣式也不會影響外部
```

### 2.5 :host 偽類

**:host 用於樣式化 Shadow Host：**

```javascript
const style = document.createElement('style');
style.textContent = `
  :host {
    display: block;
    padding: 16px;
  }
  
  :host(:hover) {
    background: #f0f0f0;
  }
  
  :host([disabled]) {
    opacity: 0.5;
    pointer-events: none;
  }
`;
```

### 2.6 ::slotted() 偽元素

**::slotted() 用於樣式化插槽內容：**

```javascript
class SlottedExample extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
      ::slotted(p) {
        color: blue;
      }
      
      ::slotted(.highlight) {
        background: yellow;
      }
    `;
    
    shadow.innerHTML = `
      <style>${style.textContent}</style>
      <slot></slot>
    `;
  }
}

// 使用
// <slotted-example>
//   <p>This will be blue</p>
//   <p class="highlight">This will have yellow background</p>
// </slotted-example>
```

---

## 三、HTML Templates（HTML 模板）

### 3.1 基本用法

**`<template>` 標籤定義可重用的模板：**

```html
<template id="user-card-template">
  <div class="user-card">
    <img class="avatar" src="" alt="">
    <h3 class="name"></h3>
    <p class="email"></p>
  </div>
</template>
```

**在 JavaScript 中使用：**

```javascript
const template = document.getElementById('user-card-template');
const content = template.content.cloneNode(true);

content.querySelector('.avatar').src = 'user.jpg';
content.querySelector('.name').textContent = 'John Doe';
content.querySelector('.email').textContent = 'john@example.com';

document.body.appendChild(content);
```

### 3.2 在 Web Component 中使用

```javascript
class UserCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    
    // 獲取模板
    const template = document.getElementById('user-card-template');
    const content = template.content.cloneNode(true);
    
    // 設置內容
    const name = this.getAttribute('name');
    const email = this.getAttribute('email');
    const avatar = this.getAttribute('avatar');
    
    content.querySelector('.name').textContent = name;
    content.querySelector('.email').textContent = email;
    content.querySelector('.avatar').src = avatar;
    
    shadow.appendChild(content);
  }
}

customElements.define('user-card', UserCard);
```

**使用：**

```html
<user-card 
  name="John Doe" 
  email="john@example.com" 
  avatar="user.jpg">
</user-card>
```

---

## 四、完整的 Web Component 示例

### 4.1 簡單的按鈕組件

```javascript
class CustomButton extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    
    // 樣式
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: inline-block;
      }
      
      button {
        background: var(--button-bg, #007bff);
        color: var(--button-color, white);
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.3s;
      }
      
      button:hover {
        background: var(--button-hover-bg, #0056b3);
      }
      
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    
    // 按鈕元素
    const button = document.createElement('button');
    button.textContent = this.getAttribute('label') || 'Button';
    
    // 事件處理
    button.addEventListener('click', () => {
      if (!this.hasAttribute('disabled')) {
        this.dispatchEvent(new CustomEvent('button-click', {
          bubbles: true,
          detail: { label: button.textContent }
        }));
      }
    });
    
    shadow.appendChild(style);
    shadow.appendChild(button);
    
    this._button = button;
  }
  
  static get observedAttributes() {
    return ['label', 'disabled'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'label') {
      this._button.textContent = newValue;
    } else if (name === 'disabled') {
      this._button.disabled = newValue !== null;
    }
  }
}

customElements.define('custom-button', CustomButton);
```

**使用：**

```html
<custom-button label="Click me"></custom-button>
<custom-button label="Submit" disabled></custom-button>

<script>
  document.querySelector('custom-button').addEventListener('button-click', (e) => {
    console.log('Button clicked:', e.detail);
  });
</script>
```

### 4.2 帶插槽的卡片組件

```javascript
class CardComponent extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        margin: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .header {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 12px;
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
      }
      
      .content {
        margin: 12px 0;
      }
      
      .footer {
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #666;
      }
    `;
    
    shadow.innerHTML = `
      <div class="header">
        <slot name="header">Default Header</slot>
      </div>
      <div class="content">
        <slot></slot>
      </div>
      <div class="footer">
        <slot name="footer">Default Footer</slot>
      </div>
    `;
    
    shadow.appendChild(style);
  }
}

customElements.define('card-component', CardComponent);
```

**使用：**

```html
<card-component>
  <span slot="header">My Card Title</span>
  <p>This is the main content of the card.</p>
  <span slot="footer">Card Footer</span>
</card-component>
```

---

## 五、與框架集成

### 5.1 在 React 中使用

```jsx
import React, { useEffect, useRef } from 'react';

function App() {
  const buttonRef = useRef(null);
  
  useEffect(() => {
    const button = buttonRef.current;
    
    const handleClick = (e) => {
      console.log('Button clicked:', e.detail);
    };
    
    button.addEventListener('button-click', handleClick);
    
    return () => {
      button.removeEventListener('button-click', handleClick);
    };
  }, []);
  
  return (
    <div>
      <custom-button 
        ref={buttonRef}
        label="React Button"
      />
    </div>
  );
}
```

### 5.2 在 Vue 中使用

```vue
<template>
  <div>
    <custom-button 
      ref="button"
      label="Vue Button"
      @button-click="handleClick"
    />
  </div>
</template>

<script>
export default {
  methods: {
    handleClick(e) {
      console.log('Button clicked:', e.detail);
    }
  }
}
</script>
```

---

## 六、高級特性

### 6.1 屬性反射

**將屬性同步到屬性：**

```javascript
class ReflectedExample extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }
  
  get value() {
    return this.getAttribute('value');
  }
  
  set value(newValue) {
    if (newValue) {
      this.setAttribute('value', newValue);
    } else {
      this.removeAttribute('value');
    }
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value') {
      this._updateDisplay(newValue);
    }
  }
  
  _updateDisplay(value) {
    // 更新顯示
  }
}
```

### 6.2 自定義事件

**創建和派發自定義事件：**

```javascript
class EventExample extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', () => {
      // 派發自定義事件
      this.dispatchEvent(new CustomEvent('custom-event', {
        bubbles: true,
        composed: true, // 允許事件穿透 Shadow DOM
        detail: {
          message: 'Custom event fired',
          timestamp: Date.now()
        }
      }));
    });
  }
}
```

### 6.3 樣式主題化

**使用 CSS 變量實現主題：**

```javascript
class ThemedButton extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
      button {
        background: var(--theme-primary, #007bff);
        color: var(--theme-text, white);
        border: 2px solid var(--theme-border, transparent);
        padding: 10px 20px;
        border-radius: var(--theme-radius, 4px);
      }
    `;
    
    const button = document.createElement('button');
    button.textContent = 'Themed Button';
    
    shadow.appendChild(style);
    shadow.appendChild(button);
  }
}
```

**使用：**

```css
:root {
  --theme-primary: #28a745;
  --theme-text: white;
  --theme-border: #1e7e34;
  --theme-radius: 8px;
}
```

---

## 七、最佳實踐

### 7.1 命名規範

```javascript
// ✅ 好的命名：使用連字符，至少兩個單詞
customElements.define('user-card', UserCard);
customElements.define('custom-button', CustomButton);

// ❌ 不好的命名：單詞、沒有連字符
customElements.define('button', Button); // 錯誤
customElements.define('userCard', UserCard); // 錯誤
```

### 7.2 生命週期管理

```javascript
class LifecycleExample extends HTMLElement {
  constructor() {
    super();
    this._timer = null;
  }
  
  connectedCallback() {
    // 在 connectedCallback 中設置事件監聽器
    this.addEventListener('click', this.handleClick);
    
    // 啟動定時器
    this._timer = setInterval(() => {
      this.update();
    }, 1000);
  }
  
  disconnectedCallback() {
    // 清理事件監聽器
    this.removeEventListener('click', this.handleClick);
    
    // 清理定時器
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
  
  handleClick = (e) => {
    // 使用箭頭函數，避免 this 綁定問題
  }
}
```
