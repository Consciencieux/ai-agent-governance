# Repo CHANGELOG Policy（REPO-ONLY）

本文件是**本仓库自身** CHANGELOG 的执行政策（Repo Profile 拥有；ADR-0012 § 后续补充 §5 与 2026-09-10 后续修正）。它按需加载——日常不进入 Agent 执行上下文；写 CHANGELOG 或做 checkpoint 对账时读取。`AGENTS.md` 只放指向本文件的指针（ADR-0022 薄入口）。

被治理项目的 CHANGELOG 格式契约由 Skill payload `references/policies/lifecycle.policy.md` 权威；repo 与 governed project 共享「CHANGELOG 记录已交付变更而非验证叙事」这一语义（ADR-0020），但各自拥有执行政策。

## 定位

CHANGELOG 是**发布边界上的变更投影**（release-boundary change projection），不是开发日志，也不是 `docs/` 知识类型（见 `docs/README.md` § CHANGELOG）。

```text
Git        = 某次代码变更当时做了什么（实现事件）
Plan       = 施工历史（为何做、怎么做、怎么验收）
ADR        = 决策历史
Finding    = 问题历史
Research   = 理解演进
CHANGELOG  = 到某个 release boundary，维护者认为哪些变化应被声明为已交付
```

三者文本重合也不互相替代。`≤ 1.0.2` 的 verbose 写法是 Generation-1 缺少职责边界的证据（RESEARCH-0004），不是今天的写作范例。

唯一主问题：从上一个发布边界到这个发布边界，项目发生了哪些值得读者知道的实际变化？

信息流：

```text
Finding → Research → ADR → Plan → Implementation → CHANGELOG 投影「最终交付了什么」
```

## 五条不变量

```text
C1  CHANGELOG 记录 delivered change，不记录决策、计划、研究、发现、commit 或验证叙事。
C2  准入由可观察影响决定，不由文件类型决定。
C3  写入可以推迟到 checkpoint；对账不得推迟到该 checkpoint 之后。
C4  一条 entry 表示一个对用户 / 贡献者 / 运维可独立理解的变化。
C5  发布前按实际 release boundary 重组 [Unreleased]；仅存在于迁移过程的中间机制不必进入已发布节。
```

核心句：**CHANGELOG 的写成可以推迟；变更对账不能推迟。**（Writing may be deferred; accounting may not.）

## 准入（decision ≠ delivered change）

```text
Did observable project behavior / public interface / contributor workflow /
release behavior / or supported capability actually change?
YES → candidate；NO → normally no CHANGELOG entry
```

`ADR Accepted` / 新 Finding / 新 Research / Plan 创建**本身不产生** CHANGELOG 条目。等 Implementation 之后记录 implemented change。

### 影响，不是文件类型（C2）

`doc-only（typo、措辞、格式）→ 无条目` 只覆盖**纯呈现**。Markdown / 文档路径变更若改变公开导航、贡献者工作流、parity 映射、仓库入口或受支持行为，按普通准入评估。

```text
presentation-only documentation change
→ no entry

documentation change that alters
public contract / navigation / contributor workflow / supported behavior
→ evaluate normally
```

### 受众测试（谁会在 release 时在意）

`observable` 用受众收窄，避免「内部文档 vs 新能力」两边都能辩：

```text
Who would care at release time?
Product user / Contributor / Maintainer-operator / Integrator /
Nobody outside the implementation discussion?
```

```text
只有 ADR / Plan / Research 作者关心 → 不进
使用者 / 贡献者 / 维护者需要知道才能正确使用或维护新版本 → candidate
```

## 分类

- 纯呈现文档（typo、措辞、格式，且不影响导航 / 工作流 / 行为）→ 无条目
- bug fix → `Fixed`；新能力 → `Added`；架构 / 行为 / 破坏性 → `Changed`
- 按 **change** 写，不按 commit：26 个 commit 可能只交付 3 条

### 同一条 change 的判定（C4）

同一 Implementation 项目 ≠ 同一 CHANGELOG change。两个变化若**受众不同、迁移影响不同、或可独立回滚**，则分成两条。

```text
Independent user/contributor effect → separate entry
```

不要用「一个 commit / 一个 Plan / 一个 ADR」当单位。

## 写入可推迟，对账不可推迟（C3）

Migration Mode（ADR-0014）禁发布时，**不**把每个 migration commit 写入 `[Unreleased]`。允许：

```text
日常 commit → 不碰 CHANGELOG
Phase checkpoint 真正完成 → 对本 checkpoint 的 delivered changes 对账并更新 [Unreleased]
2.0 release composition → 再压缩、去重、按 release boundary 过滤
```

禁止：把「以后 checkpoint 再写」当成可以永远不对账。defer 必须有 revisit trigger（与 ADR-0021 Known-Issue Closure 同一纪律）。

### Reconciliation 触发

必须做 CHANGELOG 对账的时刻：

```text
- 一个 Phase checkpoint 关闭
- 一个改变了可观察行为的 Active Plan 到达 Completed
- migration 分支被 merge / promote
- release composition 开始
```

不是「随便一次 review」或 Agent 自判「好像该写了」。

### Checkpoint 对账清单

自上次 CHANGELOG checkpoint 以来，逐项回答；每项要么已在 `[Unreleased]` 中表示，要么显式 no-entry 并写原因（no-entry 理由不必永久存档，checkpoint 当时做一次即可）：

```text
1. What observable behavior changed?
2. What contributor workflow changed?
3. What public/interface path changed?
4. What supported capability changed?
5. What release behavior changed?
```

```text
Deferred writing     可以
Deferred accounting  不可以
```

## `[Unreleased]` 的两层语义

= 已实现、**当前预计**进入下一个正式 release 的 change projection。**不是**所有正在讨论的工作 / 所有 Accepted ADR / 所有 Active Plan / 每个 migration commit 的流水账。

长期 migration 分支上它同时可能表示：

```text
migration checkpoint projection
≠
future 2.0 release projection
```

二者不能等同。四阶段：

```text
Implementation
    ↓
Delivery Candidate          （仓库行为已真实改变）
    ↓
Checkpoint Reconciliation
    ↓
[Unreleased]                （预计进入下一 release 的 delivered changes）
    ↓
Release Composition
    ↓
Released CHANGELOG          （真正跨越 release boundary 的最终投影）
```

## Release composition（C5）

发布前按实际 release boundary 重组 `[Unreleased]`：

```text
Did this change survive into the release boundary?
YES → keep
NO, migration-only scaffolding → normally omit from the released section
```

**Migration Mode 下不做 release composition。** Phase checkpoint 只更新 `[Unreleased]` 并对账；禁止把 checkpoint 切成 `[x.y.z]` 版本节、打 `v*` tag 或走 `skill-release.md`（ADR-0014：checkpoint ≠ Release）。真正的 2.0 composition 发生在退出 Migration Mode 之后。

例如 Dual-mode migration CI 在迁移期间是真实 contributor behavior，应进入 checkpoint 的 `[Unreleased]`；若 2.0 merge 后该机制消失，最终 released 节可以省略——这不是改写历史，因为它从未进入 Released section。

## Released section

= 历史记录，默认不可重写。允许：factual correction / broken pointer correction / 已明确授权的一次性历史整理。不允许：为匹配今天架构或今天的准入政策，把已发布节改写成「仿佛当时就按现行知识架构写作」。

```text
ADR 可以演进，但不能改写历史
CHANGELOG 可以纠错，但不能重写历史
新政策约束未来写法，不反向改造过去
```

**写作语义分界：`[1.0.2]`。** `≤ 1.0.2` 是 Legacy CHANGELOG semantics（delivered change 与根因、验证叙事、rationale、实现过程混写）。`> 1.0.2` / Gen2 migration 按本文件 C1–C5 只写 release-boundary delivered change。不要把前者压成后者的短条目。

已识别的反例：v0.15.0 的 retroactive trim 是 CHANGELOG 自书的「一次性例外」；随后 `60185ef` 压缩已发布 `[1.0.0]` 并插入当时不存在的 ADR 引用，见 FINDING-0009。再按新规则全量精简 released 节，是重复该失败模式。

有科研价值 ≠ CHANGELOG 是这些知识今天应继续存在的唯一位置。旧节保持原文作 provenance；值得长期研究的失效模式提炼进 Research / Finding；未来新条目只写 delivered change。Git commit 与 CHANGELOG 时间语义不同：commit 记录某次变更做了什么；CHANGELOG 记录到某个 release boundary 维护者认为哪些变化应被声明为已交付——二者重合也不互相替代。

## 格式契约

统一格式（版本节、分类标题、空行、列表分隔）的权威是 `references/policies/lifecycle.policy.md` § CHANGELOG 结构契约（shared 格式语义，repo 作为 consumer 遵循）；`scripts/check-doc-consistency.js` changelogCoverage 集群机械校验。
