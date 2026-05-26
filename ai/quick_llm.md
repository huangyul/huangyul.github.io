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
