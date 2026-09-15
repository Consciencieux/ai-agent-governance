# 可复用治理原则（Portable Governance Principles）

> SKILL-INTERNAL。随技能包分发，供 skill 执行器按需加载。INIT **不**写入被治理项目。
> 权威边界：可复用 L1/L2/L3。本目录是方法论，不是本仓 `docs/` 树的拷贝。

## 何时加载

在**向其他项目应用 / 审查治理设计**时加载本入口，再按任务打开下方专题文件。日常业务编码、本仓 INSTALLED 巡检，不默认通读本目录。

## 三层（产物分层，不是提取步骤）

| 层 | 含义 | 违反后果 |
| --- | --- | --- |
| **L1 Hard Rules** | 不可违反；宜可机械检查 | Agent 用默认经验补洞（metadata 膨胀、入口变百科、规则多处复制） |
| **L2 Recommended Patterns** | 推荐路径，可替换 | 失去可维护性，但不自动判失败 |
| **L3 Project Customization** | 目录名、编号、模板实例 | 写进 L1 = 复制型抽象，跨项目必碎 |

## L1 总表（结构性约束）

1. **Metadata budget** — 封闭 schema；禁任意加字段 / 为搜索堆冗余 / 正文回填 frontmatter；新字段须 ADR。
2. **Document type boundary** — Research=事实；Finding=问题；ADR=决策；Plan=执行；禁跨类型混用。
3. **Canonical ownership** — 一事实一 owner；他处仅 link / summarize；禁规则全文多处复制。
4. **Entry point size** — 入口仅 identity · scope · invariants · routing；禁长背景 / 历史 / 完整 workflow / encyclopedia。
5. **Routing requirement** — 新 capability 须声明 Task trigger → Capability → Authority → Execution → Verification。
6. **Mechanical control shape**（若采用 Control）— identity · semantic owner · evaluator · binding · evidence；不强制任何项目的编号格式。
7. **Discovery disposition** — 有价值发现可追踪 + disposition + closure；不强制具体表列名。

## 专题文件（按需）

| 文件 | 覆盖 |
| --- | --- |
| `instruction-architecture.md` | 薄入口、渐进披露、Context Economy |
| `document-model.md` | 文档类型边界与对象职责 |
| `metadata-policy.md` | 元数据封闭与预算 |
| `capability-model.md` | Capability 与 Task→Capability 路由 |
| `control-shape.md` | Control 最小形状（无本仓编号承诺） |
| `enforcement-semantics.md` | allow/deny/warn/require_review 与判断型分层 |
| `decision-records.md` | ADR / 决策语义与权威 |
| `migration-method.md` | 提取与迁移：Facts→Rationale→Pattern→Skill |

## 硬禁止（跨专题）

- 把某一仓库的目录树、Phase/PLAN 剧本、控制编号当作 L1
- 一次从「项目现状」跳到「通用 Skill」而不经 Facts / Rationale / Pattern
- 在被治理项目中安装本目录全文当百科
- 启动即要求通读全部规则树 / 全量加载治理树

权威决策记录在消费方项目的 ADR；本文件不代替 ADR。
