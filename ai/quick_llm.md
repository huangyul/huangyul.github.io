# LLM 基础

## Token

**什么是`token`**

- 工程定义：Token 是大模型处理语言的最小数字单位（元数据）。LLM 不读文字，只读数字。
- 物理特征：1 个 Token ≈ 0.75 个英文单词，而中文通常 1 个汉字占用 1~3 个 Token。

**为什么 Prompt 太长会变差？**

1. 注意力分散（Attention Dilution / Lost in the Middle 现象）：
LLM 的核心是 Attention（注意力）机制。当 Prompt 过长时，模型的计算资源被大量无关的 Token 分散。研究表明，模型对输入开头和输入结尾的信息敏感度最高，而长文本中间的信息极易被模型“判低权重”而忽略。
2. 计算复杂度呈二次方增长 ($O(N^2)$)：
标准 Transformer 架构中，每个 Token 都要和前面所有的 Token 计算关联度。Prompt 长度翻倍，计算量和显存占用是翻四倍。虽然有线性注意力优化，但长文本依然会导致严重的延迟（Latency）增加，影响用户体验。
3. 噪声引入（Noise Accumulation）：
过长的 Prompt 通常包含大量冗余、模糊或自相矛盾的上下文。AI 是概率模型，干扰信息越多，它生成“幻觉（Hallucination）”和错误逻辑的概率就呈指数级上升。

## Context Window

彻底理解 Context Window 的本质

- 它是一个“总和限制”：大模型的上下文窗口（比如 GPT-4o 的 128k，或者某些轻量级本地模型的 8k）指的是 Input Tokens（Prompt + 历史记录） + Output Tokens（模型即将生成的回复） 的总和。
- 为什么不是无限记忆？：因为 Transformer 架构的计算复杂度。虽然现在很多模型号称支持 1M（百万）上下文，但正如你上一节学到的，文本越长，不仅越贵，而且“Lost in the Middle”现象越严重。把 10 万字无脑塞给大模型，它的智商会直线下降。

当对话长度撑爆`Context window`时，有以下三种策略：
1. 阶段策略：
   - 滑动窗口法（Sliding Window / Window Buffer）：
    - 逻辑：规定一个固定的 Token 阈值（例如 4096）。当新对话进来导致总 Token 超标时，锁死 System Prompt 不动，将最早的 User-Assistant 对话轮次从队列中 Pop 掉（先进先出），只保留最近的 $N$ 条对话。
    - 缺点：Agent 会彻底遗忘很久以前聊过的内容。
  - 按轮次截断（Max Turns）：
    - 逻辑：不看 Token，只看轮次（比如只保留最近 5 轮对话）。
    - 缺点：可能单词聊天就撑爆，一般不使用
2. 上下文控制：这是一种预防性的工程手段，在把数据发给模型之前，先精细化分配“Token 预算（Token Budget）”。
3. Memory 基础（长短期记忆架构）:
   - 短期记忆（Short-term Memory）：
     - 载体：当前 Session 的滑动窗口（RAM）。
     - 特点：极其精准，带有语境，但容量有限，随用随抛。
   - 长期记忆（Long-term Memory）：
     - 载体：PostgreSQL (pgvector) / Redis / 关系型数据库（ROM）。
     - 实现：
       - Summary Memory（滚动摘要）：把被滑动窗口淘汰掉的老对话，用一个异步 Task 让大模型压缩成一句“历史摘要”，作为 System Prompt 的一部分永久带上。
       - Semantic Memory（语义记忆）：把老对话向量化存入 pgvector。当用户提问“我三天前说过的那个 Bug 怎么解？”时，通过向量检索捞出那一段历史，临时的插入到当前 Prompt 中。


## Hallucination（幻觉）

**为什么模型会“胡说八道”？**

从底层算法来看，大模型的本质是一个 **“基于概率的下一个 Token 预测机器”**。

- 它没有真正的“意识”或者“逻辑实体数据库”。
- 当你问它一个问题时，它只是在计算：在当前给定的上下文（Prompt）下，输出哪一个 Token 的概率组合看起来最高、最符合语言习惯？

幻觉的四大工程来源:
- 缺上下文（Lack of Context）
- Retrieval 错误（检索污染 / 垃圾进垃圾出）
- Prompt 不明确（Ambiguous Prompt）
- Tool 失败（工具链断裂 / 状态失控）
