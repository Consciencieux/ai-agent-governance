---
id: FINDING-0029
status: Confirmed
type: architecture-gap
observed_in: gen1
---

# FINDING-0029：`lifecycle` 一名三义叠层，政策单体沿错误命名轴继续生长

## 分类

- 严重度：高（架构坐标，不是单点条文）
- 影响范围：repo、skill
- 研究方向：B. 政策 / 控制平面（兼及 A. 生产者边界：自更新外置）

## 观察

1.0 里「lifecycle」至少叠了三件不同的事，却共用同一词、并长期落在同一文件叙事里：

| 义项 | 真正对象 | 权威去向（现状） |
| --- | --- | --- |
| **A. Skill 安装生命周期** | `INSTALL → UPDATE → ROLLBACK`（安装层 Skill Manager） | PLAN-0025 归档；完整自更新外置未来 `ai-skill-manager`；**不回归本仓** |
| **B. 产品模式** | `INIT / AUDIT / RELEASE`（本 skill 如何治理目标项目） | `SKILL.md` 模式面；与 A 无关 |
| **C. Agent 操作生命周期** | Understand → … → Report（任务执行阶段） | `references/policies/lifecycle.policy.md` → INSTALLED `docs/rules/lifecycle.md` |

起源上，义项 A 曾被误命名 / 误承载为「生命周期管理」子能力；自更新外置后，**文件与词没有跟着死掉**，反而变成义项 C 的「哪里出事就往哪个 Phase 塞」的政策单体（RESEARCH-0009）。Gen2 已裁定 C 的目标职责是**编排骨架，不是政策仓库**（ADR-0022），Phase 5a–5c 已把 Slice B 横切投影为 Capability；残留抽出延后，不重开 Phase 5。本 Finding 记录该辨析（Confirmed，未 Resolved）；后续 Agent 容易再次：

- 把六阶段当产品骨架继续长肉；
- 把自更新需求重新塞回本仓 lifecycle；
- 或提议「推倒整份 lifecycle」而丢掉已沉淀的可迁移规则语义。

## 证据

- PLAN-0025（Archived）：INSTALL/UPDATE/ROLLBACK 属安装层；推荐独立 `ai-skill-manager`；本仓无可交付物。
- RESEARCH-0006 § H：完整 INSTALL/UPDATE/ROLLBACK **accepted constraint: 不回归本仓库**。
- RESEARCH-0009 §「lifecycle 是面向阶段的政策单体」：表面六阶段，打开后是规模分级、计划 schema、变更卫生、根因修复、证据、Rule Capture、CHANGELOG…「Lifecycle」只是容器名。
- ADR-0022 后续修正：lifecycle 目标职责 = 编排骨架；横切独立 capability；禁止内嵌进某 Phase 当默认归宿。
- `docs/research/working/routing/call-topology.md`：文件只是 `AuthorityRef` 当前投影；1.0 按 lifecycle Phase 堆横切 **不得**再当查找权威。
- PLAN-0040（5c Implemented）：已抽出 discovery-ledger / change-hygiene / root-cause-repair / rule-capture；lifecycle 留指针——证明「留语义、拆容器」路径，而非整文件作废。

## 根因

同名叠义 + 缺少「命名权威辨析」知识对象 → 外置决策（A）与产品模式（B）没有在 instruction 面与 C 切开；C 又被当成**能力分类轴**而非**编排 facet**。缺陷驱动的规则沉淀是真的；错误的是**生长坐标**（按 Phase 堆横切），不是「凡 lifecycle 文件里的句子都错」。

## 若关闭，世界应变成什么样

1. **三义永久可查**：任意 Agent 读本 Finding + ADR-0022 窄修正即可区分 A/B/C，不得混谈「lifecycle 架构」。
2. **生长轴**：新规则默认进 Capability / Control / 适用图；lifecycle 只保留编排骨架与指针；禁止新增大段横切正文。
3. **不回归**：A 不回到本仓；B 不并入 `lifecycle.policy.md` 当「生命周期产品」；C 不升格为 Phase 0–8 之外的并行架构程序。
4. **残留处置**有计划车辆时再拆（规模分级、计划格式、证据、Synchronize/Report、`state.json` 六阶段状态机等）——关闭本 Finding **不**要求这些已全部搬走，但要求**不得再按错误坐标新增**。

## 非目标

- 不重写 ADR-0018 Phase 0–8，不新开「推翻 lifecycle」Roadmap 阶段。
- 不删除 `lifecycle.policy.md`，不一次性重写产品页全文。
- 不在本 Finding 内开文件搬家 Plan（5c leftover / successor Plan 另立）。
- 不恢复本仓 Skill 自更新实现。

## 关联

- PLAN-0025 · RESEARCH-0006 § H · RESEARCH-0009 · ADR-0022 · call-topology § Gen1 查找 vs 本图
- PLAN-0038 / 0039 / 0040（5a–5c：图 → 解析 → 投影）
- FINDING-0015（静态长 prompt / 注意力）— 同族症状，不同切面
- 后续车辆（未开）：lifecycle 残留叶抽出 / `state.json` phase 降级为 facet；roadmap「故意延后」仅索引，不展开

## 回归保护

（未关闭）关闭条件建议：

- ADR-0022 含三义边界窄修正，且 AGENTS / 薄入口不复述冲突定义；
- 新增 INSTALLED 横切不得只写进 lifecycle Phase 小节而无 Capability `AuthorityRef`；
- 表征或审查清单抽查：不得把 INSTALL/UPDATE/ROLLBACK 写回本仓 lifecycle 交付范围。
