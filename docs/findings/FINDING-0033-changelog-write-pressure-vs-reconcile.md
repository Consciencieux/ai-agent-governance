---
id: FINDING-0033
status: Confirmed
type: control-gap
observed_in: gen2
---

# FINDING-0033：CHANGELOG「写成可推迟」在执行上被逼成「每改必写」

## 分类

- 严重度：中（Unreleased 噪声淹没可观察交付；Agent 上下文与审查成本上升）
- 影响范围：repo（本仓 CHANGELOG + 指针/门禁语义）；payload 共享 lifecycle 格式契约，但 repo accession 在 `repo-workflows/changelog-policy.md`
- 研究方向：C. 执行强度缺口 · E. 检查器正确性 / 回归 · G05 治理自身膨胀

## 观察

书面政策方向合理：[`repo-workflows/changelog-policy.md`](../../repo-workflows/changelog-policy.md) 将 CHANGELOG 定为**发布边界上的已交付投影**（核心句接近「**写成可推迟；对账不可推迟**」）；[`lifecycle.policy.md`](../../references/policies/lifecycle.policy.md) 管结构契约与内容边界。Keep a Changelog 式「只记 notable」与此一致。

执行面却把 Agent **推向每改写 Unreleased**：AGENTS / 治理文件保护中的「行为变更 → CHANGELOG」、lifecycle「任务完成时可先写」、以及「机制面有 diff → Unreleased 须有分类头」的 coverage 语义，被读成**日常硬义务**。结果 Unreleased 变成开发流水账（含 Finding/ADR 状态类条目），重要交付被埋掉——**不是缺政策，是缺「默认不写」硬默认 + 对账触发的机械化**。

## 证据

1. **政策 vs 指针冲突（2026-09-15 研究）**：changelog-policy 已区分写成/对账；薄入口与保护集仍用「CHANGELOG if behavioral」短句，Agent 优化「别漏写」→ 过度写入。
2. **Unreleased 污染样例**：`[Unreleased]` 出现 Finding 开场条目（如 FINDING-0031 类决策/发现流水），违反「changelog ≠ finding/ADR 流水」的内容边界（与 C1 / 受众测试同向）。
3. **门禁激励**：`changelogCoverage` 等在日常 gate 下把「机制面改了但无新条目」读成压力；`check-changelog-narration` 能挡验证叙事，但**挡不住**「勤写流水账」。发布闸 `changelog.required` 无法单独纠正日常灌水习惯。
4. **同族**：FINDING-0009（历史条目被不当改写）管的是**已发布节完整性**；本条管的是**写入时机与 Unreleased 准入**——互补，不互相关闭。

## 根因

1. **短指针吞掉默认否**：入口层「if behavioral → CHANGELOG」缺少「默认不写；仅在对账触发点写入或显式 no-entry」。
2. **Coverage 语义过宽**：日常「有机制面 diff」≈「必须新增 Unreleased 条」→ 用灌水满足门禁，而非对账。
3. **无半机械 candidate 队列**：缺少「delivery candidate → reconcile → Unreleased 或 deferred/no-entry」的机读步骤，遗忘与灌水两极摇摆。

## 影响

- Unreleased 失去「即将发布投影」作用；发布 composition 成本上升。
- Finding/ADR/Plan 状态进 changelog → 读者与 Agent 混淆知识对象边界。
- 与「行数/注意力」问题叠加：CHANGELOG 本身变长（本仓已近千行），进一步惩罚上下文。

## 关闭条件

1. **默认不写成文**：changelog-policy（及对齐的 lifecycle / AGENTS / governance-files 指针）明确：日常小改、纯文档呈现、Finding/ADR/Research/Plan **创建本身**默认不写；改变可观察 skill/repo 工作流行为 → 记入**对账**（写入 Unreleased **或** 显式 no-entry/deferred + 原因），「commit / wrap up」**不是**写 CHANGELOG 的许可。
2. **Coverage 日常 vs release 拆分**：日常 gate 不以「机制面有 diff 且无新条目」逼灌水；release / `changelog.required` 对可交付行为变更强制非空投影或已 reconcile 的 candidates。
3. **Unreleased 准入收紧**：机械或半机械禁止 Finding/ADR Accepted/Plan Active 类开场流水（narration 门禁可扩展）；可选 candidate stub（机读清单）吸收对账，而不强迫每条立刻进 Unreleased。
4. 关闭叙述不得声称「只改了 README 一句」；须有门禁语义或指针措辞的可验证差分。

## 解决情况

（待填。）研究结论已形成；政策正文未按上表修订；coverage 语义未拆分。

## 关联

- FINDING-0009（已发布 changelog 历史条目完整性）
- FINDING-0016（范例/叙述 ≠ 约束；narration fail-closed）
- FINDING-0012 / ADR-0012（若涉及 repo accession 权威）
- `repo-workflows/changelog-policy.md`
- `references/policies/lifecycle.policy.md` § CHANGELOG 结构契约
- `repo-tools/check-changelog-narration.js` / `changelogCoverage`

## 回归保护

关闭后应能证明：

- 机制面小改 + 无对账触发 → 日常 gate **不**仅因缺新 Unreleased 条失败（或等价：允许 no-entry 对账记录）。
- Unreleased 新增「FINDING-xxxx …」开场 → narration/准入检查失败。
- Release 路径上，未 reconcile 的可交付行为变更 → 仍被 `changelog.required` / release-gate 挡住。
