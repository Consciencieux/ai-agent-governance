# Governed-Project Sync Groups（TASK 计划）

> **Status: archived.**（已归档。归档即断言完成。）

### 任务目的

把隐式同步规则变成**显式、可对照的声明**，让被治理项目的 Agent 不再随文件增长而漏同步。本 skill 仓库自身有硬编码的同步检查（`check-doc-consistency.js` 的 prompt-sync）；被治理项目需要**声明式、项目专属**的等价物。

### 当前问题

被治理项目的同步目前是纯规则文本（生命周期 Phase 5、New Code Registration、CHANGELOG 分类），零机械强制。校验器查工件**存在性**，不查内容**同步**。文件越多，漏同步的概率（改了 API 不动 ARCHITECTURE、新功能不登 Feature Registry、规则变更不同步 AGENTS.md 摘要）趋近必然。本仓库自己都漏过一次（commands.md 触发词）——被治理项目连等价的安全网都没有。

### 提议方案

**第一层：声明式同步组 + 生命周期强制（本计划）。**

INIT 生成 `.governance/sync-rules.json`：

```json
{
  "syncGroups": [
    { "name": "api-architecture", "watch": ["src/**", "lib/**"], "require": ["docs/ARCHITECTURE.md", "CHANGELOG.md"] },
    { "name": "rules-summary", "watch": ["docs/rules/**"], "require": ["AGENTS.md"] },
    { "name": "feature-registry", "watch": ["src/**"], "require": ["docs/features/"] }
  ]
}
```

- `watch` —— 触发同步组的 glob 模式
- `require` —— 同任务必须一并改动的文件

生命周期 Phase 5（Synchronize）改为**清单驱动**：Agent 读取 `sync-rules.json`，对照自己的改动集逐组评估，更新所有 require 文件，并在任务报告里逐组标注 ✅ 已同步 / ⚠️ 不适用（无 watch 命中）。无 watch 命中 = 无同步义务；watch 命中但 require 缺失 = 任务未完成。

默认组保守、项目可扩展（项目添加自己的组；机制通用）。

### 受影响文件

- `SKILL.md` —— Phase 1 生成 `.governance/sync-rules.json`；Phase 5 章节引用它
- `references/policies/lifecycle.policy.md` —— Phase 5 重写为清单驱动同步
- `references/templates/` —— 新增 `sync-rules.template.md`（或 SKILL.md 内嵌 JSON）+ sub-skills.md 报告格式（state-manager/plan-manager 报告节）
- `references/policies/governance-files.policy.md` —— sync-rules.json 声明为受跟踪状态
- `docs/{en,zh-CN,zh-TW}/` —— bootstrap-output.md（生成工件）、commands.md（报告措辞）、CHANGELOG

### 风险

- **过度同步** —— 保守默认可能要求实际不需要的更新；用报告形式（⚠️ 附原因）与项目可编辑规则缓解
- **Glob 语义** —— `src/**` 类 glob 需要最小匹配器；v1 只用前缀/`**`，不上正则
- **LLM 仍执行** —— 这是清单不是编译器；把可靠性从记忆驱动升级为清单驱动，完全机械验证属第二层（见 sync-groups-mechanical-check 计划）

### 验证方法

- INIT 生成带默认组的 `.governance/sync-rules.json`（测试断言）
- 生命周期 policy Phase 5 引用声明并强制逐组 ✅/⚠️ 报告（文档断言）
- `governance-files.policy.md` 把 `sync-rules.json` 列入受跟踪状态（文档断言）
- bootstrap-output.md 展示生成文件（文档断言）
