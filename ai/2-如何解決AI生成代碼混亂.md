### AI coding歷史

1. GitHub Copilot：代碼補全
2. Chatbot：上下文工程
3. Vibe Coding：編碼權限全權交給AI

### 解決AI生成代碼混亂

- 建立開發手冊，強調只能怎樣做，不能怎樣做，工程規範eslint、tsconfig、prettier都要遵守。
- 清晰規劃
  - 深討新特性方案：拿到需求，做過調研，方案對比評審
  - 具體實施步驟：設定實施步驟
  - 可能存在風險：確定技術難點，思考如何攻克
  - Unit Test / Integration Test：測試驅動 TDD
  - 反思如何通過經驗優化

### 基於Google Form協作表格編輯全盞開發，怎樣處理性能瓶頸和代碼質量？

進行全局約束

.cursorrules .clauderules約束AI編碼實現技術

.plan 規劃

- 需求一：STAR-L法則
  - 描述需求
  - 探討方案
  - 實施步驟拆解
  - 存在性能瓶頸
  - 優化細節
- 核心數據協議設計
  - 頂層數據協議抽象

.features 新特性

拆解需求，按新特性逐步開發

- 實現表格渲染引擎（支持千萬行數據表格渲染流暢），沉澱到mono repo子包中
- 公式引擎、WebWorker多線程架構
- 協同實現
  - crdt、ot協同算法，基於yjs實現
  - 協同服務
  - 協同層傳輸協議
- 界面
  - 登錄
  - 表格渲染

### Vibe Coding 工作流開發 SOP

1. 規範 Spec
2. 代碼生成
3. 完成測試用例編寫
4. 測試 + lint
5. check過程

MCP、skill

通用工具協議來調用 Model Context Protocol

- 查資料 deepwiki mcp
- shadcn mcp

zcf zero config format

skill
