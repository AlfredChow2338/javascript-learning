## React.cache()基本原理

`React.cache()` 是 React 19 引入的函數，用於**請求記憶化**（Request Memoization）。簡單來說，它能讓相同參數的 fetch 請求只執行一次，避免重複浪費。

**實際情境**：你有個使用者資料函數，在同一個頁面裡被多個元件呼叫。如果首頁、側邊欄、彈出視窗都要顯示同一個使用者，API 會被呼叫三次，這就是所謂的「瀑布效應」問題

```jsx
import { cache } from 'react'

export const getUser = cache(async (id) => {
	const res = await fetch(`/api/users/${id}`)
	return res.json()
})
```

通過以上事例，即使getUser被call多次，API 只會被觸發一次。其他呼叫會直接拿到之前快取的結果。

`fetch` 的 cache 是跨請求的：不同使用者、不同頁面都能共享。`React.cache()` 是**單次請求週期內**的有效，即只在同一次伺服器渲染過程中生效。所以 `React.cache()` 解決的是「同一個頁面 render 過程中的重複請求」，而不是「不同請求之間的快取」。

1. 只能用於 async 函數
2. Parameters必須是可序列化的（支援物件作為 key）
3. 在 client component 無法使用（這是 Server-only 的功能）
4. 如果需要跨請求共享，請用 `fetch` 的 cache 或 third-party 方案如 Redis

`React.cache()` 是request-level的 memoization，專治同一頁面內的重複 fetch。