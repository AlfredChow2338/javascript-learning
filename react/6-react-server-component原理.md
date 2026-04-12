## React Server Component 原理

在 App Router 等架構下，預設在伺服器執行的 React 樹若誤解成「另一種 SSR」，會錯估 bundle、邊界與資料流。**一句話**：RSC 把「可在伺服器算的 UI」留在伺服器，只把**序列化後的樹（RSC payload）**交給瀏覽器；互動仍落在標記為 Client 的邊界內。

### 本質一：它在解決什麼

- **問題**：純客戶端組件 = 依賴下載 JS + 常見「先 hydrate 再打 API」的往返；機密與重型依賴也不該進瀏覽器。
- **手段**：伺服器執行 Server Component，產出可傳輸的樹狀描述；Client Component（例如 `use client`）才打包、才跑 hooks 與事件。
- **結果**：展示與資料取得可貼近資料源（DB、檔案、內網），下載給使用者的**主要是互動所需**的那一段 JS；若誤把需要互動的整頁都做成「預設伺服器組件」，會發現無法用 state / 事件 —— 那不是 bug，是模型分工。

### 本質二：邊界與資料規則（搞錯就壞）

- **誰能 import 誰**：Server 可 render Client；Client **不可** import Server 模組（否則伺服器邏輯會被拖進客戶端 bundle 或違反執行模型）。需要時用 **props / children** 把伺服器已算好的結果傳進 Client。
- **跨邊界 props**：必須是**可序列化**的資料（JSON 友善）。不可傳函式、類實例、Symbol 等 —— 因為邊界兩側是不同 runtime，傳的是「資料」不是「行為」；行為留在 Client 內定義。
- **Server 側不能做**：`useState` / `useEffect`、事件處理、`window` / `document` 等瀏覽器 API（與「在伺服器執行」矛盾）。
- **Server 側適合做**：`async` 資料、直接查 DB / 讀檔、環境變數；與 **Suspense** 組合做載入分段亦可。

### 本質三：和「傳統 SSR / 靜態產生」的關係

- **與 SSR**：兩者都可先在有資料的環境算 UI；差別在 RSC **不把 Server 組件邏輯當成一大包客戶端 bundle**，而是協議化的更新流（payload），互動仍靠 Client 邊界與（視框架）hydration 策略。不要只用「都有 HTML」來等同兩者。
- **與 SSG**：SSG 是**建置時**固定內容；RSC 常是**依請求**在伺服器組樹，適合常變或個人化內容，但取捨是伺服器算力與快取策略，不是「比較像靜態頁」。

### 本質四：實務上怎麼切

- **Server**：列表、文章、依權限裁剪後的資料、少互動的版面。
- **Client**：表單、動畫、僅瀏覽器能做的 API、區域狀態與事件。
- **傳遞**：只傳 Client 需要的欄位，減少序列化與重 render 成本；錯誤在 Server 組件內 try/catch 成 UI 即可，不必為「展示錯誤頁」硬拉一整包到客戶端。

### 與其他筆記的關係

- **Reconciliation / Fiber**：客戶端仍對**已抵達的那一側**做協調；RSC 改的是「誰先算、什麼被下載」，不是取代 reconciler。
- **快取與 `react.cache`**：伺服器端資料去重與請求邊界常和框架／cache API 一起出現，可另篇對照「同一請求內 dedupe」語意。

### 小結

- **問題**：bundle、往返、邊界與祕密資料不宜全部進瀏覽器。
- **手段**：伺服器組樹 + 序列化 payload；Client 邊界承載互動與 hooks。
- **結果**：預設把「能伺服器算的就伺服器算」，互動收斂到小塊 Client；跨邊界只傳可序列化資料，並遵守 import 方向，即可避免多數模型性錯誤。
