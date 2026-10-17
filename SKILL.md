---
name: ai-agent-governance
description: 日常软件开发：实现功能、修复缺陷、重构、删除旧实现、维护测试与相关文档。用于编写代码、排查问题、改进架构及继续未完成的开发任务。直接交付代码与验证结果；独立只读审查使用 agent-review，项目接入、CI 和正式发布使用 agent-project。
license: MIT
---

# 日常开发

围绕用户要实现的行为理解代码，确定合适的设计，完成修改并验证。分析或设计请求以结论交付；实施请求进入代码修改。

## 加载

开始任务读取[工程核心](shared/core.md)、[工程判断](shared/standards/engineering.md)、项目自身的有效指令和有关代码。实施任务完整读取[变更完整性](shared/standards/changes.md)与[验证标准](shared/standards/verification.md)。根据动作叠加下列材料，同一任务可以命中多行：

| 当前动作 | 读取材料 |
| --- | --- |
| 设计方案、选择依赖或调整架构 | [设计方法](references/design.md) |
| 实现新行为、扩展现有功能 | [实现方法](references/implement.md) |
| 错误、失败测试、回归、性能或行为异常 | [诊断与修复](references/diagnose.md) |
| 重构、删除、重命名、移动、接口或数据格式变更 | [重组与删除](references/restructure.md) |
| 写文档、发现文档漂移、改变公开用法或项目约束 | [知识维护](shared/standards/knowledge.md) |
| Git 写操作、越出原授权范围、破坏性数据操作 | [授权与 Git](shared/standards/permissions.md) |
| 认证、权限、密钥、不可信输入、依赖安装或外部执行 | [安全标准](shared/standards/security.md) |
| 跨轮持续任务、上下文恢复、并行协作 | [上下文与交接](shared/context.md) |
| 选择检查命令、搜索或调用宿主工具 | [工具使用](shared/tools.md) |

从当前 Skill 文件位置解析相对链接。读取遇到截断时接续；本次会话已读且未变更的材料直接复用。新的动作发生时，在执行前补读对应材料。

## 工作顺序

1. 确定目标行为、已作决定、相关实现和验收方式；检查当前分支及已有未提交改动。解决会改变方案的未知。
2. 选择代码与事实的合适归属。简单任务直接实现；跨模块设计在需要协调的决定上形成短计划，沿用项目已有记录。
3. 在授权范围完成实现、调用方、测试和必要文档。检查同一缺陷的其他实例，并从权威来源更新相关生成物。
4. 执行与变更相关的验证，检查完整差异及剩余问题。最终回复说明实际完成内容、运行结果和影响交付的具体待办。

用户只要求审查时，读取 [agent-review](skills/agent-review/SKILL.md)。用户要求检查并修复时，先诊断再按同一次授权实施。项目指令接入、CI 和发布使用 [agent-project](skills/agent-project/SKILL.md)。
