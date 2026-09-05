# Sync Groups Mechanical Check（TASK 计划）

> **Status: archived.**（已归档。归档即断言完成。）

### 任务目的

把被治理项目的同步强制从**清单驱动**（第一层）升级为**机械验证**：只读脚本对照任务实际改动集与声明的同步组，报告缺失的 require——让漏同步被**发现**，而不是被信任。

### 当前问题

第一层（`.governance/sync-rules.json` + Phase 5 清单）把可靠性从记忆驱动升级为清单驱动，但清单仍由 Agent 自己执行。疲惫的 LLM 可以勾 ✅ 而不做。机械检查缺的最后一个拼图是**任务边界**——"本次任务改了什么"必须可定义。

### 提议方案

`scripts/check-sync.js`（INIT 复制、只读、零依赖）：

- **改动集** —— `git diff --name-only <task-start-sha>..HEAD` 加上未暂存/已暂存改动；task-start-sha 由 state-manager 在任务开始时写入 `.governance/state.json`（新字段 `task_start_sha`，取自 `git rev-parse HEAD`）
- **规则评估** —— 对 `.governance/sync-rules.json` 每个 syncGroup：任一 `watch` glob 命中改动路径、但没有任何 `require` 路径改动 → 报告 `unsynced: <group.name>`（门禁模式 exit 1；`--advisory` 模式 exit 0）
- **输出** —— 人类摘要 + `--json`；写入: `drift-report.json` 于 `scripts/check-sync.js`（`sync` 字段）
- **Glob 匹配器** —— 仅前缀 + `**`（与未来消费方共享辅助函数；v1 不用正则）
- **接入** —— 生命周期 Phase 5 结束时：宣称完成前跑 `node scripts/check-sync.js`（门禁模式）；RELEASE 前置 `sync.passed`

### 受影响文件

- `scripts/check-sync.js` —— 新脚本 + INIT 复制清单（SKILL.md 第 11 步）
- `.governance/state.json` schema —— `task_start_sha` 字段（state-manager 任务开始时写入）
- `references/templates/sub-skills.md` —— state-manager 记录 task_start_sha；生命周期报告引用 check-sync
- `references/policies/lifecycle.policy.md` —— Phase 5 在清单后强制 check-sync（门禁）
- `references/workflows/release.md` —— 前置 `sync.passed`
- `scripts/verify-governance.js` —— 要求 check-sync.js 存在（校验器默认 +1）
- `tests/run-tests.js` —— 同步检测测试

### 风险

- **任务边界语义** —— task_start_sha 在任务开始时记录；跨多 commit 或从 state.json 恢复的任务不得中途重置 SHA（恢复保留原 SHA）
- **合理分歧误报** —— 如规则变更暂时不打算反映到 AGENTS.md；用 `--advisory` 模式 + 报告缓解，门禁模式只在 Phase 5 结束/发布时
- **Glob 边界** —— 目录 vs 文件路径、`docs/features/`（目录）vs `docs/features/foo.md`；匹配器把尾部 `/` 视为前缀

### 验证方法

- Fixture：改 `src/a.ts` 不动 `docs/ARCHITECTURE.md` → exit 1 + `unsynced: api-architecture`（测试）
- Fixture：两者都改 → exit 0（测试）
- 恢复场景：state.json 已有 task_start_sha → 不覆盖（测试）
- 校验器在 check-sync.js 缺失时失败（测试）
