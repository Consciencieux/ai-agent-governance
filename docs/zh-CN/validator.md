# Validator

[English](../en/validator.md) · [简体中文](validator.md) · [繁體中文](../zh-TW/validator.md)

治理校验器是零依赖的纯 Node 脚本，INIT 时生成到每个被治理项目 `scripts/verify-governance.js`（源头：本仓库 `scripts/verify_governance.js`）。本页是开发者用法手册；检查项清单由脚本自身定义，不在本页复述。

### 用法

```bash
node scripts/verify-governance.js          # 人类可读报告，退出码 = 通过/失败
node scripts/verify-governance.js --json   # 机器可读 JSON 报告
node scripts/verify-governance.js --help   # 用法
```

全部治理工件存在时退出码 0，否则 1。

### 模式

- **manifest 模式** — `.governance/manifest.json` 声明了非空 `artifacts` 数组时，路径以它为准（结构适配）。追加 manifest 相关检查（schema、工件 kind、治理版本、可选 release 元数据）。
- **默认模式** — 无 manifest 时检查内置默认清单（AGENTS.md、CHANGELOG format、architecture/features/plans/rules 目录、.gitignore、.env.example、CI 工作流、脚本、.governance/ 状态文件、治理版本）。
- **生成技能检查（两种模式共存）** — 当 `.governance/generated/skills/` 存在时，对每个子技能目录检查其 `SKILL.md` 是否真实且在项目树内（符号链接文件、或目录链接到树外均被拒绝）。这些检查附加到当前模式清单，因此 `N/M checks passed` 中的 `M` 随生成技能数量增加。

工件路径经过包含性校验：manifest 条目尝试逃逸项目根（或通过链接解析到树外）时报告为失败，而不是 stat 到项目外。

权威检查清单在 `scripts/verify_governance.js`（`DEFAULTS` 数组）；`check-doc-consistency.js` 用它交叉核对 docs 里的数值声明。运行时输出 `validation.json` / `drift-report.json` 不是 required artifact —— fresh checkout 无它们也能通过。

### 治理徽章（可选）

CI 治理 job 产出 shields.io `endpoint` 格式工件（`governance-badge.json`：`{ "schemaVersion": 1, "label": "governance", "message": "N/M", "color": "green|yellow|red" }`）。托管到自选公网地址后，在 README 引用：

```markdown
[![Governance](https://img.shields.io/endpoint?url=<YOUR_HOSTED_URL>/governance-badge.json)](scripts/verify-governance.js)
```

`--json` 输出的 `score`（passed/total，v1 等权）即徽章与未来看板消费的综合分数。配色阈值：100% 绿、≥80% 黄、否则红。

### 报告

人类模式逐项打印 `✓/✗ <名称> (<路径>)` 及 `N/M checks passed.`。JSON 模式返回 `{ mode, governance_version, total, passed, failed, score, passedAll, results[] }`。治理检查必须在宣称任务完成前、以及 RELEASE 前通过。

---
