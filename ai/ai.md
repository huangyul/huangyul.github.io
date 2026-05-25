# 问问题提示词模板

你现在是我的 AI Agent 转行导师。

背景：
我是传统 Web2 开发转 AI Agent 开发。

目标：
最快达到 AI Application Engineer / Agent Engineer 可面试水平。

技术主线（固定）：
Python + FastAPI + PostgreSQL(pgvector) + LangGraph + Docker + SSE

原则：
- 项目驱动
- 就业导向
- production 优先
- 先手写后框架
- 避免追热点
- 避免过深理论

学习进度（能力快照）：

【已完成】
- LLM API 调用
- Tool Calling（天气 Agent）
- Structured Output
- FastAPI Streaming
- 手写最小 RAG
- pgvector
- 企业知识库 Agent（基础版）

【当前在做】
- SQL Agent
- LangGraph state
- SQL validation

【未开始】
- evaluation
- observability
- guardrails

当前问题：
【你的问题】



# 学习原则（务必遵守）

1. **先做出东西，再补理论**
2. **先手写，再框架**
3. **每阶段必须有可运行项目**
4. **不会的问题直接问 AI**
5. **不追热点工具，不全学**
6. **只学岗位真正需要的东西**

## 技术主线（固定，不轻易换）

* Python
* FastAPI
* PostgreSQL + pgvector
* OpenAI-compatible API
* LangGraph
* Docker
* SSE Streaming

明确：

**不做模型训练，不学深度学习，不走算法岗路线。**

---

# 总路线图

## 第0阶段：环境准备（1天）

目标：跑通第一个 AI 应用

验收标准：

* 能成功调用 LLM API
* 能本地运行 FastAPI
* 能用 Docker 跑 PostgreSQL

产出项目：

* Hello AI App

---

## 第1阶段：LLM 基础（1–2周）

目标：理解 LLM 工作方式

重点：

* token
* context window
* hallucination
* prompt
* structured output
* tool calling
* embedding
* RAG 基础

产出项目：

* Tool Calling 天气助手

---

## 第2阶段：RAG（2周）

目标：做出企业知识库

重点：

* 文档解析
* chunking
* embedding
* retrieval
* rerank
* citation

产出项目：

* 企业知识库 Agent

---

## 第3阶段：Agent（2–3周）

目标：理解 Agent 架构

重点：

* workflow vs agent
* tool orchestration
* state machine
* LangGraph
* memory

产出项目：

* SQL 数据分析 Agent

---

## 第4阶段：工程化（2–3周）

目标：Production 能力

重点：

* evaluation
* tracing
* observability
* streaming
* retry
* fallback
* guardrails
* cost optimization

产出项目：

* 可部署 Agent

---

## 第5阶段：作品集 + 面试（2–4周）

目标：求职

最终项目：

1. 企业知识库 Agent
2. SQL 数据分析 Agent
3. Browser Automation Agent（可选）

---

# 第0阶段：环境准备（Day 1）

## 必须安装

### Python

要求：Python 3.12+

目标：
只掌握 AI 服务开发需要的 Python。

不要学：

* numpy
* pandas
* 机器学习
* 数据分析

### VSCode

插件：

* Python
* Ruff
* Pylance
* Docker

### Docker

目标：
本地服务管理。

### PostgreSQL

后续直接搭配 pgvector。

### API Provider

任选：

* OpenAI-compatible API
* OpenRouter
* Claude compatible provider

要求：
能调用 chat completion。

## 第一个程序

目标：
完成一个最小可运行 AI 服务。

功能：
用户输入 → 模型回答

必须包含：

* system prompt
* user input
* logging
* error handling

验收标准：

* 能稳定回答
* 能处理报错
* 能打印 token usage

---

# 第1阶段：LLM 基础（Week 1–2）

## 核心目标

建立：

> Context Engineering 思维

而不是 Prompt 崇拜。

## P0（必须学）

### 1. Token

理解：

* token 是什么
* 为什么贵
* 为什么影响上下文

必须会回答：

> 为什么 prompt 太长会变差？

---

### 2. Context Window

理解：

模型不是无限记忆。

必须会：

* 截断策略
* 上下文控制
* memory 基础

---

### 3. Hallucination

必须理解：

为什么模型胡说。

来源：

* 缺上下文
* retrieval 错误
* prompt 不明确
* tool 失败

重点：

> 幻觉是工程问题。

---

### 4. Structured Output

必须掌握：
JSON 输出。

目标：
让模型变得稳定。

实战：
让模型输出固定 schema。

---

### 5. Tool Calling（极重要）

重点：

> Agent 本质是 Tool Routing。

你必须自己手写。

不要先上框架。

项目：
天气 Agent

流程：
用户问题
→ 模型决定调用天气工具
→ 返回结果

验收标准：
你必须能解释：

1. 为什么用 tool calling？
2. 为什么不用 prompt parsing？
3. tool schema 为什么重要？

---

## Week 2 小项目

### 项目：Tool Calling Agent

要求：

支持：

* weather tool
* calculator tool
* currency tool

必须：

* FastAPI
* Streaming response
* Error handling
* Logging

禁止：

* LangChain
* LangGraph

原因：
先理解底层。

---

# AI 提问模板

当你不会时：

```text
请像高级 AI 工程师一样解释：

【问题】

要求：
1. 用 Web2 开发者视角
2. 给最小可运行 demo
3. 给真实业务场景
4. 给常见坑
5. 给最佳实践
```

---

# 当前阶段不要学

❌ 微调
❌ LoRA
❌ Stable Diffusion
❌ CrewAI
❌ AutoGen
❌ GraphRAG
❌ MCP
❌ 多 Agent

理由：
全部属于过早优化。

# 第2阶段：RAG（Week 3–4）

## 核心目标

做出：

> 企业知识库 Agent（可写进简历）

明确：

> 80% 企业 AI 落地 = RAG

所以这一阶段是求职核心。

学习目标：

你必须真正理解：

```text
文档
→ chunking
→ embedding
→ retrieval
→ rerank
→ context inject
→ answer
```

不要只会：

```python
rag_chain.invoke()
```

---

## P0（必须学）

### 1. Embedding

理解：

> embedding 是语义搜索，不是关键词搜索。

必须理解：

* embedding 是什么
* similarity search
* cosine similarity
* 为什么 embedding model 会影响效果

必须会回答：

> 为什么 RAG 查不准？

---

### 2. Chunking（极重要）

这是 RAG 成败关键。

重点：

* chunk size
* overlap
* semantic chunking
* parent-child chunking（了解）

必须理解：

> chunking 比 prompt 更影响效果。

实战：

同一份文档：

分别测试：

* 200 token
* 500 token
* 1000 token

比较效果。

验收标准：

你能解释：

> 为什么 chunk 太大或太小都不好？

---

### 3. Retrieval

必须掌握：

* top-k
* similarity threshold
* metadata filter
* hybrid search（了解）

重点：

不要盲目：

```python
k=5
```

要理解：

> 为什么 retrieval 会污染上下文。

---

### 4. pgvector（唯一主线）

只学一个向量库：

> PostgreSQL + pgvector

理由：

企业落地非常常见。

优势：

* 已有数据库体系
* SQL 能力复用
* 成本低
* 部署简单

当前阶段不要学：

❌ Pinecone
❌ Weaviate
❌ Milvus
❌ 一堆向量库横跳

---

### 5. Citation（重要）

必须做引用。

目标：

模型回答时：

> 告诉用户依据哪个文档。

为什么重要：

企业非常在意可信度。

面试高频：

> 如何减少 hallucination？

正确答案之一：

> citation + retrieval quality

---

## P1（推荐）

### Rerank

理解：

第一轮 retrieval 不一定最准。

rerank 可以优化相关性。

当前：

会概念即可。

不要深挖模型。

---

### Query Rewrite

理解：

用户问题可能很差。

例如：

```text
那个退款规则是啥？
```

改写成：

```text
公司退款政策与退款流程说明
```

提升 retrieval。

---

## Week 3 实战

### 手写最小 RAG（禁止框架）

要求：

自己实现：

```text
upload file
→ chunk
→ embedding
→ save pgvector
→ retrieve
→ context inject
→ answer
```

禁止：

❌ LangChain
❌ LangGraph

理由：

先理解原理。

验收标准：

你必须能画出架构图。

并解释：

1. embedding 为什么有效？
2. retrieval 为什么失败？
3. 为什么 hallucination？
4. context 如何污染？

---

## Week 4 项目（重点）

### 项目1：企业知识库 Agent

必须做。

功能要求：

### 文件上传

支持：

* PDF
* DOCX
* TXT
* Markdown

---

### 文档解析

实现：

* chunking
* embedding
* indexing

---

### Retrieval

支持：

* top-k
* metadata filter

---

### 回答

必须：

* streaming
* citation
* source reference

---

### UI（简单即可）

任选：

* React
* Next.js
* 简单页面

重点：

后端能力优先。

不要浪费时间做 UI。

---

## 项目验收标准

你必须能回答：

### RAG 为什么不准？

至少讲出：

* chunking
* retrieval
* embedding quality
* context pollution

### 如何降低 hallucination？

至少讲出：

* citation
* better retrieval
* structured output
* threshold

### 为什么选择 pgvector？

至少讲出：

* 成本
* 企业落地
* SQL 能力复用

---

## 当前阶段不要学

❌ GraphRAG
❌ Agentic RAG
❌ Multi-agent
❌ Fine-tuning
❌ MCP
❌ LangGraph

理由：

基础 RAG 没做扎实前，全是干扰。

# 第3阶段：Agent（Week 5–7）

## 核心目标

从：

> Chatbot 开发者

升级为：

> Agent Engineer

重点认知：

> Agent ≠ 会聊天

Agent 本质：

```text
Goal
→ Think
→ Tool
→ Observe
→ Decide
→ Continue
```

本质是：

> 状态机 + Tool orchestration

---

## 第一个重要概念

### Workflow vs Agent（面试高频）

必须彻底理解。

### Workflow

特点：

* 固定流程
* 可预测
* 稳定
* 易调试

适合：

* 审批流
* 数据处理
* 客服流程
* 企业系统

例如：

```text
用户问题
→ 分类
→ 检索
→ 总结
→ 输出
```

---

### Agent

特点：

* 动态决策
* 可规划
* 不确定性更高

例如：

```text
用户需求
→ Decide Tool
→ Search
→ Retry
→ Reflect
→ Continue
```

重点：

> 能 workflow 就别 agent。

这是 production 思维。

面试高频：

> 为什么不用 agent？

你要会回答：

> 成本高、稳定性差、不可预测。

---

## P0（必须学）

### 1. Tool Calling 深化

当前阶段必须会：

工具：

* search
* http api
* sql
* calculator
* database

必须理解：

> Agent 本质是 Tool Router。

常见失败：

* schema 不清晰
* 参数错误
* tool explosion
* context 污染

验收标准：

你能解释：

> 为什么 tool description 会影响效果？

---

### 2. State Machine 思维

Agent 必须有状态。

理解：

```text
current_state
→ next_action
→ update_state
```

为什么重要：

否则：

> Agent 会越来越乱。

理解：

* state
* transition
* retry
* termination

---

### 3. Memory（够用即可）

只学：

* short-term memory
* summary memory

不要深挖。

重点：

> memory 是 context management。

不是无限聊天记录。

必须理解：

为什么聊天越长效果越差。

---

### 4. LangGraph（重点框架）

现在开始引入框架。

原因：

你已经理解底层。

重点学习：

* StateGraph
* node
* edge
* conditional edge
* state update
* retry
* interrupt

理解：

> LangGraph = 更适合 production 的 agent runtime

不要学：

❌ LangChain 全家桶

原因：

太重。

只掌握基础即可。

---

## Week 5 实战

### 项目：Research Agent

功能：

用户问题
→ search
→ summarize
→ citation

必须支持：

* 多工具调用
* retry
* structured output
* error handling

目标：

理解 agent loop。

不要追求复杂。

---

## Week 6–7 核心项目

### 项目2：SQL 数据分析 Agent（强推）

这是：

> 最容易拿 offer 的项目之一。

原因：

高度复用 Web2 能力。

流程：

```text
用户问题
→ schema understanding
→ sql generation
→ sql validation
→ query
→ analysis
→ visualization
→ answer
```

示例：

用户：

```text
最近30天哪个商品增长最快？
```

Agent：

```text
理解业务
→ 生成 SQL
→ 校验 SQL
→ 查询
→ 分析趋势
→ 输出结果
```

---

## 项目功能要求

### 1. Schema Awareness

必须：

Agent 能读取 DB schema。

否则：

SQL 很容易错。

---

### 2. SQL Validation（极重要）

必须：

防止危险 SQL。

禁止：

* DROP
* DELETE
* UPDATE

只允许：

```sql
SELECT
```

这是面试亮点。

---

### 3. Retry

SQL 执行失败：

自动修复。

流程：

```text
sql failed
→ error message
→ regenerate
→ retry
```

---

### 4. Visualization

支持：

* line chart
* bar chart
* pie chart

不要追求前端。

重点：

AI workflow。

---

### 5. Explanation

模型必须解释：

> 为什么得出这个结论。

避免黑盒。

---

## 面试验收标准

你必须能回答：

### Workflow 和 Agent 区别？

### 为什么 LangGraph？

### 为什么不用纯 Prompt？

### 为什么 SQL Agent 容易失败？

至少讲出：

* schema
* hallucination
* validation
* retry

### 为什么要 state？

至少讲出：

* 可追踪
* 可恢复
* 更稳定

---

## 当前阶段不要学

❌ Multi-agent
❌ CrewAI
❌ AutoGen
❌ MCP
❌ 超复杂 planner

理由：

单 Agent 都没稳定前，别升级复杂度。

# 第4阶段：工程化 / Production（Week 8–10）

## 核心目标

从：

> 能跑 Demo

升级为：

> 能上线的 AI 系统

重点认知：

> AI 应用 = 服务系统

不是 Notebook。

---

## P0（必须学）

### 1. Streaming（极重要）

必须掌握：

* SSE
* websocket（了解）

默认主线：

> SSE

原因：

简单、稳定、企业常见。

验收标准：

所有项目必须支持 streaming。

---

### 2. Observability

必须理解：

> 为什么模型突然变差？

要能追踪：

* prompt
* response
* latency
* tool calls
* token cost
* failure

推荐：

* LangSmith（了解）
* OpenTelemetry（了解）
* 自己 logging（必须）

验收标准：

你能定位：

> 回答为什么失败。

---

### 3. Evaluation（高频面试）

重点：

> AI 没有传统单元测试。

必须理解：

* golden dataset
* correctness
* groundedness
* retrieval quality

要求：

给每个项目建立：

```text
20~50条测试问题
```

这是强差异化能力。

---

### 4. Guardrails

必须理解：

风险：

* prompt injection
* jailbreak
* SQL injection
* unsafe output

SQL Agent 必须：

只允许：

```sql
SELECT
```

---

### 5. Cost Optimization

理解：

为什么 token 会爆炸。

必须掌握：

* caching
* shorter context
* retrieval optimization
* model routing
* summary memory

重点：

> Context Engineering > Prompt Engineering

---

### 6. Retry / Fallback

必须：

失败可恢复。

示例：

```text
model failed
→ retry
→ fallback model
→ degrade gracefully
```

验收标准：

项目不会因为一次错误直接挂。

---

## Production Checklist

所有项目必须满足：

* logging
* retry
* error handling
* streaming
* docker
* env config
* health check
* evaluation
* README

---

# 第5阶段：作品集（Week 10–12）

## 核心目标

形成：

> 可投简历作品集

重点：

> 少而精

不要：

```text
10个聊天机器人
```

要：

```text
2~3个高质量项目
```

---

## 项目1（必做）

### 企业知识库 Agent

展示能力：

* RAG
* pgvector
* retrieval
* citation
* streaming
* evaluation

加分项：

* 多租户
* 权限
* 文档更新

简历关键词：

```text
RAG
Semantic Search
Vector Retrieval
Context Engineering
```

---

## 项目2（强推）

### SQL 数据分析 Agent

展示能力：

* tool calling
* workflow
* validation
* retry
* visualization
* business reasoning

这是最推荐项目。

理由：

和 Web2 能力最匹配。

简历关键词：

```text
Agent Workflow
NL2SQL
Tool Calling
Reasoning Pipeline
```

---

## 项目3（可选）

### Browser Automation Agent

展示：

* planning
* tool orchestration
* automation

例如：

自动：

* 搜索信息
* 填表
* 数据收集

注意：

不要投入太久。

优先前两个项目。

---

# GitHub 要求

每个项目必须：

### README

包含：

* 项目介绍
* 架构图
* 技术栈
* 核心流程
* 本地运行
* Demo GIF
* 已知问题

---

### 架构图

必须有。

推荐：

Mermaid。

例如：

```text
user
→ api
→ agent
→ retrieval/tool
→ llm
→ response
```

---

### Docker

必须支持：

```bash
Docker Compose
```

目标：

一键运行。

---

# 面试准备（持续进行）

## 高频问题

### LLM 为什么 hallucination？

必须答出：

* 缺上下文
* retrieval 差
* prompt 模糊
* tool 错误

---

### RAG 为什么失效？

至少答出：

* chunking
* retrieval
* embedding
* rerank
* context pollution

---

### 为什么 LangGraph？

答：

* stateful
* controllable
* retry
* production better

---

### Workflow vs Agent？

重点：

workflow 更稳定。

不要盲目 Agent。

---

### 为什么不用纯 Prompt？

答：

不稳定。

需要：

* tools
* structure
* state
* retrieval

---

### 如何降低 token 成本？

至少答出：

* better retrieval
* shorter context
* cache
* summary
* model routing

---

### 如何评估 AI 应用质量？

答：

* golden dataset
* evaluation set
* correctness
* groundedness

---

# 求职策略

目标岗位：

优先投：

### AI Application Engineer

### AI Agent Engineer

### LLM Engineer（应用方向）

### AI Fullstack Engineer

暂时不投：

❌ 算法岗
❌ 模型训练岗
❌ Research Engineer

---

# 推荐学习资源（只保留必要）

## 官方文档（优先级最高）

必须读：

* OpenAI docs
* Anthropic docs
* LangGraph docs
* FastAPI docs

原则：

> 官方文档 > 二手教程

---

## 视频/课程

只补基础：

* 吴恩达 LLM 系列（选看）
* 必要时 YouTube 搜特定问题

不要沉迷课程。

---

# 避坑总表

不要浪费时间：

❌ 深度学习
❌ Transformer 数学推导
❌ 微调
❌ LoRA
❌ Stable Diffusion
❌ 一堆向量库
❌ 一堆 Agent 框架
❌ Prompt 花活
❌ 复杂 Multi-Agent
❌ 只写 Notebook
❌ 做聊天机器人作品集

---

# 每周执行规则

每周必须：

1. 学新知识
2. 写代码
3. 做项目
4. 写 README
5. 问 AI
6. 总结问题

比例：

```text
20% 学习
80% 动手
```

---

# 结束标准（达到即可开始投递）

满足以下条件：

✅ 能独立写 FastAPI AI 服务
✅ 能实现 Tool Calling
✅ 能自己写 RAG
✅ 会 LangGraph
✅ 有 SQL Agent 项目
✅ 有 Knowledge Base 项目
✅ 会 streaming
✅ 会 evaluation
✅ 会 logging/tracing
✅ GitHub 项目完整
✅ 能回答核心面试题

达到这里：

> 开始投递，不要继续学习。

边面边补。

