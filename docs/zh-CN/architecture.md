# Architecture

[English](../en/architecture.md) · [简体中文](architecture.md) · [繁體中文](../zh-TW/architecture.md)

本页是仓库布局——本 skill 仓库各目录用途的开发者地图。

skill 的行为（运行模式 INIT/AUDIT/RELEASE、生命周期管线、设计原则）定义在 skill 本体里，不在本页：见 [SKILL.md](../../SKILL.md) 与 `references/`。本页只记录文件都放在哪里。

### 三种分发角色（给任何文件归类前先读这里）

"载荷（payload）"过去同时指三件不同的事——这正是一个仓库专用工具被标成"NOT payload"却放在 `scripts/` 里、以及一个子技能引用了被治理项目根本收不到的工作流文件的原因。改用下面三个互斥角色名；`references/init-spec.json` 是判定角色的机器可读权威：

| 角色 | 定义 | 如何核验 | 例子 |
| --- | --- | --- | --- |
| **INSTALLED（安装到被治理项目）** | INIT 把它写进被治理项目（copy / template / generated）。该项目的 Agent 在运行期读它。 | 在 `init-spec.json` 中作为 `source` 出现（当前数量见 `check-role-completeness.js --gate` 输出） | `references/policies/coding.policy.md` → `docs/rules/coding.md`；`scripts/check-secrets.js`；`agents-md.template.md` → `AGENTS.md` |
| **SKILL-INTERNAL（随 tarball 但不安装）** | 随 tarball 分发（打包整目录复制 `references/` + `scripts/`）且由 **skill 执行器**读取——但 INIT 从不安装它，所以被治理项目里没有这个文件。 | 在 `init-spec.json` 的 `distribution.skillInternal` 中列出 | `references/workflows/release.md`、`references/init-spec.json`、`scripts/generate-governance.js`、`scripts/release-manager.js`、`scripts/package-skill.sh`，以及仅本仓库运行的门禁（`check-doc-parity`、`check-layout-sync`、`check-plan-delivery`、`check-coding-hygiene`、`check-role-completeness`） |
| **REPO-ONLY（仅本仓库）** | 完全不进 tarball。约束在本仓库上的工作。 | 在 `references/`/`scripts/`/`SKILL.md`/`LICENSE` 之外 | `AGENTS.md`、`docs/**`、`tests/**`、`package.json`、`.github/**`、`.gitattributes` |

角色是**人的决定，绝不推断**：`copy`/`template`/`generated`、重命名（`lifecycle.policy.md` → `docs/rules/lifecycle.md`、`verify_governance.js` → `verify-governance.js`）、一对多输出（`githooks-template.md` → `pre-commit` + `commit-msg`）以及 13 条内嵌静态内容工件，都编码了生成器无法从文件树恢复的契约决定。**可机械化的只是抓漏**：`scripts/check-role-completeness.js --gate` 会在出现未分类文件、同时属于两个集合、声明路径已不存在、或角色声明与 `package-skill.sh` 实际打包不符时失败。角色确实未决的文件放进 `distribution.undecided` 并记录待裁定问题，该门禁保持红色直到裁定——目前是 `governance-files.policy.md`（一个 INSTALLED 的检查器读它，但它自己没被安装）与 `feature-doc.template.md`（SKILL.md 让 Agent 复制一个被治理项目没有的文件）。

由此得出两条规则，且在本表存在之前两条都被违反过：

1. **SKILL-INTERNAL 文件绝不能被当作被治理项目的规则来源引用**（那里没有这个文件）。子技能与生成的 AGENTS.md 文本只能指向 INSTALLED 路径——`docs/rules/*`、被治理项目自己的 `AGENTS.md`、或复制过去的 `scripts/*`。
2. **SKILL-INTERNAL 脚本在本仓库形态之外必须 no-op**，因为打包仍会带上它。`check-coding-hygiene.js` 的做法是：缺少套件布局时报告 `applicable: false`。

### 目录职责

| 路径 | 职责 | 读者 | 语言 |
| --- | --- | --- | --- |
| `SKILL.md` | Skill 入口 / 产品规范 | agent（skill 使用者） | 单语 |
| `references/` | **Skill 主体——skill 行为唯一存放处。** INSTALLED 与 SKILL-INTERNAL 混装（见角色表）。 | agent（skill 使用者） | 单语 |
| `scripts/` | Skill 运行时脚本。同样混装：7 个是 INSTALLED（复制进被治理项目），其余是只在本仓库运行的 SKILL-INTERNAL 工具。 | agent/CI | 代码 |
| `LICENSE` | MIT 许可证——随 tarball 分发 | 安装者 | — |
| `docs/` | **项目知识。REPO-ONLY。** 开发者维护，供开发者与在本仓库工作的 Agent 读取：如何使用 skill（`commands.md` 触发词）、设计计划（`plans/`）、路线图、术语表。 | 开发者 + Agent | 三语 |
| `tests/`、`package.json`、`.github/`、`CHANGELOG.md`、`CONTRIBUTING.md`、`README.md`、`AGENTS.md`、`.gitattributes` | REPO-ONLY 基础设施：CI、发布流程、变更日志、贡献指南 | 仓库维护者 | 按文件 |

### 仓库布局

```
ai-agent-governance/
├── SKILL.md                    # skill 入口 / 产品规格
├── references/                 # skill 本体——skill 行为唯一所在地
│   ├── init-spec.json          # 机器可读 INIT 规范（generate-governance.js 的单一事实源）
│   ├── templates/
│   │   ├── agents-md.template.md   # AGENTS.md 模板
│   │   ├── feature-doc.template.md # Feature 文档模板（含反虚构规则）
│   │   ├── sub-skills.md           # 生成 skill 的来源；每个会变成 .governance/generated/skills/<name>/SKILL.md，不是脚本
│   │   ├── env-example.template.md # .env.example 模板（占位符、按依赖裁剪）
│   │   ├── gitmessage.template.md  # .gitmessage.txt 模板（提交约定）
│   │   ├── git-policy.template.md  # .governance/git-policy.json 模板（Git 工作流策略）
│   │   ├── githooks-template.md     # 可选 .githooks/pre-commit + commit-msg 模板
│   │   └── sync-rules.template.md  # .governance/sync-rules.json 模板（同步组）
│   ├── policies/
│   │   ├── lifecycle.policy.md / git.policy.md / security.policy.md / coding.policy.md / testing.policy.md
│   │   └── governance-files.policy.md   # 受保护文件 + .governance Git 跟踪策略
│   └── workflows/
│       ├── ci.md               # CI 模板（能力检测 + 降级）
│       └── release.md          # 发布前置检查 + 版本一致性
├── scripts/                    # skill 运行时脚本
│   ├── verify_governance.js    # 校验引擎（manifest 驱动路径 + governance_version）
│   ├── check-lock.js           # 多 Agent 锁检查（只读，exit 1 = 持锁）
│   ├── check-git-policy.js     # Git 工作流门禁（受保护分支 + directPush=false → exit 1）
│   ├── check-secrets.js        # 密钥扫描门禁（暂存区扫描，绝不打印密钥）
│   ├── check-sync.js           # 同步组门禁（watch/require 对照，exit 1）
│   ├── check-coding-hygiene.js # 编码卫生（SKILL-INTERNAL：测试归属 + 残留标记）
│   ├── check-role-completeness.js # 分发角色完整性（SKILL-INTERNAL：未分类/重叠/失效路径/打包边界）
│   ├── check-doc-freshness.js  # 文档过时度 + 译文新鲜度（git log 日期；建议性，--release-gate 阻断过时/draft 译文）
│   ├── check-doc-consistency.js # 文档一致性 + consent/受保护清单/原则索引/计划状态/术语簇（默认建议性；--gate/--release-gate fail-closed；changelog 覆盖仅 --release-gate fail-closed）
│   ├── check-doc-parity.js     # trilingual tree parity (CI + release precondition)
│   ├── check-layout-sync.js    # architecture.md 仓库布局 vs references/ + scripts/（fail-closed 门禁）
│   ├── check-plan-delivery.js  # 计划声明 vs 实际交付（归档前门禁）
│   ├── generate-governance.js  # INIT 脚本化生成器（确定性引导，规范：references/init-spec.json）
│   ├── package-skill.sh        # 发布载荷 tarball 打包
│   └── release-manager.js      # plan（只读）+ execute（审批门禁）发布工具
├── LICENSE                     # MIT
│
│  ▼ 安装载荷到此为止——以下全是仓库基础设施，
│    不随 skill 复制进安装目录（与 README Install 一节同规则）
│
├── docs/                       # 项目知识——开发者维护，开发者与 Agent 共享读取（触发词、计划、路线图）
│   ├── glossary.md             # 三语术语对照表（共享）
│   ├── design-decisions/       # 架构决策记录（共享，简体单语）
│   ├── archive/                # 已完成计划归档（共享，单语）
│   ├── en/                     # 英文树
│   │   ├── architecture.md     # 本页
│   │   ├── governance-model.md # Spec / Status / Health 概念摘要
│   │   ├── anti-regression.md  # 防乱改机制开发者地图
│   │   ├── lifecycle.md        # 六阶段生命周期开发者摘要
│   │   ├── validator.md        # 校验器用法手册
│   │   ├── skill-discovery.md  # Agent 如何发现并触发 skill
│   │   ├── commands.md         # 完整提示词参考（用户入口命令）
│   │   ├── bootstrap-output.md # 完整带注释的初始化产物
│   │   ├── roadmap.md          # 待开发功能与状态
│   │   └── plans/              # 设计计划（TASK 格式）
│   ├── zh-CN/                  # 简体中文树（源语言）
│   └── zh-TW/                  # 繁體中文树（台湾）
├── README.md                   # 英文主页（翻译：docs/zh-CN/README.md、docs/zh-TW/README.md）
├── CONTRIBUTING.md             # 开发指南（翻译：docs/zh-CN/CONTRIBUTING.md、docs/zh-TW/CONTRIBUTING.md）
├── AGENTS.md                   # 本仓库的 Agent 工作指南
├── CHANGELOG.md                # 发布历史
├── package.json                # npm 脚本（test、check）
├── .github/                    # CI 工作流
└── tests/
    ├── run-tests.js            # 单一发现入口：仅 runner + 汇总
    ├── support/helpers.js      # 共享 fixture、git 辅助、脚本路径常量、临时根生命周期
    └── suites/                 # 领域套件（validator、security、consistency、docs、
                                # release、generator、payload、hygiene）——见反补丁计划 §3
```

安装载荷 = `SKILL.md` + `references/` + `scripts/` + `LICENSE` 四项。分割线以下（`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md）是仓库基础设施——不得复制进 skill 安装目录。一处例外说明：`scripts/check-coding-hygiene.js` 会随 tarball 分发（打包整目录复制 `scripts/`），但**未**在 `references/init-spec.json` 声明，INIT 从不安装或运行它；在本仓库布局之外运行时它报告 not applicable 并 exit 0。
