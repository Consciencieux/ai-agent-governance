# ADR-0002: `validation.json` / `drift-report.json` 是可选的运行时输出


- 状态：Accepted（v0.3.2）
- 日期：2026

## 背景

`validation.json`（校验结果）与 `drift-report.json`（漂移报告）由 AUDIT/发布运行产生。提交它们带来两个问题：

1. 它们是会话级快照，每次巡检都会产生噪声 diff。
2. 没有它们的 fresh checkout 会校验失败（它们被当作 required artifact），CI 因此依赖本地状态。

## 决策

将其视为运行时输出：git 忽略、不作为 required artifact。校验器必须在无它们的 fresh checkout 上通过。

## 后果

- `manifest.json` / `state.json` / `preflight.json` / `generated/skills/` 仍然提交（治理即代码）。
- Fresh-checkout CI 不依赖本地生成的状态。
- AUDIT/发布运行仍会写入它们作为证据记录。
