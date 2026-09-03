# Architecture

[English](../en/architecture.md) · [简体中文](architecture.md) · [繁體中文](../zh-TW/architecture.md)

本页是仓库布局——本 skill 仓库各目录用途的开发者地图。

skill 的行为（运行模式 INIT/AUDIT/RELEASE、生命周期管线、设计原则）定义在 skill 本体里，不在本页：见 [SKILL.md](../../SKILL.md) 与 `references/`。本页只记录文件都放在哪里。

### 目录职责

| 路径 | 职责 | 读者 | 语言 |
| --- | --- | --- | --- |
| `SKILL.md` | Skill 入口 / 产品规范 | agent（skill 使用者） | 单语 |
| `references/` | **Skill 主体——skill 行为唯一存放处。** 复制进被治理项目、或定义 skill 如何行动的策略、模板、工作流。 | agent（skill 使用者） | 单语 |
| `scripts/` | Skill 运行时脚本（校验器、检查、生成器、发布工具）——属于安装载荷 | agent/CI | 代码 |
| `LICENSE` | MIT 许可证——属于安装载荷 | 安装者 | — |
| `docs/` | **用户/开发者手册。不属于 skill 载荷。** 说明如何使用 skill（`commands.md` 触发词）、设计计划（`plans/`）、路线图、术语表。 | 用户/开发者 | 三语 |
| `tests/`、`package.json`、`.github/`、`CHANGELOG.md`、`CONTRIBUTING.md`、`README.md`、`AGENTS.md` | 仓库基础设施：CI、发布流程、变更日志、贡献指南 | 仓库维护者 | 按文件 |

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
│   ├── check-doc-freshness.js  # 文档过时度（git log 日期，建议性，exit 0）
│   ├── check-doc-consistency.js # 文档间矛盾（建议性，exit 0）
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
├── docs/                       # 用户/开发者手册——怎么用 skill（触发词、计划、路线图）
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
    └── run-tests.js            # 测试套件
```

安装载荷 = `SKILL.md` + `references/` + `scripts/` + `LICENSE` 四项。分割线以下（`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md）是仓库基础设施——不得复制进 skill 安装目录。
