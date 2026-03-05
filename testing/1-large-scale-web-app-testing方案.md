## 大型 Web App 測試策略（Testing Strategy for Large-Scale Web Applications）

### 測試金字塔（Testing Pyramid）

**測試金字塔**是測試策略的核心概念，描述了不同層級測試的數量比例：

```
        /\
       /E2E\          ← 少量 E2E 測試（End-to-End）
      /------\
     /Integration\    ← 適量整合測試
    /------------\
   /  Unit Tests  \   ← 大量單元測試
  /----------------\
```

**比例建議：**
- **Unit Tests（單元測試）**：70-80%
- **Integration Tests（整合測試）**：15-20%
- **E2E Tests（端到端測試）**：5-10%

**為什麼是金字塔結構？**
- **Unit Tests**：執行快、成本低、容易維護、覆蓋率高
- **Integration Tests**：驗證模組間交互、執行較慢、成本中等
- **E2E Tests**：驗證完整流程、執行最慢、成本最高、容易不穩定

### 單元測試（Unit Tests）

#### 什麼是單元測試

**定義：** 測試應用程式中最小的可測試單元（通常是函數或組件），在隔離環境中執行。

**特點：**
- 快速執行（毫秒級）
- 不依賴外部資源（資料庫、API、檔案系統）
- 可預測和可重複
- 容易維護

#### 單元測試工具

**JavaScript/TypeScript：**
- **Jest**：最流行的測試框架，內建 assertion、mock、coverage
- **Vitest**：基於 Vite 的快速測試框架，與 Vite 配置兼容
- **Mocha + Chai**：靈活的組合，需要更多配置
- **Jasmine**：BDD 風格的測試框架

**React 組件測試：**
- **React Testing Library**：推薦，專注於用戶行為
- **Enzyme**：較舊，不支援 React 18 hooks

**Vue 組件測試：**
- **Vue Test Utils**：官方測試工具
- **@testing-library/vue**：類似 React Testing Library

#### 單元測試範例

**純函數測試：**

```javascript
// utils/calculateTotal.js
export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// utils/calculateTotal.test.js
import { calculateTotal } from './calculateTotal';

describe('calculateTotal', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should calculate total correctly', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 }
    ];
    expect(calculateTotal(items)).toBe(35);
  });

  it('should handle decimal prices', () => {
    const items = [{ price: 10.99, quantity: 2 }];
    expect(calculateTotal(items)).toBeCloseTo(21.98);
  });
});
```

**React 組件測試：**

```javascript
// components/Button.jsx
import React from 'react';

export function Button({ onClick, children, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// components/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByText('Click')).toBeDisabled();
  });
});
```

**Mock 和 Stub：**

```javascript
// services/api.js
export async function fetchUser(userId) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

// services/api.test.js
import { fetchUser } from './api';

// Mock fetch
global.fetch = jest.fn();

describe('fetchUser', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should fetch user data', async () => {
    const mockUser = { id: 1, name: 'John' };
    fetch.mockResolvedValueOnce({
      json: async () => mockUser
    });

    const user = await fetchUser(1);
    expect(user).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledWith('/api/users/1');
  });

  it('should handle errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    await expect(fetchUser(1)).rejects.toThrow('Network error');
  });
});
```

#### 單元測試最佳實踐

**1. AAA 模式（Arrange-Act-Assert）**

```javascript
it('should calculate discount', () => {
  // Arrange（準備）
  const price = 100;
  const discount = 0.1;
  
  // Act（執行）
  const result = applyDiscount(price, discount);
  
  // Assert（斷言）
  expect(result).toBe(90);
});
```

**2. 測試命名規範**

```javascript
// ✅ 好的命名
describe('UserService', () => {
  it('should return user when valid ID is provided', () => {});
  it('should throw error when user not found', () => {});
  it('should cache user data for subsequent requests', () => {});
});

// ❌ 不好的命名
describe('UserService', () => {
  it('test 1', () => {});
  it('works', () => {});
});
```

**3. 測試隔離**

```javascript
// ✅ 每個測試獨立，不依賴其他測試
describe('UserService', () => {
  beforeEach(() => {
    // 每個測試前重置狀態
    jest.clearAllMocks();
  });

  it('test 1', () => {
    // 不依賴其他測試的狀態
  });
});
```

**4. 測試邊界條件**

```javascript
describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should reject empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('should reject null', () => {
    expect(validateEmail(null)).toBe(false);
  });

  it('should reject invalid format', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

### 整合測試（Integration Tests）

#### 什麼是整合測試

**定義：** 測試多個模組、組件或服務之間的交互，驗證它們是否能正確協同工作。

**特點：**
- 測試模組間的交互
- 可能涉及真實的資料庫、API、檔案系統
- 執行速度中等（秒級）
- 比單元測試更接近真實場景

#### 整合測試範例

**API 整合測試：**

```javascript
// tests/integration/api.test.js
import request from 'supertest';
import app from '../../app';
import { setupDatabase, teardownDatabase } from '../helpers/database';

describe('User API Integration', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  it('should create and retrieve user', async () => {
    // Create user
    const createResponse = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);

    const userId = createResponse.body.id;

    // Retrieve user
    const getResponse = await request(app)
      .get(`/api/users/${userId}`)
      .expect(200);

    expect(getResponse.body.name).toBe('John');
    expect(getResponse.body.email).toBe('john@example.com');
  });
});
```

**React 組件整合測試：**

```javascript
// tests/integration/UserProfile.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from '../../components/UserProfile';
import { UserService } from '../../services/UserService';

// Mock service but test component integration
jest.mock('../../services/UserService');

describe('UserProfile Integration', () => {
  it('should load and display user data', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@example.com' };
    UserService.getUser.mockResolvedValue(mockUser);

    render(<UserProfile userId={1} />);

    // Wait for async data loading
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

**資料庫整合測試：**

```javascript
// tests/integration/database.test.js
import { db } from '../../database';
import { UserRepository } from '../../repositories/UserRepository';

describe('UserRepository Integration', () => {
  beforeEach(async () => {
    // 清理測試資料
    await db.query('DELETE FROM users');
  });

  it('should save and retrieve user from database', async () => {
    const repository = new UserRepository();
    
    // Save
    const user = await repository.create({
      name: 'John',
      email: 'john@example.com'
    });

    expect(user.id).toBeDefined();

    // Retrieve
    const retrieved = await repository.findById(user.id);
    expect(retrieved.name).toBe('John');
  });
});
```

#### 整合測試最佳實踐

**1. 使用測試資料庫**

```javascript
// ✅ 使用獨立的測試資料庫
const TEST_DB_URL = process.env.TEST_DATABASE_URL;

// ❌ 不要使用生產資料庫
const PROD_DB_URL = process.env.DATABASE_URL;
```

**2. 測試前後清理**

```javascript
describe('Integration Tests', () => {
  beforeAll(async () => {
    // 設置測試環境
    await setupTestDatabase();
  });

  beforeEach(async () => {
    // 每個測試前清理
    await clearTestData();
  });

  afterAll(async () => {
    // 測試後清理
    await teardownTestDatabase();
  });
});
```

**3. 測試真實的交互流程**

```javascript
// ✅ 測試完整的用戶流程
it('should complete user registration flow', async () => {
  // 1. 註冊用戶
  const registerResponse = await registerUser({ email, password });
  
  // 2. 登入
  const loginResponse = await loginUser({ email, password });
  
  // 3. 獲取用戶資料
  const userResponse = await getUserProfile(loginResponse.token);
  
  expect(userResponse.email).toBe(email);
});
```

### E2E 測試（End-to-End Tests）

#### 什麼是 E2E 測試

**定義：** 測試完整的用戶流程，從用戶界面到後端系統，模擬真實用戶行為。

**特點：**
- 測試完整應用流程
- 使用真實瀏覽器
- 執行最慢（分鐘級）
- 最接近真實用戶體驗
- 容易不穩定（flaky）

#### E2E 測試工具

**主流工具：**
- **Playwright**：微軟開發，支援多瀏覽器，API 現代化
- **Cypress**：開發者友好，時間旅行調試，但只支援 Chromium
- **Puppeteer**：Google 開發，主要支援 Chrome
- **Selenium**：最老牌，支援最多瀏覽器，但配置複雜
- **WebdriverIO**：基於 WebDriver 協議，靈活但配置複雜

#### E2E 測試範例

**Playwright 範例：**

```javascript
// tests/e2e/user-registration.spec.js
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should register new user successfully', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:3000/register');

    // Fill registration form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('.success-message')).toContainText(
      'Registration successful'
    );

    // Verify redirect to login page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText(
      'Invalid email format'
    );
  });
});
```

**Cypress 範例：**

```javascript
// cypress/e2e/shopping-cart.cy.js
describe('Shopping Cart', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login('test@example.com', 'password');
  });

  it('should add item to cart', () => {
    // Navigate to product page
    cy.get('[data-testid="product-card"]').first().click();
    
    // Add to cart
    cy.get('[data-testid="add-to-cart"]').click();
    
    // Verify cart count
    cy.get('[data-testid="cart-count"]').should('contain', '1');
    
    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    
    // Verify item in cart
    cy.get('[data-testid="cart-item"]').should('have.length', 1);
  });

  it('should complete checkout flow', () => {
    // Add items to cart
    cy.addToCart('product-1');
    cy.addToCart('product-2');
    
    // Go to checkout
    cy.get('[data-testid="checkout-button"]').click();
    
    // Fill shipping info
    cy.fillShippingForm({
      name: 'John Doe',
      address: '123 Main St',
      city: 'New York'
    });
    
    // Complete payment
    cy.get('[data-testid="pay-button"]').click();
    
    // Verify success
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
  });
});
```

#### E2E 測試最佳實踐

**1. 使用 Data Test IDs**

```javascript
// ✅ 使用穩定的選擇器
<button data-testid="submit-button">Submit</button>

// ❌ 避免使用易變的選擇器
<button className="btn-primary">Submit</button> // CSS class 可能改變
```

**2. 等待策略**

```javascript
// ✅ 明確等待
await page.waitForSelector('.success-message');
await expect(page.locator('.message')).toBeVisible();

// ❌ 避免固定等待
await page.waitForTimeout(5000); // 不穩定且慢
```

**3. 測試隔離**

```javascript
// ✅ 每個測試獨立
test('test 1', async ({ page }) => {
  await setupTestData();
  // test logic
  await cleanupTestData();
});

// ❌ 測試間依賴
let sharedState; // 避免共享狀態
```

**4. 使用 Page Object Model**

```javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// tests/e2e/login.spec.js
import { LoginPage } from '../pages/LoginPage';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  
  await expect(page).toHaveURL(/.*\/dashboard/);
});
```

**5. 處理異步操作**

```javascript
// ✅ 正確處理異步
test('should load data', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Wait for API call to complete
  await page.waitForResponse(response => 
    response.url().includes('/api/data') && response.status() === 200
  );
  
  await expect(page.locator('.data-item')).toHaveCount(10);
});
```

### 大型應用測試策略

#### 測試組織結構

**推薦的目錄結構：**

```
project-root/
├── src/
│   ├── components/
│   │   └── Button/
│   │       ├── Button.jsx
│   │       └── Button.test.jsx        # 單元測試（同目錄）
│   ├── services/
│   │   └── api.test.js                 # 單元測試
│   └── utils/
│       └── helpers.test.js             # 單元測試
│
├── tests/
│   ├── unit/                           # 單元測試（可選，如果不想同目錄）
│   ├── integration/
│   │   ├── api.test.js
│   │   └── components.test.jsx
│   └── e2e/
│       ├── user-flow.spec.js
│       └── checkout.spec.js
│
├── __mocks__/                          # Mock 檔案
├── jest.config.js
├── playwright.config.js
└── cypress.config.js
```

#### 測試覆蓋率（Test Coverage）

**覆蓋率指標：**
- **Line Coverage**：行覆蓋率
- **Branch Coverage**：分支覆蓋率
- **Function Coverage**：函數覆蓋率
- **Statement Coverage**：語句覆蓋率

**目標覆蓋率：**
- **單元測試**：80-90%
- **關鍵業務邏輯**：100%
- **工具函數**：100%

**Jest 覆蓋率配置：**

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/index.js'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/utils/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
```

#### 測試執行策略

**本地開發：**
```bash
# 只執行相關測試（watch mode）
npm test -- --watch

# 執行特定測試
npm test -- Button.test.jsx

# 執行覆蓋率
npm test -- --coverage
```

**CI/CD 流程：**
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run start &
      - run: npm run test:e2e
```

#### 測試性能優化

**1. 並行執行**

```javascript
// jest.config.js
module.exports = {
  maxWorkers: '50%', // 使用一半 CPU 核心
  // 或
  maxWorkers: 4, // 固定數量
};
```

**2. 測試分片（Test Sharding）**

```bash
# 將測試分成多個 shard
npm test -- --shard=1/4  # 執行第 1 個 shard（共 4 個）
npm test -- --shard=2/4  # 執行第 2 個 shard
```

**3. 快取測試結果**

```javascript
// jest.config.js
module.exports = {
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
};
```

**4. 選擇性執行**

```bash
# 只執行變更檔案的測試
npm test -- --onlyChanged

# 只執行相關測試
npm test -- --findRelatedTests src/components/Button/Button.jsx
```

### 特殊測試場景

#### 快照測試（Snapshot Testing）

```javascript
// components/UserCard.test.jsx
import { render } from '@testing-library/react';
import { UserCard } from './UserCard';

it('should match snapshot', () => {
  const { container } = render(
    <UserCard name="John" email="john@example.com" />
  );
  expect(container).toMatchSnapshot();
});
```

**注意事項：**
- 快照測試容易產生 false positives
- 需要定期審查和更新快照
- 適合測試 UI 組件的結構，不適合測試邏輯

#### 視覺回歸測試（Visual Regression Testing）

**工具：**
- **Percy**：商業工具，易於集成
- **Chromatic**：Storybook 的視覺測試工具
- **Applitools**：AI 驅動的視覺測試

```javascript
// tests/visual/Button.visual.test.js
import { test, expect } from '@playwright/test';

test('Button visual regression', async ({ page }) => {
  await page.goto('/components/button');
  await expect(page).toHaveScreenshot('button.png');
});
```

#### 可訪問性測試（Accessibility Testing）

```javascript
// tests/a11y/Button.a11y.test.jsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### 性能測試（Performance Testing）

```javascript
// tests/performance/Component.perf.test.jsx
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { HeavyComponent } from './HeavyComponent';

it('should render within performance budget', () => {
  const start = performance.now();
  render(<HeavyComponent items={1000} />);
  const end = performance.now();
  
  const renderTime = end - start;
  expect(renderTime).toBeLessThan(100); // 100ms budget
});
```

### 測試維護策略

#### 處理 Flaky Tests

**Flaky Test 的原因：**
- 時間相關的測試（setTimeout, Date.now）
- 異步操作沒有正確等待
- 測試間狀態污染
- 外部依賴不穩定

**解決方案：**

```javascript
// ❌ Flaky：依賴真實時間
it('should show current time', () => {
  const time = new Date().toLocaleTimeString();
  expect(component.textContent).toContain(time);
});

// ✅ 穩定：Mock 時間
it('should show current time', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01T12:00:00'));
  
  render(<Clock />);
  expect(screen.getByText('12:00:00')).toBeInTheDocument();
  
  jest.useRealTimers();
});
```

#### 測試資料管理

**1. 使用 Factory 模式**

```javascript
// tests/factories/UserFactory.js
export function createUser(overrides = {}) {
  return {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    ...overrides
  };
}

// 使用
const user = createUser({ name: 'Jane' });
```

**2. 使用 Fixtures**

```javascript
// tests/fixtures/users.json
{
  "validUser": {
    "name": "John",
    "email": "john@example.com"
  },
  "adminUser": {
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}

// 使用
import fixtures from './fixtures/users.json';
const user = fixtures.validUser;
```

#### 測試文檔化

```javascript
/**
 * 測試用戶註冊流程
 * 
 * 測試場景：
 * 1. 成功註冊新用戶
 * 2. 驗證 email 格式
 * 3. 檢查密碼強度
 * 4. 處理重複 email
 * 
 * 依賴：
 * - UserService API
 * - Email validation utility
 */
describe('User Registration', () => {
  // tests...
});
```

### 測試工具選擇指南

#### 單元測試框架比較

| 工具 | 優點 | 缺點 | 適用場景 |
|------|------|------|----------|
| **Jest** | 零配置、內建 mock、覆蓋率 | 大型專案可能較慢 | React、Node.js 專案 |
| **Vitest** | 極快、Vite 生態 | 較新、生態較小 | Vite 專案 |
| **Mocha** | 靈活、可配置 | 需要更多配置 | 需要高度自定義 |
| **Jasmine** | BDD 風格 | 功能較少 | BDD 風格專案 |

#### E2E 測試工具比較

| 工具 | 優點 | 缺點 | 適用場景 |
|------|------|------|----------|
| **Playwright** | 多瀏覽器、現代 API、穩定 | 較新 | 現代 Web 應用 |
| **Cypress** | 開發體驗好、時間旅行 | 只支援 Chromium | 開發階段測試 |
| **Puppeteer** | 簡單、Chrome 原生 | 只支援 Chrome | Chrome 專用 |
| **Selenium** | 支援最多瀏覽器 | 配置複雜、慢 | 需要多瀏覽器支援 |

### 測試最佳實踐總結

**1. 測試優先級**
- 核心業務邏輯 → 高優先級
- UI 組件 → 中優先級
- 工具函數 → 中優先級
- 第三方庫包裝 → 低優先級

**2. 測試命名**
- 描述測試行為，不是實現細節
- 使用 "should" 開頭
- 包含測試條件和預期結果

**3. 測試隔離**
- 每個測試獨立
- 不依賴執行順序
- 測試前後清理狀態

**4. 測試速度**
- 單元測試 < 100ms
- 整合測試 < 1s
- E2E 測試 < 30s

**5. 測試穩定性**
- 避免固定等待時間
- 正確處理異步操作
- Mock 外部依賴

**6. 測試維護**
- 定期審查和重構測試
- 移除過時或重複的測試
- 保持測試代碼質量

### 常見錯誤和解決方案

**錯誤 1：測試過於複雜**

```javascript
// ❌ 測試做太多事情
it('should handle user flow', () => {
  // 註冊、登入、購物、結帳... 全部在一個測試
});

// ✅ 拆分成多個測試
it('should register user', () => {});
it('should login user', () => {});
it('should add item to cart', () => {});
```

**錯誤 2：測試實現細節**

```javascript
// ❌ 測試內部實現
it('should call setState', () => {
  const setState = jest.spyOn(Component.prototype, 'setState');
  // ...
});

// ✅ 測試行為
it('should update count when button clicked', () => {
  render(<Counter />);
  fireEvent.click(screen.getByText('Increment'));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

**錯誤 3：過度 Mock**

```javascript
// ❌ Mock 太多東西
jest.mock('./utils');
jest.mock('./services');
jest.mock('./components');

// ✅ 只 Mock 必要的
jest.mock('./external-api');
```

**錯誤 4：忽略邊界條件**

```javascript
// ❌ 只測試 happy path
it('should calculate total', () => {
  expect(calculateTotal([{ price: 10 }])).toBe(10);
});

// ✅ 測試各種情況
it('should calculate total for valid items', () => {});
it('should return 0 for empty array', () => {});
it('should handle null input', () => {});
it('should handle negative prices', () => {});
```

### 結論

大型 Web 應用的測試需要：

1. **分層測試策略**：遵循測試金字塔，平衡不同層級的測試
2. **工具選擇**：根據專案需求選擇合適的測試工具
3. **持續優化**：定期審查測試，移除 flaky tests，優化執行速度
4. **團隊協作**：建立測試規範，確保代碼質量
5. **CI/CD 集成**：自動化測試執行，快速反饋問題

**記住：** 測試的目的是提高代碼質量和開發信心，而不是為了達到 100% 覆蓋率。重點是測試正確的東西，而不是測試所有東西。
