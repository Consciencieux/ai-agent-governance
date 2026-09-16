# Architecture

[English](../en/architecture.md) · [简体中文](architecture.md) · [繁體中文](../zh-TW/architecture.md)

本页是仓库布局——本 skill 仓库各目录用途的开发者地图。

skill 的行为（运行模式 INIT/AUDIT/RELEASE、生命周期管线、设计原则）定义在 skill 本体里，不在本页：见 [SKILL.md](../../../SKILL.md) 与 `references/`。本页只记录文件都放在哪里。

### 三种分发角色

每个文件只属于一个角色。`references/init-spec.json` 是机器可读权威；`repo-tools/check-role-completeness.js --gate` 负责抓漏。

| 角色 | 定义 | 例子 |
| --- | --- | --- |
| **INSTALLED** | INIT 把它写进被治理项目。该项目的 Agent 在运行期读它。 | `references/policies/coding.policy.md` → `docs/rules/coding.md`；`scripts/check-secrets.js`；`agents-md.template.md` → `AGENTS.md` |
| **SKILL-INTERNAL** | 随 tarball 分发，由 skill 执行器读取——但 INIT 从不安装，被治理项目里没有此文件。 | `references/init-spec.json`、`references/workflows/release.md`、`scripts/generate-governance.js`、`references/principles/*` |
| **REPO-ONLY** | 完全不进 tarball。仅约束本仓库。 | `repo-tools/**`、`repo-workflows/**`、`AGENTS.md`、`docs/**`、`tests/**`、`package.json`、`.github/**` |

硬规则：

1. **SKILL-INTERNAL 文件不得被当作被治理项目的规则来源引用**——那里没有。子技能与生成的 AGENTS.md 只能指向 INSTALLED 路径（`docs/rules/*`、`scripts/*`）。
2. **SKILL-INTERNAL 脚本在本仓库形态之外必须 no-op**（缺少预期布局时报告 `applicable: false`）。

### 可移植性（文件"去哪里"与内容"在那里是否成立"）

| 受众 | 在哪里读 | 内容要求 |
| --- | --- | --- |
| skill 执行器 | 技能包内 | skill 可移植——可命名 `references/…`，不可命名 repo-only 路径 |
| 被治理项目 agent | 目标项目内 | 项目可移植——命名的路径、命令、脚本必须在**那里**存在 |
| 本仓库贡献者 | 本仓库内 | 仓库专属——可命名任何内容 |
| 生成器 | 读模板、写目标 | 输出在写入阶段必须项目可移植 |

硬规则：

1. **INSTALLED 内容必须项目可移植。** 引用兄弟文件用目标项目路径（`docs/rules/*.md`）；仓库专属命令不进安装规则。
2. **在执行环境验证，不在创作环境。** 生成真实项目并在那里解析。
3. **阶段可移植性也算。** Phase A 工件不得调用 Phase B 脚本。生成的 `AGENTS.md` 按阶段裁剪（`<!-- phase:A/B+/C -->`）。

### 施工出处（仓库知识 vs skill 合同）

| 归属 | 可引用 | 不得出现在 skill 载荷 |
| --- | --- | --- |
| **本仓库（生产者）** | `PLAN-*`、`ADR-*`、`FINDING-*`、`RESEARCH-*`、本仓路径、npm scripts | — |
| **Skill 产品** | 产品语言（`judgment`/`mechanical`、`CTRL-*` 控制、安装路径） | `PLAN-*`、`ADR-*`、`FINDING-*`、`RESEARCH-*`、指向本仓 `docs/` 的指针 |

边界决策记录：[ADR-0020](../../design-decisions/ADR-0020-producer-product-governance-separation.md) 不变量 I5。

### 目录职责

| 路径 | 职责 | 读者 | 语言 |
| --- | --- | --- | --- |
| `SKILL.md` | 薄 always-on 入口（身份 · 模式 · 不变量 · 能力路由） | agent（skill 使用者） | 单语 |
| `references/` | **Skill 主体——行为唯一存放处。** INSTALLED 与 SKILL-INTERNAL 混装。 | agent（skill 使用者） | 单语 |
| `scripts/` | Skill 运行时脚本。INSTALLED 与 SKILL-INTERNAL 混装。 | agent/CI | 代码 |
| `LICENSE` | MIT 许可证——随 tarball 分发 | 安装者 | — |
| `docs/` | **项目知识。REPO-ONLY。** | 开发者 + Agent | 按知识类型 |
| `tests/`、`package.json`、`.github/`、`CHANGELOG.md`、`README*.md`、`CONTRIBUTING*.md`、`AGENTS.md`、`.gitattributes` | REPO-ONLY 基础设施 | 仓库维护者 | 按文件 |

### 仓库布局

```
ai-agent-governance/
├── SKILL.md                    # 薄 always-on 入口 + 能力路由
├── references/                 # skill 本体——行为唯一所在地
│   ├── init-spec.json          # 机器可读 INIT 规范（generate-governance.js 的单一事实源）
│   ├── instruction/                # 可执行指令源（不是 templates）
│   │   ├── agents-md.template.md   # AGENTS.md 运行时合同源
│   │   └── sub-skills.md           # 生成 skill 的来源
│   ├── templates/                  # 只收留物化模板（bootstrap / machine-state）
│   │   ├── feature-doc.template.md / env-example.template.md / gitmessage.template.md
│   │   ├── git-policy.template.md / githooks-template.md / sync-rules.template.md
│   ├── policies/
│   │   ├── lifecycle.policy.md / git.policy.md / security.policy.md / coding.policy.md / testing.policy.md
│   │   └── governance-files.policy.md
│   ├── capabilities/               # Capability 叶权威（INIT → docs/rules/capabilities/）
│   │   ├── enforcement.v0.json     # 义务分类库存
│   │   ├── audit-drift.md / change-hygiene.md / confirmation-hygiene.md / content-consistency.md
│   │   ├── deterministic-init.md / discovery-ledger.md / doc-freshness.md / engineering-restraint.md
│   │   ├── evidence-tiers.md / generated-subskill-lifecycle.md / git-workflow-safety.md
│   │   ├── git-write-consent.md / governance-state.md / governance-validator.md
│   │   ├── installed-portability.md / plan-sync.md / release-orchestration.md
│   │   ├── release-risk-tiering.md / review-mechanism.md / root-cause-repair.md
│   │   ├── rule-capture.md / secret-scanning.md / seed-oracles.md / ssot-repair.md / sync-groups.md
│   │   └── subskills/
│   │       ├── subskill-ci-generator.md / subskill-drift-check.md / subskill-governance-validator.md / subskill-plan-manager.md
│   │       └── subskill-release-manager.md / subskill-repository-inspection.md / subskill-review-manager.md / subskill-state-manager.md
│   ├── principles/                 # 可复用方法论（SKILL-INTERNAL — INIT 不安装）
│   │   ├── entry.md / instruction-architecture.md / document-model.md / metadata-policy.md
│   │   └── capability-model.md / decision-records.md / migration-method.md / control-shape.md / enforcement-semantics.md
│   ├── contracts/
│   │   └── sibling-closure.example.json
│   └── workflows/
│       ├── ci.md               # CI 模板（能力检测 + 降级）
│       └── release.md          # 发布前置检查 + 版本一致性（被治理项目）
├── scripts/                    # skill 运行时脚本——安装进被治理项目 + 生成器
│   ├── verify_governance.js    # 校验引擎（manifest 驱动路径 + governance_version）
│   ├── check-lock.js / check-git-consent.js / check-sibling-closure.js / check-file-size-budget.js
│   ├── migrate-governance.js / check-git-policy.js / check-secrets.js / check-sync.js
│   ├── lib/
│   │   ├── git-facts.js / md-link-facts.js / plan-status.js / adr-status.js / secret-scan-facts.js
│   │   ├── doc-consistency/
│   │   │   ├── run.js / shared.js
│   │   │   ├── changelog-coverage.js / version-examples.js / protected-files.js
│   │   │   ├── consent-cluster.js / principles-index.js / plan-status.js / adr-status.js
│   │   │   └── broken-links.js / numeric-claims.js / prompt-sync.js
│   │   └── generate/
│   │       └── run.js              # INIT 生成器本体（SKILL-INTERNAL）
│   ├── evaluators/
│   │   ├── ctrl-0001-secret-protection.js / ctrl-0002-git-write-consent.js
│   │   ├── ctrl-0003-doc-freshness.js / ctrl-0004-translation-freshness.js
│   │   └── ctrl-0006-broken-links.js
│   ├── check-doc-freshness.js / check-doc-consistency.js / check-plan-sync.js
│   ├── generate-governance.js      # 薄 INIT CLI（SKILL-INTERNAL）
│   └── release-manager.js          # plan（只读）+ execute（审批门禁）发布工具
├── LICENSE                     # MIT
│
│  ▼ 安装载荷到此为止——以下全是仓库基础设施。
│    package-skill.sh 只复制 SKILL.md + references/ + scripts/ + LICENSE。
│
├── repo-tools/                 # 本仓库自己的门禁与打包——绝不分发
│   ├── check-doc-parity.js / check-layout-sync.js / check-plan-delivery.js
│   ├── check-role-completeness.js / check-coding-hygiene.js / check-file-size-budget.js
│   ├── check-daily-check-surface.js / daily-check-surface.v0.json
│   ├── check-terminology.js / check-changelog-narration.js / check-secrets.js
│   ├── check-must-ship.js / check-must-ship-carriers.js
│   ├── lib/
│   │   └── routing.js
│   ├── routing-graph.v0.json
│   ├── script-inventory.v0.json / oracle-inventory.v0.json / route-task.js
│   └── package-skill.sh        # 发布载荷 tarball 打包
├── repo-workflows/             # 本仓库自己的流程文档——绝不分发
│   ├── changelog-policy.md
│   └── skill-release.md
│
├── docs/                       # 项目知识——开发者维护
│   ├── glossary.md             # 三语术语对照表
│   ├── product/                # 用户向文档——三语（en / zh-CN / zh-TW）
│   ├── plans/                  # 执行计划（简中 canonical）
│   │   ├── roadmap/            # 三语
│   │   └── archive/
│   ├── findings/               # Issue/Finding 档案（简中）
│   ├── research/               # 研究知识库（简中）
│   └── design-decisions/       # 架构决策记录（简中）
├── README.md / README.zh-CN.md / README.zh-TW.md
├── CONTRIBUTING.md / CONTRIBUTING.zh-CN.md / CONTRIBUTING.zh-TW.md
├── AGENTS.md / CHANGELOG.md / package.json
├── .github/                    # CI：must-ship 门禁 + 版本 tag 时 skill-payload-release
└── tests/
    ├── run-tests.js            # 单一发现入口
    ├── support/helpers.js
    └── suites/                 # 领域套件（validator、security、consistency、docs 等）
```

发布草稿 `repo-tools/.release/proposal.json` 已 gitignore，故意不列在上方布局树中。

安装载荷 = `SKILL.md` + `references/` + `scripts/` + `LICENSE` 四项。分割线以下是仓库基础设施——不得复制进 skill 安装目录。
