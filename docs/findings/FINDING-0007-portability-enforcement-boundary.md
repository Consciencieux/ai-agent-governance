---
id: FINDING-0007
status: Confirmed
type: architecture-gap
observed_in: gen1
---

# FINDING-0007：可移植性与运行时强制执行的天然冲突：执行边界未定义

## 分类

- 严重度：高
- 影响范围：repo、skill
- 研究方向：F. 可移植性 / 运行时边界

## 观察

项目定位 tool-agnostic（Claude Code / Cursor / Codex / opencode），但真正严格的 tool-call enforcement（before_write / before_delete / before_shell）需要接入每个宿主工具的 hooks / middleware / policy API。完全 portable 的核心无法同时天然提供所有 runtime-level hard enforcement。

## 证据

- **F01 hooks 非 hard boundary**：`.githooks/pre-commit` / `commit-msg` 默认不启用、INIT 不配置 `core.hooksPath`、可被 `--no-verify` 绕过、只查 consent/staged files/commit message，且项目明确它不是 authorization mechanism。
- **F02 lock 非原子**：`check-lock.js` 只读 `.governance/state.json` 的 `locked` 字段，read-only 检查存在 TOCTOU race——两个 agent 同时读到「未锁」并同时写，无原子 compare-and-set。它是一个 advisory 检查，不是 concurrency-safe lock。
- **F04 分层缺失**：当前没有「Portable Governance Core（rule model / context detection / dispatcher / primitives / evidence / CI-git integration） + Runtime Adapters」的分层。

## 根因

enforcement boundary 候选（AI task completion / git hook / pre-push / CI / release / branch protection / tool call）强度不同且未统一建模：AGENTS rule 可被忘记、hook 可 `--no-verify`、CI 若非 required check 不阻止 merge。没有统一定义「哪一个动作不能绕过哪个 checker」。

## 影响

- 不能称 hard enforcement。
- tool-agnostic 与 runtime interception 冲突未解决，严格 enforcement 依赖宿主 adapter。

## 关闭条件

1. 明确 enforcement boundary 矩阵：哪个动作 + 哪个 checker = 不可绕过。
2. 分层：portable core 负责 policy semantics，adapter 负责 runtime interception。
3. 至少一种 repository-level deterministic enforcement 保持跨工具。

## 解决情况

**2.0 切片关闭（2026-09-12 · skill-release）：** ADR-0024 将本 Finding 的 2.0 blocker 收窄为「干净目标上必装 INSTALLED 引用闭合 + INIT/VERIFY 可跑」。证据：打包 → 空仓 INIT Phase C → 8 子技能 → 目标根 verify **62/62**；仓库级 `check:must-ship` fail-closed。**2.0 blocker 切片关闭。**

**H2d / 2.1 已交付（文档边界，非 hooks hard）：**

| 层 / 动作 | 2.1 状态 | 说明 |
| --- | --- | --- |
| portable_core（政策语义） | 已交付 | 规则/原则/声明式契约；不宣称宿主硬拦截 |
| repo_deterministic（secrets / verify / must-ship / CI） | 已交付 | 跨工具可复现的仓库级 fail-closed 路径 |
| host_adapter（hooks / tool-call before_write） | later | 可选；非必装 |
| `tool_call_before_write` | later | 需宿主 adapter |
| hooks / `--no-verify` 不可绕过 | later | 不在 2.1 必装面 |

机读矩阵文件 `repo-tools/portability-boundary.v0.json` 已在 PLAN-0055 删除（无消费者）；**本表为当前权威边界说明**。Finding 整体保持 Confirmed，直至 later 项有载体。


## 关联

- GitHub Issue #7

## 回归保护

enforcement boundary 矩阵测试：对每个声明的「不可绕过」组合，验证确实存在一条不依赖 Agent 注意力的自动路径。
