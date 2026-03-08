## SigNoz 實現和原理：Web 應用性能監測與調試

### 為什麼需要性能監測

**問題場景：**
- 用戶報告應用變慢，但不知道具體原因
- 生產環境出現錯誤，難以重現和定位
- 需要了解應用的性能瓶頸
- 需要追蹤用戶請求的完整路徑

**性能監測的價值：**
- **可觀測性（Observability）**：了解應用內部狀態
- **快速定位問題**：快速找到性能瓶頸和錯誤
- **數據驅動優化**：基於真實數據進行優化
- **用戶體驗提升**：主動發現和解決問題

### 三大支柱（Three Pillars）

現代可觀測性基於三大支柱：

```
┌─────────────────────────────────────┐
│      Observability                  │
├─────────────────────────────────────┤
│  Metrics  │  Traces  │  Logs        │
└─────────────────────────────────────┘
```

1. **Metrics（指標）**：數值數據，如請求數、響應時間、錯誤率
2. **Traces（追蹤）**：請求的完整路徑，跨服務調用鏈
3. **Logs（日誌）**：詳細的事件記錄

---

## 什麼是 SigNoz

**SigNoz** 是一個開源的 APM（Application Performance Monitoring）工具，提供統一的平台來監測應用性能、追蹤錯誤和調試問題。

**核心特點：**
- **開源**：MIT 許可證，可自託管
- **統一平台**：Metrics、Traces、Logs 一體化
- **OpenTelemetry 原生**：基於 OpenTelemetry 標準
- **高性能**：使用 ClickHouse 存儲，支持大規模數據
- **易於集成**：支持多種語言和框架

### SigNoz vs 其他方案

| 特性 | SigNoz | Datadog | New Relic | Jaeger |
|------|--------|---------|-----------|--------|
| **開源** | ✅ | ❌ | ❌ | ✅ |
| **自託管** | ✅ | ❌ | ❌ | ✅ |
| **Metrics** | ✅ | ✅ | ✅ | ❌ |
| **Traces** | ✅ | ✅ | ✅ | ✅ |
| **Logs** | ✅ | ✅ | ✅ | ❌ |
| **成本** | 免費 | 付費 | 付費 | 免費 |

---

## SigNoz 架構和實現原理

### 整體架構

```
┌─────────────────────────────────────────────────┐
│           Web Application                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Frontend │  │ Backend  │  │ Database │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
└───────┼─────────────┼──────────────┼──────────┘
        │             │              │
        │  OpenTelemetry SDK         │
        │             │              │
        └─────────────┼──────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │   OpenTelemetry         │
        │   Collector             │
        │  (OTEL Collector)       │
        └───────────┬─────────────┘
                    │
                    ▼
        ┌─────────────────────────┐
        │      SigNoz              │
        │  ┌───────────────────┐  │
        │  │  Query Service    │  │
        │  │  (Go)             │  │
        │  └───────────────────┘  │
        │  ┌───────────────────┐  │
        │  │  ClickHouse        │  │
        │  │  (Storage)         │  │
        │  └───────────────────┘  │
        │  ┌───────────────────┐  │
        │  │  UI (React)        │  │
        │  └───────────────────┘  │
        └─────────────────────────┘
```

### 核心組件

#### 1. OpenTelemetry SDK

**作用：** 在應用中收集遙測數據（Metrics、Traces、Logs）

**工作原理：**

```javascript
// OpenTelemetry 自動插樁（Auto-instrumentation）
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({
      // 自動插樁 HTTP、Express、PostgreSQL 等
    })
  ],
  resource: new Resource({
    'service.name': 'my-web-app',
    'service.version': '1.0.0'
  })
});

sdk.start();
```

**自動插樁的內容：**
- HTTP 請求/響應
- 數據庫查詢
- 外部 API 調用
- 異步操作

#### 2. OpenTelemetry Collector

**作用：** 接收、處理和導出遙測數據

**架構：**

```
┌─────────────┐
│  Receivers  │  ← 接收數據（OTLP、Jaeger、Zipkin）
└──────┬──────┘
       │
┌──────▼──────┐
│ Processors  │  ← 處理數據（批處理、過濾、轉換）
└──────┬──────┘
       │
┌──────▼──────┐
│  Exporters  │  ← 導出數據（SigNoz、其他後端）
└─────────────┘
```

**配置範例：**

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  memory_limiter:
    limit_mib: 512

exporters:
  otlp/signoz:
    endpoint: signoz-otel-collector:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp/signoz]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp/signoz]
```

#### 3. SigNoz Query Service

**作用：** 查詢和聚合存儲在 ClickHouse 中的數據

**技術棧：**
- **Go**：高性能後端服務
- **ClickHouse**：列式數據庫，適合分析查詢
- **gRPC/HTTP**：API 接口

**查詢流程：**

```go
// 簡化的查詢服務邏輯
func (q *QueryService) GetTraces(ctx context.Context, req *TraceQueryRequest) (*TraceResponse, error) {
    // 1. 構建 ClickHouse 查詢
    query := buildClickHouseQuery(req)
    
    // 2. 執行查詢
    rows, err := q.clickhouse.Query(ctx, query)
    if err != nil {
        return nil, err
    }
    
    // 3. 聚合和處理結果
    traces := aggregateTraces(rows)
    
    // 4. 返回結果
    return &TraceResponse{Traces: traces}, nil
}
```

#### 4. ClickHouse 存儲

**為什麼選擇 ClickHouse？**
- **列式存儲**：適合分析查詢
- **高性能**：快速聚合和過濾
- **壓縮率高**：節省存儲空間
- **可擴展**：支持大規模數據

**數據模型：**

```sql
-- Traces 表結構（簡化）
CREATE TABLE traces (
    timestamp DateTime,
    traceID String,
    spanID String,
    parentSpanID String,
    serviceName String,
    operationName String,
    duration UInt64,
    tags Map(String, String),
    logs Array(String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, traceID);
```

#### 5. SigNoz UI

**技術棧：**
- **React**：前端框架
- **TypeScript**：類型安全
- **Ant Design**：UI 組件庫
- **D3.js**：數據可視化

**功能模塊：**
- Dashboard：指標概覽
- Traces：追蹤查詢和可視化
- Metrics：指標查詢和圖表
- Logs：日誌查詢和過濾

---

## 在 Web 應用中集成 SigNoz

### 前端集成

#### 1. 安裝 OpenTelemetry SDK

```bash
npm install @opentelemetry/api
npm install @opentelemetry/sdk-web
npm install @opentelemetry/instrumentation
npm install @opentelemetry/exporter-otlp-http
```

#### 2. 初始化 OpenTelemetry

```javascript
// tracing.js
import { WebSDK } from '@opentelemetry/sdk-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

// 創建導出器
const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // SigNoz OTLP endpoint
  headers: {}
});

// 創建資源
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'web-frontend',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0'
});

// 初始化 SDK
const sdk = new WebSDK({
  resource,
  traceExporter: exporter,
  contextManager: new ZoneContextManager(),
  instrumentations: [
    getWebAutoInstrumentations({
      // 自動插樁 Fetch API、XMLHttpRequest
      '@opentelemetry/instrumentation-fetch': {
        propagateTraceHeaderCorsUrls: [
          /http:\/\/localhost:.*/,
          /https:\/\/.*\.example\.com/
        ]
      },
      '@opentelemetry/instrumentation-xml-http-request': {
        propagateTraceHeaderCorsUrls: [
          /http:\/\/localhost:.*/,
          /https:\/\/.*\.example\.com/
        ]
      }
    })
  ]
});

// 啟動 SDK
sdk.start();

export default sdk;
```

#### 3. 在應用中引入

```javascript
// main.js 或 index.js
import './tracing';

// 應用代碼
import { trace } from '@opentelemetry/api';

// 手動創建 Span
function fetchUserData(userId) {
  const tracer = trace.getTracer('user-service');
  const span = tracer.startSpan('fetchUserData');
  
  span.setAttributes({
    'user.id': userId,
    'operation.type': 'read'
  });
  
  return fetch(`/api/users/${userId}`)
    .then(response => {
      span.setStatus({ code: SpanStatusCode.OK });
      return response.json();
    })
    .catch(error => {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span.recordException(error);
      throw error;
    })
    .finally(() => {
      span.end();
    });
}
```

#### 4. 監測性能指標

```javascript
// 使用 Performance API 收集 Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToSigNoz(metric) {
  const tracer = trace.getTracer('web-vitals');
  const span = tracer.startSpan(metric.name);
  
  span.setAttributes({
    'metric.name': metric.name,
    'metric.value': metric.value,
    'metric.id': metric.id,
    'metric.navigationType': metric.navigationType
  });
  
  span.end();
}

// 收集所有 Web Vitals
getCLS(sendToSigNoz);
getFID(sendToSigNoz);
getFCP(sendToSigNoz);
getLCP(sendToSigNoz);
getTTFB(sendToSigNoz);
```

### 後端集成（Node.js）

#### 1. 安裝依賴

```bash
npm install @opentelemetry/api
npm install @opentelemetry/sdk-node
npm install @opentelemetry/auto-instrumentations-node
npm install @opentelemetry/exporter-otlp-http
```

#### 2. 初始化 OpenTelemetry

```javascript
// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'api-server',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development'
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces'
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // 自動插樁 Express、HTTP、PostgreSQL 等
      '@opentelemetry/instrumentation-http': {
        enabled: true
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true
      }
    })
  ]
});

sdk.start();

// 優雅關閉
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

#### 3. 在應用啟動時引入

```javascript
// app.js
require('./tracing'); // 必須在其他模塊之前引入

const express = require('express');
const app = express();

// 應用代碼會自動被插樁
app.get('/api/users/:id', async (req, res) => {
  // OpenTelemetry 會自動追蹤這個請求
  const user = await db.getUser(req.params.id);
  res.json(user);
});
```

#### 4. 手動創建 Span

```javascript
const { trace } = require('@opentelemetry/api');

async function processOrder(orderId) {
  const tracer = trace.getTracer('order-service');
  const span = tracer.startSpan('processOrder');
  
  try {
    span.setAttributes({
      'order.id': orderId,
      'operation.type': 'process'
    });
    
    // 創建子 Span
    const paymentSpan = tracer.startSpan('processPayment', {
      parent: span
    });
    
    await processPayment(orderId);
    paymentSpan.end();
    
    const shippingSpan = tracer.startSpan('createShipping', {
      parent: span
    });
    
    await createShipping(orderId);
    shippingSpan.end();
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

---

## 使用 SigNoz 進行性能調試

### 1. 查看 Traces（追蹤）

**功能：**
- 查看請求的完整路徑
- 識別慢請求
- 查看跨服務調用

**使用場景：**

```javascript
// 問題：用戶報告登錄慢
// 1. 在 SigNoz UI 中搜索 trace
// 2. 過濾條件：service = "auth-service", operation = "login"
// 3. 查看 trace 時間線，發現：
//    - 數據庫查詢：200ms
//    - 外部 API 調用：1500ms ← 瓶頸！
//    - JWT 生成：50ms
```

**Trace 視圖顯示：**
```
Request: POST /api/login
├─ Span: auth-service.login (100ms)
│  ├─ Span: db.queryUser (200ms) ← 慢
│  ├─ Span: external.validate (1500ms) ← 很慢！
│  └─ Span: jwt.generate (50ms)
└─ Total Duration: 1750ms
```

### 2. 查看 Metrics（指標）

**關鍵指標：**
- **Request Rate**：每秒請求數
- **Error Rate**：錯誤率
- **P50/P95/P99 Latency**：響應時間分位數
- **Throughput**：吞吐量

**使用範例：**

```javascript
// 監測 API 性能
// 指標：/api/users 端點
// - P95 Latency: 500ms
// - Error Rate: 0.1%
// - Request Rate: 100 req/s

// 發現問題：P95 突然增加到 2000ms
// 調試：查看對應時間段的 traces，發現數據庫查詢變慢
```

### 3. 查看 Logs（日誌）

**功能：**
- 搜索和過濾日誌
- 關聯 logs 和 traces
- 查看錯誤詳情

**集成日誌：**

```javascript
import { logs } from '@opentelemetry/api';

const logger = logs.getLogger('my-service');

function handleRequest(req, res) {
  const logRecord = {
    severityText: 'INFO',
    body: `Processing request: ${req.url}`,
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'user.id': req.user?.id
    }
  };
  
  logger.emit(logRecord);
}
```

### 4. 設置告警

**告警規則範例：**

```yaml
# 錯誤率告警
alerts:
  - name: High Error Rate
    condition: error_rate > 0.05  # 5%
    duration: 5m
    notification: slack

# 延遲告警
  - name: High Latency
    condition: p95_latency > 1000ms
    duration: 10m
    notification: email
```

---

## SigNoz 實現原理深入

### 1. 數據收集流程

```
應用代碼
  ↓
OpenTelemetry SDK (自動插樁)
  ↓
生成 Spans/Traces
  ↓
OTLP Exporter
  ↓
OpenTelemetry Collector
  ↓
處理和批處理
  ↓
SigNoz Query Service
  ↓
ClickHouse 存儲
  ↓
SigNoz UI 查詢和展示
```

### 2. Trace 數據結構

```javascript
// Trace 結構
{
  traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
  spans: [
    {
      traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      spanId: "00f067aa0ba902b7",
      parentSpanId: null,  // 根 span
      name: "HTTP GET /api/users",
      kind: "SERVER",
      startTime: 1633024800000000,
      endTime: 1633024800100000,
      duration: 100000000,  // 100ms (納秒)
      status: {
        code: "OK"
      },
      attributes: {
        "http.method": "GET",
        "http.url": "/api/users",
        "http.status_code": 200
      },
      events: [
        {
          name: "db.query",
          time: 1633024800050000,
          attributes: {
            "db.statement": "SELECT * FROM users"
          }
        }
      ]
    }
  ]
}
```

### 3. 採樣策略（Sampling）

**問題：** 高流量應用會產生大量 traces，需要採樣來減少數據量。

**採樣策略：**

```javascript
// 頭部採樣（Head-based Sampling）
// 在請求開始時決定是否採樣
const sampler = new TraceIdRatioBased(0.1); // 10% 採樣率

// 尾部採樣（Tail-based Sampling）
// 在請求完成後根據結果決定是否採樣
const sampler = new TailSampler({
  // 總是採樣錯誤請求
  errorRate: 1.0,
  // 慢請求 100% 採樣
  slowRequestThreshold: 1000, // ms
  slowRequestRate: 1.0,
  // 正常請求 1% 採樣
  normalRequestRate: 0.01
});
```

### 4. 數據存儲和查詢

**ClickHouse 查詢優化：**

```sql
-- 查詢特定 trace
SELECT *
FROM traces
WHERE traceID = '4bf92f3577b34da6a3ce929d0e0e4736'
ORDER BY startTime;

-- 查詢慢請求
SELECT 
    serviceName,
    operationName,
    quantile(0.95)(duration) as p95_latency
FROM traces
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY serviceName, operationName
HAVING p95_latency > 1000000000  -- 1秒
ORDER BY p95_latency DESC;

-- 查詢錯誤率
SELECT 
    serviceName,
    countIf(status = 'ERROR') / count() * 100 as error_rate
FROM traces
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY serviceName;
```

---

## 實際應用場景

### 場景 1：性能瓶頸分析

```javascript
// 問題：用戶報告首頁加載慢
// 1. 在 SigNoz 中查看首頁相關的 traces
// 2. 發現時間線：
//    - API 調用：200ms
//    - 數據庫查詢：150ms
//    - 外部服務：800ms ← 瓶頸
// 3. 優化外部服務調用（添加緩存、並行請求等）
```

### 場景 2：錯誤追蹤

```javascript
// 問題：生產環境出現 500 錯誤
// 1. 在 SigNoz 中過濾錯誤 traces
// 2. 查看錯誤詳情和堆棧
// 3. 關聯相關 logs
// 4. 快速定位問題代碼
```

### 場景 3：依賴分析

```javascript
// 問題：需要了解服務依賴關係
// 1. 在 SigNoz 中查看服務地圖（Service Map）
// 2. 了解服務間的調用關係
// 3. 識別關鍵路徑和單點故障
```

### 場景 4：容量規劃

```javascript
// 問題：需要規劃服務器容量
// 1. 查看歷史 metrics
// 2. 分析請求趨勢
// 3. 預測未來需求
// 4. 設置告警閾值
```

---

## 最佳實踐

### 1. 合理的採樣率

```javascript
// 根據流量調整採樣率
const samplingRate = {
  development: 1.0,    // 100% 採樣
  staging: 0.5,        // 50% 採樣
  production: 0.1      // 10% 採樣
};
```

### 2. 添加業務上下文

```javascript
// 在 traces 中添加業務相關的 attributes
span.setAttributes({
  'user.id': userId,
  'order.id': orderId,
  'payment.method': 'credit_card',
  'business.region': 'us-east'
});
```

### 3. 監測關鍵路徑

```javascript
// 標記關鍵業務操作
const span = tracer.startSpan('critical-operation', {
  attributes: {
    'business.critical': true
  }
});
```

### 4. 設置合理的保留期

```yaml
# ClickHouse 數據保留策略
# 保留 7 天的詳細 traces
# 保留 30 天的聚合 metrics
retention:
  traces: 7d
  metrics: 30d
  logs: 3d
```

---

## 總結

**SigNoz 核心原理：**

1. **數據收集**：OpenTelemetry SDK 自動插樁收集數據
2. **數據傳輸**：OTLP 協議傳輸到 Collector
3. **數據處理**：Collector 批處理和轉換
4. **數據存儲**：ClickHouse 列式存儲
5. **數據查詢**：Query Service 提供查詢 API
6. **數據可視化**：React UI 展示數據

**關鍵優勢：**
- 開源且可自託管
- 基於 OpenTelemetry 標準
- 統一的 Metrics、Traces、Logs 平台
- 高性能存儲和查詢

**使用建議：**
- 從關鍵服務開始集成
- 設置合理的採樣率
- 添加業務相關的 attributes
- 定期查看和分析性能數據
- 設置告警及時發現問題

理解 SigNoz 的實現原理和最佳實踐，可以幫助構建可觀測的 Web 應用，快速定位和解決性能問題。
