# Throttle 實現

高頻事件（scroll）需要 **定期** 更新 UI，但又不能每幀都跑。**Throttle**：在 `delay` 窗口內 **最多執行一次**（可選 leading 立刻、trailing 補最後一次）。

### 本質：時間戳版（leading）

- **問題**：觸發遠多於人眼/業務需要的更新次數。
- **手段**：記 `lastTime`；`now - lastTime >= delay` 才執行並更新 `lastTime`。
- **結果**：均勻節流，例如每 100ms 最多一次 scroll handler。

```javascript
function throttle(func, delay) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      return func.apply(this, args)
    }
  }
}
```

### 與 Debounce 的因果差異

- **Throttle**：持續滾動仍會 **每隔 delay 執行** → 進度條、懶加載檢測。
- **Debounce**：滾動 **停下來** 才執行 → 搜尋、resize 算版面（見 `3-debounce實現.md`）。

### 進階（面試加分）

- **trailing**：窗口內最後一次參數用 `setTimeout(remaining)` 補執行。
- **cancel / flush**：元件卸載時清定時器或強制執行排隊中的尾呼叫。

### 小結

- **問題**：限制執行頻率但保持「有在更新」。
- **手段**：時間窗 + `apply` 保 `this`。
- **結果**：scroll / mousemove / 防連點常用。

可執行範例：`script/7-throttle.js`
