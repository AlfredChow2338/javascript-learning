# Web3 應用的安全挑戰與漏洞

Web3 安全難在 **鏈上不可逆、合約公開、資產即 code**：一次 revert 攔不住已轉走的 ETH，一次 **無限 approve** 可清空錢包。取捨不是「多加 audit」而已 — 要 **合約層 invariant + 錢包/前端信任邊界 + 運維密鑰** 分層防；與 `web/2-web-security-practices.md` 互補（XSS/CSRF 仍管 DApp 前端）。

### 本質一：為何 Web3 威脅模型不同

- **無 undo**：tx 確認後只能再發 tx 補救，不能 rollback DB。
- **公開 bytecode**：攻擊者可 fork 本地精確 replay。
- **MEV / 公開 mempool**：交易順序可被 **front-run/back-run**。
- **用戶即密鑰**：沒有「伺服器 session 作廢」— 私鑰丟 = 帳戶丟。

### 本質二：智能合約 — 高頻漏洞

| 漏洞 | 機制 | 防護要點 |
|------|------|----------|
| **Reentrancy** | 外部 call 在 state 更新前重入 | CEI 順序、`nonReentrant` |
| **Overflow** | 舊版整數繞界 | Solidity 0.8+ / SafeMath |
| **Access control** | 任意人調 admin | `onlyOwner`、role、timelock |
| **Front-running** | 公開 mempool 搶跑 | commit-reveal、私有 mempool、滑點限制 |
| **Oracle 操縱** | 現貨價被閃電貸拉高 | TWAP、多源、延遲 |
| **Logic / 精度** | rounding、first depositor | 審計、invariant 測試 |

- **閃電貸**：單 tx 內借還 — **治理投票、價格、清算** 可在一條 tx 完成攻擊鏈。

### 本質三：錢包與前端（用戶資金入口）

- **私鑰 / seed**：硬體錢包、不網頁存 seed、防釣魚站點。
- **approve 釣魚**：惡意 site 請求 **無限 token 授權** — 清單化 spender、revoke.cash。
- **前端攻擊**：改 **contract address、chainId、calldata** — 用戶以為在 Uniswap，實際簽 malicious（`web/2-web-security-practices.md` XSS 可改頁面）。
- **WalletConnect / 簽名盲簽**：讀清 **EIP-712 typed data** 再簽。
- **Smart contract wallet**：模組權限、social recovery 各增 attack surface。

### 本質四：鏈與網路層

- **51% / long-range**：小鏈 PoW/PoS 風險；選 **finality 強** 的 L1/L2。
- **RPC eclipse**：餵假鏈狀態 — 多 RPC、自驗 block hash。
- **Sybil / DDoS**：節點與 indexer 層；非合約 alone 可解。
- **Bridge**：歷史最大被盜面 — 最小化跨鏈、官方橋、監控 anomaly。

### 本質五：治理與運維

- **投票操縱 / 閃電貸治理**：臨時借票改參數 — timelock、快照 block、quorum。
- **Timelock bypass**：proxy admin 誤配 — 多簽 + 延遲公開。
- **Admin key 單點**：upgrade proxy `implementation` — **多簽 + timelock + 放棄 ownership** 是產品承諾。
- **密鑰**：HSM/KMS、分級權限、鏈上事件監控；**never commit private key**。

### 本質六：工程流程（可執行）

- **開發**：OZ 庫、靜態分析（Slither）、fuzz（Foundry）、invariant、external audit。
- **部署**：immutable vs upgradeable 顯式告知；verify on Etherscan；初始化參數 double-check。
- **運維**：pause 機制、incident runbook、鏈上監控（`web/7-signoz實現和原理.md` 類 RUM 管 API，鏈上用 indexer + alert）。
- **Bug bounty**、漸進 rollout、限 TVL cap。

### 與 ERC20 / Gas / L2 的關係

- **`web3/5-甚麼是erc20-token.md`**：approve 向量。
- **`web3/2-以太坊Gas`**：out of gas 半狀態、DoS gas griefing。
- **`web3/3-比較layer1-layer2`**：橋與 rollup 信任。

### 小結

- **問題**：公開、不可逆、高價值、新棧。
- **手段**：合約 CEI+審計、最小授權、前端地址校驗、多簽治理、橋最小化、監控。
- **結果**：風險無法為零；目標是 **每層假設會破、損失有上限**。
