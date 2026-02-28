# Next.js Hydration 是什麼？

**什麼是 Hydration**

Hydration（水合）是 Next.js 將伺服器渲染的 HTML「激活」成可互動 React 應用的過程。伺服器先 render 出靜態 HTML，瀏覽器下載後，React 會接管這些 DOM 元素，綁定事件處理器，讓頁面變得可以互動。

**為什麼需要 Hydration**

如果沒有 Hydration，網頁就只是靜態內容——按鈕點不了、表單無法提交、狀態也無法更新。Hydration 讓伺服器生成的 HTML 變成「活」的應用，同時享受 SSR 的速度和 CSR 的互動性。

**Hydration 的問題**

最大的困擾是**客戶端和伺服器內容不一致**。比如你在伺服器端用 `new Date()` 取得時間，但客戶端 hydration 時時間已經變了，React 會發現 HTML 不匹配，產生「hydration mismatch」錯誤，導致整個元件樹重新渲染。常見案例：時間顯示、天氣元件、隨機數內容、第三方嵌入內容。

**第一個解決方案是只在客戶端渲染，**用`useEffect` 確保只在客戶端執行，避免 hydration mismatch。

```jsx
'use client'

import{ useEffect, useState } from 'react'

function TimeDisplay () {
	const [time, setTime] = useState(null)
	
	useEffect(()=>{
		setTime(newDate())
	}, [])
	
	if (!time) return <div>Loading...</div>
	
	return<div>{time.toLocaleTimeString()}</div>
}
```

**第二個解決方案是使用 `next/dynamic` 延遲載入，**直接把會產生問題的元件變成客戶端專用，伺服器完全不渲染它。

```jsx
import dynamic from 'next/dynamic'

const DynamicWeather = dynamic(()=> import('./Weather'), { ssr:false })
```

**進階optimization：React Suspense + Selective Hydration**

Next.js 13+ 引入Selective Hydration，以前是等整個頁面 hydrate 完成才能互動，現在可以讓關鍵元件先互動，其他部分慢慢來。搭配 React Suspense，可以讓頁面「分區域」完成 hydration，使用者更快能開始操作。