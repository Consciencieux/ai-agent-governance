---
id: FINDING-0004
status: Confirmed
type: control-gap
observed_in: gen1
---

# FINDING-0004：触发覆盖率缺口（Trigger Coverage）：门禁触发依赖 Agent 注意力

## 分类

- 严重度：高
- 影响范围：repo、skill
- 研究方向：B. 政策 / 控制平面

## 观察

即使 checker 本身是机械的，如果 AI 没有启动它，它就等于不存在。治理可靠性可拆成两维：**Trigger Coverage**（该运行有没有运行）与 **Detection Coverage**（运行后能不能发现）。Issue #5 主要研究第二维；第一维存在明显缺口。

## 证据

- **B03 AI 注意力当 trigger**：本地工作流 `AGENTS.md: "任务完成前运行 gate" → AI 是否记得 → AI 是否正确判断 scope → AI 是否运行 npm run check:* → checker 才开始工作`。
- 当前不存在本地控制平面：`file changed → governance runtime 自动发现 → 自动计算 applicable controls → 自动运行 gate`。
- 极端情况：AI 改文件后忘记 npm test / check / commit / push，直接报告完成，绝大多数机械门禁不会自动出现。
- Git hooks 默认不启用、可被 `--no-verify` 绕过、不是 authorization mechanism；CI 自动但粒度粗。

## 根因

架构是 prompt-triggered, mechanically-executed governance。门禁触发是自然语言规则，不是系统事件。

## 影响

- 本地严格 enforcement 很有限。
- 「门禁本身机械」不等于「门禁触发机械」。

## 关闭条件

1. 设计统一 dispatcher / trigger 模型（见 FINDING-0002）。
2. 至少一种触发路径不依赖 Agent 记得运行（hook / CI / pre-push 之一）。
3. Trigger Coverage 成为可测量指标。

## 解决情况

（待填。）

## 关联

- GitHub Issue #7

## 回归保护

对每个 trigger 路径的负向测试：模拟「AI 忘记运行」场景，证明另一条自动路径仍会拦截。
