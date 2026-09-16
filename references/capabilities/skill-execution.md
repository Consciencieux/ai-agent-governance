# Skill 执行编排（INIT / AUDIT / RELEASE）

## Trigger

用户触发 initialize / audit / release / migrate / check skill update；或本 skill 作为执行器被加载。

## Authority

进入模式与编排顺序以本叶为准。常驻硬规则 → `docs/rules/runtime-invariants.md`（源：`runtime-invariants.policy.md`）。产物清单 → `references/init-spec.json`。发布 → `references/workflows/release.md`。

## Invoke

### 进入模式

| 模式 | 触发 | 下一步 |
| --- | --- | --- |
| INIT | 无 manifest / L0–L1 / 明确初始化 | `deterministic-init.md` |
| AUDIT | 有 manifest / 巡检·健康检查·drift | `audit-drift.md` |
| RELEASE | release / publish | `release-orchestration.md` + `workflows/release.md` |

判定：**用户指令 > manifest 存在性 > 成熟度**。皆先 Phase 0。AUDIT 不重建；RELEASE 由生成的 `release-manager` 执行；治理文件改动走保护流程。日常由 `.governance/generated/skills/` 接管；本 skill 可随时 AUDIT。

### 版本与更新

frontmatter `version` 与发布五同步点一致。用户说 check/update skill → 读本地 version → 查上游 latest → 报告差异；**绝不自动更新**（须明确同意）。

### 成熟度（Phase 0）

| 等级 | 策略 |
| --- | --- |
| L0 / L1 | 完整骨架（合并不覆盖） |
| L2 | 只补缺失 |
| L3 | 默认审计；写入须强制标志 + 确认 |

写入 `state.json` 的 `maturity`。执行有序；逐步更新 `state.json` / `validation.json`。

### 编排骨架

1. **Phase 0** — 环境检测 → 成熟度 → Inspection Report → 写文件前记 `preflight.json`
2. **INIT / Phase 1** — 生成器按 `init-spec.json` 物化 → `deterministic-init.md`
3. **AUDIT** — 替代 Phase 1 构建 → `audit-drift.md`
4. **MIGRATE** — 仅明确升级：`migrate-governance.js`（只建议、不自动改树）→ 确认 → 补齐 → verify 0
5. **RELEASE** — Approval Gate → `workflows/release.md`
6. **Phase 2–3** — `verify_governance.js` 写 `validation.json` → 交付报告（✅/⚠️/❌ + 证据）

状态工件字段 → `governance-state.md`。断点续跑不得跳步或重跑已完成项。

## Verify

- 引导/巡检/发布项均为 Completed，或 Blocked 且原因明确
- `scripts/verify_governance.js`（或项目入口）退出码 0
- `validation.json` 已更新且含真实输出
- 无虚构完成声明

## Non-goals

不承载常驻政策百科（在 `runtime-invariants` / 各 policy）；不复述 init-spec 工件表；不写业务代码。
