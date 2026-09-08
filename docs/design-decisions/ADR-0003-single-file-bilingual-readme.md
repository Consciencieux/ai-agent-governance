# ADR-0003: 单文件双语 README，而非按语言拆分文件


- 状态：Superseded（被 ADR-0005 取代）
- 日期：2026

## 背景

项目常并行维护 `README.md` 与 `README.zh-CN.md`（或 `README-zh.md`、`README_cn.md`）。多文件拆分带来同步负担：每次编辑都要镜像，漂移悄然扩大；生成物与 CI 链接最后指向"最新的那个文件"——没人知道是哪个。

## 决策

只用一个 `README.md`，双语布局：英文在前，`---` 分隔后简体中文在后，锚点切换（`[English](#english) · [简体中文](#chinese)`）。已存在 README 的项目，INIT 只合并文档索引与 CI 徽章，绝不拆分、不覆盖。

## 后果

- 首页只有一个事实源；不产生任何语言拆分文件（INIT 禁止生成 `README.zh-CN.md` 等）。
- 单文件略长；相比拆分文件的同步成本可以接受。
- 本 skill 自己的 README 与所有生成的 README 结构一致。
