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

## 输出解析器

把模型的**文本输出**转成程序易用的**结构化数据**（如字符串、JSON、强类型对象）

**输出解析器分类**

| 解析器                    | 最终结果                   | 适用场景                  | 说明                      |
| ---------------------- | ---------------------- | --------------------- | ----------------------- |
| `StrOutputParser`      | 字符串 `str`              | 只需要展示文本，不需要拆字段        | 最简单，通常就是取出模型输出正文内容      |
| `JsonOutputParser`     | Python `dict` / `list` | 希望模型返回 JSON，再交给程序继续处理 | 适合字段抽取、接口返回、工作流参数传递     |
| `PydanticOutputParser` | Pydantic 对象            | 需要强类型和运行时校验           | 适合对字段类型、长度、范围有明确要求的业务场景 |