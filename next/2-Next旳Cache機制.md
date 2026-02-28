## Static 與 Dynamic

Next.js 的頁面分兩種：**Static**（靜態）和 **Dynamic**（動態）。

Static 頁面在 build 時就確定了，永遠不會變，永遠用同一個快取。Dynamic 頁面每次請求都可能不同，預設不 cache。

這裡有個重要概念：**Static 不是都不能更新**，你可以用 `revalidate` 讓它定時更新。

## **fetch() 的 cache 選項**

在 Next.js 裡面，`fetch` 有三種 cache 模式：

第一種是 `force-cache`，強制使用快取，相當於 Static。第二種是 `no-store`，完全不用快取，每次都去抓新的。第三種是 `revalidate`，一段時間後自動重新驗證快取。

```jsx

// 強制快取
fetch('https://api.example.com/data',{cache:'force-cache'})

// 不快取
fetch('https://api.example.com/data',{cache:'no-store'})

// 60秒後重新驗證
fetch('https://api.example.com/data',{next:{revalidate:60}})
```

## **進階：Router Cache 與 Full Route Cache**

Next.js 其實有兩層快取：**Router Cache** 和 **Full Route Cache**。

Router Cache 存在客戶端，專門快取已經訪問過的頁面連結，讓你點擊連結時瞬間跳轉，不用重新載入。Full Route Cache 存在伺服器端，快取整個頁面的 HTML 和 React Server Component 的結果。

這就是為什麼 Next.js 網站這麼快——因為它把能存的全部存起來了。

## **On-Demand Revalidation**

除了定時 revalidate，你還可以**手動觸發**更新。只要訪問 `/api/revalidate?path=/products`，就能讓特定頁面立刻刷新快取。這對於 CMS 更新後要立刻看到新內容特別有用。