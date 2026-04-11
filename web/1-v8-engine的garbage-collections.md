## V8 Engine 的 Garbage Collection 原理

### 垃圾回收

- JavaScript 是自動管理內存的語言，開發者不需要手動分配和釋放內存
- V8 引擎負責自動回收不再使用的對象，避免內存洩漏。

### 內存分區

V8 將內存分為兩個主要區域，每個區域有不同的管理策略：

#### 新生代（Young Generation）

在新生代中，V8 使用 **Scavenger Algorithm（清除算法）**，基於**分代複製垃圾回收（Generational Copying GC）**。

**用途**

- 存儲短期存活的對象（如臨時變量和函數作用域內的對象）
- 大小：通常比較小（幾 MB 到數十 MB）
- 特性：新生代的對象通常存活時間很短，因此垃圾回收頻率較高
- 如果某些對象經歷了多次垃圾回收仍然存活，則認為它們是長期存活的對象，並將其移動到老生代

**設計**

- **From 空間**：活動對象的初始存儲區
- **To 空間**：用於垃圾回收過程中的臨時存儲區

**垃圾回收過程**

1. **標記活動對象**：從根對象開始，標記所有被引用的對象
2. **複製到 To 空間**：將 From 空間中的活動對象複製到 To 空間
3. **丟棄未引用對象**：未被引用的對象留在 From 空間，被丟棄
4. **交換空間**：To 空間變成新的 From 空間，舊的 From 空間被清空並充當新的 To 空間

#### 老生代（Old Generation）

**用途**

- 存儲長期存活的對象（如全局對象或被多次引用的對象）
- 大小：通常比新生代大得多（幾百 MB 到幾 GB，具體取決於可用內存）
- 特性：老生代的內存回收頻率較低，但回收過程更複雜和耗時

老生代內存主要存儲長期存活的對象，因此回收過程更複雜。V8 引擎使用以下兩種主要算法：

**過程**

標記-清除算法（Mark-Sweep Algorithm）

**過程：**

1. **標記階段（Marking Phase）**
   - 從根對象（如全局變量、活動的執行上下文）開始
   - 遍歷所有被引用的對象，並將這些對象標記為「活躍」
   - 使用深度優先或廣度優先遍歷

2. **清除階段（Sweeping Phase）**
   - 遍歷整個內存
   - 釋放未被標記的對象所佔用的內存

**標記-壓縮算法（Mark-Compact Algorithm）**

目的：解決內存碎片問題

**過程：**

1. **標記階段**：與標記-清除相同，先標記活躍對象
2. **壓縮階段**：將存活的對象移動到內存的一端，釋放出一塊連續的空間

### 增量垃圾回收（Incremental GC）

為了避免應用程序在垃圾回收期間完全暫停，V8 將老生代的垃圾回收過程分解為多個小步驟，與應用程序執行交替進行，減少回收的停頓時間（**Stop-the-World** 時間）。

### 實際優化建議

- 事件監聽沒有移除
- 避免不必要長期引用
- 及時釋放大對象避免長期持有
- 使用對象也

### 監控和調試

#### 使用 Chrome DevTools

```javascript
// 在 Chrome DevTools 中監控內存使用
// 1. 打開 Performance 面板
// 2. 勾選 Memory
// 3. 開始錄製
// 4. 執行你的代碼
// 5. 停止錄製，查看內存使用情況

// 使用 performance.memory（非標準 API，僅 Chrome）
if (performance.memory) {
  console.log("Used:", performance.memory.usedJSHeapSize / 1048576, "MB");
  console.log("Total:", performance.memory.totalJSHeapSize / 1048576, "MB");
  console.log("Limit:", performance.memory.jsHeapSizeLimit / 1048576, "MB");
}
```

#### 強制觸發 GC（僅開發環境）

```javascript
// 在 Chrome DevTools 中：
// 1. 打開 Memory 面板
// 2. 點擊垃圾桶圖標手動觸發 GC

// 或在 Node.js 中（需要 --expose-gc 標誌）
if (global.gc) {
  global.gc();
}
```

### 總結

**新生代 GC（Scavenger）：**

- 快速、高效
- 只處理短期存活的對象
- 使用複製算法，無碎片問題

**老生代 GC（Mark-Sweep / Mark-Compact）：**

- 處理長期存活的對象
- 更複雜、更耗時
- Mark-Compact 解決碎片問題

**增量 GC：**

- 將 GC 工作分成小塊
- 減少 Stop-the-World 時間
- 提升用戶體驗

**最佳實踐：**

- 避免內存洩漏（及時移除事件監聽器、清理引用）
- 避免不必要的長期引用
- 及時釋放大對象
- 考慮使用對象池減少 GC 壓力
