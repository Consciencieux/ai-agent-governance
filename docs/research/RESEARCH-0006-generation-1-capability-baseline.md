---
id: RESEARCH-0006
status: Active
version: 2
subject_generation: gen1
---

# RESEARCH-0006：第一代能力基线（Generation-1）

本 RESEARCH 从 `docs/plans/archive/PLAN-0001..0030`（30 份归档计划）、当前代码与测试中提炼 Generation-1 的**能力保存矩阵**，为 Generation-2 重构提供 baseline evidence。它回答「1.0 曾经保护什么、现在由什么承载、2.0 怎么处置」，不复制任何归档计划的全文。

## 为什么需要

最危险的 2.0 迁移风险不是「删掉 archived Plan」，而是：

```text
重构代码
↓
旧机制消失
↓
没人意识到这个机制原来保护什么
↓
2.0 少了一个能力
```

测试数量（如 `332/332`）不能替代设计意图证据——测试只证明已覆盖的断言，不一定覆盖所有设计意图；而归档 Plan 很可能记录了「为什么加入这个机制、当时解决什么问题、涉及什么文件、哪些边界条件、哪些同步点、哪些功能最终交付」。

## 第一代机械基底（Generation-1 Mechanical Substrate）

在 Generation-2 迁移期间，Generation-1 的 JS 与其 materialization 相关工件应被理解为 **Frozen Gen1 Mechanical Substrate**。这是对现状的描述，不是新的执行规范：

```text
第一代 JS / 物化机制（Gen1 JS / materialization machinery）
├─ 现有产品行为的实现
├─ 第一代能力基线（Generation-1 capability baseline）的证据
├─ 可供 characterization 的行为样本
└─ 不是第二代架构（Generation-2 architecture）的设计面
```

### 基底分类（Substrate）

| 类别 | 描述 | 当前代表 |
| --- | --- | --- |
| 已安装控制（Installed controls） | 安装进被治理项目、直接提供 Gen1 mechanical behavior 的控制 | `verify-governance.js`、`check-lock.js`、`check-git-policy.js`、`check-secrets.js`、`check-sync.js`、`check-doc-freshness.js`、`check-doc-consistency.js`、`check-plan-sync.js`、`release-manager.js` |
| 物化机制（Materialization machinery） | 把 Skill 规范与模板物化为被治理项目工件的机制 | `scripts/generate-governance.js`、`references/init-spec.json`、`references/templates/` |
| 仓库迁移基础设施（Repo migration infrastructure） | 保护本仓库与迁移过程的仓库侧工具，不等同于已安装控制（Installed controls） | `repo-tools/*`、Migration Safety Kernel |
| 未来的第二代实现（Future Gen2 implementation） | 尚不存在可当作正式产品实现的 Gen2 mechanical layer；后续实现只能由 Phase 3 的语义/控制模型与 Phase 4 的重构产生 | Rule / Applicability / Evidence / Dispatcher 的未来实现 |

因此，旧 JS 被保留并不表示其设计将原样进入 Gen2；同样，旧实现存在缺陷也不自动意味着现在应重写。每项能力必须先在本基线中保留其 provenance，再在后续阶段获得明确的 `keep / wrap / extract / rewrite / retire` disposition。

## 溯源链

```text
归档计划（Archived Plan；PLAN-0001..0030）
      ↓
第一代能力基线（Generation-1 Capability Baseline；本 RESEARCH）
      ↓
2.0 处置（disposition）
      ↓
新实现 / 有意移除（new implementation / intentional removal）
      ↓
回归证据（regression evidence）
```

**计划已归档（Plan archived）≠ 功能已弃用（Feature deprecated）≠ 控制已废弃（Control obsolete）。** 归档只表示任务完成，不表示能力仍然存在。每条 Generation-1 能力在 2.0 必须得到明确处置。

## Generation-1 开发演化特征

### Git 历史观察

截至 `v1.0.0`（commit `62876cd`），主线约 94 个提交，按「是否触碰该路径」统计：

| 区域 | v1.0 前触碰提交数 | 占约 94 commits |
| --- | ---: | ---: |
| `references/` | 55 | 59% |
| `scripts/` | 53 | 56% |
| `SKILL.md` | 50 | 53% |
| `tests/` | 49 | 52% |
| `references/policies/` | 33 | 35% |

这些集合**高度重叠**——一个 commit 常同时修改 SKILL.md、references/policies、references/templates、scripts/check-*.js、tests、plan、CHANGELOG——因此不能相加解释为「56% JS + 59% Markdown」的工作量比例。

指令面**单文件**触碰次数（`release.md` 26、`agents-md.template.md` 24、`lifecycle.policy.md` 19、`sub-skills.md` 18；`testing.policy.md` / `security.policy.md` 几乎不增长）见 RESEARCH-0009 § Git 演进证据。目录级共变说明「Markdown 与 JS 被一起改」；文件级分布进一步说明增长的是少数核心行为容器，不是新治理原则。

历史中反复出现的典型开发链：

```text
治理问题
→ 先写 Plan
→ 修改 SKILL / policy / template / AGENTS（自然语言治理语义）
→ 同步多个 Agent-facing surface
→ 发现仅靠提示词不可靠
→ 给 check-doc-consistency.js 增加 cluster / gate（JS enforcement）
→ tests 增加正反例（regression）
→ audit 又发现 checker false positive / false negative / vacuous pass
→ 继续修改 JS + tests
```

例如 2026-08-28 先有纯 `governance rule sync & meta-governance plan`，规划给 `check-doc-consistency.js` 增加 `--gate` 与 consent / protected-files cluster；下一 commit 即实现 `--gate` 并新增 8 个 tests；再下一 commit 同时改 AGENTS 原则索引、Plan Target、ADR、checker 与 regression test。Consent policy rewrite 同样：Plan → 重写 5 个 Markdown sync points → 改 consent-cluster checker → 加 tests → release。后期 `repair inert gates and align single sources of truth` 是一次典型大规模机械层修复（protected-files parser 解析不到内容、payload gate 丢失、plan-delivery 范围不足、secret scanner 对未读内容报 clean），测试从 193 增到 223。

### 分析

Generation-1 不是纯提示词系统，也不是纯 checker 系统。其实际演化单位通常是一个**人工同步簇**：

```text
Plan + normative Markdown + Agent-facing instruction + JS enforcement + gate routing + regression tests
```

三层作用：

```text
Plan      = 我们打算怎么改
Markdown  = 治理规则是什么意思
JS        = 哪部分规则要机械 enforce
Tests     = JS enforcement 有没有坏
```

随着 1.0 发展，维护成本越来越向 **JS enforcement + regression tests** 偏移（测试数量沿 49 → 63 → 78 → … → 193 → 223 → 300+ 增长）。这些元素之间**缺少显式 machine-readable control identity**，semantics → applicability → evaluator → evidence 无结构化关系，因此多点同步、drift、checker accretion、regression burden 依赖开发者与 Agent 人工维护——这正是「冻结 Gen1 JS、重建 Rule / Applicability / Evaluator / Evidence 显式关系」（ADR-0018 Phase 3/5）的历史依据，而非纯架构审美。系统性缺陷提炼见 FINDING-0025。

## 处置语义（Disposition Vocabulary）

| 处置 | 含义 |
| --- | --- |
| `Preserve` | 机制与载体均保留，原样进入 2.0 |
| `Preserve behavior, replace mechanism` | 行为保留，但载体/实现机制在 2.0 替换 |
| `Redesign` | 行为目标保留，但在 2.0 重新设计 |
| `Intentionally remove` | 明确移除，不留替代 |
| `Superseded` | 已被更新的机制取代 |
| `Unknown / requires investigation` | 处置未定，需要调查 |

## 能力保存矩阵

### A. INIT 与生成器

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| INIT 确定性生成器 | PLAN-0012 | `scripts/generate-governance.js` | Preserve |
| 治理文件与状态管理 | PLAN-0012 | `references/init-spec.json` + 生成器 | Preserve |
| 载荷治理教训（声明-机制差距、证据等级、测试活性、枚举复查、CI 完整性） | PLAN-0028 | INSTALLED `docs/rules/lifecycle.md` 等 | Preserve（喂入 2.0 evidence model） |

### B. 运行时检查器（Mechanisms）

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 密钥扫描（Secret scanning） | PLAN-0001 | `scripts/check-secrets.js` | Preserve |
| Git 工作流治理（Git workflow governance） | PLAN-0002 | `.governance/git-policy.json` + `scripts/check-git-policy.js` | Preserve |
| Agent 活动审计（Agent activity audit） | PLAN-0003 | `.governance/activity.jsonl` + drift-check（validator） | Unknown / requires investigation |
| 治理评分 / 徽章（Governance score / badge） | PLAN-0004 | validator `--json` score + shields badge | Unknown / requires investigation |
| 文档新鲜度（Doc freshness） | PLAN-0005 | `scripts/check-doc-freshness.js` | Preserve behavior, replace mechanism |
| 内容一致性（Content consistency） | PLAN-0006 | `scripts/check-doc-consistency.js`（monolith，见 FINDING-0019） | Preserve behavior, replace mechanism |
| 多 Agent 锁 | — | `scripts/check-lock.js`（非独立计划引入） | Preserve behavior, replace mechanism |
| 计划归档门禁 | PLAN-0017 | plan-status / pending-archive 集群 | Unknown / requires investigation（plan model 随 2.0 演进） |
| 交付锚点 | PLAN-0026 | `repo-tools/check-plan-delivery.js` | Unknown / requires investigation |
| 领域级测试入口 | PLAN-0030 | `tests/run-tests.js --suite` | Preserve（配合 invariant-centric testing） |

### C. 同步与一致性

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 被治理项目同步组（声明层） | PLAN-0008 | `.governance/sync-rules.json` | Unknown / requires investigation |
| 同步组机械校验 | PLAN-0010 | `scripts/check-sync.js` | Unknown / requires investigation |
| 治理规则同步与元治理 | PLAN-0011 | `references/` ↔ 规则文件同步 | Preserve behavior, replace mechanism（→ 2.0 Profile 同步） |

### D. 审查与人类在环

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 审查管理器（Review manager） | PLAN-0007 | `references/templates/sub-skills.md` 第 8 节 | Redesign（→ Implementation / System / Research 三类） |
| 分级审查门禁 | PLAN-0009 | `references/workflows/release.md` 风险分级 | Redesign |
| 审查后积压修复 | PLAN-0015 | broken-links 集群 + consistency | Preserve |
| 提交确认政策（Consent；提交前一次确认） | PLAN-0013 | release-manager consent + git.policy | Preserve |
| 确认凭证与变更卫生 | PLAN-0027 | `stagedDigest` + `.governance/change-hygiene.json` | Preserve |

### E. 生命周期与过程模型

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 规则捕获（Rule Capture） | PLAN-0016 | `references/policies/lifecycle.policy.md` § Rule Capture | Redesign（→ Rule Registry） |
| 反补丁式开发 / 根因修复协议 | PLAN-0018 | lifecycle.policy § 根因修复 + 失败预算 | Preserve |
| 工程克制（机制测试） | PLAN-0019 | coding.policy § 工程克制 | Preserve |
| 治理缺陷闭包 | PLAN-0029 | lifecycle.policy § 根因修复协议与失败预算（同类实例闭包）+ sibling 搜索 | Preserve |
| 变更归位与残留清理 | PLAN-0014 | change-hygiene + 残留标记检查 | Preserve |

### F. 文档与知识治理

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 术语门禁 + 翻译新鲜度 | PLAN-0020 | `repo-tools/check-terminology.js`（术语门禁，已拆出为 repo-owned）+ freshness（翻译新鲜度，仍在 INSTALLED 检查器） | Unknown / requires investigation（翻译新鲜度待查；术语门禁已 repo-owned） |
| 验证门禁分层与证据边界 | PLAN-0021 | evidence tiers（mechanical / human-attested / unverified） | Preserve（喂入 2.0 evidence model） |
| 内容受众与可移植性 | PLAN-0022 | 四受众 portability 规则 | Preserve（喂入 2.0 core/profile 边界） |
| 门禁修复与单一事实源对齐 | PLAN-0023 | SSOT 纪律 + 门禁修复协议 | Preserve |

### G. 分发与边界

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 仓库边界拆分（载荷 vs 仓库工具） | PLAN-0024 | 三种分发角色（INSTALLED / SKILL-INTERNAL / REPO-ONLY） | Preserve（喂入 Phase 1 producer/product separation） |

### H. Skill 生命周期

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| Skill 生命周期管理（Skill lifecycle management） | PLAN-0025 | 子技能生命周期 | Redesign |

## 所有权分类（Ownership；PLAN-0031 Deliverable B）

对 Generation-1 治理做 Producer/Product ownership 分类。**每一行 = 一个 governance concern，每个 concern 只能有一个 semantic owner**；carrier 归属、implementation location、历史起源不混入 owner 字段（它们是单独的列）。依据：仓库实测——本仓库 `.governance/` 只有 release-proposal.json 与 review-evidence（后者是审查证据产物，不是审查机制实现）；package.json 直接运行 `scripts/check-doc-consistency.js` 与 `scripts/check-doc-freshness.js`（INSTALLED 载体）。术语与不变量见 ADR-0020。

四个正交轴，**每个轴只表达一件事**，互不混入：

```text
A. Ownership topology（语义适用范围——该 concern 是否跨 profile）
   repo-only / skill-only / shared-semantic / unknown

B. Semantic authority state（语义权威是否单一——SSOT 状态）
   single / duplicated / unknown

C. Implementation dependency（实现是否依赖另一 profile 的实现）
   方向：repo→skill / skill→repo / bidirectional / none / unknown

D. Target disposition（分离目标——粗粒度 outcome，不是 Rule Model schema）
   keep / separate later / remove dependency / investigate
```

**I3 的正确理解**（ADR-0020）：`Shared semantics does not imply shared implementation` 禁止的是**把 repo/skill 两个实现当作同一个实现**（因语义共享而视为同一实现）；两个 profile 各有独立实现本身**不违反 I3**。需要消灭的不是 separate implementations，而是：

```text
duplicated semantic authority —— 同一语义存在两份权威（AGENTS.md 与 git.policy 各写一套）
repo implementation 直接依赖 mutable working-tree skill implementation
```

因此 **Semantic authority state** 与 **Implementation dependency** 是两个不同的问题：consent 这类行是 `authority: duplicated`（两侧实现互不调用也仍然有问题）；Repo 文档一致性是 `impl dependency: repo→skill`（repo 直接跑 skill checker，即使语义单一）。

**关于 `core`**：Semantic owner 判定为 `core` 的 concern（consent、分级发布审查、Rule Capture、确认凭证与变更卫生、evidence tiers、portability、SSOT）当前状态是 **owner identified: core，但 physical canonical source 尚未建立**——它们现在仍以两份语义存在（repo 实现 + skill 实现）。`core` 只是 conceptual shared semantic authority（ADR-0020 § 决策 5），物理 canonical source 由 Phase 3 Governance Core 建立。因此「owner = core」不代表「canonical source physically established: yes」。

| 关注项 | 语义所有者 | 消费者 | 仓库实现 | 技能实现 | 拓扑 | 语义权威状态 | 实现依赖 | 目标处置 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INIT 确定性生成器 | skill | skill executor | — | `generate-governance.js`（SKILL-INTERNAL） | skill-only | single | none | keep |
| 治理文件与状态管理 | skill | skill executor | — | `references/init-spec.json`（SKILL-INTERNAL） | skill-only | single | none | keep |
| 载荷治理教训（INSTALLED rules） | skill | governed projects | — | `docs/rules/*`（INSTALLED） | skill-only | single | none | keep |
| 密钥扫描（Secret scanning） | skill | governed projects；repo（手动预提交） | AGENTS.md:153 手动调用 `scripts/check-secrets.js` | `scripts/check-secrets.js`（INSTALLED） | shared-semantic | single | repo→skill · accidental | separate later |
| Git 分支与直推保护 | skill | governed projects | —（本仓库无 git-policy.json，AGENTS.md 的 Git 协议是 consent 非分支政策） | `.governance/git-policy.json` + `scripts/check-git-policy.js` | skill-only | single | none | keep |
| Agent 活动审计（Agent activity audit） | skill | governed projects | — | `.governance/activity.jsonl` + validator drift-check | skill-only | single | none | keep |
| 治理评分 / 徽章（Governance score / badge） | skill | governed projects | — | validator `--json` score | skill-only | single | none | keep |
| Repo 文档新鲜度 | repo | repo | 直接运行 `scripts/check-doc-freshness.js`（INSTALLED） | — | repo-only | single | repo→skill · accidental | separate later |
| 被治理项目文档新鲜度 | skill | governed projects | — | `scripts/check-doc-freshness.js` | skill-only | single | none | keep |
| Repo 文档一致性 | repo | repo | 直接运行 `scripts/check-doc-consistency.js`（INSTALLED） | — | repo-only | single | repo→skill · accidental（monolith 见 FINDING-0019） | separate later |
| 被治理项目内容一致性 | skill | governed projects | — | `scripts/check-doc-consistency.js` | skill-only | single | none | keep |
| 多 Agent 锁 | skill | governed projects | —（本仓库是否使用待查） | `scripts/check-lock.js`（INSTALLED） | unknown | unknown | unknown | investigate |
| 计划归档门禁（本仓库） | repo | repo | `check-doc-consistency.js` plan-status 集群（共享载体） | — | repo-only | single | repo→skill · accidental | separate later |
| 交付锚点 | repo | repo | `repo-tools/check-plan-delivery.js`（REPO-ONLY） | — | repo-only | single | none | keep |
| 领域级测试入口 | repo | repo | `tests/run-tests.js --suite` | — | repo-only | single | none | keep |
| 被治理项目同步组（声明层） | skill | governed projects | — | `.governance/sync-rules.json` | skill-only | single | none | keep |
| 同步组机械校验 | skill | governed projects | — | `scripts/check-sync.js`（INSTALLED） | skill-only | single | none | keep |
| 治理规则同步与元治理 | skill | governed projects | — | lifecycle.policy § Rule Capture + 规则同步 | skill-only | single | none | keep |
| 审查机制（Review mechanism；review-manager） | skill | governed projects | —（`.governance/review-evidence-*.md` 是**证据产物**，非机制实现） | sub-skills 模板 review-manager | skill-only | single | none | keep |
| 分级发布审查（release risk tiering） | core | repo；governed projects | `repo-workflows/skill-release.md` | `references/workflows/release.md`（SKILL-INTERNAL） | shared-semantic | duplicated | none | remove dependency（消除双重权威，实现保持分离） |
| 审查后积压修复 | repo | repo | `check-doc-consistency.js` broken-links 集群（共享载体） | — | repo-only | single | repo→skill · accidental | separate later |
| Git 写操作确认（consent） | core | repo；governed projects | AGENTS.md § Git Operation Safety Protocol | git.policy.md § 确认范围 + release-manager | shared-semantic | duplicated | none | remove dependency（消除双重权威；最危险项） |
| 确认凭证与变更卫生 | core | repo；governed projects | AGENTS.md 影响面对照 | `stagedDigest` + `.governance/change-hygiene.json` | shared-semantic | duplicated | none | remove dependency |
| 规则捕获（Rule Capture） | core | repo；governed projects | AGENTS.md Rule Capture 条文 | lifecycle.policy § Rule Capture | shared-semantic | duplicated | none | remove dependency |
| 根因修复协议与失败预算 | skill | governed projects；repo | AGENTS.md 原则索引指针 → lifecycle.policy § 根因修复 | lifecycle.policy § 根因修复（INSTALLED） | shared-semantic | single | repo→skill · intentional（repo 消费 skill-owned canonical carrier） | keep |
| 工程克制（机制测试） | skill | governed projects；repo | AGENTS.md 指针 → coding.policy § 工程克制 | coding.policy § 工程克制（INSTALLED） | shared-semantic | single | repo→skill · intentional | keep |
| 治理缺陷闭包 | skill | governed projects；repo | AGENTS.md 指针 → lifecycle.policy § 根因修复协议与失败预算（同类实例闭包） | lifecycle.policy § 根因修复协议与失败预算（同类实例闭包）（INSTALLED） | shared-semantic | single | repo→skill · intentional | keep |
| 变更归位与残留清理 | skill | governed projects；repo | AGENTS.md 变更归位 + hygiene 对照 | lifecycle.policy § 变更归位（INSTALLED） | shared-semantic | single | repo→skill · intentional | keep |
| 术语门禁 | repo | repo | `repo-tools/check-terminology.js`（REPO-ONLY，已从 INSTALLED 检查器拆出） | —（已移除；无 glossary 的被治理项目本就不适用） | repo-only | single | none | keep |
| 翻译新鲜度 | repo | repo | `check-doc-freshness.js` 翻译对推导（共享载体） | — | repo-only | single | repo→skill · accidental | separate later |
| 验证门禁分层（evidence tiers） | core | repo；governed projects | AGENTS.md 证据等级表 | testing.policy 证据等级（INSTALLED） | shared-semantic | duplicated | none | remove dependency |
| 内容受众与可移植性 | core | repo；governed projects | AGENTS.md Content portability | 归档规则四受众（INSTALLED） | shared-semantic | duplicated | none | remove dependency |
| SSOT 对齐（门禁修复） | core | repo；governed projects | AGENTS.md SSOT 纪律 | 规则文件 + 门禁修复协议（INSTALLED） | shared-semantic | duplicated | none | remove dependency |
| 仓库边界拆分（三角色） | repo | repo；skill executor | `docs/product/en/architecture.md` + `check-role-completeness.js`（REPO-ONLY） | `init-spec.json` distribution invariants | shared-semantic | single（repo 定义权威，skill executor 消费声明） | skill→repo · intentional | keep |
| Skill 生命周期管理（Skill lifecycle management） | skill | governed projects | — | 子技能生命周期 | skill-only | single | none | keep |

**需要 CONTROL-X 的 shared controls**（准入判据，不是「owner 是否 core」）：

```text
shared semantic
+ repo 有独立 evaluator/implementation
+ skill 有独立 evaluator/implementation
+ 同一 negative oracle 对两侧都成立
```

符合判据的 7 项（正式实现留给 Rule Model 阶段，见 ADR-0020 § 决策 4）：

```text
1. Git 写操作确认（consent）
2. 分级发布审查（release risk tiering）
3. 确认凭证与变更卫生
4. Rule Capture
5. 验证门禁分层（evidence tiers）
6. 内容受众与可移植性
7. SSOT 对齐
```

每条 future CONTROL-X 的 canonical negative fixture 必须同时打 repo 与 skill 两个实现，两侧都必须 fail。

**排除说明**：仓库边界拆分（三角色）拓扑为 `shared-semantic`，但**不建 CONTROL-X**——skill 侧是 `init-spec.json` 的 distribution invariants（声明，不是独立 evaluator），role-completeness gate 是 REPO-ONLY；它不是「双独立 evaluator 的可执行 control」，故按上述判据排除。

## 与现有测试的关系

测试数量（`332/332`）不是治理成熟度的代理指标，也不代表对上述 30 条能力的设计意图覆盖。本基线与测试互补：

- **测试**证明「当前代码当前行为正确」（mechanical, 现状）；
- **本基线**保存「这个能力为什么存在、保护什么」（provenance, 意图）。

2.0 迁移时以本基线为清单逐条核对：每移除/替换一个 Generation-1 载体前，先确认对应能力已被新的 carrier 承载或明确移除。

## 维护规则

- 本 RESEARCH 是活文档：2.0 每完成一个 Phase，将相应行的处置从 `Redesign / Replace` 更新为实际结果，并保留处置历史（supersede 版本演进，不删除）。
- 新增 Generation-1 能力来源（如果发现遗漏的 Plan/实现）时补充对应行。
- 处置值只使用上表 6 个枚举；不确定的显式标 `Unknown / requires investigation`，不允许空白。
