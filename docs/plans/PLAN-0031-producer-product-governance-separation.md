---
id: PLAN-0031
generation: gen2
---

# Producer / Product Governance Separation（TASK 计划）

> **Status: Active.**（进行中。2026-09-09：完成 Profile 术语、separation invariants（ADR-0020）、cross-profile closure 契约与 ownership inventory 初稿；inventory 正在接受架构复核返工——修复混合 owner 值、补 consumers 列、拆分复合行。完成条件尚未全部达成，见「完成条件」。）

**Target: repo-infra** —— 本计划分析 repo 与 skill 两个治理域，但实际交付仅修改 repo-infra；payload migration 在 ownership model 稳定后由后续 Plan 承担。

## 背景

ADR-0018 将 **Phase 1 — Producer / Product Separation** 定为 Generation-2 的第一项核心架构工作，并硬约束：**禁止在 Phase 1 之前设计 Dispatcher / Rule Registry / Evidence 的具体 schema**——若先设计它们，会把当前 `repo / skill / both` 的混乱编码进新架构。

FINDING-0001（producer/product 耦合）指出：ADR-0006 的「本仓库不狗粮自身治理框架」只解决了 artifact-level no-dogfooding（物理分发边界），没有解决 **control-level 隐性狗粮**——本仓库自身治理与 Skill Governance 在治理语义、checker ownership、shared rules 上仍隐式耦合，`scope = both` 无法回答谁拥有规则语义、谁负责执行、哪些实现必须同步。

## 阶段边界：Phase 1 的产物是「边界与 ownership 已知」，不是「Generation-2 Control Model 已设计」

Phase 1 只回答：

```text
谁拥有？          semantic owner 是谁
谁消费？          consumer profiles 是谁
谁实现？          implementation owner(s) 是谁
谁不能依赖谁？     dependency boundary 是什么
哪些是共享语义？   语义共享但实现独立
哪些只是两个域恰好都有？   coincidental similarity
```

Phase 1 **不回答**：

```text
control / evaluator / evidence / decision / applicability 怎么建模？   ← Phase 3
adapter 怎么设计？                                                   ← Phase 8
primitive 怎么抽象？                                                 ← Phase 4
```

## SSOT 原则：共享语义只能有一个 authoritative owner

> **Shared semantics does not imply shared implementation. 共享语义只能有一个 authoritative owner；repo 与 skill 是 consumer，不互为事实源。**

严禁把 shared semantics「同时写入 references/ 与 AGENTS/docs」——那只是把 `scope = both` 改名为「双份同步」，正是本阶段要消灭的失效模式。正确方向：

```text
Canonical shared semantic declaration
              ↓
       ┌──────┴──────┐
       ▼             ▼
 repo consumer   skill consumer
```

Phase 1 不一定要决定 canonical Core 最终物理放在哪里，但必须确立上述原则。

## 提议方案（四个交付物）

### Deliverable A — Profile boundary

定义术语与边界，不定义 schema：

```text
repo                     本仓库自身的治理
skill                    分发给被治理项目的 Skill Governance
shared semantic owner    某条共享语义的权威 owner
consumer                 消费该语义的 profile
implementation           某 profile 对该语义的具体实现
dependency               一个 profile 对另一个 profile 实现的依赖
```

到「Governance concern → semantic owner → consumer profiles → implementation owner(s) → dependency boundary」为止，不再往下设计。

### Deliverable B — Gen1 ownership inventory

基于 RESEARCH-0006 中记录的全部 Generation-1 capability entries，逐条做出 ownership 分类：

```text
repo-only
skill-only
shared-semantic / separate implementation
accidental coupling
unknown
```

分类以**架构分类记录**表达（允许写入 RESEARCH-0006 或专门的 separation inventory），不是正式 rule schema：

```yaml
semantic_owner: core          # core 此处是 conceptual shared semantic authority，
                              # 不是 Phase 3 Governance Core 的物理实现或 schema 承诺
consumers: [repo, skill]
repo_implementation: <载体>
skill_implementation: <载体>
```

Phase 3 才决定这些概念最终是否进入正式 machine-readable schema（`owner` / `consumers` / `applies_when` / `evaluator` / `effect` / `boundary`）。

核心产物是 **ownership map**：

| Concern | Semantic owner | Repo implementation | Skill implementation | Shared? | Current coupling |
| --- | --- | --- | --- | --- | --- |
| Git consent | core? | AGENTS/repo workflow | git.policy | yes | duplicated |
| secret scan | skill? | repo invokes skill checker | check-secrets | maybe | implicit dogfood |
| release approval | core? | repo-workflow | payload release workflow | yes | duplicated |
| doc parity | repo | repo-tool | — | no | repo-only |

先把 `what exists / who owns it / who consumes it / where implementation lives / where accidental dependency exists` 盘清楚，之后才能安全设计 Core。

### Deliverable C — Separation invariants

形成长期边界，进入 Accepted ADR：

```text
1. Repo critical governance MUST NOT depend on mutable working-tree skill implementation.
2. Shared semantic truth MUST have one authoritative owner.
3. A repo implementation and a skill implementation MUST NOT be treated as the same
   implementation merely because semantics are shared.
4. Product packaging MUST NOT contain repo-only governance.
```

### Deliverable D — Cross-profile closure specification

定义未来 CONTROL-X 必须满足的契约，**不在本阶段全面实现**：

```text
shared control
→ canonical negative fixture
→ repo consumer validation
→ skill consumer validation
```

本阶段只完成：定义 closure contract、识别未来需要 CONTROL-X 的 shared controls、明确 fixture reuse 要求。最多允许一个 characterization prototype 证明「同一个 fixture 可以打 repo/skill 两个现有实现」，但不作为本阶段的普遍完成条件。正式 CONTROL-X 实现留给 Rule Model / invariant-testing 阶段（ADR-0018）。

## 工程克制边界

- **不设计** Dispatcher / Rule Registry / Evidence / evaluator / applicability 的正式 schema（ADR-0018 决策 2）。
- **不实现** 正式 CONTROL-X。
- **不移动、不重分配** checker 代码——现有载体原样保留，只做分类与记录。
- **第一轮尽量不改 payload behavior**：payload declarations 迁移等 ownership model 稳定后另行决定。
- **不引入**新的 Gen-1 式门禁验证 profile 分类（分类是人工判断，与 ADR-0013 的 finding 分类同一性质）。

## 与现有 ADR/研究的关系

- FINDING-0001：本阶段**保持 `status: Confirmed`**，更新 `updated`、Resolution/Progress 说明与 `related.plans` 指向 PLAN-0031，表达「boundary defined / remediation underway」；**不改状态**——真正的 cross-profile contract 落到 Phase 3+ 后，FINDING-0001 才 Resolved。
- ADR-0006：artifact-level no-dogfooding 继续成立。
- ADR-0018：阶段顺序 + 决策 2 硬约束。
- ADR-0019：profile/ownership 分类遵守「用元数据、不用目录」。
- RESEARCH-0006：ownership 分类清单来源。

## 受影响文件

**repo-infra（本阶段主体）：**
- `docs/plans/PLAN-0031-producer-product-governance-separation.md` —— 本计划
- `docs/research/RESEARCH-0006-generation-1-capability-baseline.md` —— 回填每条能力的 ownership 分类（Deliverable B）
- `docs/findings/FINDING-0001-*.md` —— **保持 `status: Confirmed`**，更新 `updated`、Resolution/Progress 说明与 `related.plans`（→ PLAN-0031），不改变 Finding 状态
- `docs/design-decisions/ADR-0020-producer-product-governance-separation.md` —— separation model 的永久决策（Deliverable C invariants）
- `AGENTS.md` / `docs/` —— 纠正 repo/product ownership 描述（如适用）
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` —— Phase 1 进展同步（如适用）
- `CHANGELOG.md` —— 仅当本阶段实际产生产品行为、公开契约或用户可见治理行为变化时更新

**payload（本阶段不迁移；留待 ownership model 稳定后的后续迁移项）：**
- `references/`、`SKILL.md` 中与 ownership 相关的声明 —— 仅记录为 future migration，不在本计划交付。

## 验证方法

1. **Deliverable B**：RESEARCH-0006 中记录的全部 Generation-1 capability entries 有明确 ownership 分类，无空白（`unknown` 必须显式标注）。
2. **Deliverable A/D**：术语与 closure contract 已写入本计划/ADR；不要求有可运行的 CONTROL-X。
3. **Deliverable C**：separation invariants 形成 Accepted ADR。
4. `scope = both` 不再作为架构 ownership 结论出现在新的分类记录中；存量 Gen1 文本仅作为 compatibility residue 记录。
5. Architecture checkpoint 验证（ADR-0014）；不要求旧 Gen-1 gate 全绿，Refactor Safety Kernel 保持通过。

## 完成条件

- 所有 RESEARCH-0006 中的 Generation-1 能力都有明确 ownership classification：`repo` / `skill` / `shared-semantic` / `unknown`。
- 所有 shared-semantic 项都明确 authoritative semantic owner 和 consumer profiles。
- 已识别所有关键 cross-profile governance dependencies（至少覆盖 `repo → skill` 与 `skill → repo`），并分别标记：`intentional` / `accidental` / `must-remove` / `requires-investigation`；其中 **repo → mutable working-tree skill** 作为重点风险单独突出。
- 不再使用 `scope = both` 作为架构 ownership 结论；尚未迁移的 Gen1 文本只能作为 compatibility residue 明确记录。
- cross-profile closure contract 已定义；正式 CONTROL-X implementation 留给 Rule Model / invariant-testing 阶段。
- Producer/Product separation invariants 已形成 Accepted ADR 或等价永久架构决策。
- 未设计 Dispatcher / Evidence / evaluator / applicability 的正式 schema。

## 未决风险

- **分类是人工判断**：哪些归 core / repo / skill 需逐条裁定，可能反复；用 RESEARCH-0006 清单 + 复核会审缓解。
- **契约先行 vs 实现滞后的窗口**：定义 ownership 但不动 checker，产生「分类已定、载体未动」过渡态；由 ADR-0014 checkpoint 语义承接。
- **FINDING-0001 不能在本 Phase 关闭**：明确预期其 Resolved 在 Phase 3+；不要为让本 Phase 显得闭环而提前宣布架构 Finding 已解决。

## 参考

- FINDING-0001（producer/product 耦合，`docs/findings/FINDING-0001-producer-product-governance-coupling.md`）
- ADR-0006（artifact-level no-dogfooding）
- ADR-0018（Phase 顺序 + 决策 2 硬约束；CONTROL-X 时间点）
- ADR-0019（元数据而非目录原则）
- RESEARCH-0006（Generation-1 能力基线，ownership 分类清单来源）
