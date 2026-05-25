# 區塊鏈基礎原理與 Web3 生態

區塊鏈是 **多方維護、用密碼學鏈接的帳本**：新資料打包成 block，hash 指向前塊，改歷史需重算後續整條鏈 — 在足夠去中心化下 **幾乎不可篡改**。Web3 是在此帳本上跑 **智能合約 + 錢包 + DApp**；取捨是 **無中介信任** ↔ **不可逆、Gas/租金、安全責任全在鏈上邏輯**。

### 本質一：區塊鏈在解決什麼

- **問題**：多方記帳需一致，又不想依賴單一銀行/server。
- **手段**：P2P 廣播交易 → 打包 block → **共識** 選 canonical 鏈 → 全節點驗證。
- **結果**：公開（通常）可審計的 global state；**不是**「加密=匿名」，地址可追蹤。

### 本質二：結構 — hash 為什麼能防篡改

- **Block**：header（prevHash、merkle root、timestamp…）+ 交易列表。
- **Hash**：微小輸入變 → 輸出劇變；改舊 block 會 **連鎖 invalidate** 後續 hash。
- **Merkle tree**：大量交易用 root 摘要 — 輕節點可驗 inclusion。
- **誤解**：hash 不是加密隱藏內容，是 **完整性** 與 **鏈式綁定**。

### 本質三：共識 — 誰有資格寫下一塊

| 機制 | 核心 | 取捨 |
|------|------|------|
| **PoW** | 算力競賽 nonce | 安全、耗能、慢（BTC） |
| **PoS** | 質押選 validator | 省能、快；需防 nothing-at-stake / 中心化（ETH 2.0） |
| **DPoS** | 投票代表 | 快、治理集中（EOS 類） |

- **因果**：共識決定 **finality 速度、攻擊成本、TPS 上限** — 見 `web3/3-比較layer1-layer2鏈.md` 三難困境。

### 本質四：交易與智能合約

- **Transaction**：簽名授權 state 變更；上鏈 **不可撤銷**（除非鏈本身 reorg，窗口短）。
- **Account vs UTXO**：ETH/SOL 多 **account model**；BTC **UTXO** — 影響 wallet 與合約設計。
- **Smart Contract**：鏈上 deterministic 程式 — **bug = 直接資金風險**（`web3/6-web3-application的security-vulnerabilities.md`）。
- **EVM**：以太坊字節碼 VM；Solidity 最常見 — Gas 見 `web3/2-以太坊Gas機制解釋.md`。

### 本質五：Web3 應用棧（前端視角）

- **Wallet**：私鑰簽名 — 使用者 **就是** 身份；非 `web/2-web-security-practices.md` 的 session 模型。
- **RPC 節點**：讀鏈、廣播 tx — 單點 RPC 可被 **eclipse / 餵假資料**。
- **DApp 前端**：ethers/viem/wagmi 調 wallet + 讀 contract — **前端顯示可被篡改**，須驗 contract address。
- **索引**：The Graph 等 — 鏈下查詢，非 consensus 本身。

### 與其他 web3 筆記的分工

- **`2-以太坊Gas`**：EVM 執行計費。
- **`3-L1/L2`**：擴展與選鏈。
- **`4-Solana rent`**：非 EVM 的 state 成本模型。
- **`5-ERC20`**：最常見 token 接口。
- **`6-安全`**：合約與錢包威脅全集。

### 小結

- **問題**：去中心化一致帳本 + 可程式化資產。
- **手段**：hash 鏈 + 共識 + 簽名交易 + 智能合約。
- **結果**：無許可金融/應用可能；代價是 **不可逆、公開、安全完全鏈上+鏈下自負**。
