## Top K Frequent Elements 實現

### 問題描述

給定一個整數陣列 `nums` 和一個整數 `k`，返回出現頻率最高的 `k` 個元素。可以按任意順序返回答案。

**範例：**
```javascript
Input: nums = [1,1,1,2,2,3], k = 2
Output: [1,2]
// 1 出現 3 次，2 出現 2 次，3 出現 1 次
// 頻率最高的 2 個是 [1, 2]

Input: nums = [1], k = 1
Output: [1]
```

### 方法一：HashMap + 排序

**思路：**
1. 使用 HashMap 統計每個元素的出現頻率
2. 將 HashMap 轉換成陣列並按頻率排序
3. 取前 k 個元素

**實現：**

```javascript
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
function topKFrequent(nums, k) {
  // 步驟 1: 統計頻率
  const frequencyMap = new Map();
  
  for (const num of nums) {
    frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
  }
  
  // 步驟 2: 轉換成陣列並排序
  const entries = Array.from(frequencyMap.entries());
  entries.sort((a, b) => b[1] - a[1]); // 按頻率降序排序
  
  // 步驟 3: 取前 k 個
  return entries.slice(0, k).map(entry => entry[0]);
}
```

**時間複雜度分析：**
- 統計頻率：O(n)，n 是陣列長度
- 排序：O(m log m)，m 是不同元素的數量（通常 m ≤ n）
- 總時間複雜度：**O(n + m log m)**

**空間複雜度：**
- HashMap：O(m)
- 排序陣列：O(m)
- 總空間複雜度：**O(m)**

**使用範例：**

```javascript
console.log(topKFrequent([1,1,1,2,2,3], 2)); // [1, 2]
console.log(topKFrequent([1], 1)); // [1]
console.log(topKFrequent([4,1,-1,2,-1,2,3], 2)); // [-1, 2]
```

### 方法二：HashMap + 最小堆（Min Heap）

**思路：**
1. 使用 HashMap 統計頻率
2. 使用最小堆維護頻率最高的 k 個元素
3. 當堆大小超過 k 時，移除頻率最小的元素

**實現：**

```javascript
function topKFrequent(nums, k) {
  // 步驟 1: 統計頻率
  const frequencyMap = new Map();
  for (const num of nums) {
    frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
  }
  
  // 步驟 2: 使用最小堆
  const minHeap = [];
  
  for (const [num, freq] of frequencyMap.entries()) {
    // 如果堆大小小於 k，直接加入
    if (minHeap.length < k) {
      minHeap.push([num, freq]);
      // 維護堆性質（從最後一個非葉節點開始）
      heapifyUp(minHeap, minHeap.length - 1);
    } else {
      // 如果當前元素頻率大於堆頂（最小頻率）
      if (freq > minHeap[0][1]) {
        minHeap[0] = [num, freq];
        heapifyDown(minHeap, 0);
      }
    }
  }
  
  // 步驟 3: 返回結果
  return minHeap.map(item => item[0]);
}

// 向上調整堆（插入時）
function heapifyUp(heap, index) {
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (heap[parent][1] <= heap[index][1]) break;
    
    [heap[parent], heap[index]] = [heap[index], heap[parent]];
    index = parent;
  }
}

// 向下調整堆（刪除時）
function heapifyDown(heap, index) {
  const n = heap.length;
  while (true) {
    let smallest = index;
    const left = 2 * index + 1;
    const right = 2 * index + 2;
    
    if (left < n && heap[left][1] < heap[smallest][1]) {
      smallest = left;
    }
    if (right < n && heap[right][1] < heap[smallest][1]) {
      smallest = right;
    }
    
    if (smallest === index) break;
    
    [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
    index = smallest;
  }
}
```

**時間複雜度分析：**
- 統計頻率：O(n)
- 建堆：O(m log k)，m 是不同元素數量，k 是堆大小
- 總時間複雜度：**O(n + m log k)**

**空間複雜度：**
- HashMap：O(m)
- 堆：O(k)
- 總空間複雜度：**O(m)**

**優點：**
- 當 k 遠小於 m 時，比排序方法更高效
- 不需要對所有元素排序，只維護 k 個元素

### 方法三：Bucket Sort（桶排序）

**思路：**
1. 統計每個元素的頻率
2. 使用頻率作為索引，將元素放入對應的桶中
3. 從高頻率到低頻率遍歷桶，收集 k 個元素

**實現：**

```javascript
function topKFrequent(nums, k) {
  // 步驟 1: 統計頻率
  const frequencyMap = new Map();
  for (const num of nums) {
    frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
  }
  
  // 步驟 2: 創建桶（索引 = 頻率）
  // 最大頻率不會超過陣列長度
  const buckets = Array(nums.length + 1).fill(null).map(() => []);
  
  for (const [num, freq] of frequencyMap.entries()) {
    buckets[freq].push(num);
  }
  
  // 步驟 3: 從高頻率到低頻率收集元素
  const result = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
    if (buckets[i].length > 0) {
      result.push(...buckets[i]);
    }
  }
  
  // 如果結果超過 k 個，只返回前 k 個
  return result.slice(0, k);
}
```

**時間複雜度分析：**
- 統計頻率：O(n)
- 放入桶：O(m)，m 是不同元素數量
- 收集結果：O(n)（最壞情況）
- 總時間複雜度：**O(n)** - 線性時間！

**空間複雜度：**
- HashMap：O(m)
- 桶陣列：O(n)
- 總空間複雜度：**O(n)**

**優點：**
- 時間複雜度最優，達到 O(n)
- 當頻率範圍較小時特別高效

**視覺化過程：**

```javascript
// nums = [1,1,1,2,2,3], k = 2

// 步驟 1: 統計頻率
// frequencyMap = { 1: 3, 2: 2, 3: 1 }

// 步驟 2: 放入桶
// buckets[0] = []
// buckets[1] = [3]
// buckets[2] = [2]
// buckets[3] = [1]
// buckets[4] = []
// buckets[5] = []
// buckets[6] = []

// 步驟 3: 從後往前收集
// i=6: buckets[6] = []，跳過
// i=5: buckets[5] = []，跳過
// i=4: buckets[4] = []，跳過
// i=3: buckets[3] = [1]，加入 result = [1]
// i=2: buckets[2] = [2]，加入 result = [1, 2]
// result.length === k，停止
// 返回 [1, 2]
```

### 方法四：使用 JavaScript 內建方法（簡化版）

**實現：**

```javascript
function topKFrequent(nums, k) {
  // 統計頻率
  const frequencyMap = nums.reduce((map, num) => {
    map.set(num, (map.get(num) || 0) + 1);
    return map;
  }, new Map());
  
  // 排序並取前 k 個
  return Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([num]) => num);
}
```

**優點：**
- 代碼簡潔易讀
- 適合面試快速實現

**缺點：**
- 時間複雜度 O(n + m log m)，不如桶排序

### 完整測試範例

```javascript
// 測試用例
function test() {
  // 測試 1: 基本情況
  console.assert(
    JSON.stringify(topKFrequent([1,1,1,2,2,3], 2)) === JSON.stringify([1,2]),
    'Test 1 failed'
  );
  
  // 測試 2: k = 1
  console.assert(
    JSON.stringify(topKFrequent([1], 1)) === JSON.stringify([1]),
    'Test 2 failed'
  );
  
  // 測試 3: 負數
  console.assert(
    JSON.stringify(topKFrequent([4,1,-1,2,-1,2,3], 2)) === JSON.stringify([-1,2]),
    'Test 3 failed'
  );
  
  // 測試 4: 所有元素頻率相同
  console.assert(
    topKFrequent([1,2,3,4,5], 3).length === 3,
    'Test 4 failed'
  );
  
  console.log('All tests passed!');
}

test();
```

### 方法比較

| 方法 | 時間複雜度 | 空間複雜度 | 適用場景 |
|------|-----------|-----------|---------|
| HashMap + 排序 | O(n + m log m) | O(m) | 通用，代碼簡單 |
| HashMap + 最小堆 | O(n + m log k) | O(m) | k 遠小於 m 時 |
| Bucket Sort | **O(n)** | O(n) | **最優解**，頻率範圍小 |
| 簡化版 | O(n + m log m) | O(m) | 快速實現，面試使用 |

### 實際應用場景

1. **熱門搜索關鍵字**：找出搜索頻率最高的 k 個關鍵字
2. **推薦系統**：找出用戶最常點擊的 k 個商品
3. **日誌分析**：找出出現頻率最高的 k 個錯誤
4. **社交媒體**：找出最熱門的 k 個話題標籤

### 進階：處理相同頻率的元素

如果多個元素有相同頻率，可能需要額外的排序規則：

```javascript
function topKFrequent(nums, k) {
  const frequencyMap = new Map();
  for (const num of nums) {
    frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
  }
  
  const entries = Array.from(frequencyMap.entries());
  
  // 先按頻率降序，頻率相同時按元素值升序
  entries.sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1]; // 頻率降序
    }
    return a[0] - b[0]; // 元素值升序
  });
  
  return entries.slice(0, k).map(entry => entry[0]);
}
```

### 總結

**推薦方法：**
- **面試快速實現**：使用方法四（簡化版）
- **追求最佳效能**：使用方法三（Bucket Sort）
- **k 很小時**：使用方法二（最小堆）

**關鍵要點：**
1. 先用 HashMap 統計頻率是基礎
2. 根據 k 和 m 的關係選擇合適方法
3. Bucket Sort 在頻率範圍小時最優
4. 最小堆在 k 遠小於 m 時更高效
