# Debounce 實現

高頻觸發（輸入、resize）若每次都跑 handler，會浪費 CPU / 打爆 API。**Debounce**：連續觸發只保留「最後一次」，等安靜 **delay** 後才執行。

### 本質：定時器重置鏈

- **問題**：事件在短時間內連發。
- **手段**：每次呼叫 `clearTimeout` 再 `setTimeout`；閉包保存 `timeoutId`。
- **結果**：只有「最後一輪觸發 + delay」會真正呼叫原函數。

```javascript
function debounce(func, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}
```

- **`apply(this, args)`**：保留呼叫方的 `this` 與參數（例如 `obj.handler` 綁在物件上）。

### 常見變體

- **immediate**：第一次立刻執行，其後在 delay 內再觸發則重置等待（適合「先反應、再合併後續」）。
- **cancel**：`debounced.cancel = () => { clearTimeout(timeoutId); timeoutId = null }`，卸載元件時避免殘留 callback。

### 與 Throttle 的分工

- **Debounce**：停止觸發後才執行 → 搜尋框、表單校驗。
- **Throttle**：固定窗口最多一次 → scroll、mousemove（見 `7-throttle實現.md`）。

### 小結

- **問題**：只關心「最終狀態」，不要中間每次觸發。
- **手段**：單一定時器 + 每次重置。
- **結果**：請求次數與實際完成輸入次數同級。

可執行範例：`script/3-debounce.js`
