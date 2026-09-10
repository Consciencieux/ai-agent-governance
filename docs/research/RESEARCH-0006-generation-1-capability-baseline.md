---
id: RESEARCH-0006
status: Active
version: 6
subject_generation: gen1
---

# RESEARCH-0006：第一代能力基线

本 RESEARCH 从三路事实源提炼 Generation-1 的**能力保存矩阵**，为 Generation-2 重构提供 baseline evidence：

```text
1. PLAN-0001..0030（归档 Plan → 意图 / provenance）
2. 当前 SKILL / references（产品入口与 instruction surface）
3. init-spec INSTALLED artifacts + scripts/（实际会装进被治理项目的机械面）
```

它回答「1.0 曾经保护什么、现在由什么承载、Phase 4 还需要问什么」，不复制任何归档计划的全文，**不裁决** 2.0 处置。

它是**描述层**。规范冻结见 ADR-0014；阶段顺序见 ADR-0018（Phase 4 才对 Gen1 mechanism 做 keep / wrap / extract / rewrite / retire）。已观察到的同步缺口见 FINDING-0025。

**Agent 默认消费层：** 下文「Agent 压缩上下文」（v6）。默认**不要**重读 PLAN-0001..0030；归档 Plan 是 cold provenance。仅当压缩层不足以解决溯源、边界语义或争议迁移时，才回查某一份 `PLAN-xxxx`。

**v6 completeness：** v5 压缩层偏重 Plan-derived 能力；v6 补齐 **Pre-PLAN / non-Plan** 基础产品能力，并用 `init-spec` 脚本面做反向对账（见「INSTALLED 机械面反向清单」）。对账闭合后，就 INSTALLED scripts 面而言可声称 `Unaccounted = 0`。

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

## Agent 压缩上下文（v6）

### 演化单位

1.0 的真实演化单位**不是** Markdown 文件，也**不是** JS 文件，而是一个**能力簇**：

```text
规则语义
+ Agent 指令
+ 状态 / 配置
+ mechanical checker
+ gate
+ tests
+ generator / materialization
```

2.0 重构必须保存或明确处置**能力**，不能按旧文件做一对一迁移。Carrier（某节 Markdown、某 cluster、某五处同步点）可消失；能力不得 Unaccounted。

### 最短阅读指令（给后续 Agent）

```text
Do not reread PLAN-0001..0030 by default.

Generation-1 capability baseline = Plan-derived capabilities
+ Pre-PLAN / non-Plan base product capabilities.

Ten long-lived families:
Security/Git Safety; Governance State & Coordination;
Knowledge Integrity; Review/HITL; Product Modes & Materialization;
Change/Repair Governance; Plan/Delivery Governance;
Testing/Evidence; Ownership/Distribution; Engineering Restraint.

Treat archived Plans as provenance, not current authorization.
Also reconcile against current SKILL + init-spec INSTALLED scripts:
any installed script must map to an accounted capability.
Migrate capability semantics, not historical file topology.
For every Gen1 capability, assign an explicit target disposition:
KEEP / EXTRACT / MERGE / REWRITE / RETIRE / DEFER.

No historical carrier may disappear without its capability being
accounted for; completion requires Unaccounted = 0.

Only reopen a specific PLAN-xxxx when the compressed baseline is
insufficient to resolve provenance, edge semantics, or a disputed
migration decision.
```

默认读：Active Plan + 本压缩层 + 当前 target files。  
需要架构裁决 → 对应 ADR。需要事实 → 对应 Research / init-spec / SKILL。  
只有 provenance / 边界歧义 → 回查某一份 PLAN-xxxx。

### 十个长期能力族

```text
1. Security / Git Safety
   secret protection · protected branch · consent · change-set binding

2. Governance State / Coordination
   manifest desired-state · state current-state · validation observed-state
   preflight/rollback snapshot · activity · Rule Capture
   interruption/resume · multi-agent lock

3. Knowledge Integrity
   freshness · consistency · translation · terminology · sync

4. Review / Human-in-the-loop
   review-manager · risk tiering · explicit approval

5. Product Modes & Materialization
   INIT · AUDIT/drift repair · MIGRATE · RELEASE
   governance validator · deterministic generator
   init-spec · tarball · portability

6. Change / Repair Governance
   change hygiene · root-cause repair · failure budget
   same-class closure · control-plane tracing

7. Plan / Delivery Governance
   plan lifecycle · archive semantics
   DEVELOPMENT_PLAN ↔ TASK plan sync（check-plan-sync）
   affected-file delivery · evidence anchors

8. Testing / Evidence
   characterization · evidence tiers · negative fixtures
   mutation evidence · domain suites · scoped iteration

9. Architecture / Ownership
   SSOT · repo vs skill boundary · semantic owner
   physical distribution boundary

10. Engineering Principles
    machinery test · bounded failure · no speculative mechanism
    finish-and-stop
```

文档拓扑重构应围绕这十族，而不是围绕旧文件树。

### Pre-PLAN / non-Plan 基础产品能力（v6 补齐）

这些能力在 PLAN-0001 之前或之外已存在于 SKILL 产品面；**没有独立 Plan provenance，因此最容易在「只读 30 个 Plan」时丢失**。压缩层必须显式记账：

| 能力 | 当前载体（事实） | 归属族 | 备注 |
| --- | --- | --- | --- |
| INIT 模式 | `SKILL.md` INIT；`scripts/generate-governance.js`；`references/init-spec.json` | 5 | 与 PLAN-0012 重叠但入口模式本身是产品面 |
| AUDIT / drift repair | `SKILL.md` AUDIT；generated `drift-check`；manifest 对账 | 5 / 2 | 只读巡检 + 最小补丁；不重建 |
| MIGRATE | `SKILL.md` 版本迁移流程 | 5 | 框架版本升级路径 |
| RELEASE 编排 | `SKILL.md` RELEASE；`scripts/release-manager.js`；`references/workflows/release.md` | 5 | 前置检查→版本同步→tag/push/GitHub Release |
| Governance validator | `scripts/verify_governance.js` → INSTALLED `verify-governance.js` | 5 / 2 | 对照 manifest 校验工件存在与结构 |
| Manifest / state / validation / preflight | `.governance/manifest.json` · `state.json` · `validation.json` · `preflight.json` | 2 | desired / current / observed / rollback 四态 |
| Multi-agent lock | `scripts/check-lock.js`（INSTALLED；无独立 Plan） | 2 | 细表曾有、压缩层 v5 漏显式列出 |
| Plan/milestone sync | `scripts/check-plan-sync.js`（INSTALLED；`--release-gate` 可阻断） | 7 | **v5 矩阵漏行**；≠ repo-only CTRL-0005 plan-delivery |

### INSTALLED 机械面反向清单（init-spec ↔ capability）

`references/init-spec.json` 中 `scripts/` copy artifacts 是「当前 payload mechanical surface」的权威反向清单。任一会安装的脚本必须能在本基线解释：

| INSTALLED script | 能力解释 | 基线位置 |
| --- | --- | --- |
| `verify-governance.js` | governance validator | Pre-PLAN 表；族 5/2 |
| `check-lock.js` | multi-agent lock | Pre-PLAN 表；族 2；矩阵 B |
| `check-git-policy.js` | Git workflow governance | PLAN-0002；族 1 |
| `check-secrets.js` | secret scanning | PLAN-0001；族 1 |
| `check-sync.js` | sync-group mechanical verify | PLAN-0010；族 3 |
| `check-doc-freshness.js` + `lib/git-facts.js` + evaluators/ctrl-0003\|0004 | doc/translation freshness | PLAN-0005/0020；CTRL-0003/0004 |
| `check-doc-consistency.js` | cross-doc consistency monolith | PLAN-0006；族 3 |
| `check-plan-sync.js` | DEVELOPMENT_PLAN ↔ TASK sync | Pre-PLAN 表；族 7；矩阵 B |
| `release-manager.js` | RELEASE write executor | Pre-PLAN 表；族 5 |

**闭合规则：** 新增 INSTALLED script 而未更新本表 / 压缩层 → `Unaccounted > 0`。v6 对账结果：上表全覆盖；`Unaccounted = 0`（就 INSTALLED scripts 面而言）。
### PLAN-0001..0030 → 能力压缩表

| Plan | 真正留下来的能力/意图 | 2.0 重构时的理解 |
| --- | --- | --- |
| 0001 | Secret scanning：提交前扫描 staged content，命中凭证阻断，绝不回显 secret | 保留安全 invariant；旧 regex/单文件结构不是必须保留 |
| 0002 | Git workflow governance：protected branch、禁止危险直推、分支/PR、人类批准、受控回滚 | Git 安全能力 ≠ 旧 `git-policy.json` 结构必须保留 |
| 0003 | Agent activity audit：任务级追加审计、失败/动作/文件/命令记录、脱敏 | 审计/状态能力；完整 activity log 须显式 disposition |
| 0004 | Governance score / badge | Gen1 产品能力，非基础治理 invariant；可 KEEP/RETIRE，非默认必须 |
| 0005 | Governance-doc freshness（相对代码活动；Git history 非 mtime） | 已演化为 CTRL-0003；advisory 是 enforcement，不是 freshness 事实本身 |
| 0006 | Cross-document consistency（版本/清单/ADR/链接/数字/语言结构等机械矛盾） | 能力可保；mega-checker 结构不保 |
| 0007 | Review Manager：按变更集派领域审查，聚合严重度，修复后验证 | 独立 Review capability；≠ drift-check；≠ mechanical evaluator |
| 0008+0010 | Sync groups：声明 watch→require，再以 task diff 机械验证 | 保存「声明同步关系 + 独立验证」；可能被 Control/applicability 重表达 |
| 0009 | Risk-tiered review：低/中/高风险决定深度 Review；mechanical checks 始终存在 | 风险分类与 Review orchestration；勿硬编码进普通 evaluator |
| 0011 | Meta-governance / SSOT：跨 repo/payload 规则不能靠人工同步；Target/ownership/原则索引 | 演化为 Producer/Product separation 与 canonical semantic ownership |
| 0012 | Deterministic INIT：Agent 决策、机械生成；同输入确定性输出；`init-spec` 物化契约 | 重要产品能力；prompt topology 改动须能闭合到 generator/materialization |
| 0013 | Git consent：提交前回显完整命令序列一次确认；失败即停；push reject 不擅自 rebase/pull；计划批准 ≠ Git 授权 | 已演化为 CTRL-0002；核心是 consent semantics，不是五处 Markdown 同步结构 |
| 0014 | Change hygiene：删除/改名/迁移/替换检查当前层、兼容层、历史层；先权威源后投影；残留须 disposition | 横切 capability；不能继续埋在 lifecycle 某一阶段 |
| 0015 | Review 后真实缺陷修复（fail-open、路径解析、secret coverage、generator version、hook 真实性） | 主要价值是 characterization / historical failure evidence；勿把所有旧 bug 永久架构化 |
| 0016 | Rule Capture：开发者确认的长期要求持久化；persistent/one-off/unclear；确认后进入 rule owner；blocked/resume | 横切 capability；规则捕获 ≠ 自动写规则 ≠ Git consent |
| 0017 | Plan lifecycle/status/archive gate：状态可判；implemented/completed 与 archived 区分 | 保留「Plan lifecycle 可判定」；**不要**照搬 Gen1 release-coupled archive timing（ADR-0016 已解耦） |
| 0018 | Root-cause repair、failure budget、测试拆域、补丁债务；重复失败必须升级 | 横切 repair capability；测试 monolith 拆分也源于此 |
| 0019 | Engineering Restraint / Machinery Test：未被当前需求证明的机制不要增加 | 重要设计原则；明确不是新的 gate/framework |
| 0020 | Translation governance：术语 + source→translation freshness + draft/review/release boundary | 已演化为 CTRL-0004；translation semantics 独立于普通 doc freshness |
| 0021 | Evidence boundary + scoped verification：mechanical ≠ human-attested ≠ unverified claim | 2.0 evidence 模型来源；「checker green」≠「语义正确」 |
| 0022 | Audience / portability：INSTALLED 内容必须在被治理项目自身成立 | 文档拓扑须同时考虑「文件去哪」与「内容对谁成立」两轴 |
| 0023 | Gate repair + SSOT：反向 fixture、真实生产路径、CI wiring、声明与机制一致 | 门禁必须真的覆盖其声称范围；不是保存当时那批具体修补 |
| 0024 | Repository boundary：repo-tools / repo-workflows 与 payload 物理分离；tarball 边界可验证 | 演化为 ADR-0020；物理边界是重要 invariant |
| 0025 | Skill INSTALL/UPDATE/ROLLBACK（安装层 Skill Manager） | **不是** generated sub-skill lifecycle。除 version metadata / check-update 外，完整 INSTALL/UPDATE/ROLLBACK 移交未来独立 `ai-skill-manager`；勿重新吸收进本仓库 |
| 0026 | Plan delivery anchors：改已有文件时证明声明内容真的落地 | repo-only CTRL-0005 / plan-delivery；核心是 delivery evidence |
| 0027 | Consent evidence + change hygiene automation：凭证绑定 change-set；机器证据不能代替人的语义判断 | CTRL-0002/变更卫生的进一步机械化；hash ≠「人已理解」 |
| 0028 | Payload governance lessons：声明集合=机制覆盖集合；移动后复查枚举；防 shape-guard 空转；空洞测试；证据等级；CI 完整性 | meta invariant 集合 → 原则/测试设计；勿重新复制历史事故 |
| 0029 | Governance defect closure：修实例时查同类；追到 control plane；source→generator→output→gate→test→consumer | 横切 repair；Discovery Ledger / 零遗漏思想前身之一 |
| 0030 | Domain test entry：保留全量 CI，允许手动只跑相关 suite；不做自动 scope routing | repo 开发效率能力；**不应**误演化成 Phase 5 Dispatcher |

### 三类勿 1:1 迁移

1. **旧物理结构（carrier）** — `lifecycle.policy` 某节、`sub-skills.md` 第 N 节、consistency cluster #x、五处同步 Markdown。可替换；能力须记账。  
2. **已被 supersede 的旧机制** — 如 PLAN-0017 release-coupled archive（ADR-0016 已修正）。历史 Plan ≠ 当前授权。  
3. **可重新裁决甚至退出本仓库的能力** — Governance score/badge；完整 activity audit 形态；Skill INSTALL/UPDATE/ROLLBACK；部分 Gen1 heuristic consistency；部分 historical compatibility/hook machinery。

### 与下文矩阵的关系

- **本压缩层**：Agent 默认入口；十族 + Pre-PLAN 表 + Plan→意图表 + INSTALLED 反向清单 + 阅读策略。  
- **下文「能力保存矩阵」+ Ownership 表**：逐条 carrier / ownership / 待决问题的细粒度 evidence。  
- 机械 CTRL 面现状 → RESEARCH-0011；处置裁决 → PLAN-0035（及后续 Plan）。
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

因此，旧 JS 被保留并不表示其设计将原样进入 Gen2；同样，旧实现存在缺陷也不自动意味着现在应重写。每项能力必须先在本基线中保留其 provenance；**处置由后续阶段的 ADR / Plan 裁决**，本表只保存待决问题。

## 溯源链

```text
归档计划（Archived Plan；PLAN-0001..0030）
      ↓
第一代能力基线（Generation-1 Capability Baseline；本 RESEARCH）
      ↓
Phase 4 ADR / Plan 裁决处置（keep / wrap / extract / rewrite / retire）
      ↓
新实现 / 有意移除
      ↓
回归证据
```

**计划已归档 ≠ 功能已弃用 ≠ 控制已废弃。** 归档只表示任务完成。每条 Generation-1 能力在进入 2.0 产品行为前需要明确处置；**本 RESEARCH 不预填该裁决。**

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

例如 2026-08-28 先有纯 `governance rule sync & meta-governance plan`，规划给 `check-doc-consistency.js` 增加 `--gate` 与 consent / protected-files cluster；下一 commit 即实现 `--gate` 并新增 8 个 tests；再下一 commit 同时改 AGENTS 原则索引、Plan Target、ADR、checker 与 regression test。Consent policy rewrite 同样：Plan → 重写 5 个 Markdown sync points → 改 consent-cluster checker → 加 tests → release。后期 `repair inert gates and align single sources of truth`（`83c2467`）是一次典型大规模机械层修复（protected-files parser 解析不到内容、payload gate 丢失、plan-delivery 范围不足、secret scanner 对未读内容报 clean），测试从 193 增到 223。同一事实同时写入 verbose commit message、Archived Plan 与 CHANGELOG——三重投影重叠是旧知识体系缺少 responsibility boundary 的证据，不是「CHANGELOG 可删」的理由。系统描述见 RESEARCH-0004 § Generation-1 的三重历史投影。

### 分析

Generation-1 不是纯提示词系统，也不是纯 checker 系统。其实际演化单位通常是一个**能力簇**（人工同步）：

```text
规则语义 + Agent 指令 + 状态/配置 + mechanical checker + gate + tests + generator/materialization
```

（Agent 压缩层见上文；细粒度矩阵见下文。）

三层作用：

```text
Plan      = 我们打算怎么改
Markdown  = 治理规则是什么意思
JS        = 哪部分规则要机械 enforce
Tests     = JS enforcement 有没有坏
```

随着 1.0 发展，维护成本越来越向 **JS enforcement + regression tests** 偏移（测试数量沿 49 → 63 → 78 → … → 193 → 223 → 300+ 增长）。这些元素之间**缺少显式 machine-readable control identity**，semantics → applicability → evaluator → evidence 无结构化关系，因此多点同步、drift、checker accretion、regression burden 依赖开发者与 Agent 人工维护。这是 ADR-0018 把 Rule / Applicability / Evidence 显式化放在 Phase 3/5 的**历史证据**，不是本 RESEARCH 对方案的选择。系统性缺陷见 FINDING-0025。

## 待决问题（不是处置裁决）

**Research 可以保存 disposition evidence，不能自己裁决 disposition。**

第四列默认 `undecided`：只记录 Phase 4 还需要回答的问题。仅当 Accepted ADR 已给出约束时写 `accepted constraint` 并指出权威。Phase 4 候选词汇（`keep` / `wrap` / `extract` / `rewrite` / `retire`，以及历史上用过的 Preserve / Redesign 等）由届时的 ADR / Plan 填写。

| 本列取值 | 含义 |
| --- | --- |
| `undecided` | 本 RESEARCH 未裁决；附迁移问 |
| `accepted constraint: …` | 已有 Accepted ADR 约束；2.0 载体仍可能 undecided |

当前跨行约束：ADR-0014 冻结 Gen1 机械层至 Phase 4——这约束的是**现在不要改 Gen1 JS 来编码 Gen2**，不是「该能力原样进入 2.0」。

## 能力保存矩阵

### A. INIT 与生成器 / 产品入口

| 1.0 能力 | 历史来源 | 当前实现载体 | 待决问题 |
| --- | --- | --- | --- |
| INIT 确定性生成器 | PLAN-0012；SKILL INIT | `scripts/generate-governance.js` | `undecided` — 2.0 是否仍要确定性 INIT？载体是否仍是该生成器？ |
| AUDIT / drift repair 模式 | Pre-PLAN / SKILL AUDIT | SKILL AUDIT 流程；generated `drift-check`；manifest 对账 | `undecided` — AUDIT 是否仍为独立产品入口？与 Phase 5 routing 如何分工？ |
| MIGRATE（框架版本迁移） | Pre-PLAN / SKILL MIGRATE | SKILL 版本迁移流程；manifest `governance_version` | `undecided` — 迁移编排是否保留？谁拥有升级契约？ |
| RELEASE 编排 | Pre-PLAN / SKILL RELEASE | `scripts/release-manager.js` + `references/workflows/release.md` | `undecided` — release executor 边界？与 CTRL-0002 consent 如何绑定？ |
| Governance validator | Pre-PLAN | `scripts/verify_governance.js` → INSTALLED `verify-governance.js` | `undecided` — validator 是否仍对照 manifest 做存在性/结构校验？ |
| 治理文件与状态管理（manifest/state/validation/preflight） | PLAN-0012；Pre-PLAN | `references/init-spec.json` + `.governance/{manifest,state,validation,preflight}.json` | `undecided` — 四态模型是否保留？谁拥有 artifact 清单？ |
| 载荷治理教训（声明-机制差距、证据等级、测试活性、枚举复查、CI 完整性） | PLAN-0028 | INSTALLED `docs/rules/lifecycle.md` 等 | `undecided` — 哪些 invariant 进入 2.0 evidence / control model？ |

### B. 运行时检查器（Mechanisms）

| 1.0 能力 | 历史来源 | 当前实现载体 | 待决问题 |
| --- | --- | --- | --- |
| 密钥扫描（Secret scanning） | PLAN-0001 | `scripts/check-secrets.js` | `undecided` — 是否保留此 invariant？由什么 mechanism 承担？ |
| Git 工作流治理（Git workflow governance） | PLAN-0002 | `.governance/git-policy.json` + `scripts/check-git-policy.js` | `undecided` — 分支/直推保护是否保留？载体是否仍是 git-policy.json？ |
| Agent 活动审计（Agent activity audit） | PLAN-0003 | `.governance/activity.jsonl` + drift-check（validator） | `undecided` — 活动审计是否仍是产品能力？ |
| 治理评分 / 徽章（Governance score / badge） | PLAN-0004 | validator `--json` score + shields badge | `undecided` — 评分/徽章是否保留？ |
| 文档新鲜度（Doc freshness） | PLAN-0005 | `scripts/check-doc-freshness.js` + CTRL-0003/0004 evaluators | `undecided` — 哪些新鲜度行为必须保留？哪些是 Gen1 checker artifact？ |
| 内容一致性（Content consistency） | PLAN-0006 | `scripts/check-doc-consistency.js`（monolith，见 FINDING-0019） | `undecided` — 哪些一致性行为必须保留？哪些属于 Gen1 checker accretion？ |
| 多 Agent 锁 | Pre-PLAN（无独立 Plan） | `scripts/check-lock.js`（INSTALLED） | `undecided` — 锁语义是否保留？当前 fail-closed held-lock 是否够？ |
| Plan/milestone sync（DEVELOPMENT_PLAN ↔ TASK） | Pre-PLAN / 无独立 Plan（v6 补录） | `scripts/check-plan-sync.js`（INSTALLED；`--release-gate` 可阻断） | `undecided` — 是否保留为 INSTALLED control？与 repo-only plan-delivery（CTRL-0005）如何分工？ |
| 计划归档门禁 | PLAN-0017 | plan-status / pending-archive 集群 | `undecided` — 随 2.0 plan model 如何承载？ |
| 交付锚点 | PLAN-0026 | `repo-tools/check-plan-delivery.js` | `undecided` — repo-only 交付对账是否保留？ |
| 领域级测试入口 | PLAN-0030 | `tests/run-tests.js --suite` | `undecided` — 套件入口是否保留为 repo 能力？ |
### C. 同步与一致性

| 1.0 能力 | 历史来源 | 当前实现载体 | 待决问题 |
| --- | --- | --- | --- |
| 被治理项目同步组（声明层） | PLAN-0008 | `.governance/sync-rules.json` | `undecided` — 声明层同步组是否保留？ |
| 同步组机械校验 | PLAN-0010 | `scripts/check-sync.js` | `undecided` — 机械 sync check 是否保留？ |
| 治理规则同步与元治理 | PLAN-0011 | `references/` ↔ 规则文件同步 | `undecided` — 多点同步被 Control identity 取代后还剩什么？ |

### D. 审查与人类在环

| 1.0 能力 | 历史来源 | 当前实现载体 | 待决问题 |
| --- | --- | --- | --- |
| 审查管理器（Review manager） | PLAN-0007 | `references/templates/sub-skills.md` 第 8 节 | `undecided` — 审查能力如何拆层？实现形态未决 |
| 分级审查门禁 | PLAN-0009 | `references/workflows/release.md` 风险分级 | `undecided` — 风险分级是否保留？权威落在哪一 profile？ |
| 审查后积压修复 | PLAN-0015 | broken-links 集群 + consistency | `undecided` — 积压修复门禁是否保留？ |
| 提交确认政策（Consent；提交前一次确认） | PLAN-0013 | release-manager consent + git.policy | `accepted constraint: 共享语义须单一权威（ADR-0020）；2.0 载体 undecided` |
| 确认凭证与变更卫生 | PLAN-0027 | `stagedDigest` + `.governance/change-hygiene.json` | `accepted constraint: 共享语义须单一权威（ADR-0020）；2.0 载体 undecided` |

### E. 生命周期与过程模型

| 1.0 能力 | 历史来源 | 当前实现载体 | 待决问题 |
| --- | --- | --- | --- |
| 规则捕获（Rule Capture） | PLAN-0016 | `references/policies/lifecycle.policy.md` § Rule Capture | `undecided` — 捕获语义是否进入 Control model？形态未决 |
| 反补丁式开发 / 根因修复协议 | PLAN-0018 | lifecycle.policy § 根因修复 + 失败预算 | `undecided` — 纵向修复控制是否保留？与 ADR-0021 如何分工？ |
| 工程克制（机制测试） | PLAN-0019 | coding.policy § 工程克制 | `undecided` — 机制测试 invariant 由什么 carrier 承担？ |
| 治理缺陷闭包 | PLAN-0029 | lifecycle.policy § 根因修复协议与失败预算（同类实例闭包）+ sibling 搜索 | `undecided` — 同类实例闭包是否保留为机械/判断规则？ |
| 变更归位与残留清理 | PLAN-0014 | change-hygiene + 残留标记检查 | `undecided` — 残留清理是否保留？ |

### F. 文档与知识治理

| 1.0 能力 | 历史来源 | 当前实现载体 | 待决问题 |
| --- | --- | --- | --- |
| 术语门禁 + 翻译新鲜度 | PLAN-0020 | `repo-tools/check-terminology.js` + freshness | `undecided` — 翻译新鲜度待查；术语门禁已是 repo-owned 执行事实，2.0 去留未决 |
| 验证门禁分层与证据边界 | PLAN-0021 | evidence tiers | `accepted constraint: 共享语义须单一权威（ADR-0020）；2.0 载体 undecided` |
| 内容受众与可移植性 | PLAN-0022 | 四受众 portability 规则 | `accepted constraint: 共享语义须单一权威（ADR-0020）；2.0 载体 undecided` |
| 门禁修复与单一事实源对齐 | PLAN-0023 | SSOT 纪律 + 门禁修复协议 | `accepted constraint: 共享语义须单一权威（ADR-0020）；2.0 载体 undecided` |

### G. 分发与边界

| 1.0 能力 | 历史来源 | 当前实现载体 | 待决问题 |
| --- | --- | --- | --- |
| 仓库边界拆分（载荷 vs 仓库工具） | PLAN-0024 | 三种分发角色 | `accepted constraint: Producer/Product 物理分发角色（ADR-0020）；语义权威仍须单一` |

### H. Skill 生命周期

| 1.0 能力 | 历史来源 | 当前实现载体 | 待决问题 |
| --- | --- | --- | --- |
| Skill 安装层生命周期（INSTALL/UPDATE/ROLLBACK） | PLAN-0025 | 历史 skill-manager 面；除 version metadata / check-update 外已明确移出本仓库 → 未来 `ai-skill-manager` | `accepted constraint: 完整 INSTALL/UPDATE/ROLLBACK 不回归本仓库（PLAN-0025）；本仓仅保留 version/check-update 类元数据能力的去留仍 undecided` |
| Generated sub-skill lifecycle（生成子技能的运行期生命周期） | 非 PLAN-0025 | `.governance/generated/skills/` + templates | `undecided` — 与安装层 Skill Manager **不是同一能力**；2.0 路由/物化下如何承载？ |

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

D. 处置状态（Phase 4 才裁决；本列默认 undecided）
   仅当 Accepted ADR 已约束时写 accepted constraint
```

**I3 的正确理解**（ADR-0020）：`Shared semantics does not imply shared implementation` 禁止的是**把 repo/skill 两个实现当作同一个实现**（因语义共享而视为同一实现）；两个 profile 各有独立实现本身**不违反 I3**。需要消灭的不是 separate implementations，而是：

```text
duplicated semantic authority —— 同一语义存在两份权威（AGENTS.md 与 git.policy 各写一套）
repo implementation 直接依赖 mutable working-tree skill implementation
```

因此 **Semantic authority state** 与 **Implementation dependency** 是两个不同的问题：consent 这类行是 `authority: duplicated`（两侧实现互不调用也仍然有问题）；Repo 文档一致性是 `impl dependency: repo→skill`（repo 直接跑 skill checker，即使语义单一）。

**关于 `core`**：Semantic owner 判定为 `core` 的 concern（consent、分级发布审查、Rule Capture、确认凭证与变更卫生、evidence tiers、portability、SSOT）当前状态是 **owner identified: core，但 physical canonical source 尚未建立**——它们现在仍以两份语义存在（repo 实现 + skill 实现）。`core` 只是 conceptual shared semantic authority（ADR-0020 § 决策 5），物理 canonical source 由 Phase 3 Governance Core 建立。因此「owner = core」不代表「canonical source physically established: yes」。

| 关注项 | 语义所有者 | 消费者 | 仓库实现 | 技能实现 | 拓扑 | 语义权威状态 | 实现依赖 | 处置状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INIT 确定性生成器 | skill | skill executor | — | `generate-governance.js`（SKILL-INTERNAL） | skill-only | single | none | undecided |
| 治理文件与状态管理 | skill | skill executor | — | `references/init-spec.json`（SKILL-INTERNAL） | skill-only | single | none | undecided |
| 载荷治理教训（INSTALLED rules） | skill | governed projects | — | `docs/rules/*`（INSTALLED） | skill-only | single | none | undecided |
| 密钥扫描（Secret scanning） | skill | governed projects；repo（手动预提交） | AGENTS.md:153 手动调用 `scripts/check-secrets.js` | `scripts/check-secrets.js`（INSTALLED） | shared-semantic | single | repo→skill · accidental | undecided |
| Git 分支与直推保护 | skill | governed projects | —（本仓库无 git-policy.json，AGENTS.md 的 Git 协议是 consent 非分支政策） | `.governance/git-policy.json` + `scripts/check-git-policy.js` | skill-only | single | none | undecided |
| Agent 活动审计（Agent activity audit） | skill | governed projects | — | `.governance/activity.jsonl` + validator drift-check | skill-only | single | none | undecided |
| 治理评分 / 徽章（Governance score / badge） | skill | governed projects | — | validator `--json` score | skill-only | single | none | undecided |
| Repo 文档新鲜度 | repo | repo | 直接运行 `scripts/check-doc-freshness.js`（INSTALLED） | — | repo-only | single | repo→skill · accidental | undecided |
| 被治理项目文档新鲜度 | skill | governed projects | — | `scripts/check-doc-freshness.js` | skill-only | single | none | undecided |
| Repo 文档一致性 | repo | repo | 直接运行 `scripts/check-doc-consistency.js`（INSTALLED） | — | repo-only | single | repo→skill · accidental（monolith 见 FINDING-0019） | undecided |
| 被治理项目内容一致性 | skill | governed projects | — | `scripts/check-doc-consistency.js` | skill-only | single | none | undecided |
| 多 Agent 锁 | skill | governed projects | —（本仓库是否使用待查） | `scripts/check-lock.js`（INSTALLED） | unknown | unknown | unknown | undecided |
| Plan/milestone sync（DEVELOPMENT_PLAN ↔ TASK） | skill | governed projects | — | `scripts/check-plan-sync.js`（INSTALLED） | skill-only | single | none | undecided |
| Governance validator | skill | governed projects | — | `scripts/verify_governance.js` → `verify-governance.js` | skill-only | single | none | undecided |
| 计划归档门禁（本仓库） | repo | repo | `check-doc-consistency.js` plan-status 集群（共享载体） | — | repo-only | single | repo→skill · accidental | undecided |
| 交付锚点 | repo | repo | `repo-tools/check-plan-delivery.js`（REPO-ONLY） | — | repo-only | single | none | undecided |
| 领域级测试入口 | repo | repo | `tests/run-tests.js --suite` | — | repo-only | single | none | undecided |
| 被治理项目同步组（声明层） | skill | governed projects | — | `.governance/sync-rules.json` | skill-only | single | none | undecided |
| 同步组机械校验 | skill | governed projects | — | `scripts/check-sync.js`（INSTALLED） | skill-only | single | none | undecided |
| 治理规则同步与元治理 | skill | governed projects | — | lifecycle.policy § Rule Capture + 规则同步 | skill-only | single | none | undecided |
| 审查机制（Review mechanism；review-manager） | skill | governed projects | —（`.governance/review-evidence-*.md` 是**证据产物**，非机制实现） | sub-skills 模板 review-manager | skill-only | single | none | undecided |
| 分级发布审查（release risk tiering） | core | repo；governed projects | `repo-workflows/skill-release.md` | `references/workflows/release.md`（SKILL-INTERNAL） | shared-semantic | duplicated | none | accepted constraint: 消除双重语义权威（ADR-0020）；载体 undecided |
| 审查后积压修复 | repo | repo | `check-doc-consistency.js` broken-links 集群（共享载体） | — | repo-only | single | repo→skill · accidental | undecided |
| Git 写操作确认（consent） | core | repo；governed projects | AGENTS.md § Git Operation Safety Protocol | git.policy.md § 确认范围 + release-manager | shared-semantic | duplicated | none | accepted constraint: 消除双重语义权威（ADR-0020）；载体 undecided |
| 确认凭证与变更卫生 | core | repo；governed projects | AGENTS.md 影响面对照 | `stagedDigest` + `.governance/change-hygiene.json` | shared-semantic | duplicated | none | accepted constraint: 消除双重语义权威（ADR-0020）；载体 undecided |
| 规则捕获（Rule Capture） | core | repo；governed projects | AGENTS.md Rule Capture 条文 | lifecycle.policy § Rule Capture | shared-semantic | duplicated | none | accepted constraint: 消除双重语义权威（ADR-0020）；载体 undecided |
| 根因修复协议与失败预算 | skill | governed projects；repo | AGENTS.md 原则索引指针 → lifecycle.policy § 根因修复 | lifecycle.policy § 根因修复（INSTALLED） | shared-semantic | single | repo→skill · intentional（repo 消费 skill-owned canonical carrier） | undecided |
| 工程克制（机制测试） | skill | governed projects；repo | AGENTS.md 指针 → coding.policy § 工程克制 | coding.policy § 工程克制（INSTALLED） | shared-semantic | single | repo→skill · intentional | undecided |
| 治理缺陷闭包 | skill | governed projects；repo | AGENTS.md 指针 → lifecycle.policy § 根因修复协议与失败预算（同类实例闭包） | lifecycle.policy § 根因修复协议与失败预算（同类实例闭包）（INSTALLED） | shared-semantic | single | repo→skill · intentional | undecided |
| 变更归位与残留清理 | skill | governed projects；repo | AGENTS.md 变更归位 + hygiene 对照 | lifecycle.policy § 变更归位（INSTALLED） | shared-semantic | single | repo→skill · intentional | undecided |
| 术语门禁 | repo | repo | `repo-tools/check-terminology.js`（REPO-ONLY，已从 INSTALLED 检查器拆出） | —（已移除；无 glossary 的被治理项目本就不适用） | repo-only | single | none | undecided |
| 翻译新鲜度 | repo | repo | `check-doc-freshness.js` 翻译对推导（共享载体） | — | repo-only | single | repo→skill · accidental | undecided |
| 验证门禁分层（evidence tiers） | core | repo；governed projects | AGENTS.md 证据等级表 | testing.policy 证据等级（INSTALLED） | shared-semantic | duplicated | none | accepted constraint: 消除双重语义权威（ADR-0020）；载体 undecided |
| 内容受众与可移植性 | core | repo；governed projects | AGENTS.md Content portability | 归档规则四受众（INSTALLED） | shared-semantic | duplicated | none | accepted constraint: 消除双重语义权威（ADR-0020）；载体 undecided |
| SSOT 对齐（门禁修复） | core | repo；governed projects | AGENTS.md SSOT 纪律 | 规则文件 + 门禁修复协议（INSTALLED） | shared-semantic | duplicated | none | accepted constraint: 消除双重语义权威（ADR-0020）；载体 undecided |
| 仓库边界拆分（三角色） | repo | repo；skill executor | `docs/product/en/architecture.md` + `check-role-completeness.js`（REPO-ONLY） | `init-spec.json` distribution invariants | shared-semantic | single（repo 定义权威，skill executor 消费声明） | skill→repo · intentional | undecided |
| Skill 安装层生命周期（INSTALL/UPDATE/ROLLBACK） | skill（未来外部 manager） | governed projects | — | 已移出；仅 version/check-update 残留待决 | skill-only（external） | single | none | accepted constraint: 完整 INSTALL/UPDATE/ROLLBACK 不回归本仓库（PLAN-0025） |
| Generated sub-skill lifecycle | skill | governed projects | — | `.governance/generated/skills/` | skill-only | single | none | undecided |

**需要 CONTROL-X 的 shared controls**（准入判据，不是「owner 是否 core」）：

```text
shared semantic
+ repo 有独立 evaluator/implementation
+ skill 有独立 evaluator/implementation
+ 同一 negative oracle 对两侧都成立
```

符合判据的 7 项（是否建 CONTROL-X、形态如何，留给 Phase 3 Rule Model，见 ADR-0020 § 决策 4；本表不预填实现）：

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

2.0 迁移时以本基线为清单逐条核对：每移除/替换一个 Generation-1 载体前，先确认对应能力已被新的 carrier 承载或由届时 ADR/Plan **明确**移除。本表第四列在 Phase 4 之前保持 `undecided`（或已有 ADR 的 accepted constraint），不把 Preserve / Redesign 当作已批准。

## 维护规则

- 本 RESEARCH 是活文档：Phase 4 及之后由 **ADR / Plan** 把相应行从 `undecided` 更新为已裁决处置，并保留版本演进（不删除历史）。
- 新增 Generation-1 能力来源时补充对应行。
- 本表不得自行宣布 MUST / chosen architecture / final disposition。
