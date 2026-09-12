# Anti-Regression System

[English](../en/anti-regression.md) · [简体中文](anti-regression.md) · [繁體中文](../zh-TW/anti-regression.md)

治理不止于搭骨架 —— 它约束每个 Agent 的每次任务，让后来者（新同事的 AI / 新的 Agent）无法破坏前人写好的代码。本页是防乱改机制的开发者地图；每条的完整规范都在 skill 本体里（见下）。

- **入口文件自动加载** — `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/` 每次会话开始自动读取（见 `references/templates/agents-md.template.md`）
- **六阶段操作生命周期** — Understand → Plan → Implement → Validate → Synchronize → Report（见 `references/policies/lifecycle.policy.md`）
- **代码修改/删除保护** — 动已有代码先做上下文分析与归属判定；删除必须理由 + 引用搜索 + 迁移方案（见 `references/policies/coding.policy.md`）
- **变更归位与残留清理** — 删除/重命名/移动/替换/弃用/拆分合并/配置/API/生成物变更时，区分当前层、兼容层和历史层，不留未解释残留（见 `references/policies/lifecycle.policy.md`）
- **规则捕获** — 开发者提出的持久性要求必须分类并明确裁定后才能进入 `AGENTS.md` / `docs/rules/**`；未决候选保存在可恢复状态中（见 `references/policies/lifecycle.policy.md`）
- **CHANGELOG 变更分类** — 纯文档不改；修复 → `Fixed`；新能力 → `Added`；破坏性 → `Changed`（见 `references/policies/lifecycle.policy.md`）
- **治理文件保护** — 受保护文件须 原因 → CHANGELOG → 版本升级 → 跑校验器。权威清单在 `references/policies/governance-files.policy.md`（单一事实源）；本页不复述
- **规则优先级** — 系统/平台安全 > 用户明确要求 > 治理完整性 > AGENTS.md > docs/rules/ > 既有代码约定
- **Agent 权限矩阵** — 读取自动；建文档自动；改代码需验证；删除/依赖/git commit 需确认；push 禁止（见 `references/policies/git.policy.md`）
- **多 Agent 锁** — `.governance/state.json` 的 `locked` 字段；不得并行修改同一文件；从记录阶段续跑（见 `references/templates/sub-skills.md` → state-manager）
- **证据与恢复** — 每项报告基于真实输出，✅/⚠️/❌ 三态；`preflight.json` 回滚快照（见 `references/policies/lifecycle.policy.md`）

---
