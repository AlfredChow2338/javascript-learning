# 第一戰役：HTTP緩存，基礎防線

## 強緩存

- Cache-control: max-age=31536000, immutable
- Expires: HTTP/1.0遺留，用具體時間表示過期
- 場景：靜態資源 (JS, CSS, assets) ，文件名帶hash

## 協商緩存

- Last-Modified / If-Modified-Since：基於文件修改時間
- Etag / If-None-Match：基於文件內容指紋（更準確）
- 場景：HTML文件、API接口（需驗證最新數據）

## 緩存策略組合

- HTML：No-cache （每次都驗證）
- 靜態資源：max-age=31536000, immutable（長期緩存）
- API：No-store （完全不緩存）或private, max-age=60 （私有緩存一分鐘）

# 第二戰役：Service Worker，離線時代的守護神

- Service Worker：瀏覧器後台運行的腳本
- 可攔截網路請求、實現離線緩存、消息推送、後台同步
- 生命週期：註冊 安裝 激活 運行 更新

## 緩存策略設計

- Cache First：優先讀緩存，無緩存則請求網絡資源（適合靜態資源）
- Network First：優先請求網絡資源，失敗則讀取緩存（適合API）
- Stale while revalidation：返回緩存，同時異步更新緩存（適合內容更新不頻繁的頁面）
- Cache only / Network only：極端場景

## 更新策略

- 更新Service Worker 腳本
- 新版本進入waiting狀態，直到舊版本頁面關閉
- 使用skipWaiting和clients.claim強制立即激活

# 第三戰役：Web Storage，輕量級數據儲存

## localStorage vs sessionStorage

- 同：Key value pair，只能儲存string，需用JSON.parse / JSON.stringify交互
- 異：localStorage持久化，sessionStorage會話級

## 適用場景

- localStorage：用戶偏好配置、theme
- sessionStorage：form臨時數據，頁面間傳值
- 限制5 - 10 MB、同步操作，不適合大量數據

# 第四戰役：IndexedDB，瀏覽器的數據庫

- NoSQL database，儲存大量結構化數據
- 異步API，支持索引、事務
- 核心概念：數據庫、對象倉庫、索引、游標、事務

## 適用場景

- 離線數據儲存，如郵件、文檔
- 大型文件，通過blob儲存
- 用戶行為日志，待網絡恢復後上報
- 常用庫：Dexie.js、idb，簡化操作

# 第五戰役：緩存更新與失效，最容易被忽視的一環

- 版本管理：給緩存數據加版本號，版本變更時清理舊緩存
- 緩存清理策略
  - LRU (Least Recently Used)：淘汰最久未被訪問的緩存
  - TTL (Time To Live)：設置過期時間，自動失效
  - 手動失效：用戶操作（如登出）清空用戶敏感數據
  - 離線上報：使用Background Sync API，網絡恢復後立即發送積壓請求

# 實戰案例，離線閱讀的新聞閱讀器

需求：用戶在沒網的地鐵裡閱讀已加載新聞，發評論暫存，待有網時自動發送請求

## 設計

- HTTP緩存：靜態資源長期緩存，API用no-cache
- Service Worker：採用Stale while revalidate，優先返回緩存，並同時異步更新緩存
- IndexedDB：儲存新聞列表、文章內容、待發送評論
- Background Sync：待網絡恢復後發送積壓評論
- 控制策略：將7天前的新聞刪除，控制緩存數據大小
