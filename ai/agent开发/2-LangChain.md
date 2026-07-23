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

#### 消息类型

在 LangChain 官方语境里，最核心的几类消息是：**SystemMessage**、**HumanMessage**、**AIMessage**、**ToolMessage**。

| 类型              | 说明                       | 项目里最常见的用途          |
| --------------- | ------------------------ | ------------------ |
| `SystemMessage` | 系统消息，通常用于规定角色、风格、边界、输出格式 | 设定人设、回答规则、拒答策略     |
| `HumanMessage`  | 用户消息，对应用户当前输入            | 放用户问题、补充条件、后续追问    |
| `AIMessage`     | 模型回复消息                   | 保存上一轮回复，支持多轮上下文    |
| `ToolMessage`   | 工具执行结果消息                 | 把外部工具/函数的返回结果回传给模型 |