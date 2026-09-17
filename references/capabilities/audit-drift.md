# AUDIT / drift 巡检

## Trigger

已有 `.governance/manifest.json`；用户说 audit / 健康检查 / drift；成熟度 L2–L3 默认。

## Authority

skill 进入模式 AUDIT + 生成子技能 `drift-check`（`.governance/generated/skills/`）。根因修复 / 同类闭包 → `docs/rules/lifecycle.md`（源：`lifecycle.policy.md`）。

## Invoke

进入 AUDIT 时替代 Phase 1 构建（Phase 0 仍跑）：

1. 读 manifest → `node scripts/verify_governance.js --json`
2. **引用闭包**：规则所引路径须在本项目可解析（见 testing.policy § 引用闭合）
3. 健康报告 → 最小补丁（不扩大范围；需确认时走治理文件保护）
4. 版本漂移只报告，不擅自升降；升级走 MIGRATE（`scripts/migrate-governance.js`）
5. 日常轻量巡检由生成的 `drift-check` 承担；本叶是 skill AUDIT 入口

## Verify

产出偏差报告；不擅自全量重建；修复走确认边界；校验器退出码与报告一致。

## Non-goals

不等于 RELEASE；不替代日常 `drift-check` 的轻量定位。
