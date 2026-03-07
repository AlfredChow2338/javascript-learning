## 如何優化大型列表的渲染性能

### 問題分析

當渲染大量列表項時，會遇到以下性能問題：

**性能瓶頸：**
- **初始渲染慢**：需要創建大量 DOM 節點
- **滾動卡頓**：每次滾動都可能觸發重新渲染
- **內存佔用高**：所有列表項都保存在內存中
- **交互延遲**：用戶操作響應慢

**範例問題場景：**

```javascript
// ❌ 性能問題：渲染 10,000 條數據
function BadList({ items }) {
  return (
    <div>
      {items.map((item, index) => (
        <div key={index}>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <img src={item.image} alt={item.title} />
        </div>
      ))}
    </div>
  );
}

// 問題：
// 1. 創建 10,000 個 DOM 節點
// 2. 所有圖片同時加載
// 3. 每次更新都重新渲染所有項目
// 4. 內存佔用巨大
```

### 優化策略總覽

```
優化策略層次：
1. 虛擬滾動（Virtual Scrolling）- 最關鍵
2. React.memo 和 useMemo - 減少重新渲染
3. 懶加載（Lazy Loading）- 按需加載
4. 數據分頁/無限滾動 - 減少初始數據量
5. 使用 Web Workers - 處理數據
6. 優化圖片加載 - 懶加載和壓縮
```

---

## 一、虛擬滾動（Virtual Scrolling）

### 什麼是虛擬滾動

**虛擬滾動**只渲染可見區域的列表項，而不是渲染所有項目。當用戶滾動時，動態創建和銷毀 DOM 節點。

**原理：**
```
總數據：10,000 條
可見區域：20 條
實際渲染：20 + 緩衝區（如 5 條）= 25 條 DOM 節點
```

### 使用 react-window

**react-window** 是最流行的虛擬滾動庫。

#### 1. 固定高度列表

```javascript
import { FixedSizeList } from 'react-window';

// 列表項組件
const Row = ({ index, style, data }) => (
    <div style={style}>
    <div className="list-item">
      <h3>{data[index].title}</h3>
      <p>{data[index].description}</p>
    </div>
    </div>
  );
  
// 使用
function VirtualizedList({ items }) {
  return (
    <FixedSizeList
      height={600}           // 容器高度
      itemCount={items.length} // 總項目數
      itemSize={100}         // 每個項目高度
      width="100%"
      itemData={items}       // 傳遞數據
    >
      {Row}
    </FixedSizeList>
  );
}

// 性能對比：
// 渲染 10,000 條數據
// 傳統方式：10,000 個 DOM 節點
// 虛擬滾動：~25 個 DOM 節點（降低 400 倍）
```

#### 2. 動態高度列表

```javascript
import { VariableSizeList } from 'react-window';

// 需要提供高度計算函數
function getItemSize(index) {
  // 根據數據動態計算高度
  return items[index].isLarge ? 200 : 100;
}

function DynamicHeightList({ items }) {
  const listRef = useRef(null);

  // 當數據變化時，重置緩存
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [items]);

  return (
    <VariableSizeList
      ref={listRef}
      height={600}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
      itemData={items}
    >
      {Row}
    </VariableSizeList>
  );
}
```

#### 3. 水平虛擬滾動

```javascript
import { FixedSizeGrid } from 'react-window';

// 網格布局
const Cell = ({ columnIndex, rowIndex, style, data }) => (
  <div style={style}>
    {data[rowIndex][columnIndex]}
  </div>
);

function VirtualizedGrid({ data }) {
  return (
    <FixedSizeGrid
      columnCount={100}
      columnWidth={100}
      height={600}
      rowCount={1000}
      rowHeight={50}
      width={1000}
      itemData={data}
    >
      {Cell}
    </FixedSizeGrid>
  );
}
```

### 使用 @tanstack/react-virtual

**@tanstack/react-virtual** 是另一個優秀的虛擬滾動庫，更靈活。

```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // 估算高度
    overscan: 5, // 預渲染 5 個額外項目
  });

  return (
    <div
      ref={parentRef}
      style={{ height: '600px', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ListItem item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 自定義虛擬滾動實現

```javascript
function CustomVirtualList({ items, itemHeight, containerHeight }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // 計算可見範圍
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  // 只渲染可見項目
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              <ListItem item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 二、React.memo 和 useMemo 優化

### React.memo 防止不必要的重新渲染

```javascript
// ❌ 問題：每次父組件更新，所有子組件都重新渲染
function ListItem({ item }) {
  return (
    <div>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  );
}

// ✅ 優化：使用 React.memo
const ListItem = React.memo(({ item }) => {
  return (
    <div>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定義比較函數
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.title === nextProps.item.title;
});
```

### useMemo 緩存計算結果

```javascript
function ExpensiveList({ items, filter, sortBy }) {
  // ❌ 問題：每次渲染都重新計算
  const filteredItems = items.filter(item => 
    item.title.includes(filter)
  ).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return a.date - b.date;
  });

  // ✅ 優化：使用 useMemo 緩存
  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.title.includes(filter))
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return a.date - b.date;
      });
  }, [items, filter, sortBy]); // 只有依賴變化時才重新計算

  return (
    <VirtualizedList items={filteredItems} />
  );
}
```

### useCallback 緩存函數

```javascript
function List({ items }) {
  const [selectedId, setSelectedId] = useState(null);

  // ❌ 問題：每次渲染都創建新函數
  const handleSelect = (id) => {
    setSelectedId(id);
  };

  // ✅ 優化：使用 useCallback
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []); // 空依賴數組，函數永遠不變

  return (
    <VirtualizedList
      items={items}
      onSelect={handleSelect}
    />
  );
}
```

### 組合使用範例

```javascript
// 優化的列表項組件
const ListItem = React.memo(({ item, onSelect, isSelected }) => {
  // 使用 useMemo 緩存格式化數據
  const formattedDate = useMemo(
    () => new Date(item.date).toLocaleDateString(),
    [item.date]
  );

  // 使用 useMemo 緩存計算結果
  const displayName = useMemo(
    () => `${item.firstName} ${item.lastName}`,
    [item.firstName, item.lastName]
  );

  return (
    <div
      className={isSelected ? 'selected' : ''}
      onClick={() => onSelect(item.id)}
    >
      <h3>{displayName}</h3>
      <p>{formattedDate}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定義比較：只有關鍵屬性變化時才重新渲染
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.firstName === nextProps.item.firstName &&
    prevProps.item.lastName === nextProps.item.lastName &&
    prevProps.isSelected === nextProps.isSelected
  );
});
```

---

## 三、懶加載（Lazy Loading）

### 圖片懶加載

```javascript
// 使用 Intersection Observer
function LazyImage({ src, alt }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} style={{ minHeight: '200px' }}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
        />
      )}
      {!isLoaded && <div className="placeholder">Loading...</div>}
    </div>
  );
}

// 或使用原生 loading="lazy"
function OptimizedImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"  // 瀏覽器原生懶加載
      decoding="async"  // 異步解碼
    />
  );
}
```

### 組件懶加載

```javascript
// 使用 React.lazy 和 Suspense
import { lazy, Suspense } from 'react';

const HeavyListItem = lazy(() => import('./HeavyListItem'));

function List({ items }) {
  return (
    <VirtualizedList items={items}>
      {({ index, style, data }) => (
        <div style={style}>
          <Suspense fallback={<ListItemSkeleton />}>
            <HeavyListItem item={data[index]} />
          </Suspense>
        </div>
      )}
    </VirtualizedList>
  );
}
```

---

## 四、數據分頁和無限滾動

### 無限滾動實現

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';

function InfiniteVirtualList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam = 0 }) => fetchItems(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const parentRef = useRef();
  const allItems = data?.pages.flatMap(page => page.items) ?? [];

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  // 當接近底部時加載更多
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;

    if (
      lastItem.index >= allItems.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, allItems.length, virtualizer.getVirtualItems()]);

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const isLoaderRow = virtualItem.index > allItems.length - 1;
          const item = allItems[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {isLoaderRow ? (
                hasNextPage ? 'Loading more...' : 'Nothing more to load'
              ) : (
                <ListItem item={item} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 五、使用 Web Workers 處理數據

### 在 Worker 中處理數據

```javascript
// worker.js
self.onmessage = function(e) {
  const { items, filter, sortBy } = e.data;

  // 在 Worker 中過濾和排序
  let filtered = items.filter(item => 
    item.title.toLowerCase().includes(filter.toLowerCase())
  );

  filtered.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return a.date - b.date;
  });

  self.postMessage({ filtered });
};

// 主線程使用
function OptimizedList({ items, filter, sortBy }) {
  const [processedItems, setProcessedItems] = useState([]);
  const workerRef = useRef();

  useEffect(() => {
    workerRef.current = new Worker('worker.js');
    workerRef.current.onmessage = (e) => {
      setProcessedItems(e.data.filtered);
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ items, filter, sortBy });
    }
  }, [items, filter, sortBy]);

  return <VirtualizedList items={processedItems} />;
}
```

---

## 六、完整優化範例

### 綜合優化方案

```javascript
import { memo, useMemo, useCallback, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';

// 1. 優化的列表項組件
const OptimizedListItem = memo(({ item, index, style, onSelect, isSelected }) => {
  // 緩存格式化數據
  const formattedDate = useMemo(
    () => new Date(item.date).toLocaleDateString(),
    [item.date]
  );

  const displayName = useMemo(
    () => `${item.firstName} ${item.lastName}`,
    [item.firstName, item.lastName]
  );

  return (
    <div
      style={style}
      className={`list-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(item.id)}
    >
      <div className="item-content">
        <h3>{displayName}</h3>
        <p>{item.description}</p>
        <span>{formattedDate}</span>
      </div>
      {item.image && (
        <LazyImage src={item.image} alt={item.title} />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});

// 2. 主列表組件
function OptimizedList({ items, filter, sortBy }) {
  const [selectedId, setSelectedId] = useState(null);
  const listRef = useRef();

  // 緩存過濾和排序結果
  const processedItems = useMemo(() => {
    let filtered = items.filter(item =>
      item.title.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return a.date - b.date;
    });

    return filtered;
  }, [items, filter, sortBy]);

  // 緩存選擇處理函數
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // Row 渲染函數
  const Row = useCallback(({ index, style, data }) => {
    const item = data[index];
    return (
      <OptimizedListItem
        item={item}
        index={index}
        style={style}
        onSelect={handleSelect}
        isSelected={selectedId === item.id}
      />
    );
  }, [handleSelect, selectedId]);

  return (
    <div className="optimized-list">
      <FixedSizeList
        ref={listRef}
        height={600}
        itemCount={processedItems.length}
        itemSize={100}
        width="100%"
        itemData={processedItems}
        overscanCount={5} // 預渲染 5 個額外項目
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}
```

---

## 七、性能監控和調試

### 使用 React DevTools Profiler

```javascript
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log('Component:', id);
  console.log('Phase:', phase); // mount 或 update
  console.log('Actual duration:', actualDuration, 'ms');
}

function MonitoredList({ items }) {
  return (
    <Profiler id="OptimizedList" onRender={onRenderCallback}>
      <OptimizedList items={items} />
    </Profiler>
  );
}
```

### 性能指標監控

```javascript
function usePerformanceMonitor(componentName) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16) { // 超過一幀時間（60fps）
        console.warn(`${componentName} took ${duration}ms to render`);
      }
    };
  });
}

// 使用
function ListItem({ item }) {
  usePerformanceMonitor('ListItem');
  return <div>{item.title}</div>;
}
```

---

## 八、最佳實踐總結

### 優化檢查清單

✅ **虛擬滾動**
- [ ] 使用 react-window 或 @tanstack/react-virtual
- [ ] 設置合適的 overscan
- [ ] 處理動態高度（如需要）

✅ **React 優化**
- [ ] 使用 React.memo 包裹列表項
- [ ] 使用 useMemo 緩存計算結果
- [ ] 使用 useCallback 緩存事件處理函數
- [ ] 自定義比較函數避免不必要的渲染

✅ **數據處理**
- [ ] 在 Worker 中處理大量數據
- [ ] 使用分頁或無限滾動
- [ ] 延遲加載非關鍵數據

✅ **資源優化**
- [ ] 圖片懶加載
- [ ] 使用適當的圖片格式和大小
- [ ] 組件懶加載（如需要）

✅ **性能監控**
- [ ] 使用 React DevTools Profiler
- [ ] 監控渲染時間
- [ ] 識別性能瓶頸

### 性能對比

```
場景：渲染 10,000 條數據

❌ 未優化：
- DOM 節點：10,000
- 初始渲染：~5,000ms
- 內存佔用：~500MB
- 滾動 FPS：10-20

✅ 優化後：
- DOM 節點：~25
- 初始渲染：~50ms
- 內存佔用：~50MB
- 滾動 FPS：60

性能提升：
- DOM 節點：降低 400 倍
- 渲染時間：降低 100 倍
- 內存佔用：降低 10 倍
- 滾動流暢度：提升 3-6 倍
```

### 選擇建議

**使用虛擬滾動當：**
- 列表項超過 100 個
- 每個列表項包含複雜內容
- 需要流暢的滾動體驗

**使用 React.memo 當：**
- 列表項渲染成本高
- 父組件頻繁更新
- 列表項 props 變化不頻繁

**使用分頁/無限滾動當：**
- 數據量非常大（>10,000）
- 初始加載時間是關鍵
- 用戶不需要看到所有數據

理解這些優化技術並根據實際場景選擇合適的方案，可以大幅提升大型列表的渲染性能和用戶體驗。
