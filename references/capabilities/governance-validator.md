# 治理校验器

## Trigger

INIT 后验证、AUDIT、发布前、CI 门禁。

## Authority

工件清单见 INIT manifest / 校验器契约。**机械载体（RUN，勿当阅读权威）：** `scripts/verify-governance.js`（INSTALLED 校验入口）。

## Invoke

`node scripts/verify-governance.js`（或项目入口）；对照 manifest 做存在性/结构检查。

## Verify

缺必装工件 → 非 0；JSON 模式可被上层编排消费。

## Non-goals

不替代领域测试；读本叶 ≠ 已加载校验百科。
