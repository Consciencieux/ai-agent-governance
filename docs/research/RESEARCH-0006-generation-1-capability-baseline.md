---
id: RESEARCH-0006
title: Generation-1 能力基线（Capability Baseline）
status: Active
version: 1
created: 2026-09-09
updated: 2026-09-09
supersedes: []
superseded_by: []
subject_generation: gen1
---

# Generation-1 能力基线（Capability Baseline）

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

## 溯源链

```text
Archived Plan (PLAN-0001..0030)
      ↓
Generation-1 Capability Baseline (本 RESEARCH)
      ↓
2.0 disposition
      ↓
new implementation / intentional removal
      ↓
regression evidence
```

**Plan archived ≠ Feature deprecated ≠ Control obsolete。** 归档只表示任务完成，不表示能力仍然存在。每条 Generation-1 能力在 2.0 必须得到明确处置。

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
| Secret scanning | PLAN-0001 | `scripts/check-secrets.js` | Preserve |
| Git workflow governance | PLAN-0002 | `.governance/git-policy.json` + `scripts/check-git-policy.js` | Preserve |
| Agent activity audit | PLAN-0003 | `.governance/activity.jsonl` + drift-check（validator） | Re-evaluate |
| Governance score / badge | PLAN-0004 | validator `--json` score + shields badge | Re-evaluate |
| Doc freshness | PLAN-0005 | `scripts/check-doc-freshness.js` | Preserve behavior, replace mechanism |
| Content consistency | PLAN-0006 | `scripts/check-doc-consistency.js`（monolith，见 FINDING-0019） | Preserve behavior, replace mechanism |
| 多 Agent 锁 | — | `scripts/check-lock.js`（非独立计划引入） | Replace mechanism |
| 计划归档门禁 | PLAN-0017 | plan-status / pending-archive 集群 | Re-evaluate（plan model 随 2.0 演进） |
| 交付锚点 | PLAN-0026 | `repo-tools/check-plan-delivery.js` | Re-evaluate |
| 领域级测试入口 | PLAN-0030 | `tests/run-tests.js --suite` | Preserve（配合 invariant-centric testing） |

### C. 同步与一致性

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 被治理项目同步组（声明层） | PLAN-0008 | `.governance/sync-rules.json` | Re-evaluate |
| 同步组机械校验 | PLAN-0010 | `scripts/check-sync.js` | Re-evaluate |
| 治理规则同步与元治理 | PLAN-0011 | `references/` ↔ 规则文件同步 | Preserve behavior, replace mechanism（→ 2.0 Profile 同步） |

### D. 审查与人类在环

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| Review manager | PLAN-0007 | `references/templates/sub-skills.md` 第 8 节 | Redesign（→ Implementation / System / Research 三类） |
| 分级审查门禁 | PLAN-0009 | `references/workflows/release.md` 风险分级 | Redesign |
| 审查后积压修复 | PLAN-0015 | broken-links 集群 + consistency | Preserve |
| Consent 政策（提交前一次确认） | PLAN-0013 | release-manager consent + git.policy | Preserve |
| 确认凭证与变更卫生 | PLAN-0027 | `stagedDigest` + `.governance/change-hygiene.json` | Preserve |

### E. 生命周期与过程模型

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| Rule Capture | PLAN-0016 | `references/policies/lifecycle.policy.md` § Rule Capture | Redesign（→ Rule Registry） |
| 反补丁式开发 / 根因修复协议 | PLAN-0018 | lifecycle.policy § 根因修复 + 失败预算 | Preserve |
| 工程克制（机制测试） | PLAN-0019 | coding.policy § 工程克制 | Preserve |
| 治理缺陷闭包 | PLAN-0029 | lifecycle.policy § 缺陷闭包 + sibling 搜索 | Preserve |
| 变更归位与残留清理 | PLAN-0014 | change-hygiene + 残留标记检查 | Preserve |

### F. 文档与知识治理

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 术语门禁 + 翻译新鲜度 | PLAN-0020 | terminology 集群 + freshness | Preserve? |
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
| Skill lifecycle management | PLAN-0025 | 子技能生命周期 | Redesign |

## Ownership Classification（PLAN-0031 Deliverable B）

对 Generation-1 治理做 Producer/Product ownership 分类。**每一行 = 一个 governance concern，每个 concern 只能有一个 semantic owner**；carrier 归属、implementation location、历史起源不混入 owner 字段（它们是单独的列）。依据：仓库实测——本仓库 `.governance/` 只有 release-proposal.json 与 review-evidence（后者是审查证据产物，不是审查机制实现）；package.json 直接运行 `scripts/check-doc-consistency.js` 与 `scripts/check-doc-freshness.js`（INSTALLED 载体）。术语与不变量见 ADR-0020。

Ownership 分类枚举（**严格五值，不得出现混合值**）：

```text
repo-only                       只属于本仓库
skill-only                      只属于分发给被治理项目的治理
shared-semantic / separate impl 语义共享，repo 与 skill 各有独立实现（双实现）
accidental coupling             repo 直接消费 skill 载体（单载体双域）或语义被复制
unknown                         待调查
```

Dependency 分类（每行单独标注方向 + 四值之一）：

```text
方向：repo→skill / skill→repo / 双向 / —
分级：intentional（有意）/ accidental（无意）/ must-remove（必须移除）/ requires-investigation（待查）
```

| Concern | Semantic owner | Consumers | Repo implementation | Skill implementation | Ownership class | Dependency |
| --- | --- | --- | --- | --- | --- | --- |
| INIT 确定性生成器 | skill | skill executor | — | `generate-governance.js`（SKILL-INTERNAL） | skill-only | — |
| 治理文件与状态管理 | skill | skill executor | — | `references/init-spec.json`（SKILL-INTERNAL） | skill-only | — |
| 载荷治理教训（INSTALLED rules） | skill | governed projects | — | `docs/rules/*`（INSTALLED） | skill-only | —（历史起源是本仓库经验，写入 note，不影响 owner） |
| Secret scanning | skill | governed projects；repo（手动预提交） | AGENTS.md:153 手动调用 `scripts/check-secrets.js` | `scripts/check-secrets.js`（INSTALLED） | accidental coupling | repo→skill · accidental |
| Git 分支与直推保护 | skill | governed projects | — | `.governance/git-policy.json` + `scripts/check-git-policy.js` | skill-only | — |
| Agent activity audit | skill | governed projects | — | `.governance/activity.jsonl` + validator drift-check | skill-only | — |
| Governance score / badge | skill | governed projects | — | validator `--json` score | skill-only | — |
| Repo 文档新鲜度 | repo | repo | 直接运行 `scripts/check-doc-freshness.js`（INSTALLED） | — | accidental coupling | repo→skill · accidental（repo-only concern 用 skill 载体实现） |
| 被治理项目文档新鲜度 | skill | governed projects | — | `scripts/check-doc-freshness.js` | skill-only | — |
| Repo 文档一致性 | repo | repo | 直接运行 `scripts/check-doc-consistency.js`（INSTALLED） | — | accidental coupling | repo→skill · accidental（单载体双域；monolith 见 FINDING-0019） |
| 被治理项目内容一致性 | skill | governed projects | — | `scripts/check-doc-consistency.js` | skill-only | — |
| 多 Agent 锁 | skill | governed projects | —（本仓库是否使用待查） | `scripts/check-lock.js`（INSTALLED） | unknown | requires-investigation |
| 计划归档门禁（本仓库） | repo | repo | `check-doc-consistency.js` plan-status 集群（共享载体） | — | accidental coupling | repo→skill · accidental |
| 交付锚点 | repo | repo | `repo-tools/check-plan-delivery.js`（REPO-ONLY） | — | repo-only | — |
| 领域级测试入口 | repo | repo | `tests/run-tests.js --suite` | — | repo-only | — |
| 被治理项目同步组（声明层） | skill | governed projects | — | `.governance/sync-rules.json` | skill-only | — |
| 同步组机械校验 | skill | governed projects | — | `scripts/check-sync.js`（INSTALLED） | skill-only | — |
| 治理规则同步与元治理 | skill | governed projects | — | lifecycle.policy § Rule Capture + 规则同步 | skill-only | — |
| Review mechanism（review-manager） | skill | governed projects | —（`.governance/review-evidence-*.md` 是**证据产物**，非机制实现） | sub-skills 模板 review-manager | skill-only | — |
| 分级发布审查（release risk tiering） | core | repo；governed projects | `repo-workflows/skill-release.md` | `references/workflows/release.md`（SKILL-INTERNAL） | shared-semantic / separate impl | 双向 · must-remove（同语义两实现，I3） |
| 审查后积压修复 | repo | repo | `check-doc-consistency.js` broken-links 集群（共享载体） | — | accidental coupling | repo→skill · accidental |
| Git 写操作确认（consent） | core | repo；governed projects | AGENTS.md § Git Operation Safety Protocol | git.policy.md § 确认范围 + release-manager | shared-semantic / separate impl | 双向 · must-remove（I3，最危险项） |
| 确认凭证与变更卫生 | core | repo；governed projects | AGENTS.md 影响面对照 | `stagedDigest` + `.governance/change-hygiene.json` | shared-semantic / separate impl | 双向 · must-remove（I3） |
| Rule Capture | skill | governed projects；repo | AGENTS.md Rule Capture 条文 | lifecycle.policy § Rule Capture | shared-semantic / separate impl | 双向 · must-remove（同语义两实现，I3） |
| 根因修复协议与失败预算 | skill | governed projects；repo | AGENTS.md 原则索引指针 → lifecycle.policy § 根因修复 | lifecycle.policy § 根因修复（INSTALLED） | accidental coupling | 双向 · intentional（repo 遵循自身规则；单权威载体，物理未复制，不违反 I4） |
| 工程克制（机制测试） | skill | governed projects；repo | AGENTS.md 指针 → coding.policy § 工程克制 | coding.policy § 工程克制（INSTALLED） | accidental coupling | 双向 · intentional |
| 治理缺陷闭包 | skill | governed projects；repo | AGENTS.md 指针 → lifecycle.policy § 缺陷闭包 | lifecycle.policy § 缺陷闭包（INSTALLED） | accidental coupling | 双向 · intentional |
| 变更归位与残留清理 | skill | governed projects；repo | AGENTS.md 变更归位 + hygiene 对照 | lifecycle.policy § 变更归位（INSTALLED） | accidental coupling | 双向 · intentional |
| 术语门禁 | repo | repo | `docs/glossary.md` + terminology 集群（共享载体） | —（无 glossary 的被治理项目 no-op） | accidental coupling | repo→skill · requires-investigation（实际被治理项目行为待查） |
| 翻译新鲜度 | repo | repo | `check-doc-freshness.js` 翻译对推导（共享载体） | — | accidental coupling | repo→skill · accidental |
| 验证门禁分层（evidence tiers） | core | repo；governed projects | AGENTS.md 证据等级表 | testing.policy 证据等级（INSTALLED） | shared-semantic / separate impl | 双向 · must-remove（I3） |
| 内容受众与可移植性 | core | repo；governed projects | AGENTS.md Content portability | 归档规则四受众（INSTALLED） | shared-semantic / separate impl | 双向 · must-remove（I3） |
| SSOT 对齐（门禁修复） | core | repo；governed projects | AGENTS.md SSOT 纪律 | 规则文件 + 门禁修复协议（INSTALLED） | shared-semantic / separate impl | 双向 · must-remove（I3） |
| 仓库边界拆分（三角色） | repo | repo；skill executor | `docs/product/en/architecture.md` + `check-role-completeness.js`（REPO-ONLY） | `init-spec.json` distribution invariants | shared-semantic / separate impl | 双向 · intentional（分发边界设计即跨域） |
| Skill lifecycle management | skill | governed projects | — | 子技能生命周期 | skill-only | — |

**需要 CONTROL-X 的 shared controls**（即 shared-semantic / separate impl 且双域都有实现的 7 项；正式实现留给 Rule Model 阶段，见 ADR-0020 § 决策 4）：

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

## 与现有测试的关系

测试数量（`332/332`）不是治理成熟度的代理指标，也不代表对上述 30 条能力的设计意图覆盖。本基线与测试互补：

- **测试**证明「当前代码当前行为正确」（mechanical, 现状）；
- **本基线**保存「这个能力为什么存在、保护什么」（provenance, 意图）。

2.0 迁移时以本基线为清单逐条核对：每移除/替换一个 Generation-1 载体前，先确认对应能力已被新的 carrier 承载或明确移除。

## 维护规则

- 本 RESEARCH 是活文档：2.0 每完成一个 Phase，将相应行的处置从 `Redesign / Replace` 更新为实际结果，并保留处置历史（supersede 版本演进，不删除）。
- 新增 Generation-1 能力来源（如果发现遗漏的 Plan/实现）时补充对应行。
- 处置值只使用上表 6 个枚举；不确定的显式标 `Unknown / requires investigation`，不允许空白。
