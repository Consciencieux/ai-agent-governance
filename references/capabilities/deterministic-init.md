# 确定性 INIT / 生成器

## Trigger

新项目初始化、无 `.governance/manifest.json`、用户说 initialize governance。

## Authority

Skill 执行器持有的确定性生成契约（INIT 物化规则）。本叶不复制生成器源码路径。

## Invoke

进入 skill INIT 模式；按契约物化 INSTALLED 工件与状态面。

## Verify

干净目标两次生成在约定表面上可复核；必装工件存在；`node scripts/verify-governance.js`（或项目入口）预检可通过。

## Non-goals

不负责业务代码脚手架；不把 skill 仓私有施工面装进目标。
