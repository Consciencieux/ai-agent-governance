---
id: FINDING-0029
status: Resolved
type: architecture-gap
observed_in: gen1
resolved_in: gen2
---

# FINDING-0029：`lifecycle` 一名三义叠层，政策单体沿错误命名轴继续生长

## 分类

- 严重度：高（架构坐标，不是单点条文）
- 影响范围：repo、skill
- 研究方向：B. 政策 / 控制平面（兼及 A. 生产者边界：自更新外置）

## 观察

1.0 里「lifecycle」至少叠了三件不同的事，却共用同一词、并长期落在同一文件叙事里：

| 义项 | 真正对象 | 权威去向（关闭时） |
| --- | --- | --- |
| **A. Skill 安装生命周期** | `INSTALL → UPDATE → ROLLBACK`（安装层 Skill Manager） | PLAN-0025 归档；完整自更新外置未来 `ai-skill-manager`；**不回归本仓** |
| **B. 产品模式** | `INIT / AUDIT / RELEASE`（本 skill 如何治理目标项目） | `SKILL.md` 模式面；与 A 无关 |
| **C. Agent 操作生命周期** | Understand → … → Report（任务执行阶段） | `references/policies/lifecycle.policy.md` → INSTALLED `docs/rules/lifecycle.md` |

起源上，义项 A 曾被误命名 / 误承载为「生命周期管理」子能力；自更新外置后，**文件与词没有跟着死掉**，反而变成义项 C 的「哪里出事就往哪个 Phase 塞」的政策单体（RESEARCH-0009）。若不固定三义边界，后续 Agent 容易再次：

- 把六阶段当产品骨架继续长肉；
- 把自更新需求重新塞回本仓 lifecycle；
- 或提议「推倒整份 lifecycle」而丢掉已沉淀的可迁移规则语义。

## 证据

- PLAN-0025（Archived）：INSTALL/UPDATE/ROLLBACK 属安装层；推荐独立 `ai-skill-manager`；本仓无可交付物。
- RESEARCH-0006 § H：完整 INSTALL/UPDATE/ROLLBACK **accepted constraint: 不回归本仓库**。
- RESEARCH-0009 §「lifecycle 是面向阶段的政策单体」：表面六阶段，打开后是规模分级、计划 schema、变更卫生、根因修复、证据、Rule Capture、CHANGELOG…「Lifecycle」只是容器名。
- ADR-0022 后续修正：lifecycle 目标职责 = 编排骨架；横切独立 capability；禁止内嵌进某 Phase 当默认归宿。
- RESEARCH-0012 § 物理拓扑：文件只是 `AuthorityRef` 当前投影；1.0 按 lifecycle Phase 堆横切 **不得**再当查找权威。
- PLAN-0040（5c Implemented）：当时抽出 discovery-ledger / change-hygiene / root-cause-repair / rule-capture；lifecycle 留指针——证明「留语义、拆容器」路径。

## 根因

同名叠义 + 缺少「命名权威辨析」知识对象 → 外置决策（A）与产品模式（B）没有在 instruction 面与 C 切开；C 又被当成**能力分类轴**而非**编排 facet**。缺陷驱动的规则沉淀是真的；错误的是**生长坐标**（按 Phase 堆横切），不是「凡 lifecycle 文件里的句子都错」。

## 若关闭，世界应变成什么样

1. **三义永久可查**：任意 Agent 读本 Finding + ADR-0022 窄修正即可区分 A/B/C，不得混谈「lifecycle 架构」。
2. **生长轴**：新常驻硬规则进 policy / Control；任务怎么做进薄能力叶；lifecycle 只保留编排骨架与指针；禁止新增大段横切正文。
3. **不回归**：A 不回到本仓；B 不并入 `lifecycle.policy.md` 当「生命周期产品」；C 不升格为 Phase 0–8 之外的并行架构程序。
4. **残留处置**不要求关闭当日全部搬走，但要求**不得再按错误坐标新增**。

## 非目标

- 不重写 ADR-0018 Phase 0–8，不新开「推翻 lifecycle」Roadmap 阶段。
- 不删除 `lifecycle.policy.md`，不一次性重写产品页全文。
- 不在本 Finding 内开文件搬家 Plan。
- 不恢复本仓 Skill 自更新实现。

## 关联

- PLAN-0025 · RESEARCH-0006 § H · RESEARCH-0009 · ADR-0022
- PLAN-0038 / 0039 / 0040（5a–5c：图 → 解析 → 投影）
- FINDING-0015（静态长 prompt / 注意力）— 同族症状，不同切面
- FINDING-0038（policies / capabilities / scripts 路由混面；后继处置常驻正文归位与施工协议撤出）

## 回归保护

- ADR-0022 含三义边界窄修正，且 AGENTS / 薄入口不复述冲突定义；
- 新增 INSTALLED 横切不得只写进 lifecycle Phase 小节而无明确权威（policy 节或能力叶 Authority）；
- 表征或审查清单抽查：不得把 INSTALL/UPDATE/ROLLBACK 写回本仓 lifecycle 交付范围。

## 关闭记录

**Resolved（2026-09-13 · PLAN-0047 H2a Stage 2）。** ADR-0022 三义窄修正已落地；`lifecycle.policy.md` 顶部生长禁令固定义项 C 为编排骨架；`.governance/state.json` 进度维升格为 `facet`（兼容窗口可双写遗留 `phase`）。义项 A 仍不回归本仓。历史 lifecycle 正文允许残留，但不得再按错误坐标新增横切。

**现在时勘误（2026-09-16）：** 关闭当日曾把 Slice B leftover「权威正文恢复到 Capability 叶」。FINDING-0038 后，常驻产品语义（变更归位 / 发现台账 / 根因修复等）归位 `references/policies/`，错位能力叶删除；Rule Capture 5a–5c 裁定为施工协议并从 INSTALLED 撤出。本 Finding 的关闭条件（三义可查 + 生长轴）仍成立；权威物理投影以 FINDING-0038 / 现行 policies 为准，不以关闭当日的叶路径为准。
