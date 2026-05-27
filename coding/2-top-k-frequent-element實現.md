# Top K Frequent Elements 實現

給 `nums` 與 `k`，回傳出現次數最高的 `k` 個元素（順序不拘）。所有解法都先做 **頻率統計**；差異在「如何只保留 top k」。

### 本質一：統計是共同第一步

```javascript
const freq = new Map()
for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1)
```

- **m** = 不同元素個數；頻率上界 ≤ **n** = `nums.length`。

### 本質二：三種取 top k 的取捨

| 做法 | 時間 | 何時選 |
|------|------|--------|
| **排序** entries by 頻率 | O(n + m log m) | 面試先寫、m 不大 |
| **大小 k 的最小堆** | O(n + m log k) | k ≪ m |
| **桶排序（頻率當索引）** | O(n) | 要最優、可接受 O(n) 空間 |

**排序（面試版）：**

```javascript
function topKFrequent(nums, k) {
  const freq = new Map()
  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1)
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([num]) => num)
}
```

**桶排序（最優）：** `buckets[f]` 放頻率為 `f` 的數字；從 `buckets.length - 1` 往下掃，湊滿 k 個。

```javascript
function topKFrequent(nums, k) {
  const freq = new Map()
  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1)
  const buckets = Array.from({ length: nums.length + 1 }, () => [])
  for (const [num, f] of freq) buckets[f].push(num)
  const out = []
  for (let i = buckets.length - 1; i >= 0 && out.length < k; i--)
    out.push(...buckets[i])
  return out.slice(0, k)
}
```

- **為什麼桶可行**：頻率 ∈ [1, n]，用陣列當直方圖，避開對 m 個 key 做全排序。

### 小結

- **問題**：在大量重複元素中找高頻 k 個。
- **手段**：Map 計數 → 依 k 與 m 選排序 / 堆 / 桶。
- **結果**：桶 O(n) 最優；堆在 k 小時更省；排序最易寫對。

可執行範例：`script/2-top-k-frequent-element.js`
