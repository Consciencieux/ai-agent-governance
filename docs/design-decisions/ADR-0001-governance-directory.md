# ADR-0001: 用 `.governance/` 取代旧的 `.agent/` 状态目录


- 状态：Accepted（v0.3.1）
- 日期：2026

## 背景

最初的引导使用 `.agent/` 作为机器可读的治理状态目录。出现两个问题：

1. `.agents/`（复数）是跨 Agent 的标准 skill 安装层（如 `.agents/skills/...`），`.agent/`（单数）与它持续混淆。
2. `.agent/` 暗示"Agent 的目录"，即 Agent 拥有仓库，而非治理状态层。

## 决策

用 `.governance/` 作为治理状态目录（manifest / state / validation / preflight / 生成的子技能）。旧 `.agent/` 语义从运行期行为中移除，仅存于 CHANGELOG 历史。

## 后果

- 语义清晰：`.agents/` = 安装层，`.governance/` = 状态层，`AGENTS.md` = 行为契约。
- 新项目获得新布局；校验器只认 `.governance`，不产生 `.agent` 目录。
