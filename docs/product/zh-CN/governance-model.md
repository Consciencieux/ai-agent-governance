# Governance Model

[English](../en/governance-model.md) · [简体中文](governance-model.md) · [繁體中文](../zh-TW/governance-model.md)

"治理即代码"背后的三层状态模型：期望态 / 当前态 / 观测态，以可版本控制的文件存在于仓库内。

**完整机器状态规范在 skill 本体里** —— [SKILL.md](../../SKILL.md)（".governance/ 机器可读状态"一节）。本页只是开发者概念摘要。

### Spec / Status / Health

参照 Kubernetes 的 Spec / Status / Health 分层：

| 文件 | 角色 | Git |
| --- | --- | --- |
| `manifest.json` | 期望态 —— 全部治理工件的唯一索引（路径、`kind`、`type`、版本） | 提交 |
| `state.json` | 当前态 —— 成熟度、阶段、Agent 身份、锁、已完成/阻塞 | 提交 |
| `preflight.json` | 初始化写入前的回滚快照 | 提交 |
| `generated/skills/` | 生成的 Agent 模块（drift-check、release-manager 等） | 提交 |
| `validation.json` | 观测态 —— 最近一次校验结果 | 忽略（运行时输出） |
| `drift-report.json` | 漂移报告 | 忽略（运行时输出） |

### 版本

- `schema_version` —— manifest 的数据格式版本
- `governance_version` —— 治理框架版本

二者分离；升框架版本不需要改 schema。

### 其余内容在哪

MIGRATE 流程、路径解析、运行时输出与行为审计轨迹都是 skill 行为 —— 见 [SKILL.md](../../SKILL.md) 与 `references/`（生成的 state-manager 子技能写入 `.governance/activity.jsonl`）。

---
