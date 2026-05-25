# 什麼是 ERC20 Token

ERC20 是以太坊上 **同質化代幣的標準接口**：`transfer`、`balanceOf`、`approve`、`transferFrom` + `Transfer`/`Approval` 事件。取捨是 **錢包/DEX/聚合器一次集成、處處可用** ↔ **標準本身不管安全、權限、通脹** — 任何 `0x` 合約都可能惡意。

### 本質一：為什麼要標準

- **問題**：每項目自定義 `send`/`move` — 交易所、MetaMask 無法統一。
- **手段**：EIP-20 固定 **6 個必選函數 + 2 事件**（`name`/`symbol`/`decimals` 可選）。
- **結果**：Uniswap、OpenSea 等按 **同一 ABI** 調任意 token — **Composable DeFi** 的基礎。

### 本質二：核心語義（搞錯就丟錢）

- **`transfer(to, amount)`**：msg.sender 減、to 加。
- **`approve(spender, amount)`**：授權 **spender** 可動用額度 — **無限 approve 是常見被盜路徑**。
- **`transferFrom(from, to, amount)`**：spender 代扣 — DEX/router 靠此 pull 代幣。
- **`allowance`**：剩餘授權額；**先 approve 新值前要考慮 USDT 類非標準 reset**。
- **Events**：鏈下索引靠 `Transfer`/`Approval` — The Graph 等。

### 本質三：實現層取捨

- **不要手寫**：用 **OpenZeppelin ERC20** + `AccessControl` / `Pausable` 等擴展。
- **Mint/Burn**：是否在 deploy 後仍可 mint — **無限 mint = rug 向量**。
- **Decimals**：通常 18；UI 要 `formatUnits` — 與小數位數錯誤展示。
- **非標準 token**：fee-on-transfer、rebasing、blacklist — DEX 集成會 **記賬不對**。

### 本質四：擴展標準（何時超越 ERC20）

- **ERC721 / 1155**：NFT 與非同質批量。
- **ERC2612 permit**：簽名授權，少一筆 approve tx — Gas 優化。
- **ERC4626**：收益 vault 標準 — 統一 deposit/redeem 接口。
- **局限**：ERC20 不表達 **投票、委託、鎖倉** — 用 Governor/ve 等另合約。

### 本質五：前端 / DApp 集成

- 讀：`balanceOf`、`decimals`、`symbol`。
- 寫：用戶 wallet 簽 `transfer` / 先 `approve` 再 router `transferFrom`。
- **必須**：顯示 **完整 contract address**、鏈 ID；防 **釣魚同名 token**（`web3/6-web3-application的security-vulnerabilities.md`）。
- **授權 UX**：有限額 approve、revoke 連結、permit。

### 常見陷阱

- **無限 approve 給不明 router**。
- **只驗 symbol 不驗 address**。
- **忘記 decimals** 導致數量差 10^18。
- **假設 transfer 必成功**：部分 token 返回 false 不 revert。

### 小結

- **問題**：鏈上多種代幣需互操作。
- **手段**：ERC20 統一接口 + 事件索引。
- **結果**：DeFi 樂高；安全靠 **合約質量 + 授權習慣 + 地址校驗**，不在標準內。
