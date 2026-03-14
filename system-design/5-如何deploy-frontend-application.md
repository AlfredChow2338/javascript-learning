# 如何部署前端應用

## 什麼是前端部署

**前端部署（Frontend Deployment）** 是將開發完成的前端應用程序構建、優化並發布到生產環境的過程，讓終端用戶可以訪問和使用應用。

**部署的核心目標：**
- 將代碼轉換為可執行的生產版本
- 優化資源以提升性能
- 確保應用的穩定性和可用性
- 實現自動化部署流程

**部署流程概覽：**

```
開發環境
  ↓
構建（Build）
  ↓
測試（Test）
  ↓
優化（Optimize）
  ↓
部署（Deploy）
  ↓
監控（Monitor）
```

---

## 一、部署前準備

### 1.1 環境變數配置

**管理不同環境的配置：**

```javascript
// .env.development
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=development
REACT_APP_DEBUG=true

// .env.staging
REACT_APP_API_URL=https://staging-api.example.com
REACT_APP_ENV=staging
REACT_APP_DEBUG=false

// .env.production
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENV=production
REACT_APP_DEBUG=false
```

**使用環境變數：**

```javascript
// config.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  env: process.env.REACT_APP_ENV || 'development',
  debug: process.env.REACT_APP_DEBUG === 'true'
};

export default config;
```

**Next.js 環境變數：**

```javascript
// next.config.js
module.exports = {
  env: {
    API_URL: process.env.API_URL,
    API_KEY: process.env.API_KEY
  }
};
```

### 1.2 構建配置優化

**生產環境構建配置：**

```javascript
// webpack.config.prod.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  mode: 'production',
  
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除 console
            drop_debugger: true
          }
        }
      }),
      new CssMinimizerPlugin()
    ],
    
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        }
      }
    }
  },
  
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  }
};
```

**Next.js 構建配置：**

```javascript
// next.config.js
module.exports = {
  // 壓縮
  compress: true,
  
  // 生產環境優化
  swcMinify: true,
  
  // 圖片優化
  images: {
    domains: ['example.com'],
    formats: ['image/avif', 'image/webp']
  },
  
  // 輸出配置
  output: 'standalone', // 獨立輸出（用於 Docker）
  
  // 環境變數
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  }
};
```

### 1.3 構建腳本

**package.json 構建腳本：**

```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:prod": "NODE_ENV=production webpack --config webpack.prod.js",
    "build:staging": "NODE_ENV=staging webpack --config webpack.staging.js",
    "build:analyze": "ANALYZE=true npm run build",
    "prebuild": "npm run lint && npm run test",
    "postbuild": "npm run optimize-assets"
  }
}
```

**構建前檢查：**

```javascript
// scripts/pre-build-check.js
const fs = require('fs');
const path = require('path');

function checkEnvFile() {
  const envPath = path.join(__dirname, '../.env.production');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.production file not found!');
    process.exit(1);
  }
  console.log('✅ Environment file exists');
}

function checkBuildDependencies() {
  const packageJson = require('../package.json');
  const requiredDeps = ['react', 'react-dom'];
  
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      console.error(`❌ Missing dependency: ${dep}`);
      process.exit(1);
    }
  });
  
  console.log('✅ All dependencies present');
}

// 執行檢查
checkEnvFile();
checkBuildDependencies();
console.log('✅ Pre-build checks passed');
```

---

## 二、構建優化

### 2.1 代碼壓縮和優化

**JavaScript 壓縮：**

```javascript
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info']
          },
          format: {
            comments: false // 移除註釋
          }
        },
        extractComments: false
      })
    ]
  }
};
```

**CSS 優化：**

```javascript
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].chunk.css'
    })
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true }
            }
          ]
        }
      })
    ]
  }
};
```

### 2.2 資源優化

**圖片優化：**

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  }
};
```

**字體優化：**

```javascript
// next.config.js
const { fontOptimizer } = require('next-font-optimizer');

module.exports = {
  // 使用 next/font 自動優化
  // 或使用字體子集化工具
};
```

### 2.3 Bundle 分析

**分析構建產物：**

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: true
    })
  ].filter(Boolean)
};
```

```bash
# 分析構建
ANALYZE=true npm run build
```

---

## 三、部署平台和方式

### 3.1 靜態文件託管

**Vercel 部署：**

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel

# 生產環境部署
vercel --prod
```

**vercel.json 配置：**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Netlify 部署：**

```bash
# 安裝 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

**netlify.toml 配置：**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**GitHub Pages 部署：**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 3.2 容器化部署

**Dockerfile：**

```dockerfile
# 多階段構建
# 階段 1: 構建
FROM node:18-alpine AS builder

WORKDIR /app

# 複製依賴文件
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY . .

# 構建應用
RUN npm run build

# 階段 2: 運行
FROM nginx:alpine

# 複製構建產物
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 啟動 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx 配置：**

```nginx
# nginx.conf
server {
    listen 80;
    server_name example.com;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 壓縮
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # 靜態資源緩存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全頭部
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Docker Compose：**

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - API_URL=https://api.example.com
    restart: unless-stopped
```

### 3.3 CDN 部署

**使用 CDN 加速：**

```javascript
// 配置 CDN 域名
// next.config.js
module.exports = {
  assetPrefix: process.env.CDN_URL || '',
  images: {
    domains: ['cdn.example.com']
  }
};
```

**上傳到 CDN：**

```bash
# 使用 AWS CLI 上傳到 S3
aws s3 sync dist/ s3://my-bucket/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable"

# 使用 Cloudflare Workers
wrangler publish
```

---

## 四、CI/CD 流程

### 4.1 GitHub Actions

**完整的 CI/CD 流程：**

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'

jobs:
  # 測試
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # 構建
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.API_URL }}
          REACT_APP_ENV: production
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist

  # 部署到 Staging
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build
      
      - name: Deploy to Staging
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          destination_dir: staging

  # 部署到 Production
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 4.2 GitLab CI/CD

**GitLab CI 配置：**

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

# 測試階段
test:
  stage: test
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run lint
    - npm test
  only:
    - merge_requests
    - main
    - develop

# 構建階段
build:
  stage: build
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
  only:
    - main
    - develop

# 部署到 Staging
deploy_staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - curl -X POST "https://api.netlify.com/build_hooks/$NETLIFY_STAGING_HOOK"
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

# 部署到 Production
deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - curl -X POST "https://api.netlify.com/build_hooks/$NETLIFY_PRODUCTION_HOOK"
  environment:
    name: production
    url: https://example.com
  only:
    - main
  when: manual
```

### 4.3 Jenkins Pipeline

**Jenkinsfile：**

```groovy
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm run lint'
                sh 'npm test'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh 'npm run deploy:staging'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh 'npm run deploy:production'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            emailext subject: "Build Success: ${env.JOB_NAME}",
                     body: "Build ${env.BUILD_NUMBER} succeeded!",
                     to: "${env.CHANGE_AUTHOR_EMAIL}"
        }
        failure {
            emailext subject: "Build Failed: ${env.JOB_NAME}",
                     body: "Build ${env.BUILD_NUMBER} failed!",
                     to: "${env.CHANGE_AUTHOR_EMAIL}"
        }
    }
}
```

---

## 五、環境管理

### 5.1 多環境配置

**環境配置文件：**

```javascript
// config/environments.js
const environments = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    wsUrl: 'ws://localhost:3000',
    debug: true,
    logLevel: 'debug'
  },
  staging: {
    apiUrl: 'https://staging-api.example.com',
    wsUrl: 'wss://staging-api.example.com',
    debug: false,
    logLevel: 'info'
  },
  production: {
    apiUrl: 'https://api.example.com',
    wsUrl: 'wss://api.example.com',
    debug: false,
    logLevel: 'error'
  }
};

const env = process.env.REACT_APP_ENV || 'development';
export default environments[env];
```

**動態配置加載：**

```javascript
// config/config.js
let config = {};

// 在構建時注入配置
if (typeof window !== 'undefined') {
  // 客戶端：從 window 對象讀取
  config = window.__APP_CONFIG__ || {};
} else {
  // 服務端：從環境變數讀取
  config = {
    apiUrl: process.env.API_URL,
    env: process.env.NODE_ENV
  };
}

export default config;
```

### 5.2 配置注入

**構建時注入：**

```javascript
// scripts/inject-config.js
const fs = require('fs');
const path = require('path');

const config = {
  apiUrl: process.env.API_URL,
  env: process.env.NODE_ENV
};

const configString = `window.__APP_CONFIG__ = ${JSON.stringify(config)};`;
const outputPath = path.join(__dirname, '../public/config.js');

fs.writeFileSync(outputPath, configString);
console.log('✅ Config injected');
```

**運行時加載：**

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html>
<head>
  <script src="/config.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

---

## 六、監控和回滾

### 6.1 部署監控

**健康檢查：**

```javascript
// public/health.js
window.healthCheck = {
  version: '1.0.0',
  buildTime: '2024-01-01T00:00:00Z',
  environment: 'production'
};
```

**部署後驗證：**

```bash
#!/bin/bash
# scripts/verify-deployment.sh

URL=$1
EXPECTED_VERSION=$2

# 檢查服務是否可訪問
if ! curl -f "$URL" > /dev/null 2>&1; then
  echo "❌ Deployment failed: Service not accessible"
  exit 1
fi

# 檢查版本
VERSION=$(curl -s "$URL/health.js" | grep -oP 'version: "\K[^"]+')
if [ "$VERSION" != "$EXPECTED_VERSION" ]; then
  echo "❌ Version mismatch: Expected $EXPECTED_VERSION, got $VERSION"
  exit 1
fi

echo "✅ Deployment verified"
```

### 6.2 錯誤監控

**集成 Sentry：**

```javascript
// src/utils/errorTracking.js
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.REACT_APP_ENV,
  release: process.env.REACT_APP_VERSION,
  tracesSampleRate: 1.0
});

export default Sentry;
```

**性能監控：**

```javascript
// src/utils/performance.js
export function trackPerformance() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      
      // 發送到分析服務
      if (window.analytics) {
        window.analytics.track('page_load', {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          request: perfData.responseStart - perfData.requestStart,
          response: perfData.responseEnd - perfData.responseStart,
          dom: perfData.domContentLoadedEventEnd - perfData.responseEnd,
          load: perfData.loadEventEnd - perfData.fetchStart
        });
      }
    });
  }
}
```

### 6.3 回滾策略

**自動回滾：**

```yaml
# .github/workflows/deploy.yml
- name: Deploy
  id: deploy
  run: |
    # 部署邏輯
    npm run deploy

- name: Health Check
  run: |
    sleep 30
    if ! curl -f https://example.com/health; then
      echo "❌ Health check failed, rolling back..."
      # 回滾邏輯
      npm run rollback
      exit 1
    fi
```

**版本標記：**

```bash
#!/bin/bash
# scripts/rollback.sh

PREVIOUS_VERSION=$(git describe --tags --abbrev=0)
CURRENT_VERSION=$(git describe --tags)

echo "Rolling back from $CURRENT_VERSION to $PREVIOUS_VERSION"

# 切換到上一個版本
git checkout $PREVIOUS_VERSION

# 重新構建和部署
npm run build
npm run deploy

echo "✅ Rolled back to $PREVIOUS_VERSION"
```

---

## 七、安全最佳實踐

### 7.1 安全頭部

**Nginx 安全配置：**

```nginx
# 安全頭部
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

# HTTPS 強制
if ($scheme != "https") {
    return 301 https://$host$request_uri;
}
```

**Next.js 安全配置：**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  }
};
```

### 7.2 環境變數安全

**不要暴露敏感信息：**

```javascript
// ❌ 錯誤：在客戶端暴露 API 密鑰
const API_KEY = process.env.API_SECRET_KEY;

// ✅ 正確：只在服務端使用
// 使用 Next.js API Routes 或後端代理
```

**使用 Secrets 管理：**

```yaml
# GitHub Actions
- name: Build
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: npm run build
```

### 7.3 內容安全策略（CSP）

**CSP 配置：**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.example.com"
            ].join('; ')
          }
        ]
      }
    ];
  }
};
```

---

## 八、性能優化

### 8.1 緩存策略

**靜態資源緩存：**

```nginx
# 長期緩存（帶 hash 的文件）
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 短期緩存（HTML）
location ~* \.html$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

**Service Worker 緩存：**

```javascript
// public/sw.js
const CACHE_NAME = 'v1';
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### 8.2 CDN 配置

**使用 CDN 加速：**

```javascript
// next.config.js
module.exports = {
  assetPrefix: process.env.CDN_URL || '',
  
  // 圖片 CDN
  images: {
    domains: ['cdn.example.com']
  }
};
```

**CDN 緩存規則：**

```
靜態資源（.js, .css, .png 等）：
- Cache-Control: public, max-age=31536000, immutable

HTML 文件：
- Cache-Control: public, max-age=3600, must-revalidate

API 響應：
- Cache-Control: private, no-cache
```

---

## 九、部署檢查清單

### 9.1 部署前檢查

- [ ] 環境變數已正確配置
- [ ] 構建腳本已測試
- [ ] 所有測試通過
- [ ] 代碼已通過 Linter 檢查
- [ ] Bundle 大小在合理範圍內
- [ ] 錯誤處理已實現
- [ ] 監控已配置
- [ ] 回滾方案已準備

### 9.2 部署後驗證

- [ ] 應用可以正常訪問
- [ ] 所有路由正常工作
- [ ] API 連接正常
- [ ] 靜態資源加載正常
- [ ] 性能指標正常
- [ ] 錯誤監控正常
- [ ] 日誌記錄正常

---

## 十、總結

### 部署的核心要點

1. **構建優化**：壓縮、代碼分割、資源優化
2. **環境管理**：多環境配置、環境變數管理
3. **自動化**：CI/CD 流程、自動測試、自動部署
4. **監控**：健康檢查、錯誤追蹤、性能監控
5. **安全**：安全頭部、CSP、Secrets 管理
6. **回滾**：版本管理、快速回滾機制

### 最佳實踐

- ✅ 使用 CI/CD 自動化部署流程
- ✅ 實現多環境部署（dev/staging/prod）
- ✅ 配置適當的緩存策略
- ✅ 實施監控和告警
- ✅ 準備回滾方案
- ✅ 遵循安全最佳實踐
- ❌ 不要在客戶端暴露敏感信息
- ❌ 不要跳過測試和檢查
- ❌ 不要忽略錯誤處理

通過合理的部署策略和流程，可以確保前端應用的穩定、安全和高效運行。
