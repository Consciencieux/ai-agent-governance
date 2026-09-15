# .governance/sync-rules.json 模板（INIT 生成）

INIT 时复制为 `<project>/.governance/sync-rules.json`，替换 `{{...}}` 占位符。**项目同步组的单一事实源**——声明"哪些文件改动必须联动哪些文件"，Agent 在 Lifecycle Phase 5 对照执行（见 `references/policies/lifecycle.policy.md`）。

```json
{
 "syncGroups": [
 { "name": "api-architecture", "watch": ["src/**", "lib/**", "app/**", "apps/**", "services/**", "packages/**", "modules/**"], "require": ["docs/ARCHITECTURE.md", "CHANGELOG.md"] },
 { "name": "rules-summary", "watch": ["docs/rules/**"], "require": ["AGENTS.md"] },
 { "name": "feature-registry", "watch": ["src/**", "app/**", "apps/**", "services/**", "packages/**"], "require": ["docs/features/"] }
 ]
}
```

## 字段说明

| 字段 | 含义 |
| --- | --- |
| `name` | 同步组名（报告与对照时引用） |
| `watch` | glob 模式（仅前缀 + `**`，v1 不用正则）；匹配到改动的路径即触发该组 |
| `require` | 该组被触发时**必须**一并改动的文件/目录 |

## 生成规则

- 默认组保守（上表三组）：任何常见源码目录（`src/**`、`lib/**`、`app/**`、`apps/**`、`services/**`、`packages/**`、`modules/**`）改动必须同步架构文档与 CHANGELOG；`docs/rules/**` 改动必须同步 AGENTS.md 摘要；功能代码改动必须登记 Feature Registry
- 项目可增删改组（新术语/新同步关系由项目约定决定）；修改本文件属于治理文件变更（走「治理文件保护」流程）
- **目录匹配**：`require` 里带尾部 `/` 的（如 `docs/features/`）视为目录前缀，其下任一文件改动即满足
- **无 watch 命中 = 无同步义务**：任务未涉及任何 watch 路径时，Phase 5 报告该组为 ⚠️ not-applicable，不算漏
- **Phase 5 执行**（中/大型改动）：读取本文件 → 逐组对照实际改动 → 更新所有 require → 报告逐组 ✅ 已同步 / ⚠️ 不适用；watch 命中但 require 缺失 = 任务未完成
- 机械验证（可选，L2）：`scripts/check-sync.js` 对照改动集自动检查（见 `docs/plans/sync-groups-mechanical-check.md`）
