# LangChain

## 一、简介

**LangChain** 是一个面向 **LLM 应用开发**的开源框架。它本身**不是大模型**，也**不是数据库**，更**不是知识库平台**；它更像一层“**应用编排层**”或“**胶水层**”，负责把模型、提示词、外部知识、工具、记忆、输出解析、调试追踪等能力组织成一个完整、可维护、可扩展的 AI 应用。

其中，**Lang** 指 Language Model，**Chain** 指把多个环节串起来形成流程。最早的 LangChain 确实以“链式调用”闻名，但发展到今天，它已经不只是“链”，而是围绕 **Agent、RAG、工具调用、状态管理、可观测性** 形成了一整套生态。官方在发展历程中提到，LangChain 作为 Python 包公开发布于 **2022 年**，比 ChatGPT 正式发布还早约一个月，因此它几乎伴随了生成式 AI 应用开发的整个爆发期。

## 0.x 与 1.x 的核心差异

> **0.x 更像“很多高层类 + 组合式积木”，1.x 更像“精简主包 + 统一入口 + Agent 建立在 LangGraph 之上”。**

以 Agent 为例，变化尤其明显：

```text
# 约 0.x：常见需要分多步组装
[Model] → [Tools] → [Prompt] → [Agent] → [Executor]

# 约 1.x：常见收敛为高层入口
create_agent(模型、工具、提示等) → [Agent]
```

## 二、核心模块

典型 AI 应用想成这样一条链路：

1. 用户发来问题
2. 系统决定要不要带上提示词、历史记录、外部知识
3. 如果需要，先检索文档或调用工具
4. 把整理后的上下文交给模型
5. 得到输出后做解析、格式化或后处理
6. 整个过程中记录日志、追踪执行链路

从这个视角看，LangChain 的核心模块其实是在回答六个问题：

- **怎么接模型**：Model / Model I/O
- **怎么组织固定流程**：Chains / LCEL
- **怎么记住上下文**：Memory
- **怎么接外部知识**：Retrieval / RAG
- **怎么让模型会做事**：Tools / Agents
- **怎么观测与调试**：Callbacks / LangSmith

## 三、Model I/O 与模型接入

### 定义

**Model I/O** 是 LangChain 中专门负责“**如何和模型打交道**”的模块。它关心的就是：**模型输入怎么组织、模型怎么调用、模型输出怎么处理**，这三件事加在一起，就是 Model I/O。

一句话定义：

> **Model I/O = Format（输入格式化）→ Predict（模型调用）→ Parse（输出解析）**

### 使用方式

#### 原生SDK

```py
client = OpenAI(api_key=api_key, base_url=base_url)
resp = client.chat.completions.create(model=model, messages=messages)
print(resp.choices[0].message.content)
```

#### langchain provider

```py
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage


# 1. 实例化Provider
llm = ChatOpenAI(model=model, api_key=api_key, base_url=base_url)

# 2. 构建消息列表
messages = [
    SystemMessage(content="你是一个中文助手，擅长回答各种问题。"),
    HumanMessage(content="你好，请你介绍一下 LangChain"),
]

# 3. 直接调用（Predict）
response = llm.invoke(messages)
print(response.content)
```

#### init chat

目前主流推荐

```python
chat_model = init_chat_model(
    model=f"openai:{model}", api_key=api_key, base_url=base_url
)
```
