## 什麼是 ERC20 Token

### ERC20 簡介

**ERC20**（Ethereum Request for Comments 20）是以太坊上最流行的代幣標準。它定義了一套標準接口，讓所有符合該標準的代幣都能在以太坊生態系統中無縫交互。

**核心特點：**
- **標準化**：統一的接口，確保所有 ERC20 代幣可以互操作
- **兼容性**：錢包、交易所、DApp 都可以統一處理
- **簡單性**：實現簡單，易於部署和使用

### 為什麼需要 ERC20 標準

#### 標準化之前的问题

在 ERC20 標準出現之前，每個代幣都有自己的實現方式：

```solidity
// ❌ 沒有標準：每個代幣接口不同
contract TokenA {
    function send(address to, uint amount) public { }
}

contract TokenB {
    function transfer(address recipient, uint256 value) public { }
}

contract TokenC {
    function move(address destination, uint tokens) public { }
}
```

**問題：**
- 錢包需要為每個代幣編寫不同的代碼
- 交易所需要單獨適配每個代幣
- DApp 無法統一處理不同代幣
- 開發者需要重複實現相同功能

#### ERC20 標準的解決方案

```solidity
// ✅ 標準化：所有代幣使用相同接口
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    // ... 標準函數
}
```

**優勢：**
- 統一的接口，一次編寫，處處使用
- 錢包和交易所可以自動支持所有 ERC20 代幣
- 開發者可以重用代碼和工具

---

## ERC20 標準規範

### 必須實現的函數（Required Functions）

#### 1. totalSupply()

**功能：** 返回代幣的總供應量

```solidity
function totalSupply() external view returns (uint256);
```

#### 2. balanceOf(address account)

**功能：** 返回指定地址的代幣餘額

```solidity
function balanceOf(address account) external view returns (uint256);
```

#### 3. transfer(address to, uint256 amount)

**功能：** 從調用者地址轉賬代幣到指定地址

```solidity
function transfer(address to, uint256 amount) external returns (bool);
```

**特點：**
- 必須返回 `bool` 表示成功或失敗
- 必須觸發 `Transfer` 事件
- 如果餘額不足，必須回滾交易

#### 4. transferFrom(address from, address to, uint256 amount)

**功能：** 從指定地址轉賬代幣到另一個地址（需要預先授權）

```solidity
function transferFrom(address from, address to, uint256 amount) external returns (bool);
```

**使用場景：**
- 委託轉賬（如 DEX 交易）
- 自動化支付
- 智能合約控制轉賬

#### 5. approve(address spender, uint256 amount)

**功能：** 授權指定地址可以從調用者地址轉賬指定數量的代幣

```solidity
function approve(address spender, uint256 amount) external returns (bool);
```

**使用流程：**
```
1. 用戶調用 approve(spender, amount)
2. Spender 獲得授權
3. Spender 可以調用 transferFrom 轉賬
```

#### 6. allowance(address owner, address spender)

**功能：** 返回 owner 授權給 spender 的代幣數量

```solidity
function allowance(address owner, address spender) external view returns (uint256);
```

### 必須實現的事件（Required Events）

#### 1. Transfer

**觸發時機：** 代幣轉賬時

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
```

**參數：**
- `from`：發送地址（如果是鑄造，為零地址）
- `to`：接收地址（如果是銷毀，為零地址）
- `value`：轉賬數量

#### 2. Approval

**觸發時機：** 授權時

```solidity
event Approval(address indexed owner, address indexed spender, uint256 value);
```

**參數：**
- `owner`：代幣所有者
- `spender`：被授權的地址
- `value`：授權數量

### 可選的函數和屬性（Optional）

#### name()

**功能：** 返回代幣名稱

```solidity
function name() external view returns (string memory);
```

#### symbol()

**功能：** 返回代幣符號

```solidity
function symbol() external view returns (string memory);
```

#### decimals()

**功能：** 返回代幣小數位數（通常為 18）

```solidity
function decimals() external view returns (uint8);
```

**說明：**
- 大多數代幣使用 18 位小數
- 1 token = 10^18 最小單位（類似 1 ETH = 10^18 Wei）

---

## ERC20 完整實現

### 基礎實現範例

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC20Token {
    // 狀態變量
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    // 事件
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_
    ) {
        _name = name_;
        _symbol = symbol_;
        _decimals = 18;
        _totalSupply = totalSupply_ * 10**_decimals;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    // 必須實現的函數
    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    // 內部函數
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}
```

### 使用 OpenZeppelin 實現

**OpenZeppelin** 提供了經過審計的 ERC20 實現：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10**decimals());
    }
}
```

**優勢：**
- 經過安全審計
- 遵循最佳實踐
- 支持擴展功能（如鑄造、銷毀）

---

## 使用 ERC20 Token

### 使用 Ethers.js 交互

#### 1. 讀取代幣信息

```javascript
import { ethers } from 'ethers';

// 連接 Provider
const provider = new ethers.providers.JsonRpcProvider('YOUR_RPC_URL');

// 代幣合約地址和 ABI
const tokenAddress = '0x...'; // 代幣合約地址
const tokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// 創建合約實例
const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

// 讀取代幣信息
async function getTokenInfo() {
  const name = await tokenContract.name();
  const symbol = await tokenContract.symbol();
  const decimals = await tokenContract.decimals();
  const totalSupply = await tokenContract.totalSupply();
  
  console.log(`代幣名稱: ${name}`);
  console.log(`代幣符號: ${symbol}`);
  console.log(`小數位數: ${decimals}`);
  console.log(`總供應量: ${ethers.utils.formatUnits(totalSupply, decimals)}`);
}

// 獲取餘額
async function getBalance(address) {
  const balance = await tokenContract.balanceOf(address);
  const decimals = await tokenContract.decimals();
  return ethers.utils.formatUnits(balance, decimals);
}
```

#### 2. 轉賬代幣

```javascript
// 連接錢包
const signer = provider.getSigner();
const tokenContractWithSigner = tokenContract.connect(signer);

// 轉賬代幣
async function transferTokens(toAddress, amount) {
  const decimals = await tokenContract.decimals();
  const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
  
  // 發送交易
  const tx = await tokenContractWithSigner.transfer(toAddress, amountInWei);
  console.log(`交易哈希: ${tx.hash}`);
  
  // 等待確認
  const receipt = await tx.wait();
  console.log(`交易確認，區塊: ${receipt.blockNumber}`);
  
  return receipt;
}

// 使用範例
await transferTokens('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 100);
```

#### 3. 授權和委託轉賬

```javascript
// 授權 DEX 合約使用代幣
async function approveSpender(spenderAddress, amount) {
  const decimals = await tokenContract.decimals();
  const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
  
  const tx = await tokenContractWithSigner.approve(spenderAddress, amountInWei);
  await tx.wait();
  console.log('授權成功');
}

// 檢查授權額度
async function checkAllowance(ownerAddress, spenderAddress) {
  const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
  const decimals = await tokenContract.decimals();
  return ethers.utils.formatUnits(allowance, decimals);
}

// 委託轉賬（由被授權的地址調用）
async function transferFrom(fromAddress, toAddress, amount) {
  const decimals = await tokenContract.decimals();
  const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
  
  const tx = await tokenContractWithSigner.transferFrom(
    fromAddress,
    toAddress,
    amountInWei
  );
  await tx.wait();
  console.log('委託轉賬成功');
}
```

#### 4. 監聽事件

```javascript
// 監聽 Transfer 事件
tokenContract.on('Transfer', (from, to, value, event) => {
  const decimals = 18; // 通常為 18
  console.log(`轉賬: ${from} -> ${to}`);
  console.log(`數量: ${ethers.utils.formatUnits(value, decimals)}`);
});

// 監聽 Approval 事件
tokenContract.on('Approval', (owner, spender, value, event) => {
  console.log(`授權: ${owner} 授權 ${spender}`);
  console.log(`數量: ${ethers.utils.formatUnits(value, 18)}`);
});

// 查詢歷史事件
async function getTransferHistory(fromBlock, toBlock) {
  const filter = tokenContract.filters.Transfer();
  const events = await tokenContract.queryFilter(filter, fromBlock, toBlock);
  
  return events.map(event => ({
    from: event.args.from,
    to: event.args.to,
    value: ethers.utils.formatUnits(event.args.value, 18),
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash
  }));
}
```

### 使用 Web3.js 交互

```javascript
const Web3 = require('web3');
const web3 = new Web3('YOUR_RPC_URL');

const tokenAddress = '0x...';
const tokenABI = [/* ... */];

const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);

// 讀取信息
async function getTokenInfo() {
  const name = await tokenContract.methods.name().call();
  const symbol = await tokenContract.methods.symbol().call();
  const decimals = await tokenContract.methods.decimals().call();
  const totalSupply = await tokenContract.methods.totalSupply().call();
  
  console.log(`代幣: ${name} (${symbol})`);
  console.log(`總供應量: ${web3.utils.fromWei(totalSupply, 'ether')}`);
}

// 轉賬
async function transferTokens(fromAddress, toAddress, amount, privateKey) {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  
  const decimals = await tokenContract.methods.decimals().call();
  const amountInWei = web3.utils.toBN(amount).mul(web3.utils.toBN(10).pow(web3.utils.toBN(decimals)));
  
  const tx = tokenContract.methods.transfer(toAddress, amountInWei);
  const gas = await tx.estimateGas({ from: fromAddress });
  const gasPrice = await web3.eth.getGasPrice();
  
  const txData = {
    from: fromAddress,
    gas: gas,
    gasPrice: gasPrice
  };
  
  const signedTx = await account.signTransaction({
    ...txData,
    data: tx.encodeABI(),
    to: tokenAddress
  });
  
  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  return receipt;
}
```

---

## ERC20 的擴展標準

### ERC20 的局限性

**問題：**
1. 無法接收 ETH 並自動轉換為代幣
2. 無法批量操作
3. 無法暫停轉賬
4. 無法銷毀代幣

### 擴展標準

#### ERC223：改進的轉賬

```solidity
function transfer(address to, uint256 amount, bytes data) external returns (bool);
```

**改進：** 轉賬時可以附加數據，通知接收合約

#### ERC777：高級代幣標準

**特點：**
- 操作員（Operators）機制
- 鉤子（Hooks）機制
- 更靈活的授權

#### ERC1363：可支付的 ERC20

**特點：** 可以接收 ETH 並自動轉換為代幣

#### ERC20Pausable：可暫停的代幣

```solidity
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract PausableToken is ERC20Pausable {
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
}
```

#### ERC20Burnable：可銷毀的代幣

```solidity
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract BurnableToken is ERC20Burnable {
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
```

---

## 常見問題和最佳實踐

### 常見問題

#### Q1: approve 的競態條件問題

**問題：** 如果當前授權額度是 100，用戶想要增加到 200，需要先設置為 0，再設置為 200，但這可能被利用。

**解決方案：** 使用 `increaseAllowance` 和 `decreaseAllowance`

```solidity
function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
    address owner = msg.sender;
    _approve(owner, spender, allowance(owner, spender) + addedValue);
    return true;
}

function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
    address owner = msg.sender;
    uint256 currentAllowance = allowance(owner, spender);
    require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
    unchecked {
        _approve(owner, spender, currentAllowance - subtractedValue);
    }
    return true;
}
```

#### Q2: 如何處理小數位數

```javascript
// 正確處理小數
const amount = 100.5; // 用戶輸入
const decimals = 18;
const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);

// 顯示時轉換回來
const displayAmount = ethers.utils.formatUnits(amountInWei, decimals);
```

#### Q3: 如何檢查代幣是否為 ERC20

```javascript
async function isERC20(tokenAddress) {
  try {
    const contract = new ethers.Contract(tokenAddress, [
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function transfer(address, uint256) returns (bool)'
    ], provider);
    
    // 嘗試調用必須的函數
    await contract.totalSupply();
    await contract.balanceOf('0x0000000000000000000000000000000000000000');
    
    return true;
  } catch (error) {
    return false;
  }
}
```

### 最佳實踐

#### 1. 使用 OpenZeppelin 實現

```solidity
// ✅ 推薦：使用經過審計的庫
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ❌ 不推薦：自己實現（容易出錯）
```

#### 2. 檢查返回值

```javascript
// ✅ 正確：檢查返回值
const success = await tokenContract.transfer(to, amount);
if (!success) {
  throw new Error('Transfer failed');
}

// ❌ 錯誤：不檢查返回值
await tokenContract.transfer(to, amount);
```

#### 3. 處理授權額度

```javascript
// ✅ 正確：先檢查授權額度
const currentAllowance = await tokenContract.allowance(owner, spender);
if (currentAllowance < amount) {
  await tokenContract.approve(spender, amount);
}
```

#### 4. 使用 SafeMath（舊版本）

```solidity
// Solidity 0.8.0+ 自動檢查溢出
// 舊版本需要使用 SafeMath
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

using SafeMath for uint256;
```

---

## 實際應用場景

### 場景 1：創建自己的代幣

```solidity
// 使用 OpenZeppelin 創建代幣
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor() ERC20("My Token", "MTK") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

### 場景 2：在 DEX 中交易

```javascript
// 1. 授權 DEX 合約
await tokenContract.approve(dexContractAddress, ethers.constants.MaxUint256);

// 2. 執行交易
await dexContract.swap(tokenAddress, amount, minAmountOut);
```

### 場景 3：批量轉賬

```solidity
function batchTransfer(address[] memory recipients, uint256[] memory amounts) public {
    require(recipients.length == amounts.length, "Arrays length mismatch");
    
    for (uint i = 0; i < recipients.length; i++) {
        transfer(recipients[i], amounts[i]);
    }
}
```

---

## 總結

**ERC20 核心要點：**

1. **標準接口**：統一的函數和事件定義
2. **必須實現**：6 個函數 + 2 個事件
3. **可選功能**：name、symbol、decimals
4. **授權機制**：approve + transferFrom 實現委託轉賬

**使用建議：**
- 使用 OpenZeppelin 實現（經過審計）
- 正確處理小數位數
- 檢查函數返回值
- 使用 increaseAllowance 避免競態條件

**ERC20 是以太坊生態系統的基礎**，理解 ERC20 標準對於開發 DeFi 應用和與代幣交互至關重要。
