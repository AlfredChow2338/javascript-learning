# Solana 租金（Rent）機制

Solana 的 **Rent** 是對 **鏈上帳戶占用的存儲空間** 收費：帳戶要在 ledger 裡留字節，就要 **預存足夠 SOL** 達到 **rent-exempt**，否則可能被回收。與以太坊 **按次 Gas 執行** 不同 — 取捨是 **state 膨脹可控** ↔ **創建帳戶要算 minimum balance**。

### 本質一：為什麼有 Rent

- **問題**：無成本空帳戶 → 驗證者 disk 無限漲。
- **手段**：按 **account data size** 要求 **2 年租金等價的 lamports** 常駐餘額 → **rent-exempt** 後不再扣租。
- **結果**：創建 token account、PDA、program data 都要 **留足 SOL**；關閉帳戶可回收 rent。

### 本質二：和 ETH Gas 的分工

| | Ethereum Gas | Solana Rent |
|--|--------------|-------------|
| 計費點 | 每次 tx 執行 + SSTORE | 帳戶空間 **占用** |
| 長期 state | 一次性 SSTORE 貴，無持續租 | rent-exempt 一次達標 |
| 清理 | 難主動清 state | **close account** 回收 |

- 見 `web3/2-以太坊Gas機制解釋.md` — 兩鏈 **成本模型不同**，移植 DApp 不能只換 RPC。

### 本質三：帳戶與 rent-exempt

- **System / Token / Program 帳戶**：data length 決定 **rent-exempt minimum** — 用 `getMinimumBalanceForRentExemption(size)`。
- **創建 Token Account**：除 mint 邏輯外，常需 **~0.002 SOL 量級** 的 exempt 押金（隨參數變）。
- **Program**：部署 bytecode 占大 space → **部署成本高**。
- **誤解**：rent-exempt 不是「免費存儲 forever 無上限」— 仍是 **預付存儲押金**。

### 本質四：工程實踐

- **創建前**：算 size → 查 minimum → 錢包 SOL 不足會失敗。
- **關閉帳戶**：`closeAccount` 把 lamports 轉回 owner — **回收 rent**，減 state 膨脹。
- **PDA**：seed 推導地址；同樣占 space、要 exempt。
- **UX**：向用戶解釋 **refundable deposit** vs **fee**。

### 常見陷阱

- **只 mint 不存夠 rent** → 創建 ATA 失敗。
- **大量臨時帳戶不 close** → 用戶 SOL 被鎖在 dead accounts。
- **用 ETH 心智估 Solana 成本** → 低估 **帳戶數量 × exempt**。
- **忽略 account data 上限** — 單帳戶 10MB 上限等量約束。

### 與 L1 選型的關係

- Solana 高 TPS、低 per-tx fee，但 **state 與 rent 模型** 是產品成本一部分 — 見 `web3/3-比較layer1-layer2鏈.md`。

### 小結

- **問題**：鏈上 state 誰付費、如何防垃圾帳戶。
- **手段**：rent-exempt minimum + 可回收 close。
- **結果**：存儲有明確價格信號；開發要 **算 space、留 SOL、會回收**。
