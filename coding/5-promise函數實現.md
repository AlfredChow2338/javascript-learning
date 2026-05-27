# Promise 靜態方法實現

面試常考 `Promise.all` / `race` / `allSettled` / `any`：**多個異步結果如何合併、誰決定 resolve/reject**。實作時一律先用 `Promise.resolve(p)` 把非 Promise 值包起來。

### 對照：誰在什麼情況下結束

| 方法 | resolve 條件 | reject 條件 |
|------|-------------|-------------|
| **all** | 全部 fulfilled | 任一 rejected |
| **race** | 第一個 settled（成或敗） | 同上 |
| **allSettled** | 全部 settled（永不 reject） | — |
| **any** | 任一 fulfilled | 全部 rejected |

### 本質一：all — 順序靠 index，不是 push

```javascript
Promise.myAll = function (promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) return reject(new TypeError('not array'))
    if (promises.length === 0) return resolve([])
    const results = []
    let done = 0
    promises.forEach((p, i) => {
      Promise.resolve(p).then(
        (v) => {
          results[i] = v
          if (++done === promises.length) resolve(results)
        },
        reject
      )
    })
  })
}
```

- **誤用 push**：先完成的 Promise 會讓結果順序錯位。

### 本質二：race — 第一個 settled 定勝負

```javascript
Promise.myRace = function (promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) return reject(new TypeError('not array'))
    promises.forEach((p) => Promise.resolve(p).then(resolve, reject))
  })
}
```

- 空陣列：規格上 **永遠 pending**（不要 resolve/reject）。

### 本質三：allSettled — 只 resolve，帶 status

每個結果 `{ status: 'fulfilled', value }` 或 `{ status: 'rejected', reason }`；計數滿了再 `resolve(results)`。

### 本質四：any — 第一個成功；全敗才 AggregateError

- 成功：設旗標 `hasResolved`，只 resolve 一次。
- 全敗：`reject(new AggregateError(errors, 'All promises were rejected'))`。

### 使用場景（各一句）

- **all**：並行拉多個資源，缺一不可。
- **race**：超時 `Promise.race([fetch, timeoutPromise])`。
- **allSettled**：批次操作要統計成功/失敗清單。
- **any**：多 CDN / 多鏡像，任一可用即可。

### 小結

- **問題**：N 個 Promise 的聚合語義不同。
- **手段**：`Promise.resolve` + 計數或「第一個」邏輯 + `results[i]` 保序。
- **結果**：與原生行為對齊即可通過面試與除錯。

可執行範例：`script/5-promise.js`
