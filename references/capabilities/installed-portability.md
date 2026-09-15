# INSTALLED 内容可移植性

> Capability leaf (`installed-portability`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/installed-portability.md`.
> Classification (after INIT): `docs/rules/capability-enforcement.json` (PLAN-0057).

## Trigger

编写/审查 INSTALLED 规则、生成 AGENTS、模板路径引用。

## Authority

本叶（INIT → `docs/rules/capabilities/installed-portability.md`）为 INSTALLED 可移植性契约正文。贡献者侧的分发角色×内容可移植性第二轴说明见本仓产品架构文档；不得把本仓科研树路径写进 INSTALLED 权威。

## Invoke

每个 INSTALLED 引用的路径/命令必须在**被治理项目**存在；禁止依赖 skill 仓私有路径、本仓科研树或未安装的打包工具入口。阶段可移植性同样成立：Phase A 产物不得命令 Phase B 才安装的脚本。

边界分层（portable core / repo-deterministic / host-adapter）的机读对账表在本仓施工面；INSTALLED 正文只要求：**不得把宿主 hook/adapter 写成必装 hard enforcement**，也不得把 portable 规则叙述成已具备跨工具拦截。

## Verify

干净目标 INIT 后引用可解析；role-completeness / payload 表征不回归。

## Non-goals

不要求目标复制 skill 仓科研树或仓库施工工具面。
