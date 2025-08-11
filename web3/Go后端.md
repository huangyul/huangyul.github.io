# 15 周按天可执行学习日历（Web3：Go 链下后端 + Solidity）

**目标**：在 15 周（≈105 天），每天投入 5 小时，产出一套可用于求职的项目组合：主项目为链下 Indexer/Relayer（Go + Postgres + Redis + MQ + Observability），副项目为一份经过测试并部署到 testnet 的 Solidity 合约。最终目标是能在面试中 7–10 分钟演示项目并应对常见系统设计/合约安全问题。

**假设与时间分配（每日 5 小时）**

- 理论/阅读/面试题：60–75 分钟
    
- 实战编码（主项目或合约）：150–180 分钟（2.5–3 小时）
    
- 单元/集成测试或 CI：30 分钟
    
- 复盘/写 README / commit：15–30 分钟
    

> 每周给出一个可演示的小里程碑（Sprint），建议每两天至少做一次可运行的提交。遇到阻塞优先保证“可运行 demo + README”。

---

## 周目标总览

- **周1**：项目骨架 + Go 并发快速热身；搭建本地 dev 环境（node / geth or public RPC）。
    
- **周2**：区块/事件订阅并入库（最小可运行 pipeline）。
    
- **周3**：实现幂等、checkpoint、断点续跑与批量写入。
    
- **周4**：缓存（Redis）与基本查询 API（REST/gRPC）。
    
- **周5**：消息队列引入（NATS/Kafka/Rabbit），实现异步消费。
    
- **周6**：监控/日志/Tracing（Prometheus/Grafana/Jaeger）。
    
- **周7**：压力测试与性能优化（pprof、批量策略）。
    
- **周8**：容器化与本地 k8s 部署（kind/minikube）。
    
- **周9**：CI/CD（GitHub Actions）自动化流水线。
    
- **周10**：Solidity 基础与第一个合约（Foundry/Hardhat）。
    
- **周11**：合约测试覆盖、静态检测与 testnet 部署。
    
- **周12**：后端与合约集成（事件联动、业务流程）。
    
- **周13**：项目 polish（README、演示视频、架构图、压测数据）。
    
- **周14**：安全审计 checklist、补充测试与 bugfix。
    
- **周15**：面试冲刺（系统设计 + 算法 + 模拟面试）与投递。
    

---

## 每日任务（按周划分）

### 第 1 周 — 项目初始化与 Go 热身

**Day1**：阅读项目目标与计划，建立 repo；初始化 go module；写 README 初版；配置 dev nodes / RPC。  
**Day2**：复习 Go 并发（goroutine / channel / worker pool）；实现一个并发抓取小工具（示例）。  
**Day3**：实现基本项目结构（cmd/, internal/, pkg/）；添加基础 logging（zap）与配置加载。  
**Day4**：写第一个单元测试与 bench；配置 go vet / golangci-lint 基线。  
**Day5**：实现以太坊 RPC 连接模块（HTTP + WS 支持）；做一个简单的 block subscribe demo。  
**Day6**：集成本地 Postgres 容器；设计并建表（blocks, txs, events）；实现基础写入。  
**Day7**：复盘本周工作，补充 README，整理遇到的问题与解决方案。

### 第 2 周 — 事件订阅到入库的最小可运行管道

**Day8**：完善 block -> tx -> event 的数据模型与 SQL schema。  
**Day9**：实现从新区块读取 txs 并解析 logs 的核心逻辑（同步模式）。  
**Day10**：支持 websocket 订阅与回调处理；保证网络断连自动重连。  
**Day11**：实现事务化写入（batch insert）并保证数据一致性。  
**Day12**：为关键路径加 metrics（counter / histogram），本地导出到 Prometheus。  
**Day13**：编写集成测试：用 fixture 模拟几个区块并断言 db 写入。  
**Day14**：周复盘：确认最小可运行 demo（从 RPC 拉事件写进 DB），更新 README。

### 第 3 周 — 幂等、checkpoint 与断点续跑

**Day15**：设计 checkpoint 机制（按 block number 或 tx index）；实现存储/读取接口。  
**Day16**：实现幂等插入（唯一索引 + upsert 策略），处理重复消息。  
**Day17**：实现断点续跑逻辑（worker restart 后从 checkpoint 恢复）。  
**Day18**：做模拟重启测试（kill - restart），验证无重复写入。  
**Day19**：优化批量写入性能（调整 batch size、事务边界）。  
**Day20**：写压力测试脚本（本地模拟大量事件），记录基线 QPS/延迟。  
**Day21**：周复盘：整理 checkpoint 实现与重启测试结果，更新 README。

### 第 4 周 — 缓存与对外 API

**Day22**：设计 Redis 缓存策略（key 设计、ttl、cache aside）。  
**Day23**：实现缓存层并集成到查询路径（API 缓存示例）。  
**Day24**：选择 HTTP 框架（chi/gin）并设计 REST API（用户查询场景）。  
**Day25**：实现基本的 GET/POST 接口，添加分页、过滤参数。  
**Day26**：实现 gRPC 接口的 proto 定义（可选：同时保留 REST）。  
**Day27**：写 API 集成测试（包含 cache hit/miss 场景）。  
**Day28**：周复盘：用 Postman / curl 演示 API，截图并更新 README。

### 第 5 周 — 消息队列与异步消费

**Day29**：选择 MQ（NATS/Kafka/Rabbit），在本地部署或用 Docker Compose。  
**Day30**：设计消息格式（事件 envelope、trace context、idempotency key）。  
**Day31**：实现生产者：当索引到目标事件时发出消息到 MQ。  
**Day32**：实现消费者：可靠消费、手动 ack、重试策略与死信队列。  
**Day33**：实现消费幂等（消费端使用 idempotency key + dedupe）。  
**Day34**：写消费者端集成测试（模拟消息丢失/重复）。  
**Day35**：周复盘：验证端到端（onchain -> indexer -> mq -> consumer -> db）。

### 第 6 周 — 可观测性（监控、日志、追踪）

**Day36**：接入 Prometheus metrics（基础 metrics：processed_blocks, errors, latency）。  
**Day37**：实现结构化日志（含 trace id / request id）；写日志切分策略。  
**Day38**：接入 Jaeger / OpenTelemetry 的 trace（上下游传递 trace context）。  
**Day39**：搭建 Grafana 仪表盘（本地或云端），绘制关键指标面板。  
**Day40**：为关键报警场景写 alert rules（高错误率、延迟异常、backlog）。  
**Day41**：做一次故障演练（人为触发异常），验证指标与告警可用。  
**Day42**：周复盘：截取仪表盘与 trace 示例，放入项目文档。

### 第 7 周 — 压测与性能优化

**Day43**：设计压测目标（目标 QPS / 延迟 SLO）。  
**Day44**：编写压测脚本（wrk/hey/ghz for gRPC 或自写 load generator）。  
**Day45**：运行压测，记录基线数据（CPU/Memory/DB latency）。  
**Day46**：用 pprof 分析 CPU / heap hotspots，定位瓶颈。  
**Day47**：实现一次或多次代码级优化（batch 参数、goroutine 池）。  
**Day48**：重复压测，比较优化前后数据并撰写简短优化报告。  
**Day49**：周复盘：把压测结果、图表和结论加入 README。

### 第 8 周 — 容器化与本地 k8s 部署

**Day50**：编写生产就绪 Dockerfile（多阶段构建、最小镜像）。  
**Day51**：为服务写 k8s manifests（Deployment / Service / ConfigMap / Secret）。  
**Day52**：在 kind / minikube 上部署（包含 Postgres、Redis、MQ）。  
**Day53**：实现简单的 readiness / liveness 探针与资源限制（CPU/memory）。  
**Day54**：测试滚动更新、重启策略，验证 checkpoint 恢复能力。  
**Day55**：把 k8s 部署步骤写进 README（如何在本地运行）。  
**Day56**：周复盘：演示在本地 k8s 上的完整服务运行并录制短视频。

### 第 9 周 — CI/CD 自动化

**Day57**：为 repo 写 GitHub Actions 或 GitLab CI 基础流水线（test/build）。  
**Day58**：加入镜像构建与推送（DockerHub / Container Registry）。  
**Day59**：加入部署步骤（可选：把镜像自动部署到 staging k8s）。  
**Day60**：加入自动化测试步骤（unit + integration）。  
**Day61**：实现一个简单的 release 标签流程（semver）。  
**Day62**：做一次完整的 PR 流程演示（feature -> pr -> ci -> merge -> deploy）。  
**Day63**：周复盘：把 CI/CD 配置文件与使用说明加入项目文档。

### 第 10 周 — Solidity 快速入门与第一个合约

**Day64**：学习 Solidity 基础（类型、函数、事件、modifier）；搭建 Foundry/Hardhat 环境。  
**Day65**：实现基础 ERC20 或 ERC721 合约（使用 OpenZeppelin 模板）。  
**Day66**：为合约写单元测试（transfer/approve/edge cases）。  
**Day67**：实现合约的简单权限控制（Ownable / AccessControl）。  
**Day68**：运行本地测试覆盖并达到基本覆盖率（目标：关键逻辑全面测试）。  
**Day69**：写合约部署脚本与本地模拟脚本（hardhat scripts / forge scripts）。  
**Day70**：周复盘：确保合约在本地测试环境能稳定运行，更新合约 README。

### 第 11 周 — 合约安全检测与 testnet 部署

**Day71**：学习常见合约漏洞（重入、整数溢出、前端依赖、签名错误）。  
**Day72**：运行静态分析工具（Slither / MythX 或 Foundry 的工具集），修复警告。  
**Day73**：写更多场景化测试（fuzz / edge cases / access control）。  
**Day74**：把合约部署到 testnet（获取少量 testnet ETH），记录 tx hash。  
**Day75**：验证 onchain 事件可被后端索引（端到端联通）。  
**Day76**：撰写合约安全说明与使用限制（README 的 Security 小节）。  
**Day77**：周复盘：收集测试覆盖数据、静态分析报告与部署证据。

### 第 12 周 — 后端与合约集成

**Day78**：在后端中加入合约 ABI 与解析逻辑（自动化 proto 或 DTO）。  
**Day79**：实现事件到业务的完整流程（onchain event -> mq -> consumer -> business logic）。  
**Day80**：实现一个用户场景（例如 NFT 链上 mint 后在 API 可查询到 metadata）。  
**Day81**：增加安全边界（签名验证、nonce 管理、权限校验）。  
**Day82**：编写集成测试：模拟合约事件并验证后端响应。  
**Day83**：做一次端到端演示并录制视频（演示 tx -> index -> query）。  
**Day84**：周复盘：补齐所有集成文档并更新 README。

### 第 13 周 — 产品化包装与演示准备

**Day85**：整理架构图（draw.io / mermaid），写项目亮点页（1 页）。  
**Day86**：准备 7–10 分钟演示脚本（分镜头：问题 -> 解决方案 -> demo -> 数据）。  
**Day87**：录制并剪辑演示视频（屏幕录制 + 语音说明，尽量精简）。  
**Day88**：准备 FAQ（面试中可能被问到的问题与标准回答）。  
**Day89**：撰写项目亮点的简历条目（量化结果）。  
**Day90**：把项目 repo 标记为 public（或做好 README 的隐私遮蔽）。  
**Day91**：周复盘：把视频、架构图、FAQ 放入求职资料包。

### 第 14 周 — 安全审计复盘与补充测试

**Day92**：根据之前静态分析和审计 checklist 补充修复项。  
**Day93**：增加更多的自动化测试（fuzz / property-based，若时间允许）。  
**Day94**：编写部署风险说明（如何回滚、紧急终止开关）。  
**Day95**：准备一个简短的安全演讲稿（面试时解释你的安全思考）。  
**Day96**：再次运行压测，确保之前优化在集成场景下仍成立。  
**Day97**：更新所有文档，确保安装/运行/测试步骤清晰。  
**Day98**：周复盘：把安全报告片段与测试结果放入项目文档。

### 第 15 周 — 面试冲刺与投递

**Day99**：准备 5 个系统设计题目答案（每题写 1 页：架构图 + 容量估算）。  
**Day100**：算法题训练（哈希、滑动窗口、树/图），做 2–3 道中等题并写解题模板。  
**Day101**：练习项目演示（定时 7–10 分钟），并录制一次彩排。  
**Day102**：模拟面试：找朋友或平台做一次系统设计 mock interview。  
**Day103**：准备求职材料：简历、LinkedIn、GitHub README 的 final polish。  
**Day104**：开始密集投递（目标每周 10+），并在 Discord / Twitter / GitHub 上主动联系目标项目/团队。  
**Day105**：模拟面试回顾与改进；根据收到的反馈调整投递策略。

---

## 交付物清单（面试时可展示）

- 主项目 repo（Indexer/Relayer）：README、架构图、部署脚本、压测报告、仪表盘截图。
    
- 合约 repo：合约代码、测试覆盖、静态分析报告、testnet tx hash。
    
- 演示视频 7–10 分钟 + 1 页项目亮点 summary。
    
- 5 个系统设计题答案与 30 道算法题摘要（笔记）。
    

---

## 追踪与复盘建议

1. 每周末做一次 60 分钟复盘：本周完成什么、遇到什么问题、下周改进点。
    
2. 用 issue / project board 跟踪每日任务，保证每两天至少有一次可运行提交。
    
3. 把演示脚本练到流利（时间控制、数据引用）。
    

---

如果你希望，我可以把上面的每日清单再导出成 CSV（日历）或把第 1 周到第 4 周进一步拆成小时级别日程；或者我可以现在直接生成可 clone 的 Indexer 工程骨架（Go + Postgres + Docker + README 模板）。

想要我接下来做哪件事？（A）导出为 CSV；（B）拆第1–4周成小时级日程；（C）生成工程骨架。