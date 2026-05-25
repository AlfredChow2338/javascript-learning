# 以太坊 Gas 機制

Gas 是以太坊對 **EVM 計算與 storage 的計量單位**：每 opcode、每 byte 存儲都有固定成本；使用者付 **fee ≈ gas used × gas price** 換取 block 空間與執行。取捨是 **spam 與無限 loop 被經濟阻斷** ↔ **每次交互都要估 fee、Congestion 時貴**。

### 本質一：為什麼需要 Gas

- **防濫用**：無 cost 的 Turing-complete 合約可拖垮節點。
- **激勵驗證者**：PoS 下 priority fee 給 proposer/validator。
- **資源定價**：SSTORE 貴、CALL 貴 — **寫 storage 比算數更貴**，鼓勵少占 state。

### 本質二：費用怎麼算（EIP-1559 後）

- **`gas used`**：實際執行消耗（≤ `gas limit`）；用不完 **不退 limit 與 price 的乘積差額** 的誤解常見 — 只退 **未用掉的 gas × price** 部分。
- **`base fee`**：協議按 block 利用率 **自動調**，且 **burn** — 網路忙時 base 升。
- **`priority fee`（tip）**：給 validator 排序用 — 想快就加 tip。
- **`maxFeePerGas`**：願意付的上限；`maxFee - base - tip` 可退。
- **誤解**：Gas Price 高 ≠ tx 一定成功 — **out of gas / revert 仍燒 gas**。

### 本質三：哪些操作貴

- **ETH 轉帳**：~21,000 gas（基準）。
- **Contract call**：視邏輯；**首次寫 storage** 遠貴於改已有 slot。
- **Calldata**：L1 上 blob 外 data 按 byte 計 — L2 常更便宜（`web3/3-比較layer1-layer2鏈.md`）。
- **部署合約**：按 bytecode 大小 + constructor 執行。

### 本質四：工程上怎麼控 Gas

- **模式**：CEI（Checks-Effects-Interactions）、少 SSTORE、用 `immutable`/`constant`、事件代替 storage、batch。
- **估算**：`estimateGas` + 10–20% buffer；simulate / tenderly 抓 revert。
- **L2**：同 EVM 語意、低 base — 高頻交互默認考慮 L2。
- **UX**：顯示預估 fee；失敗要解釋 **revert reason**。

### 與 Solana Rent 的對比

- **ETH Gas**：按 **每次執行** 付；state 長期存在靠 **storage rent 機制弱**（清理靠 selfdestruct 限制與 EIP 改革）。
- **Solana Rent**：按 **帳戶空間** 預付 — 見 `web3/4-solana-租金機制解釋.md`。

### 常見陷阱

- **gas limit 過低** → out of gas，state 可能部分已改（視 revert 點）。
- **未處理 revert** → 前端以為成功。
- **在 L1 做高頻微操作** → 產品不可承受。
- **忽略 EIP-1559 字段** → 仍用 legacy `gasPrice` 在部分工具。

### 小結

- **問題**：公開 EVM 需計量與激勵。
- **手段**：Gas 單位 + base burn + priority tip + storage 差異化定價。
- **結果**：執行有上限與成本；優化 = 少寫鏈上 state + 選對鏈（L1/L2）。
