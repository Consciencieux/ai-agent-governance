---
id: FINDING-0015
status: Confirmed
type: mechanism-gap
direction: B
root_cause: R1
severity: Medium
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

# 静态长 Prompt 造成注意力负担：规则存在率 ↑，但正确决策点召回率 ↓

## 观察 Observation

治理文件越来越多（AGENTS.md / SKILL.md / coding.policy.md / testing.policy.md / lifecycle.policy.md / git.policy.md …），规则越积越多。但「把规则放进上下文」不等于「AI 在真正需要的时候会调用它」——存在规则存在率上升、但正确决策点召回率下降的趋势。

## 证据 Evidence

- 长任务受 context size / instruction density / rule similarity / tool output / 多轮上下文 / summary compression / 目标冲突 / decision-point distance 影响，规则被稀释。
- 静态长 Prompt 让每条规则与它真正适用的决策点距离变远（decision-point distance）。
- Issue #7 §13 提出的缓解方向：**decision-point policy injection**——AI 要改 `CHANGELOG.md` 时才动态加载 CHANGELOG structure / content boundary / one-entry-one-change / release timing，而不是任务一开始就把几十条规则全部压进上下文。

## 根因 Root cause

Prompt 是被动承载、一次性全量注入，没有按决策点按需加载的机制。规则总量与注意力稀释成正比。

## 影响 Impact

- prompt 型规则越多，单条规则的实际召回率越低。
- 这是「prompt 是 guidance 不是 control」在规模上的累积效应（延伸 FINDING-0003 C03）。

## 关闭条件 Resolution criteria

1. 实验对比：静态全量 AGENTS vs decision-point injection，测量违规率差异（与 FINDING-0008 G04 衔接）。
2. 若 injection 有效，落地最小机制（按文件类型/动作动态加载相关规则片段）。

## 解决 Resolution

（待填。）

## 回归保护 Regression protection

这是一个可实验假设（L4 级），不是机械规则。测量框架落地后由对比实验提供数据，无独立 gate。
