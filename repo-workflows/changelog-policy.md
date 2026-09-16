# Repo CHANGELOG Policy（REPO-ONLY）

本仓自身 CHANGELOG 的**执行政策**（Repo Profile；ADR-0012）。按需加载：写 CHANGELOG 或 checkpoint 对账时读。入口只放指针（ADR-0022）。

- **格式契约（shared）：** `references/policies/lifecycle.policy.md` § CHANGELOG 结构契约  
- **语义边界（shared）：** 记已交付变更，不记验证叙事（ADR-0020）  
- **历史 / 反例：** `docs/findings/FINDING-0009-changelog-historical-entry-rewrite.md` · `docs/findings/FINDING-0033-changelog-write-pressure-vs-reconcile.md` · ADR-0012 修正条款  

## 定位

CHANGELOG = **发布边界上的已交付投影**，不是开发日志，也不是 `docs/` 知识类型。

核心句：**写成可以推迟；对账不能推迟。**

## 不变量（C1–C5）

```text
C1  只记 delivered change，不记决策/计划/研究/发现/commit/验证叙事。
C2  准入看可观察影响，不看文件类型。
C3  写入可推迟到 checkpoint；对账不得推迟到该 checkpoint 之后。
C4  一条 entry = 一个对用户/贡献者/运维可独立理解的变化。
C5  发布前按实际 release boundary 重组 [Unreleased]；仅迁移脚手架通常不进已发布节。
```

## 准入

```text
可观察行为 / 公开接口 / 贡献者工作流 / 发布行为 / 受支持能力 是否真的变了？
YES → candidate；NO → 通常无条目
```

- ADR Accepted / 新 Finding / Research / Plan **创建本身** → 无条目；等 Implementation 后再评估。  
- 纯呈现（typo/措辞/格式，且不影响导航/工作流/行为）→ 无条目。  
- 文档若改公开合同、导航、贡献者工作流或受支持行为 → 按普通准入。  
- 「commit / wrap up」**不是**写 CHANGELOG 的许可（FINDING-0033）。

受众收窄：只有 ADR/Plan/Research 作者关心 → 不进；使用者/贡献者/维护者需要知道才能用或维护新版本 → candidate。

## 分类与粒度

- bug → `Fixed`；新能力 → `Added`；架构/行为/破坏性 → `Changed`  
- 按 **change** 写，不按 commit（C4：受众不同、迁移影响不同、或可独立回滚 → 分条）

## 对账（C3）

**必须对账**（写入 `[Unreleased]` **或** 显式 no-entry/deferred + 原因）：

```text
- Phase checkpoint 关闭
- 改变了可观察行为的 Active Plan → Completed
- migration 分支 merge / promote
- release composition 开始
```

checkpoint 清单（自上次对账以来）：行为 / 贡献者工作流 / 公开路径 / 受支持能力 / 发布行为 —— 每项已表示或 no-entry。

Migration Mode（ADR-0014）禁发布时：日常 commit 可不碰 CHANGELOG；checkpoint 必须对账。禁止把「以后再写」变成永远不对账。

## `[Unreleased]`

= 已实现、**当前预计**进入下一正式 release 的投影。≠ 讨论中工作 / Accepted ADR / Active Plan / 每个 migration commit 的流水账。  
migration checkpoint 投影 ≠ 未来正式 release 投影（composition 时再滤）。

## Release composition（C5）

```text
该 change 是否进入本次 release boundary？
YES → keep；NO（仅迁移脚手架）→ 已发布节通常省略
```

Migration Mode 下**不做** release composition（不切版本节、不打 tag、不走 `skill-release.md`）。退出后再 composition。

## Released section

已发布节 = 历史，默认不可重写。允许：事实纠错 / 断链修正 / **明确授权**的一次性整理。禁止按今天准入或知识架构回写旧节。

写作语义分界：`≤ 1.0.2` = Legacy（可混有根因/验证叙事）；其后按 C1–C5。细则与反例 → FINDING-0009 · ADR-0012 § 已发布节不按新准入回写。

## 格式

统一格式权威：`lifecycle.policy.md` § CHANGELOG 结构契约；机械：`check-doc-consistency` changelogCoverage。
