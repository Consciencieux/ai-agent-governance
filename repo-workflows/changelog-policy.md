# Repo CHANGELOG Policy（REPO-ONLY）

本文件是**本仓库自身** CHANGELOG 的执行政策（Repo Profile 拥有；ADR-0012 § 后续补充 §5）。它按需加载——日常不进入 Agent 执行上下文；写 CHANGELOG 时读取。`AGENTS.md` 只放指向本文件的指针（ADR-0022 薄入口）。

被治理项目的 CHANGELOG 格式契约由 Skill payload `references/policies/lifecycle.policy.md` 权威；repo 与 governed project 共享「CHANGELOG 记录已交付变更而非验证叙事」这一语义（ADR-0020），但各自拥有执行政策。

## 定位

CHANGELOG 是**历史变更投影**（不是 `docs/` 知识类型；见 `docs/README.md` § CHANGELOG）。唯一主问题：从上一个发布边界到这个发布边界，项目发生了哪些值得读者知道的实际变化？

## 准入（decision ≠ delivered change）

```text
Did observable project behavior / public interface / contributor workflow /
release behavior / or supported capability actually change?
YES → candidate；NO → normally no CHANGELOG entry
```

`ADR Accepted` / 新 Finding / 新 Research / Plan 创建**本身不产生** CHANGELOG 条目。

## 分类

- doc-only（typo、措辞、格式）→ 无条目
- bug fix → `Fixed`；新能力 → `Added`；架构/行为/破坏性 → `Changed`
- CHANGELOG 在 merge/release 边界写，不按 commit

## `[Unreleased]`

= 已实现、准备进入下一个正式 release 的 change projection。**不是**所有正在讨论的工作 / 所有 Accepted ADR / 所有 Active Plan / 每个 migration commit 的流水账。Migration Mode（ADR-0014）禁发布时，在 checkpoint / merge / release composition 统一整理。

## Released section

= 历史记录，默认不可重写。允许：factual correction / broken pointer correction / 明确授权的历史整理。不允许：为匹配今天架构改写历史（与 ADR「不改写历史」同源）。

## 格式契约

统一格式（版本节、分类标题、空行、列表分隔）的权威是 `references/policies/lifecycle.policy.md` § CHANGELOG 结构契约（shared 格式语义，repo 作为 consumer 遵循）；`scripts/check-doc-consistency.js` changelogCoverage 集群机械校验。
