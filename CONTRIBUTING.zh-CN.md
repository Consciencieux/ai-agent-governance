# 贡献指南

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

## 开发

```bash
npm test        # 或 node tests/run-tests.js
```

CI 为双模式（ADR-0014）：在 `main` / 1.x 上完整门禁组（`npm run check`）阻断；在 `migration/2.0-governance-architecture` 上只有重构安全内核阻断（JS 语法 + `--suite security/generator/payload`），第一代 `npm run check` 仅作观测。

## 各目录用途

完整仓库布局——每个目录及其角色、直到单个脚本——记录在 [docs/product/zh-CN/architecture.md](docs/product/zh-CN/architecture.md)（Repository Layout，单一事实源）。此处仅保留指针：

| 路径 | 记录于 |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | `docs/product/zh-CN/architecture.md` § Repository Layout |
| `tests/run-tests.js` | 测试入口——`npm test` 运行 |
| `docs/` 树 · `docs/glossary.md` · `docs/design-decisions/` · `docs/plans/archive/` | 各语言文档、术语表、ADR、归档 |

**新文件放哪里？** 先判断知识类型，再决定路径和语言（不要先按语言选目录）：

- 仓库知识对象（产品 / 研究 / 发现 / 决策 / 路线图 / 计划 / 术语）→ `docs/README.md` 的路由表
- 技能安装产物与物化源 → `SKILL.md`、`references/`、`scripts/`，按 `docs/product/zh-CN/architecture.md` 的分发角色放置。**不要**把「生成机制」当成进入 `references/` 的分类标准；`references/templates/` 只是物化模板的当前位置，可执行指令源与 boilerplate 不是同一类（FINDING-0026）
- 测试、CI 等开发基础设施 → `tests/`、`.github/` 等

## 语言政策（按受众）

- **Agent 面向的文件一律单语** —— `SKILL.md`、`AGENTS.md`、`references/**` 以及生成产物的正文（AGENTS.md、rules、子技能）绝不携带第二语言段落。惯例：本 skill 自身的执行文档（`SKILL.md`、`references/policies`、`references/workflows`）用中文；自动加载的 Agent 指引（`AGENTS.md`、模板正文）用英文。
- **`docs/` 内语言跟知识类型走，不是整棵树一种语言。** **用户面向的产品文档**三语且拆分——六个 README / CONTRIBUTING 入口文件在仓库根目录；其余产品文档在 `docs/product/{en,zh-CN,zh-TW}/`。**简体中文（zh-CN）是源语言**——修改从简体发起，再同步到英文与繁体中文（台湾用语）。改一种语言必须**在同一次改动里同步另两种**（稳定文档）；活跃草稿可延迟翻译至内容稳定，但 push/release 前必须补齐（parity 闸门兜底；`main` 上阻断，迁移分支上按迁移模式观测）。结构一致性由 `repo-tools/check-doc-parity.js` 强制（CI + 发布前置 `docs.parity_passed`）。**路线图**（`docs/plans/roadmap/`）三语。**计划 / 发现 / 研究 / ADR** 是简体中文规范单语，不参与三语 parity。
- **术语** —— 引入新术语前先查 `docs/glossary.md`，缺失则补三语条目；所有文件保持同一译法。

## 修改治理工件

`SKILL.md`、`references/`、`scripts/` 定义治理框架本身。本 skill 仓库的发布遵循其自身流程（见 `repo-workflows/skill-release.md`）：

1. 更新 `CHANGELOG.md`（分类：纯文档 → 不记；修复 → Fixed；新能力 → Added；破坏性 → Changed）
2. 升 `package.json` 版本（SemVer：破坏性 → MAJOR，新能力 → MINOR，修复 → PATCH）
3. 保持版本一致：package.json · CHANGELOG · SKILL.md frontmatter · `references/init-spec.json` 默认值 · `scripts/generate-governance.js` 哨兵值 · tag
4. push 前必须 `npm test`
5. 仅通过 `release-manager` 流程发布（前置检查 → 版本同步 → 校验 → tag → push → GitHub Release）

## 开发工作流

1. 从当前工作分支拉出短生命周期分支：1.x 稳定工作从 `main`；2.0 迁移从 `migration/2.0-governance-architecture`（一个分支只做一个逻辑变更；迁移模式见 ADR-0014）
2. 检查受影响面：读变更触及的文件及其引用；分类变更（文档 / 治理机制 / 脚本校验器 / 测试 / CI-发布）——分类决定验证范围
3. 实施变更，遵循上文语言与 parity 规则
4. 运行与变更范围匹配的检查（见下方验证要求）；迁移分支上安全内核阻断，第一代门禁仅作观测
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

较窄条目对各自范围 fail-closed；不确定时**升级到更大范围**——绝不缩小验证。**稳定 1.x 与 2.0 迁移：** 在 `main` 上这些门禁阻断；在 `migration/2.0-governance-architecture` 上只有重构安全内核阻断，第一代 `npm run check*` 仅作观测（ADR-0014）。哪些门禁是 advisory 而非 fail-closed、通过各意味着什么，见 `AGENTS.md` § Validation。

## 提交约定

英文 Conventional Commits：`feat(scope): subject` / `fix(scope): subject`。绝不提交生成的运行时输出（`.governance/validation.json`、`.governance/drift-report.json`、`.governance/release-proposal.json` 已被 git 忽略）。

## AI 辅助贡献

欢迎 AI 辅助开发。贡献者对理解、测试、评审与验证生成变更负最终责任。AI 输出不覆盖仓库的单一事实源文件、治理策略或验证要求。

对可能敏感的安全问题，请勿在公开 issue 中发布机密或利用细节。

## License

[MIT](LICENSE) © 2026 Consciencieux
