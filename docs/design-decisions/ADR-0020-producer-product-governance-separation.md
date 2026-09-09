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
- PLAN-0031（Phase 1 交付物 A–D）
- Control Model（Phase 3）：ADR-0023
