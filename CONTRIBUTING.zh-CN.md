# 贡献指南

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md) · [繁體中文](CONTRIBUTING.zh-TW.md)

## 开发

```bash
npm test                 # 或 node tests/run-tests.js
npm run check:must-ship  # CI 阻断门禁（必装机械集合）
```

CI（ADR-0014 Migration Mode **已退出**；PLAN-0052）：所有分支 / PR 的阻断权威是 `npm run check:must-ship`。本地仍可跑 `npm run check`，**不是** CI 作业。发布另走 `repo-workflows/skill-release.md`。

## 各目录用途

完整仓库布局——每个目录及其角色、直到单个脚本——记录在 [docs/product/zh-CN/architecture.md](docs/product/zh-CN/architecture.md)（Repository Layout，单一事实源）。此处仅保留指针：

| 路径 | 记录于 |
| --- | --- |
| `SKILL.md` · `references/` · `scripts/` | `docs/product/zh-CN/architecture.md` § Repository Layout |
| `tests/run-tests.js` | 测试入口——`npm test` 运行 |
| `docs/` 树 · `docs/glossary.md` · `docs/design-decisions/` · `docs/plans/archive/` | 各语言文档、术语表、ADR、归档 |

**新文件放哪里？** 先判断知识类型，再决定路径和语言（不要先按语言选目录）：

- 仓库知识对象（产品 / 研究 / 发现 / 决策 / 路线图 / 计划 / 术语）→ `docs/README.md` 的路由表
- 技能安装产物与物化源 → `SKILL.md`、`references/`、`scripts/`，按 `docs/product/zh-CN/architecture.md` 的分发角色放置。目录按语义责任分类（ADR-0026）：指令源在 `references/instruction/`；`references/templates/` 只收留物化模板。
- 测试、CI 等开发基础设施 → `tests/`、`.github/` 等

## 语言政策（按受众）

- **Agent 面向的文件一律单语** —— `SKILL.md`、`AGENTS.md`、`references/**` 以及生成产物的正文（AGENTS.md、rules、子技能）绝不携带第二语言段落。惯例：本 skill 自身的执行文档（`SKILL.md`、`references/policies`、`references/workflows`）用中文；自动加载的 Agent 指引（`AGENTS.md`、模板正文）用英文。
- **`docs/` 内语言跟知识类型走，不是整棵树一种语言。** **用户面向的产品文档**三语且拆分——六个 README / CONTRIBUTING 入口文件在仓库根目录；其余产品文档在 `docs/product/{en,zh-CN,zh-TW}/`。**简体中文（zh-CN）是源语言**——修改从简体发起，再同步到英文与繁体中文（台湾用语）。改一种语言必须**在同一次改动里同步另两种**（稳定文档）；活跃草稿可延迟翻译至内容稳定，但 push/release 前必须补齐（parity 闸门兜底）。结构一致性由 `repo-tools/check-doc-parity.js` 强制（CI + 发布前置 `docs.parity_passed`）。**路线图**（`docs/plans/roadmap/`）三语。**计划 / 发现 / 研究 / ADR** 是简体中文规范单语，不参与三语 parity。
- **术语** —— 引入新术语前先查 `docs/glossary.md`，缺失则补三语条目；所有文件保持同一译法。

## 修改治理工件

`SKILL.md`、`references/`、`scripts/` 定义治理框架本身。本 skill 仓库的发布遵循其自身流程（见 `repo-workflows/skill-release.md`）：

1. 更新 `CHANGELOG.md`（分类：纯文档 → 不记；修复 → Fixed；新能力 → Added；破坏性 → Changed）
2. 升 `package.json` 版本（SemVer：破坏性 → MAJOR，新能力 → MINOR，修复 → PATCH）
3. 保持版本一致：package.json · CHANGELOG · SKILL.md frontmatter · `references/init-spec.json` 默认值 · `scripts/lib/generate/run.js` 哨兵值 · tag
4. push 前必须 `npm test`；合入 `main` 前 `npm run check:must-ship` 必须绿
5. 仅通过 `release-manager` 流程发布（前置检查含 `gates.must_ship` → 版本同步 → 校验 → tag → 推送已批准分支与 tag → GitHub Release 说明；技能 tarball 优先由 tag CI 上传）

## 开发工作流

1. 从 `main` 拉出短生命周期分支（一个分支只做一个逻辑变更）
2. 检查受影响面：读变更触及的文件及其引用；分类变更（文档 / 治理机制 / 脚本校验器 / 测试 / CI-发布）——分类决定验证范围
3. 实施变更，遵循上文语言与 parity 规则
4. 运行与变更范围匹配的检查（见下方验证要求）；合入前 `npm run check:must-ship` 必须绿
5. 提交前自查 diff：暂存文件、无生成产物、无无关编辑
6. 用 Conventional Commit 提交（见提交约定）、推送分支、开 PR

## 验证要求

宣布完成前跑与变更范围匹配的门禁组；巡检前跑 `npm run check:all`；发布前跑 `npm run check:skill-release`（含 `--release-gate` 失败即阻断簇），见 `repo-workflows/skill-release.md`。记录真实输出，禁止声称「应该能过」。**CI 阻断权威 = `npm run check:must-ship`**（ADR-0014 已退出；ADR-0024；PLAN-0052 已移除 Gen1 CI 观测作业）。

### 范围分级

按 `git diff --name-only` 前缀匹配最窄一行。范围不确定时升级，绝不缩小验证。各门禁同为 fail-closed 退出语义，仅运行集合不同。

| 范围 | 何时使用 | 运行内容 |
| --- | --- | --- |
| `npm run check:docs` | 变更 `docs/`、`README.md`、`CONTRIBUTING.md`、`architecture.md` | test + parity + consistency + layout |
| `npm run check:payload` | 变更 `references/`、`scripts/`、`SKILL.md`、`LICENSE` | test + layout + consistency + role-completeness + hygiene |
| `npm run check:tests` | 变更 `tests/`、`.gitattributes` | test + hygiene |
| `npm run check:full` | 默认、范围不定、或显式全量 | test + parity + layout + consistency + hygiene + role-completeness |
| `npm run check:all` | 巡检或显式全量巡检 | check + freshness + plan delivery |
| `npm run check:file-size` | 文件肥胖信号 / 巡检 | 顾问级行数预算（`--gate` 仅 review 档失败）；不在日常 `check` |
| `npm run check:must-ship` | 合入 / 发布 CI | 仅 must-ship 机械集合 |

### 各门禁证明什么（证据分层）

| 门禁 | 检查内容 | 证据分层 | 通过含义 |
| --- | --- | --- | --- |
| `npm test` | `tests/suites/*.test.js` | mechanical | 变更范围条件满足 |
| `check-doc-parity.js` | 三语树结构 | mechanical | 结构平行（≠语义等价） |
| `check-layout-sync.js` | architecture.md ×3 与扫描目录 | mechanical | 新文件有文档归属 |
| `check-doc-consistency.js --gate` | 跨文档事实簇（冻结；新检查优先独立脚本） | mechanical | 声明与源一致 |
| `check-coding-hygiene.js --gate` | 套件归属、残留标记 | mechanical | 测试架构完整 |
| `check-role-completeness.js --gate` | 角色分类 / 打包 | mechanical | 分发契约完整 |
| `check-doc-freshness.js` | 陈旧文档 / 译文滞后 | mechanical（报告；`--release-gate` 阻断） | 未检出机械陈旧 |
| `check-plan-delivery.js` | 计划声明 vs 交付路径 | mechanical | 声明文件/标识存在 |
| `check-file-size-budget.js` | soft/review 行数预算（按对象类） | advisory（机械计数；是否拆分由人定） | 列出超 soft/review；不是拆分裁决 |
| `verify_governance.js` | 治理产物存在性 | mechanical | 本仓默认模式按设计失败（ADR-0006） |

证据分层：**mechanical** = 标记/路径/结构/存在（通过 ≠「行为正确」）；**human-attested** = 需人工（当前无自动门禁产出）；**unverified claim** = 仅声明、无独立核验。

### 影响面检查

触及公共接口/模块/文件前，先 `rg "<name>"`；命中列入 Affected Files。收尾用 `git diff --name-only` 对照：已列未改 → 补做或说明；已改未列 → 解释或回退。并对照计划 `Target`：域外改动必须说明或回退。

### 引用闭包检查

载荷工作，以及「架构是否健全 / 规则是否混杂 / skill 是否可用」类问题：影响面只解决**本仓内**引用，对装机物不够。INSTALLED 文件写在有 `references/workflows/release.md` 处、读在没有它的处。绿门禁 ≠ 目标闭包。按路由走：

1. **引用闭包** — 每个 INSTALLED 文件引用的路径/命令/脚本须在**被治理项目**中存在。
2. **阶段闭包** — 每阶段自有输出须满足该输出声明的契约。
3. **干净目标核验** — 打包 → INIT 临时项目 → 在**那里**跑规则/脚本/子技能。
4. **反向依赖** — 禁止：被治理规则 → 本仓 `docs/`；生成子技能 → SKILL-INTERNAL 脚本；INSTALLED → 本仓 `package.json`；Phase A → Phase B/C 文件。

按可解析性枚举，禁止抽样「看起来像本仓」的行。姿态参考：`scripts/check-doc-consistency.js`。Agent always-on 指针：`AGENTS.md` § Reference-closure check。

## 提交约定

英文 Conventional Commits：`feat(scope): subject` / `fix(scope): subject`。绝不提交生成的运行时输出（`.governance/validation.json`、`.governance/drift-report.json`；被治理项目另有 `.governance/release-proposal.json`；本仓使用 `repo-tools/.release/proposal.json`——均已被 git 忽略）。

## AI 辅助贡献

欢迎 AI 辅助开发。贡献者对理解、测试、评审与验证生成变更负最终责任。AI 输出不覆盖仓库的单一事实源文件、治理策略或验证要求。

对可能敏感的安全问题，请勿在公开 issue 中发布机密或利用细节。

## License

[MIT](LICENSE) © 2026 Consciencieux
