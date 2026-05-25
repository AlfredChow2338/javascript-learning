# Layer 1 與 Layer 2 鏈比較

**L1** 是自帶共識與安全的主鏈（ETH、BTC、Solana）；**L2** 在 L1 上 **batch 交易、鏈下執行**，把壓縮後的狀態/證明 **錨定回 L1** 借安全性。取捨是 **擴展三難**（去中心化 / 安全 / 吞吐只能優其二）— L2 用 **更便宜更快的執行層** 換 **橋接複雜度與最終性語意**。

### 本質一：為什麼需要 L2

- **L1 瓶頸**：ETH ~十幾 TPS、block 時間秒級、擁堵時 Gas 高（`web3/2-以太坊Gas機制解釋.md`）。
- **L2 思路**：大量 tx 在 L2 執行 → **一個 L1 tx 提交 batch/proof** → 分攤 L1 成本。
- **誤解**：L2 不是「另一條獨立鏈」就完事 — **安全假設仍綁 L1**；橋是主要風險面。

### 本質二：L1 選型（決策維度）

- **EVM 兼容**（ETH、BSC、Polygon PoS 側鏈）：Solidity 生態、工具復用。
- **非 EVM**（Solana、Aptos、Sui）：不同 VM/帳戶模型，性能高、遷移成本高（`web3/4-solana-租金機制解釋.md`）。
- **去中心化 vs 速度**：BTC/ETH 偏安全；BSC 等 validator 更集中 → 快但 trust 不同。
- **生態**：流動性、oracle、索引、錢包支持 — **空鏈便宜沒人用**。

### 本質三：L2 技術族

| 類型 | 機制 | 取捨 |
|------|------|------|
| **Optimistic Rollup** | 假設合法，**挑戰期**內 fraud proof | EVM 易移植；withdraw 慢（7 天級） |
| **ZK Rollup** | **有效性證明**上 L1 | withdraw 快；prover 貴、EVM 兼容在演進 |
| **Validium / Plasma** | 數據放鏈外 | 更便宜；數據不可用風險更高 |
| **Sidechain** | 獨立共識，橋連接 | 不算嚴格 L2 安全；BSC/Polygon PoS 常歸類討論 |

- **因果**：選 OP 還是 ZK = **延遲 vs 證明成本 vs 兼容** 的 tradeoff，不是「ZK 全面更好」。

### 本質四：橋（Bridging）— 真正的風險點

- **資產跨鏈**：lock/mint 或 liquidity network — **合約 bug / 簽權被盜 = 巨額損失**（`web3/6-web3-application的security-vulnerabilities.md`）。
- **消息跨鏈**：L1↔L2 狀態同步；finality 不同步會導致 **雙花感知**。
- **產品**：小額 L2 交互、大額 slow path；官方橋優先於無名橋。

### 本質五：怎麼選

- **選 L1 部署**：極高價值/合規/強安全假設；原生資產發行；極長 finality 可接受。
- **選 L2 部署**：DeFi/NFT/遊戲 **高頻交互**；用戶已在 L2；可接受橋與 OP 挑戰期。
- **多鏈策略**：同一邏輯多部署 + **統一前端選鏈**；流動性碎片是產品問題不是純技術問題。

### 小結

- **問題**：L1 貴且慢，但安全。
- **手段**：Rollup 批處理 + L1 錨定；橋接流動性。
- **結果**：主流以太坊生態走 **L2 執行 + L1 結算**；選鏈 = 安全模型 + 成本 + 生態 + 橋風險。
