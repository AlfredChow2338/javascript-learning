# React Animation 實現

## 什麼是 React Animation

**React Animation（React 動畫）** 是在 React 應用中實現流暢、高性能的用戶界面動畫效果。動畫可以提升用戶體驗，提供視覺反饋，並引導用戶注意力。

**動畫的核心目標：**
- 提供流暢的視覺過渡
- 增強用戶交互反饋
- 引導用戶注意力
- 提升整體用戶體驗

**動畫類型：**
- **過渡動畫**：元素狀態變化時的平滑過渡
- **進入/退出動畫**：元素出現和消失的動畫
- **交互動畫**：響應用戶操作的動畫
- **加載動畫**：數據加載時的視覺反饋

---

## 一、CSS 動畫和過渡

### 1.1 CSS Transition

**最簡單的動畫方式：** 使用 CSS transition

```jsx
// 組件
function FadeButton({ children }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      className={`fade-button ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
}
```

```css
/* CSS */
.fade-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  transition: all 0.3s ease;
  /* 或分別指定 */
  transition-property: background-color, transform;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

.fade-button:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}
```

### 1.2 CSS Animation

**關鍵幀動畫：**

```jsx
function Spinner() {
  return <div className="spinner" />;
}
```

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

**複雜關鍵幀動畫：**

```css
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
}

.bounce {
  animation: bounce 2s infinite;
}
```

### 1.3 條件 CSS 類名

**根據狀態應用動畫：**

```jsx
function Modal({ isOpen, onClose, children }) {
  return (
    <div className={`modal-overlay ${isOpen ? 'open' : 'closed'}`}>
      <div className={`modal-content ${isOpen ? 'open' : 'closed'}`}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.modal-overlay.open {
  opacity: 1;
  pointer-events: all;
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  transition: transform 0.3s ease;
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.modal-content.open {
  transform: translate(-50%, -50%) scale(1);
}
```

---

## 二、React Transition Group

### 2.1 CSSTransition

**進入和退出動畫：**

```jsx
import { CSSTransition } from 'react-transition-group';

function FadeInOut({ show, children }) {
  return (
    <CSSTransition
      in={show}
      timeout={300}
      classNames="fade"
      unmountOnExit
    >
      <div>{children}</div>
    </CSSTransition>
  );
}
```

```css
/* 進入動畫 */
.fade-enter {
  opacity: 0;
}

.fade-enter-active {
  opacity: 1;
  transition: opacity 300ms;
}

/* 退出動畫 */
.fade-exit {
  opacity: 1;
}

.fade-exit-active {
  opacity: 0;
  transition: opacity 300ms;
}
```

### 2.2 TransitionGroup

**列表動畫：**

```jsx
import { TransitionGroup, CSSTransition } from 'react-transition-group';

function TodoList({ todos, onRemove }) {
  return (
    <TransitionGroup>
      {todos.map(todo => (
        <CSSTransition
          key={todo.id}
          timeout={300}
          classNames="slide"
        >
          <div className="todo-item">
            {todo.text}
            <button onClick={() => onRemove(todo.id)}>Remove</button>
          </div>
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
}
```

```css
.slide-enter {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all 300ms;
}

.slide-exit {
  transform: translateX(0);
  opacity: 1;
}

.slide-exit-active {
  transform: translateX(100%);
  opacity: 0;
  transition: all 300ms;
}
```

### 2.3 自定義過渡類名

**使用自定義類名前綴：**

```jsx
<CSSTransition
  in={show}
  timeout={500}
  classNames={{
    enter: 'my-enter',
    enterActive: 'my-enter-active',
    exit: 'my-exit',
    exitActive: 'my-exit-active'
  }}
>
  <div>{children}</div>
</CSSTransition>
```

---

## 三、Framer Motion

### 3.1 基本動畫

**Framer Motion 是最流行的 React 動畫庫：**

```jsx
import { motion } from 'framer-motion';

function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      Hello World
    </motion.div>
  );
}
```

### 3.2 條件動畫

**根據狀態動畫：**

```jsx
function ToggleButton({ isOn, onToggle }) {
  return (
    <motion.button
      onClick={onToggle}
      animate={{
        backgroundColor: isOn ? '#4CAF50' : '#ccc',
        scale: isOn ? 1.1 : 1
      }}
      transition={{ duration: 0.2 }}
    >
      {isOn ? 'ON' : 'OFF'}
    </motion.button>
  );
}
```

### 3.3 手勢動畫

**拖拽和手勢：**

```jsx
function DraggableBox() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      Drag me
    </motion.div>
  );
}
```

### 3.4 布局動畫

**自動布局動畫：**

```jsx
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedList({ items }) {
  return (
    <AnimatePresence>
      {items.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          layout
        >
          {item.text}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

### 3.5 複雜動畫序列

**使用 variants：**

```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

function StaggeredList({ items }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map(item => (
        <motion.div key={item.id} variants={itemVariants}>
          {item.text}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 3.6 路由過渡動畫

**頁面切換動畫：**

```jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 四、React Spring

### 4.1 基本彈簧動畫

**React Spring 提供物理基礎的動畫：**

```jsx
import { useSpring, animated } from '@react-spring/web';

function SpringBox() {
  const [springs, api] = useSpring(() => ({
    from: { x: 0 },
    to: { x: 100 }
  }));
  
  return (
    <animated.div
      style={{
        ...springs,
        width: 80,
        height: 80,
        background: '#ff6d6d',
        borderRadius: 8
      }}
    />
  );
}
```

### 4.2 交互動畫

**響應用戶操作：**

```jsx
function InteractiveBox() {
  const [springs, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 300, friction: 10 }
  }));
  
  const handleClick = () => {
    api.start({
      scale: springs.scale.get() === 1 ? 1.5 : 1
    });
  };
  
  return (
    <animated.div
      onClick={handleClick}
      style={{
        ...springs,
        transform: springs.scale.to(scale => `scale(${scale})`),
        width: 100,
        height: 100,
        background: '#4ecdc4',
        cursor: 'pointer'
      }}
    />
  );
}
```

### 4.3 並行動畫

**多個屬性同時動畫：**

```jsx
function MultiSpring() {
  const [springs, api] = useSpring(() => ({
    from: { x: 0, y: 0, rotate: 0 }
  }));
  
  const handleMove = (e) => {
    api.start({
      x: e.clientX - 50,
      y: e.clientY - 50,
      rotate: springs.rotate.get() + 90
    });
  };
  
  return (
    <animated.div
      onMouseMove={handleMove}
      style={{
        ...springs,
        width: 100,
        height: 100,
        background: '#ff6d6d',
        borderRadius: '50%'
      }}
    />
  );
}
```

### 4.4 列表動畫

**使用 useTrail：**

```jsx
import { useTrail, animated } from '@react-spring/web';

function TrailList({ items }) {
  const trails = useTrail(items.length, {
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 }
  });
  
  return (
    <div>
      {trails.map((props, index) => (
        <animated.div key={items[index].id} style={props}>
          {items[index].text}
        </animated.div>
      ))}
    </div>
  );
}
```

---

## 五、自定義 Hooks 實現動畫

### 5.1 useAnimation Hook

**自定義動畫 Hook：**

```jsx
import { useState, useEffect } from 'react';

function useAnimation(initialValue, targetValue, duration = 300) {
  const [value, setValue] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (value !== targetValue) {
      setIsAnimating(true);
      const startTime = Date.now();
      const startValue = value;
      const difference = targetValue - startValue;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 緩動函數（ease-out）
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + difference * easeOut;
        
        setValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [targetValue, duration]);
  
  return [value, isAnimating];
}

// 使用
function AnimatedCounter({ target }) {
  const [count] = useAnimation(0, target, 1000);
  return <div>{Math.round(count)}</div>;
}
```

### 5.2 useSpring Hook

**簡化版彈簧動畫：**

```jsx
function useSpring(target, tension = 0.1, friction = 0.8) {
  const [value, setValue] = useState(target);
  
  useEffect(() => {
    let animationId;
    let velocity = 0;
    let current = value;
    
    const animate = () => {
      const distance = target - current;
      const force = distance * tension;
      velocity += force;
      velocity *= friction;
      current += velocity;
      
      setValue(current);
      
      if (Math.abs(distance) > 0.01 || Math.abs(velocity) > 0.01) {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [target, tension, friction]);
  
  return value;
}
```

### 5.3 useTransition Hook

**過渡動畫 Hook：**

```jsx
function useTransition(show, duration = 300) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // 強制重排以觸發動畫
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(false);
        });
      });
    } else {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration]);
  
  return { isVisible, isAnimating };
}

// 使用
function FadeTransition({ show, children }) {
  const { isVisible, isAnimating } = useTransition(show);
  
  if (!isVisible) return null;
  
  return (
    <div className={`fade ${isAnimating ? 'animating' : ''}`}>
      {children}
    </div>
  );
}
```

---

## 六、性能優化

### 6.1 GPU 加速屬性

**使用 transform 和 opacity：**

```jsx
// ❌ 性能差：觸發布局重排
function BadAnimation() {
  const [left, setLeft] = useState(0);
  
  return (
    <div
      style={{
        left: `${left}px`, // 觸發布局重排
        transition: 'left 0.3s'
      }}
    />
  );
}

// ✅ 性能好：GPU 加速
function GoodAnimation() {
  const [x, setX] = useState(0);
  
  return (
    <div
      style={{
        transform: `translateX(${x}px)`, // GPU 加速
        transition: 'transform 0.3s'
      }}
    />
  );
}
```

**GPU 加速的屬性：**
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (部分)

**避免動畫的屬性：**
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`

### 6.2 will-change 優化

**提示瀏覽器優化：**

```jsx
function OptimizedAnimation() {
  return (
    <div
      style={{
        transform: 'translateX(0)',
        willChange: 'transform' // 提示瀏覽器優化
      }}
    />
  );
}
```

**注意：** 只在動畫期間使用 `will-change`，動畫結束後移除。

### 6.3 使用 requestAnimationFrame

**自定義動畫循環：**

```jsx
function useAnimationFrame(callback) {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);
}

// 使用
function SmoothAnimation() {
  const [x, setX] = useState(0);
  
  useAnimationFrame((deltaTime) => {
    setX(prev => prev + deltaTime * 0.1);
  });
  
  return <div style={{ transform: `translateX(${x}px)` }} />;
}
```

### 6.4 減少重繪

**批量更新：**

```jsx
// ❌ 多次重繪
function BadUpdate() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  
  const handleMove = (e) => {
    setX(e.clientX); // 觸發重繪
    setY(e.clientY); // 觸發重繪
  };
  
  return <div onMouseMove={handleMove} style={{ left: x, top: y }} />;
}

// ✅ 單次重繪
function GoodUpdate() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY }); // 單次更新
  };
  
  return (
    <div
      onMouseMove={handleMove}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    />
  );
}
```

### 6.5 使用 CSS 動畫而非 JavaScript

**CSS 動畫性能更好：**

```jsx
// ❌ JavaScript 動畫（性能較差）
function JSAnimation() {
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 1);
    }, 16);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ transform: `rotate(${rotation}deg)` }} />
  );
}

// ✅ CSS 動畫（性能更好）
function CSSAnimation() {
  return <div className="spinning" />;
}
```

```css
.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 七、常見動畫模式

### 7.1 淡入淡出（Fade）

```jsx
function Fade({ show, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### 7.2 滑入滑出（Slide）

```jsx
function Slide({ show, direction = 'right', children }) {
  const variants = {
    right: { x: 100 },
    left: { x: -100 },
    up: { y: -100 },
    down: { y: 100 }
  };
  
  return (
    <motion.div
      initial={variants[direction]}
      animate={show ? { x: 0, y: 0 } : variants[direction]}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### 7.3 縮放（Scale）

```jsx
function Scale({ show, children }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: show ? 1 : 0 }}
      transition={{ duration: 0.3, type: 'spring' }}
    >
      {children}
    </motion.div>
  );
}
```

### 7.4 旋轉（Rotate）

```jsx
function Rotate({ angle, children }) {
  return (
    <motion.div
      animate={{ rotate: angle }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### 7.5 彈跳（Bounce）

```jsx
function Bounce({ children }) {
  return (
    <motion.div
      animate={{
        y: [0, -20, 0]
      }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}
```

### 7.6 搖擺（Shake）

```jsx
function Shake({ trigger, children }) {
  return (
    <motion.div
      key={trigger}
      animate={{
        x: [0, -10, 10, -10, 10, 0]
      }}
      transition={{
        duration: 0.5
      }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 八、動畫庫比較

### 8.1 庫對比

| 庫 | 優點 | 缺點 | 適用場景 |
|---|------|------|---------|
| **CSS Transition** | 簡單、性能好、無依賴 | 功能有限 | 簡單過渡動畫 |
| **React Transition Group** | 輕量、控制精確 | API 較複雜 | 進入/退出動畫 |
| **Framer Motion** | 功能強大、API 友好 | Bundle 較大 | 複雜動畫、手勢 |
| **React Spring** | 物理動畫、性能好 | 學習曲線 | 彈簧動畫、物理效果 |
| **React Motion** | 輕量、靈活 | 已停止維護 | 簡單動畫 |

### 8.2 選擇建議

**簡單過渡：** CSS Transition
**進入/退出：** React Transition Group
**複雜動畫：** Framer Motion
**物理效果：** React Spring
**自定義需求：** 自定義 Hooks

---

## 九、最佳實踐

### 9.1 動畫原則

1. **保持簡潔**：不要過度使用動畫
2. **性能優先**：使用 GPU 加速屬性
3. **用戶體驗**：動畫應該增強而非干擾
4. **可訪問性**：尊重 `prefers-reduced-motion`

### 9.2 可訪問性

**尊重用戶偏好：**

```jsx
import { useReducedMotion } from 'framer-motion';

function AccessibleAnimation({ children }) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
    >
      {children}
    </motion.div>
  );
}
```

**CSS 媒體查詢：**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 9.3 動畫時長

**建議時長：**
- **微交互**：100-200ms
- **簡單過渡**：200-300ms
- **複雜動畫**：300-500ms
- **頁面過渡**：300-500ms

### 9.4 緩動函數

**常用緩動：**
- `ease`：默認，開始和結束慢
- `ease-in`：開始慢
- `ease-out`：結束慢
- `ease-in-out`：開始和結束慢
- `linear`：勻速
- `cubic-bezier`：自定義

```jsx
// Framer Motion
<motion.div
  transition={{
    type: 'spring',
    stiffness: 300,
    damping: 30
  }}
/>

// CSS
.element {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 十、實際應用示例

### 10.1 模態框動畫

```jsx
import { motion, AnimatePresence } from 'framer-motion';

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 10.2 加載動畫

```jsx
function LoadingSpinner() {
  return (
    <motion.div
      className="spinner"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
}
```

### 10.3 列表項動畫

```jsx
function AnimatedList({ items }) {
  return (
    <AnimatePresence>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ delay: index * 0.1 }}
        >
          {item.text}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

### 10.4 進度條動畫

```jsx
function ProgressBar({ progress }) {
  return (
    <div className="progress-container">
      <motion.div
        className="progress-bar"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
```

---

## 十一、總結

### React 動畫的核心要點

1. **CSS 動畫**：簡單、性能好，適合基本過渡
2. **React Transition Group**：控制精確，適合進入/退出動畫
3. **Framer Motion**：功能強大，適合複雜動畫和手勢
4. **React Spring**：物理動畫，適合彈簧效果
5. **性能優化**：使用 GPU 加速屬性（transform, opacity）
6. **可訪問性**：尊重 `prefers-reduced-motion`

### 最佳實踐

- ✅ 使用 `transform` 和 `opacity` 進行動畫
- ✅ 保持動畫時長在 200-500ms
- ✅ 尊重用戶的動畫偏好
- ✅ 使用合適的緩動函數
- ✅ 避免過度使用動畫
- ❌ 不要動畫 `width`、`height` 等布局屬性
- ❌ 不要忽略性能優化
- ❌ 不要忘記可訪問性

通過合理的動畫實現，可以顯著提升 React 應用的用戶體驗和視覺效果。
