# Bootstrap 输出

[English](../en/bootstrap-output.md) · [简体中文](bootstrap-output.md) · [繁體中文](../zh-TW/bootstrap-output.md)

INIT 脚本化生成器（`scripts/generate-governance.js`）为被治理项目产出**确定性**的引导文件树。机器可读的单一事实源是 `references/init-spec.json`；本页是给人看的人肉摘要——两者冲突时以规范为准。

## Phase A — 静态骨架

| 路径 | 来源 |
| --- | --- |
| docs/rules/lifecycle.md | references/policies/lifecycle.policy.md |
| docs/rules/git-policy.md | references/policies/git.policy.md |
| docs/rules/security.md | references/policies/security.policy.md |
| docs/rules/coding.md | references/policies/coding.policy.md |
| docs/rules/testing.md | references/policies/testing.policy.md |
| docs/rules/governance-files.md | references/policies/governance-files.policy.md |
| AGENTS.md | references/templates/agents-md.template.md（占位符已解析） |
| CHANGELOG.md | 静态（Keep a Changelog，含 Unreleased 段） |
| README.md | 静态引导 + 文档索引 |
| docs/features/ | 目录占位 + _TEMPLATE.md（功能模板，含反虚构规则） |
| docs/plans/ + docs/plans/archive/ | 目录（归档按生命周期 Phase 5） |
| docs/plans/DEVELOPMENT_PLAN.md | 静态里程碑计划 |
| docs/ARCHITECTURE.md | 静态骨架（组件登记表 + ADR） |

## Phase B — 配置、状态与脚本

| 路径 | 来源 |
| --- | --- |
| .gitignore | 生成（安全基线，确定性） |
| .env.example | references/templates/env-example.template.md |
| .gitmessage.txt | references/templates/gitmessage.template.md |
| .governance/ + .governance/README.md | 目录 + 静态说明 |
| .governance/manifest.json | 最后生成——只列出磁盘上实际存在的工件 |
| .governance/state.json / preflight.json | 生成（确定性；preflight 字段留空至 Phase 0 检测填写） |
| .governance/git-policy.json / sync-rules.json | 模板（JSON 从代码块提取） |
| scripts/verify-governance.js + 4 个门禁脚本 | 从本 skill 原样复制 |

## Phase C — 结构适配与可选钩子

| 路径 | 来源 |
| --- | --- |
| .github/workflows/ci.yml（或 .gitlab-ci.yml） | 从 references/workflows/ci.md 按输入选择 |
| scripts/check-doc-freshness.js + check-doc-consistency.js | 从本 skill 原样复制 |
| scripts/release-manager.js | 从本 skill 原样复制（生成的 release-manager 子技能会调用它） |
| .governance/generated/skills/ | 从 references/templates/sub-skills.md 生成 |
| .githooks/pre-commit + .githooks/commit-msg | references/templates/githooks-template.md；可执行、可选启用，INIT 不自动启用 |

## 确定性与验证

- 相同输入产出字节级一致的输出（无时间戳、无随机）。
- 已存在的文件跳过、绝不覆盖（合并不覆盖留到 Phase C）。
- Phase B 输出通过 `scripts/verify-governance.js`（manifest 模式）——由 `tests/run-tests.js` 的端到端测试覆盖。

CI 工作流选择、按工具检测的入口文件、README 语言布局与结构适配模式（既有文档根）仍由 Agent 根据输入决定；选择后，Phase C 列出的工件由生成器产出。
