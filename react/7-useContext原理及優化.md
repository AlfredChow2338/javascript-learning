## React useContext 原理及優化

### 什麼是 Context API

**Context API** 是 React 提供的跨組件數據共享機制，允許在組件樹中傳遞數據，而無需逐層通過 props 傳遞。`useContext` 是 React 16.8 引入的 Hook，用於在函數組件中消費 Context。

**為什麼需要 Context：**

當需要在多層組件中傳遞數據時，如果使用 props，會出現「props drilling」問題：

```jsx
// ❌ Props drilling：需要逐層傳遞
function App() {
  const theme = 'dark';
  return <Header theme={theme} />;
}

function Header({ theme }) {
  return <Navigation theme={theme} />;
}

function Navigation({ theme }) {
  return <Button theme={theme} />;
}

function Button({ theme }) {
  return <button className={theme}>Click</button>;
}
```

使用 Context 可以避免這個問題：

```jsx
// ✅ 使用 Context：直接消費
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Header />
    </ThemeContext.Provider>
  );
}

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click</button>;
}
```

---

## 一、React 16 之前的 Context API

### 1.1 舊版 Context API 的使用方式

**舊版 Context API（React 15 及之前）：**

```javascript
// 定義 Context
const ThemeContext = React.createContext('light');

// Provider（舊版）
class ThemeProvider extends React.Component {
  getChildContext() {
    return { theme: this.props.theme };
  }
  
  render() {
    return this.props.children;
  }
}

ThemeProvider.childContextTypes = {
  theme: PropTypes.string
};

// Consumer（舊版）
class ThemedButton extends React.Component {
  render() {
    const theme = this.context.theme;
    return <button className={theme}>{this.props.children}</button>;
  }
}

ThemedButton.contextTypes = {
  theme: PropTypes.string
};
```

### 1.2 舊版 Context 的問題

**舊版 Context 的問題：**

1. **性能問題**：Context 更新會導致所有消費該 Context 的組件重新渲染，無法優化
2. **無法中斷**：Context 更新會觸發整個子樹的重新渲染，無法中途停止
3. **API 複雜**：需要定義 `childContextTypes` 和 `contextTypes`
4. **無法追蹤**：無法知道哪些組件消費了 Context
5. **無法選擇性更新**：即使組件只使用 Context 的一部分，也會因為整個 Context 更新而重新渲染

---

## 二、React 16+ 新版 Context API

### 2.1 新版 Context API 的基本用法

**React 16.3+ 引入的新版 Context API：**

```jsx
import { createContext, useContext } from 'react';

// 1. 創建 Context
const ThemeContext = createContext('light'); // 默認值

// 2. Provider：提供值
function App() {
  const [theme, setTheme] = useState('dark');
  
  return (
    <ThemeContext.Provider value={theme}>
      <Header />
    </ThemeContext.Provider>
  );
}

// 3. Consumer：消費值（類組件）
class ThemedButton extends React.Component {
  render() {
    return (
      <ThemeContext.Consumer>
        {theme => <button className={theme}>Click</button>}
      </ThemeContext.Consumer>
    );
  }
}

// 4. useContext Hook：消費值（函數組件）
function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click</button>;
}
```

### 2.2 useContext Hook 的實現原理

**useContext 的內部實現（簡化版）：**

```javascript
function useContext(Context) {
  // 1. 獲取當前 Fiber 節點
  const fiber = currentlyRenderingFiber;
  
  // 2. 從 Fiber 樹向上查找最近的 Provider
  let contextItem = fiber.dependencies;
  
  if (contextItem !== null) {
    // 3. 檢查是否有 Context 的依賴
    if (contextItem.context === Context) {
      return contextItem.memoizedValue;
    }
    
    // 4. 遍歷依賴鏈
    contextItem = contextItem.next;
  }
  
  // 5. 如果找不到 Provider，返回默認值
  return Context._currentValue;
}
```

**Fiber 節點中的 Context 結構：**

```javascript
// Fiber 節點結構（簡化）
const fiber = {
  type: Component,
  dependencies: {
    context: ThemeContext,
    memoizedValue: 'dark',
    next: {
      context: UserContext,
      memoizedValue: { name: 'John' },
      next: null
    }
  }
};
```

### 2.3 Context 的更新機制

**當 Provider 的 value 改變時：**

```jsx
function App() {
  const [theme, setTheme] = useState('dark');
  
  return (
    <ThemeContext.Provider value={theme}>
      {/* value 改變時，所有消費該 Context 的組件都會重新渲染 */}
      <Header />
    </ThemeContext.Provider>
  );
}
```

**更新流程：**

1. Provider 的 `value` prop 改變
2. React 標記所有消費該 Context 的組件為需要更新
3. 在渲染階段，這些組件會重新渲染
4. `useContext` 返回新的值

**重要：Context 使用引用相等性比較**

```jsx
// ❌ 問題：每次渲染都創建新對象
function App() {
  return (
    <UserContext.Provider value={{ name: 'John' }}>
      {/* 每次渲染都會重新創建對象，導致所有 Consumer 重新渲染 */}
      <Header />
    </UserContext.Provider>
  );
}

// ✅ 解決：使用 useMemo 或 useState
function App() {
  const user = useMemo(() => ({ name: 'John' }), []);
  // 或
  const [user] = useState({ name: 'John' });
  
  return (
    <UserContext.Provider value={user}>
      <Header />
    </UserContext.Provider>
  );
}
```

---

## 三、Context 的性能問題

### 3.1 為什麼 Context 會導致性能問題

**問題根源：**

當 Context 的 value 改變時，**所有消費該 Context 的組件都會重新渲染**，即使它們只使用了 value 的一小部分。

```jsx
const AppContext = createContext();

function App() {
  const [user, setUser] = useState({ name: 'John', age: 30 });
  const [theme, setTheme] = useState('dark');
  
  // ❌ 問題：user 和 theme 放在同一個 Context
  return (
    <AppContext.Provider value={{ user, theme }}>
      <Header /> {/* 只使用 theme */}
      <Profile /> {/* 只使用 user */}
    </AppContext.Provider>
  );
}

function Header() {
  const { theme } = useContext(AppContext);
  // 當 user 改變時，Header 也會重新渲染（即使它不需要 user）
  return <header className={theme}>Header</header>;
}

function Profile() {
  const { user } = useContext(AppContext);
  // 當 theme 改變時，Profile 也會重新渲染（即使它不需要 theme）
  return <div>{user.name}</div>;
}
```

**渲染流程：**

```
App state 改變 (user)
  ↓
AppContext.Provider value 改變
  ↓
所有 Consumer 標記為需要更新
  ↓
Header 重新渲染（即使只使用 theme）
Profile 重新渲染（正確，因為使用 user）
```

### 3.2 Context 與 React.memo 的交互

**React.memo 無法阻止 Context 更新：**

```jsx
const Header = React.memo(function Header() {
  const { theme } = useContext(AppContext);
  return <header className={theme}>Header</header>;
});

// 即使 Header 被 memo，當 AppContext 改變時，它仍會重新渲染
// 因為 useContext 會在組件內部觸發重新渲染
```

**React.memo 只能優化 props 變化：**

```jsx
// React.memo 只比較 props，不影響 Context
const Header = React.memo(function Header({ title }) {
  const { theme } = useContext(AppContext);
  // 當 AppContext 改變時，仍會重新渲染
  // 但當 title prop 不變時，不會因為父組件重新渲染而重新渲染
  return <header className={theme}>{title}</header>;
});
```

---

## 四、Context 優化策略

### 4.1 拆分 Context（Context Splitting）

**將大 Context 拆分成多個小 Context：**

```jsx
// ❌ 單一大 Context
const AppContext = createContext();
<AppContext.Provider value={{ user, theme, settings }}>
  <App />
</AppContext.Provider>

// ✅ 拆分為多個 Context
const UserContext = createContext();
const ThemeContext = createContext();
const SettingsContext = createContext();

<UserContext.Provider value={user}>
  <ThemeContext.Provider value={theme}>
    <SettingsContext.Provider value={settings}>
      <App />
    </SettingsContext.Provider>
  </ThemeContext.Provider>
</UserContext.Provider>
```

**優化效果：**

- 只有相關的組件會重新渲染
- `theme` 改變時，只影響消費 `ThemeContext` 的組件
- `user` 改變時，只影響消費 `UserContext` 的組件

### 4.2 使用 useMemo 穩定 Context Value

**防止不必要的重新渲染：**

```jsx
function App() {
  const [user, setUser] = useState({ name: 'John' });
  const [count, setCount] = useState(0);
  
  // ❌ 問題：每次渲染都創建新對象
  const contextValue = { user, count };
  
  // ✅ 解決：使用 useMemo
  const contextValue = useMemo(
    () => ({ user, count }),
    [user, count] // 只有 user 或 count 改變時才重新創建
  );
  
  return (
    <AppContext.Provider value={contextValue}>
      <Header />
    </AppContext.Provider>
  );
}
```

### 4.3 選擇性訂閱（Selective Subscription）

**只訂閱需要的部分：**

```jsx
// 自定義 Hook：只訂閱 user
function useUser() {
  const context = useContext(AppContext);
  return context.user; // 只返回 user 部分
}

// 組件只訂閱 user，不訂閱整個 context
function Profile() {
  const user = useUser(); // 當 user 改變時才重新渲染
  return <div>{user.name}</div>;
}
```

**注意：這不會完全解決問題**

即使使用選擇性訂閱，當 `AppContext` 的 value 改變時，所有使用 `useContext(AppContext)` 的組件仍會重新渲染。選擇性訂閱只是讓代碼更清晰，不會改變渲染行為。

### 4.4 使用 useMemo 和 useCallback 優化子組件

**防止子組件不必要的重新渲染：**

```jsx
function App() {
  const [theme, setTheme] = useState('dark');
  
  return (
    <ThemeContext.Provider value={theme}>
      <ExpensiveComponent />
    </ThemeContext.Provider>
  );
}

// 使用 useMemo 緩存組件
const ExpensiveComponent = React.memo(function ExpensiveComponent() {
  const theme = useContext(ThemeContext);
  
  // 使用 useMemo 緩存計算結果
  const expensiveValue = useMemo(() => {
    // 昂貴的計算
    return computeExpensiveValue(theme);
  }, [theme]);
  
  return <div>{expensiveValue}</div>;
});
```

### 4.5 使用 Context Selector Pattern

**實現選擇性更新：**

```jsx
// 自定義 Hook：實現 Context Selector
function useContextSelector(context, selector) {
  const value = useContext(context);
  const [selectedValue, setSelectedValue] = useState(() => selector(value));
  
  useEffect(() => {
    const newSelectedValue = selector(value);
    // 只有選中的值改變時才更新
    if (newSelectedValue !== selectedValue) {
      setSelectedValue(newSelectedValue);
    }
  }, [value, selector, selectedValue]);
  
  return selectedValue;
}

// 使用
function Header() {
  // 只訂閱 theme，不訂閱 user
  const theme = useContextSelector(AppContext, ctx => ctx.theme);
  return <header className={theme}>Header</header>;
}
```

**注意：這不是 React 內置功能**

React 本身不支持 Context Selector，需要使用第三方庫（如 `use-context-selector`）或自己實現。

### 4.6 使用 useReducer 替代多個 useState

**減少 Context 更新頻率：**

```jsx
// ❌ 多個 useState，可能導致多次更新
function App() {
  const [user, setUser] = useState({ name: 'John' });
  const [theme, setTheme] = useState('dark');
  
  return (
    <AppContext.Provider value={{ user, theme, setUser, setTheme }}>
      <App />
    </AppContext.Provider>
  );
}

// ✅ 使用 useReducer，批量更新
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(appReducer, {
    user: { name: 'John' },
    theme: 'dark'
  });
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <App />
    </AppContext.Provider>
  );
}
```

---

## 五、最佳實踐

### 5.1 Context 設計原則

1. **按領域拆分 Context**：不要將所有狀態放在一個 Context 中
2. **保持 Context Value 穩定**：使用 `useMemo` 或 `useState` 穩定對象引用
3. **提供專用 Hooks**：為每個 Context 提供自定義 Hook，方便使用
4. **避免在 Context 中存儲頻繁變化的數據**：考慮使用其他狀態管理方案

### 5.2 何時使用 Context

**適合使用 Context：**
- 主題（theme）
- 用戶認證狀態
- 語言設置（i18n）
- 全局配置

**不適合使用 Context：**
- 頻繁變化的數據（如表單輸入、動畫狀態）
- 大量數據（考慮使用狀態管理庫）
- 需要選擇性訂閱的複雜狀態（考慮使用 Redux、Zustand 等）

### 5.3 Context vs 其他狀態管理方案

| 方案 | 適用場景 | 優點 | 缺點 |
|------|---------|------|------|
| Context API | 簡單的全局狀態 | 內置、簡單 | 性能問題、無法選擇性訂閱 |
| Redux | 複雜的全局狀態 | 可預測、工具豐富 | 樣板代碼多、學習曲線 |
| Zustand | 中等複雜度狀態 | 簡單、輕量 | 生態系統較小 |
| Recoil | 複雜的異步狀態 | 選擇性訂閱、異步支持 | 學習曲線、相對較新 |

---

## 六、總結

### useContext 的核心要點

1. **工作原理**：從 Fiber 樹向上查找最近的 Provider，返回其 value
2. **更新機制**：當 Provider 的 value 改變時，所有 Consumer 都會重新渲染
3. **性能問題**：無法選擇性訂閱，會導致不必要的重新渲染
4. **優化策略**：拆分 Context、穩定 value、使用 useMemo/useCallback

### 最佳實踐總結

- ✅ 按領域拆分 Context
- ✅ 使用 useMemo 穩定 Context value
- ✅ 提供專用 Hooks
- ✅ 避免在 Context 中存儲頻繁變化的數據
- ❌ 不要將所有狀態放在一個 Context 中
- ❌ 不要在每次渲染時創建新的 Context value

通過這些優化策略，可以充分利用 Context API 的便利性，同時避免性能問題。
