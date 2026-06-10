# RAG 檢索增強生成：原理與進階技法

通用 LLM 上業務常卡在 **知識邊界**（訓練集無私域／即時資料）、**幻覺**（機率輸出不保真）、**資料安全**（私域不能上第三方訓練）——RAG 的取捨是：**不動模型權重，用檢索把相關知識注入 Prompt，再讓 LLM 生成**。一句話：**RAG = 檢索 + LLM 提示**；效果上限多半在 **檢索是否召回對、上下文是否夠用**，不在 Prompt 修辭。

### 本質一：兩階段管線

**離線（索引）**

- 載入 → 清洗／格式化 → **chunk** → **embedding** → 寫入向量庫（FAISS、Chroma、Milvus、ES 等）。
- **chunk 取捨**：受 embedding 模型 token 上限約束；塊太大 → 語義模糊、檢索不準；塊太小 → 上下文斷裂。常見：按句切、固定長度 + 頭尾 overlap、或 **父子塊**（檢索子塊、生成用父塊）。
- **embedding 選型**：通用場景用 OpenAI / BGE / M3E 等即可；罕見專有名詞、垂直域才值得微調 encoder。

**在線（問答）**

- 用戶 query → **檢索 top-k** → 拼進 Prompt（任務描述 + 背景知識 + 問題）→ LLM 生成。
- **檢索方式**：向量相似度（cosine 等）、全文／BM25，或 **混合搜索 + RRF 重排** — 語義 + 關鍵字互補，召回通常優於單一路徑。

### 本質二：Naive RAG 與它的天花板

- **標準流程**：分塊 → 同一 encoder 嵌入文檔與 query → 暴力或 ANN 索引搜 top-k → 把 chunk 塞進 prompt 讓 LLM 答。
- **為什麼不夠**：複雜問法一次檢索對不上、chunk 邊界切掉語義、多輪對話指代失聯、多文檔路由錯索引 — 這些是 **Advanced RAG** 要解的，不是換更大 LLM 能單獨解決。
- **Prompt 仍重要**：要求「無相關 context 要明示、勿瞎編」可降幻覺，但 **garbage in → garbage out** 依舊成立。

### 本質三：Advanced RAG 技法地圖（按管線位置）

**索引／檢索層**

- **分層索引**：大庫先搜 **摘要索引** 篩文檔，再在子集搜 chunk — 降延遲、減噪音。
- **HyDE / 假設性問題**：用 LLM 為 query 生成假設答案或為每 chunk 生成問題再嵌入 — 提升 query 與索引向量的 **語義對齊**（query↔question 常比 query↔chunk 更近）。
- **Sentence Window / Parent Document**：檢索 **小粒度**（句或子塊），生成前 **擴展上下文窗口** 或 **升級到父塊** — 搜得準、答得全。
- **Hybrid Search + RRF**：稀疏（BM25）+ 稠密向量融合重排 — 專有名詞、精確匹配場景尤其有用。

**檢索後**

- **Rerank / Filter**：cross-encoder、Cohere rerank、元數據過濾 — 在送 LLM 前砍掉假陽性；**最可控的品質槓桿之一**。

**Query 側（LLM 當推理引擎）**

- **Query 分解**：複雜比較題拆成可並行檢索的子 query，再彙總（LangChain MultiQuery / LlamaIndex SubQuestion）。
- **Step-back / Rewrite**：生成更抽象或改寫後的 query，補高層 context 或修正表述。
- **RAG Fusion**：LLM 從單一 query **生成多個搜索 query**，各自檢索後 **RRF 合併重排** — 覆蓋問題多面、可順帶糾錯拼寫；代價是 **多一次 LLM 延遲**，且 **行話／多義詞** 可能生成跑偏 query（需改 prompt 或避免使用）。

**對話與路由**

- **Chat Engine**：多輪需 **query 壓縮**（Condense + Context）把歷史與當前問題合成新检索 query — 否則「它」「上一個」檢索全 miss。
- **Query Routing**：LLM 決定走 **哪個索引**（向量／圖／SQL／摘要層）或 **總結 vs 檢索** — 多文檔、多數據源必備。
- **Agent 化 RAG**：每文檔子 Agent + 頂層路由 Agent — 能力強但 **LLM 往返多、最慢**；大庫應簡化架構再談擴展。

**生成側**

- **Response Synthesis**：不是 naive「全 chunk 硬塞」— 可逐塊 refine、先摘要再答、多路答案再合併 — 在 context 超長或多源衝突時用。

### 本質四：微調與評估（什麼值得做）

**微調**

- **Encoder 微調**：對已很強的 search-optimized encoder（如 bge-large）收益常 **有限** — 先優化 chunk／混合搜索／rerank。
- **Reranker 微調**：cross-encoder 對 query-chunk 打相關性分 — 比盲目升 embedding 模型更直接。
- **LLM 微調（RA-DIT 等）**：同時調 retriever + LLM，忠實度等指標可小幅提升；小合成集微調可能 **損害通用能力** — 要有評估再決定。

**評估（RAG 三元組）**

- **檢索相關性**：召回了對的 context 嗎？（命中率、MRR）— **最關鍵、最可控**，Advanced 技法 1–7 步主要為此服務。
- **Groundedness / 忠實度**：答案是否被 context **支撐**，還是模型自編？
- **答案相關性**：是否答到用戶問題？
- **實務**：建好 baseline RAG 後 **立刻上評估集**（Ragas、Truelens、LangSmith）；每改 prompt／chunk／fusion 都要量 **哪組 query 升、哪組降** — 不量就無法取捨。

### 本質五：RAG Fusion 與生產取捨

| 維度 | 收益 | 代價 |
|------|------|------|
| 語義覆蓋 | 多 query 多角度召回，內容更多樣 | 額外 LLM 調用 → **延遲** |
| 糾錯 | 可修正拼寫、補用戶上下文 | 行話／多義詞可能 **生成錯 query** |
| 成本 | 生成 query 的 token 遠少於最終生成 | 若 fusion 對命中率幫助小，純增成本 |

- **適合**：內容偏 **通用概念**、單次 semantic search 常漏角。
- **慎用**：大量 **內部術語、與日常詞同名** 的域 — 先試 prompt 少樣例、semantic 相似 query 庫，再考慮微調小 LLM 做 query 生成。

### 與本系列其他篇的關係

- **`5-Agent為什麼在關鍵時刻失智.md`**：Agent 失智約八成在 **規劃／推理**；RAG 只解 **知識從哪來** — 檢索再準也救不了多步規劃崩、工具順序錯。
- **`3-如何用claude-code-agentic工作流做AI代碼量化驗收.md`**：RAG 應用同樣需要 **可測指標**（檢索 MRR、忠實度、延遲）；Agent + RAG 更要分開評 **召回** 與 **推理**。
- **生產瓶頸**：除準確率外，**延遲** 常是主矛盾 — 小參數 LLM、流式輸出、減少 Agent 層級，與 Advanced 技法增加 LLM 次數形成 **直接 tradeoff**。

### 小結

- **問題**：純 LLM 缺私域知識、易幻覺、企業不敢上傳數據。
- **手段**：離線索引 + 在線檢索注入；從 Naive 到 Advanced（混合搜索、rerank、query 變換、fusion、路由、對話壓縮）按 **召回 → 重排 → 生成** 逐段加強；用 RAG 三元組持續評估。
- **結果**：RAG 把「知識邊界」變成 **可迭代的檢索工程問題**；Advanced 不是全堆，而是 **對評估數據上最弱的那一環** 加技法。

**參考**：[一文读懂：大模型RAG（检索增强生成）含高级方法](https://www.zhihu.com/tardis/zm/art/675509396?source_id=1003)
