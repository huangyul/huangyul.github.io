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

### Prompt

**Prompt** 在 LangChain 中不只是“一段字符串”，而是对模型输入的**工程化组织**（角色 + 模板 + 占位符）。

#### 1. 入参形态
聊天模型支持多种输入方式：
- **纯字符串**：`model.invoke("...")`，适合快速测试。
- **消息列表**（推荐）：`[SystemMessage(...), HumanMessage(...)]`，结构清晰，利于模型理解。
- **元组/字典列表**：`[("system", "..."), ("user", "...")]` 或 `[{"role": "system", "content": "..."}, ...]`。

#### 2. 核心消息类型
LangChain 将对话拆分为不同角色，使模型能更好理解上下文：

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage

messages = [
    SystemMessage(content="你是一个专业的法律助手。"), # 设定规则
    HumanMessage(content="什么是合同法？"),        # 用户提问
    AIMessage(content="合同法是..."),              # 模型回复（用于多轮对话历史）
    # ToolMessage 用于回传工具调用结果，详见 Agent 章节
]
```

#### 3. 提示词模板 (Templates)
模板化是 Prompt 工程的核心，解决“硬编码”问题。

- **PromptTemplate**：适合单段文本。
  ```python
  from langchain_core.prompts import PromptTemplate
  template = PromptTemplate.from_template("请帮我摘要以下内容：{text}")
  prompt = template.format(text="LangChain 是一个...")
  ```

- **ChatPromptTemplate**：最推荐的对话场景写法。
  ```python
  from langchain_core.prompts import ChatPromptTemplate
  
  prompt_template = ChatPromptTemplate.from_messages([
      ("system", "你是一个{role}"),
      ("human", "{question}")
  ])
  # 填充后得到消息列表
  messages = prompt_template.format_messages(role="专家", question="什么是 RAG?")
  ```

- **MessagesPlaceholder**：**多轮对话的关键**。在模板中预留坑位，动态插入不确定长度的历史记录。
  ```python
  from langchain_core.prompts import MessagesPlaceholder
  
  prompt = ChatPromptTemplate.from_messages([
      ("system", "你是个助手"),
      MessagesPlaceholder("chat_history"), # 动态插入历史消息列表
      ("human", "{input}")
  ])
  ```

#### 4. 模型调用方式
除了基础的 `invoke`，常用进阶方式：

- **stream (流式)**：打字机效果。
  ```python
  for chunk in model.stream("讲个长故事"):
      print(chunk.content, end="", flush=True)
  ```

- **batch (批量)**：并发处理多条输入（效率远高于循环调用）。
  ```python
  resps = model.batch(["什么是 AI?", "什么是 ML?"])
  ```

#### 5. 工程化管理
将 Prompt 存放在外部文件（如 `prompt.yaml`），实现代码与内容分离：

```yaml
# prompt.yaml
_type: prompt
input_variables: ["topic"]
template: "请详细介绍一下 {topic}"
```

```python
from langchain_core.prompts import load_prompt
template = load_prompt("prompt.yaml")
```

### 输出解析器 (Output Parser)

在 Model I/O 环节中，输出解析器负责将模型的自然语言输出转换为程序可处理的结构化数据（如字符串、JSON、Python 对象）。

#### 1. 核心价值
- **格式转换**：将 `AIMessage` 转换为 `str`、`dict` 或 `Pydantic` 对象。
- **结构约束**：通过 `get_format_instructions()` 引导模型按指定 Schema 输出。
- **结果校验**：验证输出字段的存在性、类型及取值范围。
- **工程衔接**：使模型输出能直接对接数据库、前端 API 或后续工作流。

#### 2. 常用解析器分类
| 解析器 | 最终结果 | 适用场景 |
| :--- | :--- | :--- |
| `StrOutputParser` | `str` | 仅需展示文本，如聊天回复、文章润色。 |
| `JsonOutputParser` | `dict` / `list` | 需要抽取字段，如“问题/答案”、“事件要素”。 |
| `PydanticOutputParser` | `Pydantic` 对象 | 生产环境首选，需要强类型和运行时校验（如年龄范围）。 |

#### 3. 结构化输出 (Structured Output)
现代 LangChain 推荐在支持的模型（如 GPT-4o, Claude 3.5）上直接使用 `with_structured_output` 接口。

- **TypedDict**：基于 Python 标准库，定义结构说明，无强校验，轻量级。
- **Pydantic**：基于 `BaseModel`，支持 `Field` 约束和自定义校验器（validator），工程化程度最高。
- **JSON Schema**：跨语言通用协议，适合多语言系统对接。

#### 4. 示例代码

##### A. 现代推荐：`with_structured_output` (基于 TypedDict)
```python
from typing import TypedDict, Annotated
from langchain_openai import ChatOpenAI

# 定义输出结构
class Joke(TypedDict):
    setup: Annotated[str, "笑话的铺垫"]
    punchline: Annotated[str, "笑话的梗（笑点）"]

model = ChatOpenAI(model="gpt-4o")

# 将模型与结构绑定
structured_llm = model.with_structured_output(Joke)
result = structured_llm.invoke("讲一个关于 AI 的笑话")
print(result) # 返回 Python 字典: {'setup': '...', 'punchline': '...'}
```

##### B. 经典链式：`PydanticOutputParser` (带严格校验)
```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class Person(BaseModel):
    name: str = Field(description="人名")
    age: int = Field(ge=0, le=120, description="年龄，必须在0-120之间")

parser = PydanticOutputParser(pydantic_object=Person)

# 获取格式说明，拼入提示词让模型遵循
format_instructions = parser.get_format_instructions()
# 链式调用：prompt | model | parser
```

#### 5. 选型建议
- **初级/展示**：直接用 `StrOutputParser` 或 `.content`。
- **中级/灵活**：模型支持时优先用 `with_structured_output(TypedDict)`。
- **高级/可靠**：涉及数据库写入、复杂逻辑分支时，使用 `Pydantic` 方案。
- **注意**：`Annotated` 仅提供说明（给模型看），真正的规则校验需依靠 Pydantic 的 `Field(ge=...)` 或 `validator`。

#### 6. 核心方法与进阶特性
- **方法选择**：
    - `parser.invoke(input)`：**推荐**。适合 LCEL 链式调用，能自动处理 `AIMessage` 到文本的转换。
    - `parser.parse(text)`：手动解析。当你已经拿到了纯文本字符串，且不在 LangChain 链中时使用。
- **LCEL 集成**：利用管道符 `chain = prompt | model | parser`。解析器不仅是转换器，更是链条的“终点站”，保证了下游获取的数据是干净、结构化的。
- **流式支持**：`StrOutputParser` 和 `JsonOutputParser` 支持**流式输出**。尤其是 `JsonOutputParser` 能够实时解析不完整的 JSON 片段（Partial JSON），这对于提升前端用户感知的响应速度至关重要。

#### 7. 常见误区（避坑指南）
- **误区 1：能解析成 JSON = 业务逻辑正确**。JSON 格式正确不代表数据合理（如年龄输出了 500 岁）。必须配合 Pydantic 的校验规则或业务层二次验证。
- **误区 2：解析器能完全代替 Prompt 设计**。如果 Prompt 没写清字段含义，解析器依然会失败。Prompt 负责“生成质量”，解析器负责“交付规格”。
- **误区 3：过度工程化**。如果只是简单的问答展示，强行引入 Pydantic 会增加代码复杂度。应根据“数据流向”决定解析深度。
