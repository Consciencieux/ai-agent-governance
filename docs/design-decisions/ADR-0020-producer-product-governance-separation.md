---
id: ADR-0020
status: Accepted
generation: gen2
---

# ADR-0020：生产者 / 产品治理分离


## 背景

Generation-1 的治理在物理分发层面已经分离（ADR-0006 artifact-level no-dogfooding），但在治理语义、checker ownership 和 shared rules 上仍然隐式耦合（FINDING-0001）。当前部分规则以 `repo / skill / both` 表达，无法回答谁拥有规则语义、谁负责执行、哪些实现必须同步。

ADR-0018 将 **Phase 1 — Producer / Product Separation** 定为 Generation-2 第一项核心架构工作，并硬约束：Phase 1 之前禁止设计 Dispatcher / Rule Registry / Evidence 的具体 schema。本 ADR 记录 Phase 1 的产物：**边界、不变量与 cross-profile closure 契约**——即「边界与 ownership 已知」，而不是「Generation-2 Control Model 已设计」。

## 决策

**1. Profile 术语（Deliverable A）。**

```text
repo                     本仓库自身的治理（repo-infra）
skill                    Skill Governance——分发给被治理项目的治理能力
shared semantic owner    某条共享语义的权威 owner（就是唯一事实源）
consumer                 消费该语义的 profile 或域
implementation           某 consumer 对该语义的具体实现（文件/机制）
dependency               一个 profile 对另一个 profile 实现的依赖
```

Profile 边界只定义到：

```text
Governance concern
        ↓
semantic owner
        ↓
consumer profiles
        ↓
implementation owner(s)
        ↓
dependency boundary
```

为止。evaluator / evidence / decision / applicability 的建模留给 Phase 3/4（Rule Model / Checker-Primitive）；adapter 设计不在 ADR-0018 Phase 0–8 的固定阶段内（对应 Guarantee Levels L3 Runtime Interception，属后续研究/实现，见 Roadmap Research Goals）。

**2. SSOT 原则。**

> **Shared semantics does not imply shared implementation. 共享语义只能有一个 authoritative owner；repo 与 skill 是 consumer，不互为事实源。**

禁止把共享语义「同时写入 references/ 与 AGENTS/docs」——那是把 `scope = both` 改名为双份同步。共享语义以单一 canonical 声明存在，repo 与 skill 各自消费：

```text
Canonical shared semantic declaration
              ↓
       ┌──────┴──────┐
       ▼             ▼
 repo consumer   skill consumer
```

**3. Separation invariants（Deliverable C）。**

```text
I1. Repo critical governance MUST NOT depend on mutable working-tree skill implementation.
I2. Shared semantic truth MUST have one authoritative owner.
I3. A repo implementation and a skill implementation MUST NOT be treated as the same
    implementation merely because semantics are shared.
I4. Product packaging MUST NOT contain repo-only governance.
```

**4. Cross-profile closure contract（Deliverable D）。**

未来 CONTROL-X 必须满足的契约（本阶段完成契约定义，**不实现**——正式实现留给 Rule Model / invariant-testing 阶段，ADR-0018）：

```text
shared control
→ canonical negative fixture
→ repo consumer validation（同一 fixture 打 repo 实现必须 fail）
→ skill consumer validation（同一 fixture 打 skill 实现必须 fail）
```

契约要求：

- 仅当规则在两个 profile 都有实现时，才为该规则建立 CONTROL-X（单域规则不建）。
- 同一个 canonical fixture 同时喂给 repo 与 skill 实现；两侧必须都失败（否则规则在一个域空转）。
- fixture reuse 是强制要求：禁止为 repo 与 skill 各写一套语义不同的 fixture。

**5. `owner: core` 仅是 Phase 1 分类词汇。** `core` 在此处是 **conceptual shared semantic authority**，不是 Phase 3 Governance Core 的物理实现或 schema 承诺。正式 Control / slot 规范由 ADR-0023 决定（本条原承诺「Phase 3 再定 schema」由该 ADR 履行）。括号内预告字段名（`owner` / `consumers` / `applies_when` / `evaluator` / `effect` / `boundary`）不再视为未来机器键。

## 后果

- Phase 1 产物为 ownership inventory（见 `docs/research/RESEARCH-0006` § Ownership Classification）：所有 Generation-1 capability entries 分类为 `repo-only` / `skill-only` / `shared-semantic / separate implementation` / `accidental coupling` / `unknown`。
- `repo → mutable working-tree skill` 依赖被识别为重点风险（近期：repo 直接运行 `scripts/check-doc-consistency.js`、`check-doc-freshness.js` 等 INSTALLED 检查器——implicit dogfood；远期：repo 关键治理不得依赖可变的 working-tree skill 实现）。
- 存量 `scope = both` 文本保留为 compatibility residue，明确记录不再是架构 ownership 结论。
- FINDING-0001 保持 `status: Confirmed`（remediation underway）；其 Resolved 前提是 cross-profile contract 真正落地（Phase 3+）。

## 后续修正（2026-09-10）：可复用 Skill = 设计空间边界，不是建议清单也不是文档树拷贝

本修正是对决策 1–2（producer/product 边界）的 **Narrow amendment**：规定本仓库向「可复用 Agent Governance Skill」提炼时的内容边界与时机。不授权现在改写 INSTALLED 载荷目录，也不新建平行 skill 包。

**角色区分：**

```text
本仓库（ai-agent-governance）
  = 实验场 + 参考实现（reference implementation）

未来可复用 skill
  = 经 Phase 5+ 验证后提炼的治理方法论与执行策略
  = 给 Agent 设置设计空间边界（不是「建议」）
```

禁止把本仓库整棵 `docs/`（或 research/findings/ADR 物理树）当作 skill 安装物复制进被治理项目。

### 关键限定：写死结构性约束，不写死项目实例

「不写死」**只**指项目实例（目录名、编号、本仓迁移剧本、具体 YAML 列名）。**不得**把 invariants、语义边界与禁止行为降级为理念建议——否则 Agent 会用默认经验补全缺失约束（典型失败：metadata 膨胀、文档类型混用、规则全文复制、入口变百科）。

可复用 skill 必须分三层：

```text
L1 Hard Rules（invariants）     — 不可违反；宜可机械检查
L2 Recommended Patterns         — 推荐实现模式
L3 Project Customization        — 目录名、编号、模板实例（可选）
```

**L1 必须写死（结构性约束，示例集合；提炼时定稿）：**

1. **Metadata budget** — 每种文档类型有封闭 metadata schema；禁止任意加字段、为搜索堆冗余、把正文已有信息复制进 frontmatter；新增字段须经 ADR。
2. **Document type boundary** — Research=事实/证据；Finding=问题/影响；ADR=决策/理由；Plan=执行；禁止跨类型混用。
3. **Canonical ownership** — 一个事实一个 owner；他处仅 link / summarize / reference；禁止完整规则多处复制。
4. **Entry point size** — `AGENTS.md` / `SKILL.md` 仅 identity · scope · invariants · routing；禁止长背景、历史、完整 workflow、reference encyclopedia。
5. **Routing requirement** — 新增 capability 必须声明 Task trigger → Capability → Authority → Execution → Verification。
6. **Mechanical control shape**（若采用 Control）— 须具备 identity · semantic owner · evaluator · binding · evidence；不强制本仓 `CTRL-NNNN` 编号。
7. **Discovery disposition** — 长期任务中的有价值发现须可追踪并有 disposition + closure；不强制本仓 Ledger 表列 schema。

**L2 推荐（可进 skill，非强制路径）：** Research/Finding/ADR/Plan 分离、capability-first 组织、progressive disclosure / Context Economy、抽象 migration stages。

**L3 不得写死为 skill 硬约束（项目实例）：**

1. 具体目录名（须存在 Research / Decision / Execution **类对象**，路径由项目定）
2. 本仓 CTRL 编号与种子 Control 清单
3. 本仓 Phase 0–8 / PLAN-003x 迁移剧本
4. Discovery Ledger 的具体 YAML/表列字段名

**Gen2 立场：** 允许空间 → 明确边界 → 机械检查 → Agent 在边界内发挥。可复用 skill 若只写「建议薄入口 / 适度元数据」，仍是 Gen1。

**时机：** **2.0 skill-release（Phase 8 阻断权威交接、退出 Migration Mode）之后** 再做 PLAN-0037 Stage A–D 全文提炼。过早抽取会把未验证的 applicability / topology 假设固化进载荷；把全文 0037 当作 2.0 必达项会与「2.0 = 本仓 Gen2 INSTALLED 载荷」重叠且过大。执行计划 = **PLAN-0037**（Design **冻结**；禁止 Archived；非 2.0 blocker）。过滤层（L1 结构性约束 vs 项目实例）在冻结期仍约束载荷撰写。当前顺序：Phase 5–8 → 2.0 发布 → PLAN-0037 解冻 Active。

**提取方法（流程权威在 PLAN-0037，此处只钉边界）：** 不得 `原项目 → Skill` 一次跳转。必须经 Facts → Rationale → Reusable Pattern 再写入 L1/L2/L3。禁止把本仓 WHAT 当 invariant（复制型），也禁止只有口号无约束（空泛型）。L1/L2/L3 是产物分层，不是提取步骤编号。

## 实施说明（2026-09-09，非决策性 note）：第一次执行层分离已落地

这是**后续 physical execution separation 迁移的第一项成果**，不属于 PLAN-0031 的原始完成范围（PLAN-0031 只完成 ownership/boundary 分类）；不改变 PLAN-0031 的历史目标。

第一条 `repo → mutable working-tree skill implementation` 依赖已从代码路径移除：

- **术语门禁**（repo-only concern，数据源 `docs/glossary.md`）从 INSTALLED 检查器 `scripts/check-doc-consistency.js` 拆出，成为 repo-owned `repo-tools/check-terminology.js`（REPO-ONLY，永不分发）。
- `package.json` 的 `check` / `check:docs` 改为运行 `node repo-tools/check-terminology.js`。
- INSTALLED 检查器职责面有意收缩（移除该 cluster）——被治理项目无 glossary，该 cluster 本就 no-op，标准生成项目的预期行为不受影响；但其 `--json` 输出契约相应变化（不再含 `issues.terminology_usage` 与 `termsRegistered`，无外部代码消费者，已核验）。
- 附带修复：旧 cluster 扫描迁移前的 `docs/{zh-CN,zh-TW}`（静默失效），repo-owned checker 扫描 `docs/product/{zh-CN,zh-TW}`（含 legacy 回退）。
- ownership inventory 中「术语门禁」行更新：`Impl dependency: none`（不再是 repo→skill）、`Target: keep`。

其余 `repo → skill` 依赖（consent、doc consistency/freshness、broken-links、plan-status 等）仍存在，属后续执行层分离任务。

## 参考

- FINDING-0001（producer/product 耦合，`docs/findings/FINDING-0001-producer-product-governance-coupling.md`）
- ADR-0006（artifact-level no-dogfooding）
- ADR-0018（Phase 顺序 + 决策 2 硬约束）
- ADR-0019（元数据而非目录原则）
- RESEARCH-0006（Generation-1 能力基线 + ownership classification）
- RESEARCH-0012（Task→Capability routing；skill L1 提炼前置）
- PLAN-0037（Governance Skill Extraction；Design 冻结至 2.0 后；禁止 Archived）
- PLAN-0031（Phase 1 交付物 A–D）
- Control Model（Phase 3）：ADR-0023
