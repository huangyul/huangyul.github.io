# 简介

LangChain 是一个专为大语言模型（LLM）应用开发设计的开源编程框架，是围绕 **Agent、RAG、工具调用、状态管理、可观测性** 形成了一整套生态

在项目中，**LangChain** 主要负责以下几个方面：
1. **统一接模型**：同一个项目同时接入通义、DeepSeek、OpenAI、Ollama，本质上是在做多模型编排。
2. **统一处理输入输出**：用 PromptTemplate、消息对象、输出解析器来规范请求与结果。
3. **组织固定流程**：把“提问 → 检索 → 生成 → 解析”做成稳定链路。
4. **接入工具与外部系统**：比如天气查询、数据库查询、内部 API、工单系统、邮件系统。
5. **管理状态与记忆**：多轮聊天、会话上下文、用户偏好、长期记忆。
6. **做调试和评估**：把调用过程 trace 出来，定位哪一步出了问题。

# Model I/O

> **Model I/O = Format（输入格式化）→ Predict（模型调用）→ Parse（输出解析）**

- **Format（输入格式化）**：把原始业务输入整理成模型更容易理解的形式，例如 Prompt 模板、多角色消息、变量填充等。
- **Predict（模型调用）**：通过 LangChain 的统一接口调用不同模型提供商，例如 OpenAI、DeepSeek、阿里百炼、Ollama 等。
- **Parse（输出解析）**：把模型返回的自然语言结果转成更稳定、程序更好处理的形式，例如字符串、JSON、结构化对象等。

## 提示词与消息模板

### 提示词（Prompt）

- 告诉模型它是谁，要扮演什么角色。
- 告诉模型当前任务是什么，回答边界是什么。
- 告诉模型输出格式应该长什么样。
- 把用户问题、历史对话、检索结果、工具结果组合成一次完整输入。

#### LangChain 中4种入参方式

```python
# 普通文本

print(llm.invoke("你好").content)

  

print("=== 分割线 ===")

  

# 模板

template = PromptTemplate.from_template("用少于50字介绍：{topic}是什么")

print(llm.invoke(template.format(topic="苹果")).content)

  

print("=== 分割线 ===")

  

# 角色模板

messages = [

  SystemMessage(content="你是个注重简洁的问答助手，每次回复不超过30个字"),

  HumanMessage(content="介绍一下什么是：llm")

]

print(llm.invoke(messages).content)

print("=== 分割线 ===")

  

# 原生openai风格

messages = [

  {"role": "system", "content":  "你是个注重简洁的问答助手，每次回复不超过30个字"},

  {"role": "user", "content": "介绍一下什么是：llm"}

]

print(llm.invoke(messages).content)
```

目前最常见的用法：

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{input}")
])

chain = prompt | llm

result = chain.invoke({
    "input": question
})
```
### 消息模板
#### 消息类型

在 LangChain 官方语境里，最核心的几类消息是：**SystemMessage**、**HumanMessage**、**AIMessage**、**ToolMessage**。

| 类型              | 说明                       | 项目里最常见的用途          |
| --------------- | ------------------------ | ------------------ |
| `SystemMessage` | 系统消息，通常用于规定角色、风格、边界、输出格式 | 设定人设、回答规则、拒答策略     |
| `HumanMessage`  | 用户消息，对应用户当前输入            | 放用户问题、补充条件、后续追问    |
| `AIMessage`     | 模型回复消息                   | 保存上一轮回复，支持多轮上下文    |
| `ToolMessage`   | 工具执行结果消息                 | 把外部工具/函数的返回结果回传给模型 |

#### ChatPromptTemplate 和 PlaceholderMessage

| **组件**                    | **核心定位**          | **解决的问题**                                                              |
| ------------------------- | ----------------- | ---------------------------------------------------------------------- |
| **`ChatPromptTemplate`**  | **结构化 Prompt 模板** | 将带有变量的文本，转化为带明确角色（System / Human / AI）的消息列表（`Messages`），专为 Chat 模型设计。  |
| **`MessagesPlaceholder`** | **动态消息占位符**       | 在模板中预留一个“空位”，专门用来**批量塞入一个消息数组**（如 `List[Message]`），是让 LLM 获得多轮对话记忆的关键。 |
##### 1. 核心概念与关系

|**组件**|**定位与作用**|
|---|---|
|**`ChatPromptTemplate`**|**结构化 Prompt 模板**。负责把带变量的文本组装成带角色（`system` / `human` / `ai`）的消息列表。|
|**`MessagesPlaceholder`**|**历史消息占位符**。在模板里预留一个“空位”，专门用来**批量塞入多条历史消息**。|

> **💡 关键区别：**
> 
> 普通变量 `{input}` 替换的是**单个字符串**；占位符 `{chat_history}` 替换的是**多条 Message 对象组成的列表**。

##### 2. 现代标准写法（元组语法）

目前最推荐使用元组（Tuple）写法，极简且语义清晰：

```Python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个注重简洁的助手。"),
    ("placeholder", "{chat_history}"),  # 👈 替代 MessagesPlaceholder 的极简语法
    ("human", "{input}")
])
```

##### 3. 运行机制：历史是如何被塞进去的？

不管在 LangChain 里定义了多少个占位符，**在发送给底层 LLM API 时，都会被自动打平（Unpack）合并成一条单维度的消息数组**。

Plaintext

```
【模板定义】                          【传给 API 的真实数据结构】
System: "你是一个助手。"              [
Placeholder: "{chat_history}"  --->     {"role": "system", "content": "你是一个助手。"},
Human: "{input}"                        {"role": "user", "content": "我叫小明，喜欢苹果。"}, # 历史
                                        {"role": "assistant", "content": "好的，记住了！"}, # 历史
                                        {"role": "user", "content": "我喜欢吃什么？"}       # 当前输入
                                      ]
```

###### ❓ 既然 API 只收一条数组，为什么还允许自定义不同的 Key Name（多占位符）？

- **工程解耦**：方便把“**与用户的聊天历史**（存数据库）”和“**Agent 的思考/工具调用步骤**（存临时内存）”分开传递与维护。
    
- **精准裁剪**：当 Token 超长时，可以只压缩聊天历史，而保留最新的工具调用记录。
    

##### 4. 实战代码模板（LCEL 链式调用）

```Python
import os
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage

api_key = os.getenv("DEEPSEEK_API_KEY")
model = "deepseek-v4-flash"
base_url = "https://api.deepseek.com"

llm = init_chat_model(
    model=model,
    api_key=api_key,
    base_url=base_url,
)

p = ChatPromptTemplate.from_messages([
  ("system", "你是一个幽默风趣的 AI 助手"),
  ("placeholder", "{history}"),
  ("human", "{question}")
])
chain = p | llm
history = []
print("智能 AI 聊天，<输入 'exit' 退出>")
while True:
  user_input = input("\n你：")
  if user_input == "exit":
    print("再见!")
    break

  if not user_input.strip():
    continue

  resp = chain.invoke({
    "history": history,
    "question": user_input
  }).content

  print(f"AI: {resp}")

  history.append(HumanMessage(content=user_input))
  history.append(AIMessage(content=resp))
```

## 输出解析器 (Output Parser)

在 Model I/O 环节中，输出解析器负责将模型的自然语言输出转换为程序可处理的结构化数据（如字符串、JSON、Python 对象）。

#### 1. 核心价值
- **格式转换**：将 `AIMessage` 转换为 `str`、`dict` 或 `Pydantic` 对象。
- **结构约束**：通过 `get_format_instructions()` 引导模型按指定 Schema 输出。
- **结果校验**：验证输出字段的存在性、类型及取值范围。
- **工程衔接**：使模型输出能直接对接数据库、前端 API 或后续工作流。

#### 2. 常用解析器分类
| 解析器                    | 最终结果            | 适用场景                       |
| :--------------------- | :-------------- | :------------------------- |
| `StrOutputParser`      | `str`           | 仅需展示文本，如聊天回复、文章润色。         |
| `JsonOutputParser`     | `dict` / `list` | 需要抽取字段，如“问题/答案”、“事件要素”。    |
| `PydanticOutputParser` | `Pydantic` 对象   | 生产环境首选，需要强类型和运行时校验（如年龄范围）。 |

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

# LCEL与链式调用

## 1. 核心概念

- **LCEL (LangChain Expression Language)**：LangChain 的核心声明式编程规范。
    
- **统一接口 (Runnable)**：Prompt、Model、OutputParser 等核心组件均继承自 `Runnable` 接口。
    
- **基本语法**：通过管道符 `|` 将组件按数据流顺序拼接起来：
    
    Python
    
    ```
    chain = prompt | model | output_parser
    ```
    

## 2. 核心优势

同一个 `chain` 组装完成后，自动拥有多种调用模式，无需重构底层逻辑：

- **`invoke(input)`**：同步单次调用。
    
- **`stream(input)`**：原生打字机流式输出（逐字/逐块吐出）。
    
- **`ainvoke()` / `astream()`**：异步单次调用 / 异步流式输出。
    
- **`batch(inputs)`**：并发批量处理多个输入。
    

## 3. 标准入门代码模板

Python

```python
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

# 1. 环境配置
os.environ["OPENAI_API_KEY"] = "your-api-key-here"

# 2. 组件定义
prompt = ChatPromptTemplate.from_template("请用一句话告诉我：{topic} 的核心原理是什么？")
model = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
output_parser = StrOutputParser()  # 将模型输出提取为纯文本

# 3. LCEL 链式组装
chain = prompt | model | output_parser

# 4. 单次调用 (invoke)
response = chain.invoke({"topic": "光合作用"})
print("【单次结果】:", response)

# 5. 打字机流式输出 (stream)
print("【流式输出】:", end=" ")
for chunk in chain.stream({"topic": "相对论"}):
    print(chunk, end="", flush=True)
```

## 4. 常用高级原语 (Primitives)

在组装复杂工作流（如 RAG 检索或分流处理）时常用的辅助构件：

- **`RunnablePassthrough`**：原封不动透传输入数据。
    
- **`RunnableParallel` / `{}`**：并行执行多个子任务（例如：同时检索向量库与格式化输入）。
    
- **`RunnableLambda`**：将任意自定义 Python 函数封装为标准组件，无缝插入链中。