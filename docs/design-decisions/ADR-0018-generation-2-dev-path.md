# ADR-0018: Generation-2 开发路径——8 阶段执行顺序与跨 profile 契约保证

- 状态：Accepted
- 日期：2026-09-08

## 背景

ADR-0014（Migration Mode）、ADR-0015（Roadmap 定位）、ADR-0016（文档结构）、ADR-0017（迁移分支）分别确立了 2.0 重构的**机制**，但缺少一张**执行顺序总览**：Phase 0 → 8 的先后依据、每阶段的交付物、以及各阶段依赖的边界决策。FINDING-0001（producer/product 耦合）与 FINDING-0014（review-manager 层级错配）指出了两个必须**先行**解决的架构问题，但它们各自只是观察，没有落到执行路径。

同时，本仓库的知识对象（findings / research / plans / ADR / archive）已各有 ID（FINDING-0001..0019、RESEARCH-0001..0005、PLAN-0001..0030、ADR-0001..0017），但**编号规则从未统一成文**——「新对象编号怎么定」靠各 README 隐含约定。

## 决策

**1. 2.0 执行顺序固定为 8 阶段，每阶段是一个 checkpoint（对齐 ADR-0014）。**

```text
Phase 0  Architecture Migration Mode（启用观测化 gate + Refactor Safety Kernel）
   ↓
Phase 1  Producer / Product Separation（repo profile vs skill profile）
   ↓
Phase 2  Research / Findings / Traceability（系统模型 → 问题 → 溯源闭环）
   ↓
Phase 3  Governance Core / Rule Model（shared semantics, separate profiles）
   ↓
Phase 4  Checker / Primitive restructuring
   ↓
Phase 5  Dispatcher（Context Detector → Applicability → Mechanical/Heuristic/Review）
   ↓
Phase 6  Invariant-based Testing
   ↓
Phase 7  Review System redesign（Implementation / System / Research 三类）
   ↓
Phase 8  Rebuild mandatory gates（以新 control plane 重建阻断权威）
```

**先后依据**：Phase 1 必须在 Phase 3 之前，因为「repo / skill 的 ownership 边界」是 Rule Model 的前提——若先设计 Rule Registry / Dispatcher / Evidence，会把当前 `scope = both` 的混乱正式编码进新架构。Phase 2 在 Phase 3 之前，因为「我们如何理解这个系统」（research）与「实际发现了什么」（findings）必须先于「规则如何建模」。Phase 6/7 在 Phase 8 之前，因为 gate 的**阻断权威**重建依赖测试模型（invariant）与审查模型（三类 review）先行定型。

**2. 禁止在 Phase 1 之前设计 Dispatcher / Rule Registry / Evidence 的具体 schema。** 这是对「把 `scope = both` 编码进新架构」这一最大风险的硬约束：新架构的规则模型只能建立在 producer/product 分离后的 ownership 之上。

**3. 统一知识对象 ID 编号规则（适用于 plans / findings / research / ADR）：**

```text
- 每种类型独立编号（PLAN-xxxx / FINDING-xxxx / RESEARCH-xxxx / ADR-xxxx）
- 新对象编号 = 该类型现有 max(编号) + 1
- 编号永久不复用、不重排
- 文件路径 = <id>-<slug>，slug 用英文 ASCII，内容用该类型的语言政策
```

历史对象已按真实出现顺序编到 PLAN-0030 / FINDING-0019 / RESEARCH-0005 / ADR-0017；此后新增一律走 max+1。**编号一旦分配即绑定该对象，撤销/作废不释放编号**（保持溯源完整性）。

**4. 建立跨 profile 契约测试（CONTROL-X），作为「repo 改了、skill 忘了」的机械护栏。**

FINDING-0001 的证据 A04 表明：repo 侧修复不传播到 skill 是历史反复出现的失效模式。Rule Capture 阶段（Phase 3）之后，每一条被判定为 `owner: core` 的共同规则，必须建立：

```text
CONTROL-X
   ├── repo 实现 → negative fixture 必须 fail
   └── skill 实现 → negative fixture 必须 fail
```

同一份 negative fixture 同时喂给 repo 实现与 skill 实现，**两者都必须 fail**（否则规则在某一个域是空转）。这样「AI 修 repo 忘 skill」的回归由 CI 自动 red 拦截，而不是依赖 "remember to check the skill too" 的注意力。适用性判断：仅当规则在两个 profile 都有实现时才建 CONTROL-X；单域规则不建。

**5. Review 系统按层级拆成三类，不再让一个 review-manager 承担全部。**

FINDING-0014 观察：review-manager 擅长 Implementation Review（bug / security / test weakness / vacuous gate / doc inconsistency），不擅长 System Review（architecture failure / control topology / producer-product coupling / systemic overengineering）。

```text
Implementation Review   现有 review-manager 定位——单次变更/PR 的缺陷审查
System Review           架构 / control topology / 耦合——Phase 7 重构
Research Review         研究问题（我们如何理解、如何评价系统）
```

三类独立运行，避免「找很多微观 bug → 修很多 patch → 整体架构无感改善」的循环。

**6. 测试从 suite-centric 迁往 invariant-centric，成熟度指标更换。**

`N/N tests passed` 不再作为核心成熟度指标。2.0 关注：

```text
Rule protection coverage     每条 mechanical control 有 positive + negative fixture
Negative oracle coverage     关键门禁必须有「该 fail 就 fail」的反向验证
Trigger coverage             Dispatcher 触发路径覆盖
Blocking coverage            阻断路径覆盖
False positive / negative    观测
Runtime / token cost / human burden   运维成本观测
```

每条重要 mechanical control 的验收标准：positive fixture（合法输入通过）+ negative fixture（非法输入被拦）双备。

## 后果

- 8 阶段顺序成为 2.0 migration 分支（ADR-0017）的 phase 划分依据；每阶段一个 `PLAN-xxxx` 计划 + checkpoint 验证。
- `scope = both` 在 Phase 3 起被 `owner: core` + `consumers: [repo, skill]` 替代；repo / skill 各自拥有 applicability / implementation / boundary / adapter。
- CONTROL-X 契约测试在 Phase 3 后逐步加入，成为「跨 profile 同步」的机械保证。
- Review 三类拆分在 Phase 7 落地；现有 review-manager 保留为 Implementation Review。
- 测试指标转向不要求立即重写全部测试，而是新 control 一律 invariant-centric，存量渐进迁移。
- ID 编号规则统一后，各 README 的隐含约定收敛为一条可引用规则。

## 参考

- Migration Mode（gate 观测化、checkpoint 验证）：ADR-0014
- Roadmap 架构演进视图（迁移计划归属）：ADR-0015
- 文档结构用途优先（product/plans/findings/research/ADR/archive 分层）：ADR-0016
- 迁移分支策略（main 保持 1.x baseline）：ADR-0017
- Producer/product 耦合（CONTROL-X 的动机）：FINDING-0001
- review-manager 层级错配（Review 三分的动机）：FINDING-0014
- 知识对象五分类与 findings 永久库：ADR-0013
