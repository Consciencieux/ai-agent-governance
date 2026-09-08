---
id: FINDING-0005
status: Confirmed
type: architecture-gap
direction: D
root_cause: R3
severity: High
affected:
  - repo
  - skill
github_issue: 7
opened: 2026-09-08
resolved:
related:
  plans: []
  adrs: []
---

# Validation 调度失衡：简单规则验证过重，复杂规则验证不足

## 观察 Observation

当前项目不是「gate 太少」或「gate 太多」，而是 **gate 分配错误**：简单、可判定规则被大量 JS gate 高频运行（过度工程）；复杂、语义规则只有 prompt 没有可靠机械 carrier（治理强度不足）。

## 证据 Evidence

- **D02 scope tiering 仍跑 full suite**：`check:docs` 第一步仍然是 `npm test`，而 `npm test` 默认运行所有 suite。一个 README 标点改动曾要求 42.9 秒 full run（1.0.2 CHANGELOG 记录），`--suite` 只是手工 dev-loop shortcut，明确不做自动 diff routing。
- **D03 无自动 impact routing**：runner 有 suite 粒度（`--suite docs`），但没有 `git diff → context detector → machine classification → minimal gate set`。
- **D04 两端各缺一半**：本地有 scope 概念但靠 AI 触发；CI 自动触发但 scope 粗（任何 push / PR 无条件 `npm run check`）。

```text
本地：有 scope 概念，但靠 AI 触发
CI：自动触发，但 scope 粗
理想：统一进入同一个 dispatcher
```

## 根因 Root cause

validation 按 suite/脚本组织，而非按 invariant/impact 驱动。项目已具备细粒度执行能力，但缺少细粒度自动调度能力。

## 影响 Impact

- 简单改动验证过重（成本高、迭代慢）。
- 复杂规则缺 carrier（enforcement 弱）。
- 简单 + 复杂两类规则的两头失衡。

## 关闭条件 Resolution criteria

1. 统一 Dispatcher：`README typo → docs-trivial → 只跑 docs structure/link`；`generator changed → generator surface → generator tests + output contract`；release 才 full regression。
2. CI 与本地共用同一个 dispatcher。

## 解决 Resolution

（待填。）

## 回归保护 Regression protection

dispatcher 调度矩阵测试：给定 diff 输入 → 断言只运行该触发的 minimal gate set（而不是全量）。
