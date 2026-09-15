# 治理校验器

## Trigger

INIT 后验证、AUDIT、发布前、CI must-ship/观测门禁。

## Authority

`scripts/verify-governance.js`（INSTALLED 校验入口）。

## Invoke

`node scripts/verify-governance.js`（或项目入口）；对照 manifest 做存在性/结构检查。

## Verify

缺必装工件 → 非 0；JSON 模式可被上层编排消费。

## Non-goals

不替代领域测试；不把观测性 Gen1 全绿当作产品阻断权威（本仓阻断=`check:must-ship`）。
