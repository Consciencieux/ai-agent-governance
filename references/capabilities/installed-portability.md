# INSTALLED 内容可移植性

> Capability leaf (`installed-portability`). Instruction-surface 2.0 card (PLAN-0046).
> Role: INSTALLED → `docs/rules/capabilities/installed-portability.md`.

## Trigger

编写/审查 INSTALLED 规则、生成 AGENTS、模板路径引用。

## Authority

架构第二轴（content portability）+ 相关 INSTALLED 规则；权威见 `docs/rules/lifecycle.md` / `docs/rules/coding.md` 中的可移植性条款。

## Invoke

每个 INSTALLED 引用的路径/命令必须在**本项目**存在；禁止依赖 skill 仓私有路径、本仓科研树或未安装的打包工具入口。

## Verify

干净目标 INIT 后引用可解析；role-completeness / payload 表征不回归。

## Non-goals

不要求目标复制 skill 仓科研树或仓库施工工具面。
