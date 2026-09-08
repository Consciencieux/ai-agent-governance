# ADR-0010: 文档分层与入口层边界（README/CONTRIBUTING 是入口，不是事实库）

- 状态：Accepted
- 代际：cross-generation
- 日期：2026-09-08

## 背景

ADR-0009 确立了「索引不是事实源」：roadmap/里程碑是索引，计划是事实源。但同一边界在入口层文档（README/CONTRIBUTING）上从未被声明——直到 v1.0 文档重写，现场证据才集中出现：

- README 曾维护「38 个触发器」「21 项检查」「9 行 prompt 场景表」等高频变化事实；`numeric_claims` 门禁专为 README/CONTRIBUTING 的 `N checks` 数字设防（`scripts/check-doc-consistency.js` 扫这两个文件比对 DEFAULTS 计数）——这本身就是「README 被当作事实源后需要机械兜底」的实证。
- v1.0.0 重写时作出的一系列决策，其实都是同一原则的现场执行：删掉完整 prompt 表（权威归 `commands.md`）、不写触发器数字、契约摘要链接权威源（`references/init-spec.json`、`references/templates/sub-skills.md`）、保留概念闭环 ASCII 图而丢弃具体模块/目录架构图。
- 被治理项目的同类风险同样存在：README 若维护「测试数量、检查项数量、近期目标」，随版本演化必然漂移——这正是本 skill 治理的「状态漂移」在文档层面的同构复现。

## 决策

**1. 入口层文档描述稳定语义，不记录高频变化的实现事实。**

| 内容类型 | README / CONTRIBUTING | 原因 |
| --- | --- | --- |
| 项目定位、核心理念 | ✅ 应写 | 稳定，且首页必须回答 |
| 基本使用方法 | ✅ 应写 | 用户需要直接看到 |
| 文档入口 / 链接 | ✅ 应写 | 首页导航职责 |
| 核心工作流的概念 | ✅ 可以写 | 例如 INIT → … → RELEASE |
| 具体架构实现 | ⚠️ 少写 | 随版本演化容易过时 |
| 完整文件树 | ⚠️ 少写 | 容易漂移 |
| 测试数量 / 检查项数量 | ❌ 尽量不写 | 高频变化、低价值、第二事实源 |
| 近期/中期/远期目标 | ❌ 不写 | Roadmap 负责 |
| 每个脚本/模块详细职责 | ❌ 不写 | architecture / docs 负责 |
| 完整 API / CLI 参数 | ❌ 不写 | 专门文档负责 |
| 版本同步点 | ⚠️ 可写原则，不写易变清单 | release workflow 才是权威 |

**2. 稳定的契约摘要可以写，但必须链接权威源。** 数字（如 INIT 输入 15、生成工件 38）属于 v1.0.0 公开契约摘要时可写，但 README 不是这些数字的事实源——链接 `references/` 权威文件，并注明「源文件权威、可能超越本摘要」。

**3. 概念模型图可保留，实现架构图不保留。** README 表达「系统是什么」（概念闭环：Agent → Governance Rules → Repository State → Verification → Human-controlled Release），不维护「系统内部现在具体怎么实现」（模块/目录架构图随版本演化必然过时）。

**4. 强制等级：可机械判定的子集由现有门禁覆盖，其余是设计判断。** `numeric_claims`（README 的 `N checks` 数字）、`broken_links`、`check-doc-parity`（三语结构）、`prompt_sync`（触发器清单唯一在 commands.md）已覆盖机械可判定部分。什么算「稳定语义」不可机械判定，靠本 ADR 记录 + 贡献者判断，**不新增检查器**——这是 ADR-0009 工程克制原则在文档层的延续，把设计判断机械化只会制造假阳性。

## 后果

- README/CONTRIBUTING 的后续修改遵循此边界；新增数字/清单前先问：「这是稳定契约还是易变事实？」
- 稳定术语的落点是 `docs/glossary.md`（三语登记），入口层文档使用登记译法（repository-native / lifecycle-aware / fail-closed / tool-neutral / contract surface / agent-specific 等）。
- 本次为纯文档决策，不产生 CHANGELOG 条目（与 ADR-0005 等纯文档 ADR 一致）。
