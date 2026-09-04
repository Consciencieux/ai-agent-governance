# 设计决策记录（ADR）


本仓库的架构决策记录。每条 ADR 记录一个真实决策、背景与后果。

| ID | 标题 | 状态 |
| --- | --- | --- |
| [ADR-0001](adr-0001-governance-directory.md) | 用 `.governance/` 取代旧的 `.agent/` 状态目录 | Accepted（v0.3.1） |
| [ADR-0002](adr-0002-optional-runtime-outputs.md) | `validation.json` / `drift-report.json` 为可选的运行时输出 | Accepted（v0.3.2） |
| [ADR-0003](adr-0003-single-file-bilingual-readme.md) | 单文件双语 README，而非按语言拆分文件 | Superseded（被 ADR-0005 取代） |
| [ADR-0005](adr-0005-trilingual-split-docs.md) | 三语拆分文档（docs/en/ + docs/zh-CN/ + docs/zh-TW/） | Accepted |
| [ADR-0004](adr-0004-human-in-the-loop-release.md) | Human-in-the-loop 发布流程（Analyze → Proposal → Approval → Execute） | Accepted（v0.4.0） |
| [ADR-0006](adr-0006-no-dogfooding.md) | 本仓库不狗粮自身治理框架 | Accepted |
| [ADR-0007](adr-0007-plan-layering-orthogonal-triggers.md) | 治理计划分层独立与正交触发（工程克制 × 反补丁） | Accepted |

状态：Proposed / Accepted / Superseded / Deprecated。
