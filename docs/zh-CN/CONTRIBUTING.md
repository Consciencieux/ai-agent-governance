# 贡献指南

[English](../../CONTRIBUTING.md) · [简体中文](CONTRIBUTING.md) · [繁體中文](../zh-TW/CONTRIBUTING.md)

## 开发

```bash
npm test        # 或 node tests/run-tests.js
```

测试套件覆盖：空项目（exit 1）、完整默认结构（exit 0，21 项检查）、自定义文档根经 manifest（manifest 模式）、缺 governance_version（exit 1）、`--json` 输出、`--help`、无 `.agent` 残留、`validation.json` 可选、CHANGELOG 格式检查、锁检查（无状态 / 未持锁 / 持锁）、Git 策略检查（非法策略 / 受保护分支阻止 / 特性分支通过）、密钥扫描（命中 exit 1 且不泄露 token / 干净 exit 0 / 缺门禁使校验器失败）、发布规划（SemVer 分类：docs/重构 → patch、CLI 命令 → minor、删除公开 API → major、不确定性 → 澄清、`--file` 输入）与审批门禁（未批准 → 无 tag，批准 → 创建 annotated tag）、文档一致性（三树平行 exit 0 / 标题漂移 exit 1 / 缺失文件 exit 1）、知识新鲜度（git log 日期检测 stale/very-stale）、内容一致性（干净 exit 0 / 版本示例标记 / 坏链标记）与 --json score（全过 1.0 / 部分 0.95）。CI 每次 push/PR 运行。

## 各目录用途

| 路径 | 用途 |
| --- | --- |
| `SKILL.md` | skill 入口 / 产品规格 —— INIT/AUDIT/RELEASE 编排 |
| `references/` | skill 本体 —— skill 行为唯一所在地：`templates/`（生成模板）· `policies/`（`*.policy.md` 规则，复制进被治理项目的 `docs/rules/`）· `workflows/`（CI + 发布规范） |
| `scripts/verify_governance.js` | 校验器源码，复制进被治理项目 |
| `scripts/release-manager.js` | 发布工具：`plan`（只读）+ `execute`（审批门禁） |
| `scripts/generate-governance.js` | INIT 生成器：确定性引导脚手架（规范：`references/init-spec.json`） |
| `references/init-spec.json` | 机器可读 INIT 规范（生成产出的单一事实源） |
| `tests/run-tests.js` | 测试套件 |
| `docs/en/` `docs/zh-CN/` `docs/zh-TW/` | 项目知识 —— 开发者维护，开发者与本仓库工作的 Agent 共享读取（怎么用 skill：触发词、计划、路线图），每种语言一棵目录树；不属于 skill 载荷 |
| `docs/glossary.md` | 三语术语对照表（术语的单一事实源） |
| `docs/design-decisions/` | 架构决策记录（共享，简体单语） |
| `docs/archive/` | 已完成计划归档（共享，单语，绝不翻译） |

**新文件放哪里？** 如果删掉该文件会导致 Agent 无法执行（INIT/AUDIT/RELEASE 需要读它）→ `references/`；如果是项目知识——开发者与在本仓库工作的 Agent 共享读取如何用、维护、贡献 → `docs/<语言>/`。

## 语言政策（按受众）

- **Agent 面向的文件一律单语** —— `SKILL.md`、`AGENTS.md`、`references/**` 以及生成产物的正文（AGENTS.md、rules、子技能）绝不携带第二语言段落。惯例：本 skill 自身的执行文档（`SKILL.md`、`references/policies`、`references/workflows`）用中文；自动加载的 Agent 指引（`AGENTS.md`、模板正文）用英文。
- **开发者面向的文件三语且拆分** -- 根目录只保留英文主页（`README.md`、`CONTRIBUTING.md`）；简体/繁体翻译下沉到各自语言树（`docs/zh-CN/README.md`、`docs/zh-TW/README.md`…）。**简体中文（zh-CN）是源语言** -- 修改从简体发起，再同步到英文与繁体中文（台湾用语）。改一种语言必须**在同一次改动里同步另两种**（稳定文档）；活跃草稿可延迟翻译至内容稳定，但 push/release 前必须补齐（parity 闸门兜底）。一致性映射：英文入口文件即根目录 `README.md`/`CONTRIBUTING.md`（不在 `docs/en/` 下重复）。结构一致性由 `repo-tools/check-doc-parity.js` 强制（CI + 发布前置 `docs.parity_passed`）。
- **术语** —— 引入新术语前先查 `docs/glossary.md`，缺失则补三语条目；所有文件保持同一译法。

## 修改治理工件

`SKILL.md`、`references/`、`scripts/` 定义治理框架本身。改动遵循发布策略（见 `references/workflows/release.md`）：

1. 更新 `CHANGELOG.md`（分类：纯文档 → 不记；修复 → Fixed；新能力 → Added；破坏性 → Changed）
2. 升 `package.json` 版本（SemVer：破坏性 → MAJOR，新能力 → MINOR，修复 → PATCH）
3. 保持版本一致：package.json · CHANGELOG · tag
4. push 前必须 `npm test`
5. 仅通过 `release-manager` 流程发布（前置检查 → 版本同步 → 校验 → tag → push → GitHub Release）

## 提交约定

英文 Conventional Commits：`feat(scope): subject` / `fix(scope): subject`。绝不提交生成的运行时输出（`.governance/validation.json`、`.governance/drift-report.json`、`.governance/release-proposal.json` 已被 git 忽略）。
