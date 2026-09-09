---
id: FINDING-0018
status: Confirmed
type: architecture-gap
severity: High
affected: [repo, skill]
observed_in: gen1
direction: B
root_cause: R1
github_issue: 7
related:
  adrs: [ADR-0011]
---

# FINDING-0018：1.0.0 成熟度误判：冻结了 interface surface，没冻结更核心的 rule/trigger/enforcement model

## 观察

1.0.0 冻结的是 public interface surface：sub-skill trigger words、script CLI、INIT contract、rule paths、`.governance/` contract。但后来真正暴露的不稳定部分不是这些路径，而是 governance rule model、trigger model、gate routing、enforcement model、evidence model、mechanical/judgment boundary——它们比 CLI 路径更接近项目核心。

## 证据

- 1.0.1 / 1.0.2 紧接着暴露：secret bypass、CI subset、missing template green pass、vacuous checker、release provenance issue、stack mismatch、plan coverage zero、full-test overhead、sibling closure、control-plane tracing。
- 即：冻结的表面是稳定的，冻结的表面之下的核心模型全都不稳定。
- 1.0.0 更准确的评价是 **Generation-1 baseline**，不是成熟稳定架构。未来架构变化走 2.0.0-alpha，不倒退版本号。

## 根因

「成熟度」被功能完整度（INIT/AUDIT/RELEASE/generator/policies/templates/CI/tests/state/manifest 全有）误判，而不是按「zero-attention 下还能保证什么」判断。接口冻结选择了最容易枚举的表面（路径/CLI），跳过了最难但最核心的模型（rule/trigger/enforcement）。

## 影响

- 1.0.x 系列被迫在「冻结接口」下频繁补机制，产生大量 incident-driven accretion。
- 说明接口冻结清单需要重新校准：真正该冻结的是核心模型，不是外围路径。

## 关闭条件

1. 在 2.0 重构（ADR-0014 Migration Mode）中明确 Generation-2 的「真正冻结面」= rule model / trigger model / enforcement model。
2. 记录 1.0.0 作为 Generation-1 baseline 的历史定位，不再作为成熟度参照。

## 解决情况

（待填。ADR-0014 已把 2.0 重构定义为 Generation-1 → Generation-2，本 finding 提供「为什么 1.0.0 只是 baseline」的证据。）

## 回归保护

无机械 gate（成熟度判断是研究判断，L4）。2.0 发布时用「zero-attention 保证度」而非「功能完整度」作为成熟度证据（衔接 FINDING-0008 / FINDING-0005 D04）。
