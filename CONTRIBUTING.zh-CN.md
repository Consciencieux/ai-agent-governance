# 贡献指南

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

## 开发

```bash
npm test        # 或 node tests/run-tests.js
```

CI 每次 push/PR 运行。

## 各目录用途

完整仓库布局——每个目录及其角色、直到单个脚本——记录在 [docs/product/zh-CN/architecture.md](docs/product/zh-CN/architecture.md)（Repository Layout，单一事实源）。此处仅保留指针：

| 路径 | 记录于 |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | `docs/product/zh-CN/architecture.md` § Repository Layout |
| `tests/run-tests.js` | 测试入口——`npm test` 运行 |
| `docs/` 树 · `docs/glossary.md` · `docs/design-decisions/` · `docs/plans/archive/` | 各语言文档、术语表、ADR、归档 |

**新文件放哪里？** 如果文件定义 Agent 必须遵循的治理行为或生成机制 → `references/`；如果是项目知识——开发者与在本仓库工作的 Agent 共享读取如何用、维护、贡献 → `docs/<语言>/`；测试、CI 等开发基础设施放入对应目录（`tests/`、`.github/` 等）。

## 语言政策（按受众）

- **Agent 面向的文件一律单语** —— `SKILL.md`、`AGENTS.md`、`references/**` 以及生成产物的正文（AGENTS.md、rules、子技能）绝不携带第二语言段落。惯例：本 skill 自身的执行文档（`SKILL.md`、`references/policies`、`references/workflows`）用中文；自动加载的 Agent 指引（`AGENTS.md`、模板正文）用英文。
- **开发者面向的文件三语且拆分** -- 根目录保留英文主页与三语入口文件（`README.md`、`README.zh-CN.md`、`README.zh-TW.md`、`CONTRIBUTING.md`、`CONTRIBUTING.zh-CN.md`、`CONTRIBUTING.zh-TW.md`）；其他用户-facing 文档位于 `docs/product/{en,zh-CN,zh-TW}/`。**简体中文（zh-CN）是源语言** -- 修改从简体发起，再同步到英文与繁体中文（台湾用语）。改一种语言必须**在同一次改动里同步另两种**（稳定文档）；活跃草稿可延迟翻译至内容稳定，但 push/release 前必须补齐（parity 闸门兜底）。结构一致性由 `repo-tools/check-doc-parity.js` 强制（CI + 发布前置 `docs.parity_passed`）。
- **术语** —— 引入新术语前先查 `docs/glossary.md`，缺失则补三语条目；所有文件保持同一译法。

## 修改治理工件

`SKILL.md`、`references/`、`scripts/` 定义治理框架本身。本 skill 仓库的发布遵循其自身流程（见 `repo-workflows/skill-release.md`）：

1. 更新 `CHANGELOG.md`（分类：纯文档 → 不记；修复 → Fixed；新能力 → Added；破坏性 → Changed）
2. 升 `package.json` 版本（SemVer：破坏性 → MAJOR，新能力 → MINOR，修复 → PATCH）
3. 保持版本一致：package.json · CHANGELOG · SKILL.md frontmatter · `references/init-spec.json` 默认值 · `scripts/generate-governance.js` 哨兵值 · tag
4. push 前必须 `npm test`
5. 仅通过 `release-manager` 流程发布（前置检查 → 版本同步 → 校验 → tag → push → GitHub Release）

## 开发工作流

1. 从 `main` 创建分支（短生命周期，一个分支只做一个逻辑变更）
2. 检查受影响面：读变更触及的文件及其引用；分类变更（文档 / 治理机制 / 脚本校验器 / 测试 / CI-发布）——分类决定验证范围
3. 实施变更，遵循上文语言与 parity 规则
4. 运行与变更范围匹配的检查（见下方验证要求）
5. 提交前自查 diff：暂存文件、无生成产物、无无关编辑
6. 用 Conventional Commit 提交（见提交约定）、推送分支、开 PR

## 验证要求

| 检查 | 角色 | 何时 |
| --- | --- | --- |
| `npm run check:docs` | Gate | 文档（`docs/`、README、CONTRIBUTING）变更 |
| `npm run check:payload` | Gate | `references/` / `scripts/` / `SKILL.md` / LICENSE 变更 |
| `npm run check:tests` | Gate | `tests/` 变更 |
| `npm run check` | Gate | 默认 / 范围不确定 |
| `npm run check:all` | 巡检 | 巡检前，或显式全量巡检 |
| `npm run check:skill-release` | 发布 | 发布前，按 `repo-workflows/skill-release.md` |

较窄条目对各自范围 fail-closed；不确定时**升级到更大范围**——绝不缩小验证。哪些门禁是 advisory 而非 fail-closed、通过各意味着什么，见 `AGENTS.md` § Validation。

## 提交约定

英文 Conventional Commits：`feat(scope): subject` / `fix(scope): subject`。绝不提交生成的运行时输出（`.governance/validation.json`、`.governance/drift-report.json`、`.governance/release-proposal.json` 已被 git 忽略）。

## AI 辅助贡献

欢迎 AI 辅助开发。贡献者对理解、测试、评审与验证生成变更负最终责任。AI 输出不覆盖仓库的单一事实源文件、治理策略或验证要求。

对可能敏感的安全问题，请勿在公开 issue 中发布机密或利用细节。

## License

[MIT](LICENSE) © 2026 Consciencieux
