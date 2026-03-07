## React 全局狀態管理方法原理和比較

### 為什麼需要全局狀態管理

**問題場景：**
- 多個組件需要共享狀態
- 深層嵌套組件傳遞 props（Prop Drilling）
- 狀態需要在組件間同步
- 複雜的狀態邏輯需要集中管理

**解決方案：**
- 全局狀態管理庫
- 統一的狀態存儲和更新機制
- 組件可以直接訂閱需要的狀態

---

## 主流狀態管理方案

### 方案對比總覽

| 方案 | 學習曲線 | 樣板代碼 | 性能 | 包大小 | 適用場景 |
|------|---------|---------|------|--------|---------|
| **Redux** | 陡峭 | 多 | 優秀 | 大 | 大型應用、複雜狀態 |
| **Zustand** | 平緩 | 少 | 優秀 | 小 | 中小型應用 |
| **Jotai** | 中等 | 少 | 優秀 | 小 | 原子化狀態 |
| **Recoil** | 中等 | 中等 | 優秀 | 中 | Facebook 風格 |
| **Context API** | 平緩 | 少 | 一般 | 無 | 簡單狀態 |
| **MobX** | 中等 | 少 | 優秀 | 中 | 響應式編程 |

---

## 一、Redux

### Redux 核心概念

**Redux** 是一個可預測的狀態容器，基於單向數據流和不可變性原則。

**三大原則：**
1. **單一數據源（Single Source of Truth）**：整個應用的狀態存儲在一個 store 中
2. **狀態只讀（State is Read-Only）**：只能通過 action 來改變狀態
3. **純函數修改（Changes are Made with Pure Functions）**：使用 reducer 純函數來描述狀態變化

### Redux 架構

```
┌─────────────┐
│   Component │
└──────┬──────┘
       │ dispatch(action)
       ▼
┌─────────────┐
│    Store    │
└──────┬──────┘
       │
       ├──► Reducer ──► New State
       │
       └──► Subscribe ──► Component Re-render
```

### Redux 基本使用

```javascript
import { createStore } from 'redux';

// 1. 定義 Action Types
const INCREMENT = 'INCREMENT';
const DECREMENT = 'DECREMENT';

// 2. 定義 Action Creators
const increment = () => ({ type: INCREMENT });
const decrement = () => ({ type: DECREMENT });

// 3. 定義 Reducer
function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case INCREMENT:
      return { count: state.count + 1 };
    case DECREMENT:
      return { count: state.count - 1 };
    default:
      return state;
  }
}

// 4. 創建 Store
const store = createStore(counterReducer);

// 5. 訂閱狀態變化
store.subscribe(() => {
  console.log('State:', store.getState());
});

// 6. 派發 Action
store.dispatch(increment());
store.dispatch(decrement());
```

### Redux 底層原理深入

#### 1. Store 的實現

```javascript
// 簡化的 Redux Store 實現
function createStore(reducer, preloadedState, enhancer) {
  let currentState = preloadedState;
  let currentReducer = reducer;
  let currentListeners = [];
  let nextListeners = currentListeners;
  let isDispatching = false;

  // 獲取當前狀態
  function getState() {
    if (isDispatching) {
      throw new Error('Cannot get state while dispatching');
    }
    return currentState;
  }

  // 訂閱狀態變化
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function');
    }
    if (isDispatching) {
      throw new Error('Cannot subscribe while dispatching');
    }

    let isSubscribed = true;
    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    // 返回取消訂閱函數
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }
      if (isDispatching) {
        throw new Error('Cannot unsubscribe while dispatching');
      }

      isSubscribed = false;
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
      currentListeners = null;
    };
  }

  // 派發 Action
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error('Actions must be plain objects');
    }
    if (typeof action.type === 'undefined') {
      throw new Error('Actions must have a type property');
    }
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions');
    }

    try {
      isDispatching = true;
      // 調用 reducer 計算新狀態
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    // 通知所有訂閱者
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }

    return action;
  }

  // 替換 reducer（用於代碼分割）
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected reducer to be a function');
    }
    currentReducer = nextReducer;
    dispatch({ type: '@@redux/INIT' });
  }

  // 初始化
  dispatch({ type: '@@redux/INIT' });

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer
  };
}

// 確保可以安全地修改 nextListeners
function ensureCanMutateNextListeners() {
  if (nextListeners === currentListeners) {
    nextListeners = currentListeners.slice();
  }
}
```

#### 2. combineReducers 實現

```javascript
// combineReducers 將多個 reducer 合併
function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);
  const finalReducers = {};

  // 過濾掉非函數的 reducer
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];
    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }

  const finalReducerKeys = Object.keys(finalReducers);

  // 返回合併後的 reducer
  return function combination(state = {}, action) {
    let hasChanged = false;
    const nextState = {};

    // 遍歷所有 reducer，計算新狀態
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      nextState[key] = nextStateForKey;
      // 檢查狀態是否改變（引用比較）
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    // 如果沒有改變，返回原狀態
    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}

// 使用範例
const rootReducer = combineReducers({
  counter: counterReducer,
  todos: todosReducer,
  user: userReducer
});
```

#### 3. Middleware 機制

```javascript
// Middleware 的結構
const middleware = (store) => (next) => (action) => {
  // 在 action 派發前執行
  console.log('Before dispatch:', action);
  
  // 調用下一個 middleware 或 reducer
  const result = next(action);
  
  // 在 action 派發後執行
  console.log('After dispatch:', store.getState());
  
  return result;
};

// applyMiddleware 實現
function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState);
    let dispatch = store.dispatch;

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    };

    // 構建 middleware 鏈
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    
    // 從右到左組合 middleware
    dispatch = compose(...chain)(store.dispatch);

    return {
      ...store,
      dispatch
    };
  };
}

// compose 函數：從右到左組合函數
function compose(...funcs) {
  if (funcs.length === 0) {
    return (arg) => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

// 使用範例：Redux Thunk
const thunk = (store) => (next) => (action) => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};
```

#### 4. Redux 與 React 集成（react-redux）

```javascript
// Provider 組件
function Provider({ store, children }) {
  const contextValue = useMemo(() => ({ store }), [store]);
  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
}

// useSelector Hook
function useSelector(selector, equalityFn = shallowEqual) {
  const { store } = useContext(Context);
  const [, forceRender] = useReducer(s => s + 1, 0);

  const selectedState = useRef();
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);

  // 更新引用
  selectorRef.current = selector;
  equalityFnRef.current = equalityFn;

  // 檢查狀態是否改變
  const checkForUpdates = () => {
    try {
      const newSelectedState = selectorRef.current(store.getState());
      
      if (equalityFnRef.current(selectedState.current, newSelectedState)) {
        return; // 狀態未改變，不需要更新
      }
      
      selectedState.current = newSelectedState;
    } catch (err) {
      // 錯誤處理
    }
    
    // 強制重新渲染
    forceRender();
  };

  // 訂閱 store 變化
  useEffect(() => {
    const subscription = store.subscribe(checkForUpdates);
    checkForUpdates(); // 初始檢查
    return () => subscription();
  }, [store]);

  return selectedState.current;
}

// useDispatch Hook
function useDispatch() {
  const { store } = useContext(Context);
  return store.dispatch;
}
```

### Redux Toolkit（RTK）

**Redux Toolkit** 是 Redux 的官方推薦工具集，簡化了 Redux 的使用。

```javascript
import { createSlice, configureStore } from '@reduxjs/toolkit';

// 使用 createSlice 簡化 reducer 定義
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1; // 使用 Immer，可以直接修改
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    }
  }
});

// 自動生成 action creators
export const { increment, decrement, incrementByAmount } = counterSlice.actions;

// 配置 store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer
  }
});
```

**Redux Toolkit 優勢：**
- 減少樣板代碼
- 內置 Immer（允許直接修改狀態）
- 內置 Redux Thunk
- 更好的 TypeScript 支持

### Redux 優缺點

**優點：**
- ✅ 可預測的狀態管理
- ✅ 強大的開發工具（Redux DevTools）
- ✅ 豐富的生態系統
- ✅ 時間旅行調試
- ✅ 適合大型應用

**缺點：**
- ❌ 學習曲線陡峭
- ❌ 樣板代碼多（RTK 已改善）
- ❌ 包體積較大
- ❌ 簡單場景可能過度設計

---

## 二、Zustand

### Zustand 簡介

**Zustand** 是一個輕量級的狀態管理庫，API 簡單，無需 Provider。

### Zustand 原理

```javascript
// Zustand 的核心實現（簡化版）
function create(set, get) {
  const state = {};
  const listeners = new Set();

  const setState = (partial, replace) => {
    const nextState = typeof partial === 'function' 
      ? partial(state) 
      : partial;
    
    if (nextState !== state) {
      const previousState = state;
      state = replace ? nextState : Object.assign({}, state, nextState);
      
      // 通知所有訂閱者
      listeners.forEach(listener => listener(state, previousState));
    }
  };

  const getState = () => state;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const api = { setState, getState, subscribe };
  store(setState, getState, api);
  return api;
}
```

### Zustand 使用

```javascript
import create from 'zustand';

// 創建 store
const useStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  // 異步操作
  fetchData: async () => {
    set({ loading: true });
    const data = await fetch('/api/data').then(res => res.json());
    set({ data, loading: false });
  }
}));

// 在組件中使用
function Counter() {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

### Zustand 優缺點

**優點：**
- ✅ API 簡單，學習曲線平緩
- ✅ 無需 Provider，使用方便
- ✅ 包體積小（~1KB）
- ✅ 性能優秀（選擇性訂閱）
- ✅ TypeScript 支持好

**缺點：**
- ❌ 生態系統較小
- ❌ 不適合非常複雜的狀態邏輯
- ❌ 缺少時間旅行調試

---

## 三、Jotai

### Jotai 簡介

**Jotai** 是一個原子化的狀態管理庫，基於原子（Atom）的概念。

### Jotai 原理

```javascript
// Jotai 的核心概念：原子
const countAtom = atom(0);

// 讀取原子
function useAtomValue(atom) {
  const [value, setValue] = useState(() => atom.init);
  
  useEffect(() => {
    const unsubscribe = atom.subscribe((newValue) => {
      setValue(newValue);
    });
    return unsubscribe;
  }, [atom]);
  
  return value;
}

// 寫入原子
function useSetAtom(atom) {
  return useCallback((value) => {
    atom.write(value);
  }, [atom]);
}
```

### Jotai 使用

```javascript
import { atom, useAtom } from 'jotai';

// 定義原子
const countAtom = atom(0);
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// 在組件中使用
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubleCount = useAtomValue(doubleCountAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

### Jotai 優缺點

**優點：**
- ✅ 原子化設計，細粒度更新
- ✅ 自動優化，只更新相關組件
- ✅ API 簡單
- ✅ 包體積小

**缺點：**
- ❌ 學習曲線中等
- ❌ 生態系統較小
- ❌ 複雜場景可能難以管理

---

## 四、Recoil

### Recoil 簡介

**Recoil** 是 Facebook 開發的狀態管理庫，基於原子和選擇器。

### Recoil 原理

```javascript
// Recoil 的核心概念
const countState = atom({
  key: 'countState',
  default: 0
});

const doubleCountState = selector({
  key: 'doubleCountState',
  get: ({ get }) => {
    return get(countState) * 2;
  }
});
```

### Recoil 使用

```javascript
import { RecoilRoot, atom, useRecoilState, useRecoilValue } from 'recoil';

// 定義狀態
const countState = atom({
  key: 'countState',
  default: 0
});

// 在組件中使用
function Counter() {
  const [count, setCount] = useRecoilState(countState);
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

// 使用 RecoilRoot 包裹應用
function App() {
  return (
    <RecoilRoot>
      <Counter />
    </RecoilRoot>
  );
}
```

### Recoil 優缺點

**優點：**
- ✅ Facebook 官方支持
- ✅ 細粒度更新
- ✅ 異步狀態支持好
- ✅ 時間旅行調試

**缺點：**
- ❌ 仍在實驗階段
- ❌ API 相對複雜
- ❌ 包體積較大

---

## 五、Context API

### Context API 簡介

**Context API** 是 React 內建的狀態共享機制。

### Context API 原理

```javascript
// 創建 Context
const MyContext = createContext();

// Provider 組件
function MyProvider({ children }) {
  const [state, setState] = useState({ count: 0 });
  
  const value = {
    state,
    setState,
    increment: () => setState(s => ({ ...s, count: s.count + 1 }))
  };
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// 使用 Context
function MyComponent() {
  const { state, increment } = useContext(MyContext);
  
  return (
    <div>
      <p>{state.count}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

### Context API 優缺點

**優點：**
- ✅ React 內建，無需額外依賴
- ✅ API 簡單
- ✅ 適合簡單場景

**缺點：**
- ❌ 性能問題（所有消費者都會重新渲染）
- ❌ 不適合頻繁更新的狀態
- ❌ 缺少開發工具

### 優化 Context API

```javascript
// 使用 useMemo 和 useCallback 優化
function OptimizedProvider({ children }) {
  const [state, setState] = useState({ count: 0 });
  
  const increment = useCallback(() => {
    setState(s => ({ ...s, count: s.count + 1 }));
  }, []);
  
  const value = useMemo(() => ({
    state,
    increment
  }), [state, increment]);
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// 拆分 Context 減少重新渲染
const CountContext = createContext();
const UserContext = createContext();
```

---

## 六、MobX

### MobX 簡介

**MobX** 是一個響應式狀態管理庫，使用觀察者模式。

### MobX 原理

```javascript
import { observable, action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react-lite';

// 定義 Store
class CounterStore {
  count = 0;
  
  constructor() {
    makeObservable(this, {
      count: observable,
      increment: action,
      doubleCount: computed
    });
  }
  
  increment() {
    this.count++;
  }
  
  get doubleCount() {
    return this.count * 2;
  }
}

const store = new CounterStore();

// 在組件中使用
const Counter = observer(() => {
  return (
    <div>
      <p>{store.count}</p>
      <p>Double: {store.doubleCount}</p>
      <button onClick={() => store.increment()}>+</button>
    </div>
  );
});
```

### MobX 優缺點

**優點：**
- ✅ 響應式編程，代碼簡潔
- ✅ 自動追蹤依賴
- ✅ 性能優秀
- ✅ 學習曲線平緩

**缺點：**
- ❌ 魔法較多，調試困難
- ❌ 需要理解響應式原理
- ❌ 生態系統較小

---

## 方案選擇指南

### 選擇 Redux 當：

- ✅ 大型應用，複雜狀態邏輯
- ✅ 需要時間旅行調試
- ✅ 團隊熟悉 Redux 模式
- ✅ 需要豐富的生態系統

### 選擇 Zustand 當：

- ✅ 中小型應用
- ✅ 需要簡單的 API
- ✅ 包體積敏感
- ✅ 快速開發

### 選擇 Jotai 當：

- ✅ 需要原子化狀態管理
- ✅ 細粒度更新需求
- ✅ 喜歡函數式編程

### 選擇 Context API 當：

- ✅ 簡單的狀態共享
- ✅ 不頻繁更新
- ✅ 不想引入額外依賴

### 選擇 MobX 當：

- ✅ 喜歡響應式編程
- ✅ 需要自動依賴追蹤
- ✅ 面向對象風格

---

## 性能對比

### 重新渲染次數

```
場景：10 個組件訂閱同一狀態，狀態更新 1 次

Redux (useSelector):     1-2 個組件重新渲染（選擇性訂閱）
Zustand:                 1-2 個組件重新渲染（選擇性訂閱）
Jotai:                   1 個組件重新渲染（原子化）
Recoil:                  1 個組件重新渲染（原子化）
Context API:             10 個組件重新渲染（所有消費者）
MobX:                    1 個組件重新渲染（自動追蹤）
```

### 包體積對比

```
Redux + react-redux:     ~50KB
Zustand:                 ~1KB
Jotai:                   ~3KB
Recoil:                  ~30KB
Context API:             0KB（內建）
MobX:                    ~40KB
```

---

## 總結

**Redux 底層邏輯核心：**
1. **單向數據流**：Action → Reducer → State → View
2. **不可變性**：狀態不可直接修改，必須返回新狀態
3. **訂閱模式**：Store 維護訂閱者列表，狀態變化時通知
4. **Middleware 鏈**：可擴展的中間件機制
5. **combineReducers**：將多個 reducer 合併

**選擇建議：**
- **大型應用**：Redux + Redux Toolkit
- **中小型應用**：Zustand
- **原子化需求**：Jotai
- **簡單場景**：Context API
- **響應式風格**：MobX

理解不同方案的原理和適用場景，可以幫助選擇最適合項目的狀態管理方案。
