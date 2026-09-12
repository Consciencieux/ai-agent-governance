---
id: FINDING-0027
status: Resolved
type: architecture-gap
observed_in: gen2
resolved_in: gen2
---

# FINDING-0027：知识对象高层分类已有，但权威边界不够操作化，正文逐渐承担第二种权威

## 分类

- 严重度：高
- 影响范围：repo
- 研究方向：G. 证据 / 研究方法论

## 观察

FINDING-0023 补上了 primary authoritative responsibility / supporting context / independent knowledge 的区分，目录级路由也已存在。偏移仍在发生，而且主要不是「一次写错文件夹」，而是正文在修改过程中逐渐承担第二种权威。

典型滑动：

```text
Research：描述目标形态 → 裁决目标形态
Finding：描述问题何时消失 → 指定具体实现
Plan：执行既有约束 → 重新定义长期规则
```

实例：RESEARCH-0006 从能力基线长出 Preserve / Redesign disposition；RESEARCH-0009 从系统模型长出「长期更合理的目录应该是…」；FINDING-0026 的关闭条件要求「一能力一源文件 + 薄 registry」。PLAN-0032 R29 修了这些实例，但没有把「允许写什么 / 禁止写什么 / 什么时候只是 supporting context」写成可执行合同。

第二层：几乎没有持续检查在问「这篇是否新增了此前不存在的 MUST / 架构选择 / 实现承诺」。现有手段是作者自觉、review、Agent 理解。

## 证据

- RESEARCH-0007 / `docs/README.md` 已有「Research = 描述系统」等高层分类，但未回答：Research 能否写目标架构、Finding 关闭条件能否指定 Registry、Research 能否给 Gen1 capability 写 Preserve/Redesign、Plan 能否复述长期 invariant。
- R29 实例修复与随后再次渗漏同一模式：边界靠作者临时解释，而不是对象级合同。
- 仓库没有 authority-mismatch review oracle；现有 checker 查结构/词，不查跨类型权威。

## 根因

设计缺陷优先：primary authoritative responsibility 的定义不够细，缺少 authoritative / supporting / forbidden 的操作性规则。执行缺陷随后：没有持续 review 去执行这些边界。

```text
边界规则不够操作化
        ↓
作者/Agent 在邻接类型之间自由解释
        ↓
正文逐渐承担第二种 authority
        ↓
缺少持续检查 / review oracle
        ↓
偏移长期存在
```

架构判断（非统计）：约 60% 分类/权威模型不够操作化，约 40% 缺少持续 review。检查机制不能替代分类模型；检查机制只能执行已经定义清楚的边界。一上来写 regex 会重演 Gen1：词级信号无法覆盖语义偏移，checker 却越来越复杂。

## 影响

- 目录正确的文档仍会把邻近类型的权威写进正文，读者无法判断哪一段可执行。
- Phase 2 修复实例后复发，因为合同仍不够细。
- 若用 JS gate 抓「必须 / 决定采用」，引用 ADR 的合法句子也会误伤，或把语义问题降成词表游戏。

## 关闭条件

1. 每类知识对象有可执行的三列合同：可权威声明 / 只能作为支持上下文 / 不得权威声明。
2. 邻接问题有明确归属：目标架构、关闭条件、disposition、长期 invariant 分别落在哪一类、以什么强度出现。
3. Phase 2 用结构化 review 执行该合同，而不是用词级 JS gate 假装已关闭。机械化是否引入，留给后续阶段的 ADR / Plan，不是本 Finding 的关闭手段。

## 解决情况

（Resolved，2026-09-10。）ADR-0016 追加知识对象权威矩阵与五问 review。RESEARCH-0007 记录设计缺陷 vs 执行缺陷及 L1/L2/L3 分层（描述层，不裁决 Phase 4/5 实现）。PLAN-0032 以该矩阵为 Phase 2 施工合同。未新增 JS authority gate。

## 关联

- FINDING-0023（上一层：缺 primary vs supporting 区分）
- PLAN-0032 R29 / R30
- ADR-0016
- RESEARCH-0007

## 回归保护

再出现 Research 裁决 disposition、Finding 关闭条件指定实现、Plan 重写 Accepted ADR 时，先对照 ADR-0016 权威矩阵，而不是先加 regex。词级信号最多作后续 warning 候选，不能单独当作本问题已关闭。
