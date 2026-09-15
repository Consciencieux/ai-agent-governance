# 贡献指南

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

感谢你对 AI Agent Governance 的关注！我们欢迎各种形式的贡献——Bug 报告、功能建议、文档修正和代码变更。

## 报告问题

- **Bug** — 在 [GitHub Issues](https://github.com/Consciencieux/ai-agent-governance/issues) 提交，附上复现步骤、预期与实际行为、Agent / 工具版本。
- **功能建议** — 提交 Issue，描述使用场景和建议的行为。
- **安全问题** — 请勿在公开 Issue 中发布机密或利用细节。可通过邮件联系维护者或使用 GitHub 的私密漏洞报告。

## 开发环境

```bash
git clone https://github.com/Consciencieux/ai-agent-governance.git
cd ai-agent-governance
npm test                 # 运行测试套件
npm run check:must-ship  # CI 阻断门禁——合入前必须通过
```

无需额外依赖——所有检查都是零依赖的 Node.js 脚本。

## 提交变更

1. 从 `main` 拉出分支——一个分支只做一个逻辑变更
2. 实施变更
3. 运行 `npm test`；文档变更还需 `npm run check:docs`
4. 用 [Conventional Commits](https://www.conventionalcommits.org/) 英文提交：`feat(scope): subject` / `fix(scope): subject`
5. 推送并开 PR

CI 在每个 PR 上运行 `npm run check:must-ship`。绿了就行。

## 语言政策

本项目有三语文档（English、简体中文、繁體中文）：

- **简体中文（zh-CN）是源语言** —— 修改从简体发起，再同步到英文与繁体中文
- 改一种语言必须在同一次变更中同步另两种
- `repo-tools/check-doc-parity.js` 强制结构一致性（CI 中运行）

Agent 面向的文件（`SKILL.md`、`references/**`）一律单语，不参与三语拆分。

## 代码组织

完整仓库布局记录在 [architecture.md](docs/product/zh-CN/architecture.md)（单一事实源）。关键区域：

| 路径 | 角色 |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | 技能载荷（交付给用户） |
| `docs/product/{en,zh-CN,zh-TW}/` | 用户面向的产品文档（三语） |
| `docs/plans/` · `docs/findings/` · `docs/research/` · `docs/design-decisions/` | 内部知识（简体中文单语） |
| `tests/` | 测试套件 |
| `repo-tools/` · `repo-workflows/` | 仅限本仓的工具与工作流 |

**新文件放哪里？** 先判断知识类型（路由表在 [docs/README.md](docs/README.md)），再决定路径和语言。

## 修改治理框架

`SKILL.md`、`references/`、`scripts/` 定义交付给用户的治理框架。这些变更影响更大：

1. 更新 `CHANGELOG.md`（纯文档 → 不记；修复 → Fixed；新能力 → Added；破坏性 → Changed）
2. 升 `package.json` 版本（SemVer）
3. 保持版本一致：`package.json` · `CHANGELOG` · `SKILL.md` frontmatter · `references/init-spec.json` · tag
4. 发布遵循 `repo-workflows/skill-release.md`，需人在环审批

## 验证

按变更范围匹配最窄的检查：

| 变更涉及 | 运行 |
| --- | --- |
| `docs/`、`README`、`CONTRIBUTING` | `npm run check:docs` |
| `references/`、`scripts/`、`SKILL.md` | `npm run check:payload` |
| `tests/` | `npm run check:tests` |
| 范围不确定或范围较广 | `npm run check:full` |
| 合入 / 发布 | `npm run check:must-ship`（CI 门禁） |

所有门禁均为 fail-closed。不确定时升级到更宽范围。完整门禁说明：[architecture.md](docs/product/zh-CN/architecture.md)。

## AI 辅助贡献

欢迎 AI 辅助开发。贡献者对理解、测试、评审与验证生成变更负最终责任。AI 输出不覆盖仓库的单一事实源文件、治理策略或验证要求。

## License

[MIT](LICENSE) © 2026 Consciencieux
