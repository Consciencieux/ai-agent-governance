# ADR-0005: 三语拆分文档（docs/en/ + docs/zh-CN/ + docs/zh-TW/）

- 状态：Accepted
- 日期：2026

## 背景


## 决策

开发者面向文档改为**三语且拆分**，简体中文为源语言：

- 根目录只保留英文主页（`README.md`、`CONTRIBUTING.md`）；简体/繁体翻译下沉到各自语言树（`docs/zh-CN/README.md`、`docs/zh-TW/README.md` 等），顶部互相链接。
- `docs/` 下每种语言一棵目录树：`docs/en/`、`docs/zh-CN/`（源）、`docs/zh-TW/`。各树结构镜像一致（roadmap、lifecycle、commands、architecture、plans 等；ADR 与归档在共享区，见下）。
- **简体中文（zh-CN）是源语言** —— 修改从简体发起，再同步到英文与繁体；改一种语言必须**同一次提交里同步另两种**。
- `docs/glossary.md` 是单一三语术语对照表（术语译法的单一事实源；台湾用语基线，如 專案/檔案/範本/密鑰）。
- **历史记录单语且入共享区**：ADR 决策史（`docs/design-decisions/`）与已完成计划归档（`docs/archive/`）放 docs/ 根共享区，只保留简体，不翻译；三棵语言树因此完全同构。
- Agent 面向文件不受影响 —— `SKILL.md`、`AGENTS.md`、`references/**` 保持单语（ADR-0003 的受众原则被扩展，而非推翻）。
- 被治理项目遵循同一原则：根目录只保留英文主页，翻译下沉 `docs/README.zh-CN.md` 等（项目约定可覆盖为纯英文或增加更多语言）；多语言文档树仅当项目明确约定时生成。原先"禁止语言变体 README 文件"的条款删除。

## 后果

- 改一份开发者面向文档需要三处更新而非两处 —— 由受众拆分约束（Agent 面向文件保持单语）。
- EN / zh-CN / zh-TW 之间的翻译漂移可结构检测：内容一致性检查（v0.7.0）由"两段比对"改为"三树比对"。
- GitHub 访客看到英文主页；简体/繁体用户经顶部链接到达各自的 README。
- 对开发者面向文件取代 ADR-0003 的单文件双语布局（ADR-0003 的历史理由仍然成立）。
