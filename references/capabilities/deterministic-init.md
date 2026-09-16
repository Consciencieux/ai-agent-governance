# 确定性 INIT / 生成器

## Trigger

新项目初始化、无 `.governance/manifest.json`、用户说 initialize governance；成熟度 L0–L2 构建（L3 默认只报告）。

## Authority

`references/init-spec.json`（产物清单唯一权威）+ skill 进入模式 INIT。本叶不复制整份 init-spec。

## Invoke

1. Phase 0 已写入成熟度与（如有）续跑点；写文件前有 `preflight.json`。
2. 运行生成器（幂等跳过已存在文件；`--dry-run` / `--json` 可用）：

```bash
node scripts/generate-governance.js --target <项目根> --phase C \
  --project-name <名称> --maturity <等级> --doc-root <文档根> \
  --stack <栈> --ci-platform <平台>
```

3. Agent 兜底（合并不覆盖）：工具入口适配、README 合并、Feature/ARCHITECTURE 真实内容、CI 降级占位、L2/L3 合并——反虚构与确认门仍适用。
4. 确认门：依赖变更 · Git 身份 · CI 首次推送 · L3 写入 · 跨 3+ 文件额外改动。
5. 未实现生成器 → exit 1（除非显式允许 stub）。

## Verify

干净目标约定表面可复核；必装工件存在；`node scripts/verify_governance.js`（或项目入口）预检可通过；`validation.json` 有真实输出。

## Non-goals

不负责业务代码脚手架；不把 skill 仓私有施工面装进目标；不在本叶复述 init-spec 工件表。
