---
id: ADR-0017
status: Accepted
generation: gen2
---

# ADR-0017：2.0 迁移分支策略


## 背景

Generation-1 → Generation-2 是 **architecture migration**，不是普通 feature。它涉及 repo/skill 分离、文档结构变化、policy model 变化、gate model 变化、test model 变化、CI 变化、release model 变化——一系列破坏性、互相依赖的变更。

两种反面方案都不合适：

- **直接 main 开发**：中间状态不稳定、不可使用、不可发布；issue 链接到半成品 commit；release history 混乱。主分支上的 1.x 基线被破坏，无法清晰比较 Generation-1 与 Generation-2——损害科研价值。
- **巨大长期黑洞分支**：分支漂移（main 上的 bug/security/dependency 修复不断造成 merge conflict）；200 commits / 500 files 无人能 review；丢失中间反馈（架构迁移需要「阶段完成 → 验证 → 调整 → 继续」，不是半年后一次验证）。

## 决策

**1. 建立长期迁移分支 `migration/2.0-governance-architecture`，阶段性合并里程碑，而不是每个中间状态都进入 main。**

```text
main
 |-- v1.0.x (stable baseline)
 |
 +---- migration/2.0-governance-architecture
         |
     Phase 1  边界重构（repo/skill 分离）
         |
     Phase 2  Rule Registry
         |
     Phase 3  新 Gate 系统 → v2.0.0-alpha tag（不是 release）
         |
     Phase 4  tests/docs/CI/release 全迁移 → v2.0.0-rc
         |
     merge
         |
         v
       main → v2.0.0
```

**2. main 保持 1.x 稳定，作为可复现 baseline。** 保护科研价值：`v1.0` 与 `v2.0` 是两个可比对的对象，而非混在一条提交链里。

**3. 破坏性重构只进 migration 分支**：docs 结构移动、gate 重写、Rule Registry / Dispatcher / Evidence 引入，以及新旧架构并存（`scripts/*.js` 与 `rules/` 同时存在）的危险窗口。这些不进 main。

**4. 非破坏性变化可阶段性 merge 到 main**：文档整理、ADR、findings、research、PLAN ID 等与架构无关的治理知识。逐项判断兼容性，兼容才合。

**5. 不发布 1.1/1.2 过渡版本。** 只在必要时发布 `1.0.x`（security fix / critical bug fix / dependency update），**不增加旧架构能力**——否则同时维护 1.x 与 2.x 两套架构。

**6. 里程碑用 checkpoint 验证（对齐 ADR-0014 Migration Mode）**：每个 Phase 完成后验证、调整、继续，不是最后一次 merge 才验证。

**7. 不要让 migration 分支成为「隐藏开发」**：每阶段有公开记录（`docs/plans/PLAN-xxxx-<phase>.md`、`docs/research/`、`docs/findings/` 引用），让分支存在的原因透明。

**8. 2.0 RC 后 merge 到 main，v2.0.0 正式版重新建立 release gates**（退出 Migration Mode 的条件：新架构 gates green、critical old regressions migrated、release characterization green——ADR-0014）。

## 后果

- 正面：1.x 保持可复现 baseline；2.0 是清晰实验对象；阶段性 checkpoint 提供中间反馈；避免双架构维护。
- 代价：migration 分支需要定期从 main 合并修复（降低漂移）；非破坏性变化的 merge 判断需要逐个做。
- 遗留风险：如果阶段间隔过长，仍会累积漂移——用「阶段性 merge 文档/无破坏变化」缓解。

## 与现有 ADR 的关系

- ADR-0014 定义迁移期间 gate 处理（观测化、checkpoint 验证、禁 release）；本 ADR 定义迁移在 git 上的组织方式。两者互补。
- ADR-0016 的 docs 结构迁移（product/plans/findings/research/ADR/archive）属于本 ADR 的破坏性重构，进 migration 分支。
- ADR-0015 roadmap 重写同理。

## 参考

- Migration Mode：ADR-0014
- 文档结构用途优先：ADR-0016
- Roadmap 重新定位：ADR-0015
