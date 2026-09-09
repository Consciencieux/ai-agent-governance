---
id: FINDING-0025
status: Confirmed
type: architecture-gap
observed_in: gen1
---

# 治理语义与机械执行缺少显式控制身份 → 多点同步、checker accretion、regression 维护负担

## 分类

- 严重度：高
- 影响范围：repo、skill
- 研究方向：B. 政策 / 控制平面

## 观察

Generation-1 中**同一条治理规则通常分散在 Markdown、checker、routing 和 tests 中**，但缺少显式的 **Rule / Control identity** 与 `semantics → applicability → evaluator → evidence` 的结构化关系。系统不知道这些「属于同一条 Control」，因此开发者和 Agent 必须人工维护一条规则的多处投影（sync points），每新增一条规则即产生新的多点同步 + checker + regression 义务。

## 证据

- v1.0 前 Git 历史（约 94 个主线提交）中 `references/`（55）、`scripts/`（53）、`SKILL.md`（50）、`tests/`（49）高频共同修改，且这些集合高度重叠——典型提交同时改 Plan + Markdown 语义 + Agent-facing surface + JS checker + regression tests。
- 反复出现 `rule → checker → regression` 的联动演进：先写 Plan，改 policy/template/AGENTS，然后给 `check-doc-consistency.js` 加 cluster/gate，再补正反例；后续 audit 又发现 checker false positive / vacuous pass / gate 未路由，继续修 JS（见 `RESEARCH-0006` § Generation-1 开发演化特征）。
- 测试数量沿 49 → 63 → … → 193 → 223 → 300+ 增长，维护成本持续向 JS enforcement + tests 偏移。

## 根因

R1（Policy Structure）：治理语义未以「控制」为单位结构化；缺少 machine-readable control identity，`semantics`、`applicability`、`evaluator`、`evidence` 之间无显式绑定，投影关系靠人工维护。

## 影响

- **多点同步**：一条规则散落于 Markdown / checker / routing / tests，改一处漏多处 → drift。
- **checker accretion**：事故驱动地在单点 checker（check-doc-consistency.js）堆积 cluster/regex（FINDING-0019 同族）。
- **regression burden**：JS enforcement 与 tests 持续膨胀，维护成本上升。
- **Agent attention dependency**：rules 语义仍主要靠 Agent 读取与记忆（FINDING-0002 / FINDING-0015 同族）。

## 关闭条件

1. 规则以显式 Control identity 表达，`semantics / applicability / evaluator / evidence` 结构化绑定；
2. 单条规则的 Markdown / checker / routing / test 投影可机械对账（CONTROL-X / Rule Registry，ADR-0018 Phase 3/5）；
3. 新增规则不再天然产生「人工多点同步」义务。

## 解决情况

（未解决，remediation planned。）ADR-0018 Phase 3（Rule / Control Model）与 Phase 5（Dispatcher）即为此设计；`RESEARCH-0006` § Generation-1 开发演化特征保留 Git 历史证据。Gen1 JS 冻结（ADR-0014）前该模式仍主导。

## 关联

- ADR-0018
- RESEARCH-0006
- RESEARCH-0009
- FINDING-0002
- FINDING-0015
- FINDING-0019
- FINDING-0003
- FINDING-0026

## 回归保护

- 描述层：`docs/research/RESEARCH-0006-generation-1-capability-baseline.md` § Generation-1 开发演化特征（Git 历史观察 + 分析）；指令面单文件演进见 RESEARCH-0009。
