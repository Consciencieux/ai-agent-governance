# Roadmap

[English](../en/roadmap.md) · [简体中文](roadmap.md) · [繁體中文](../zh-TW/roadmap.md)

时间尺度：**已完成** / **近期** / **中期** / **远期**

### 已完成

- AGENTS.md 治理引导
- Feature 登记
- 治理校验器
- 发布工作流
- 多语言 CI 模板
- 多 Agent 锁强制 —— `scripts/check-lock.js`（只读锁检查；INIT 复制、校验器必查）
- 校验器内容检查 —— CHANGELOG 格式 + manifest `artifacts[].kind` 有效性
- Git 工作流治理 —— `.governance/git-policy.json` + `scripts/check-git-policy.js`（受保护分支、分支开发、禁止直推）
- Agent 行为审计 —— 追加式 .governance/activity.jsonl 逐任务审计轨迹 + drift-check `activity-report` 模式
- 密钥扫描门禁 —— scripts/check-secrets.js 阻止暂存区密钥类内容（校验器 21 项）
- 治理健康分 —— 校验器 `--json` 输出综合 `score`（v1 等权）+ CI 产出 shields.io 徽章 endpoint 工件
- 知识新鲜度 —— `scripts/check-doc-freshness.js` 经 `git log` 提交日期标记过时治理文档（仅建议性）
- 内容一致性 —— `scripts/check-doc-consistency.js` 标记文档间交叉矛盾（版本示例/受保护清单/ADR 状态/roadmap 目标/链接/数值声明；仅建议性）
- **审核管理器** —— 第 8 个子技能：多智能体深度审查工作流（固定 5 领域、严重度排序报告、修复 + 门禁验证）。设计：[../archive/review-manager.md](../archive/review-manager.md)
- **分级审核门禁** —— release/push 风险分级（低 = 仅轻量级；中 = 批准时建议深度审查；高 = 必须 review-manager）；轻量级脚本总是自动跑。设计：[../archive/tiered-review-gate.md](../archive/tiered-review-gate.md)
- **被治理项目同步组** —— 两层：（L1）声明式 `.governance/sync-rules.json`（watch/require）+ 清单驱动 Phase 5；（L2）`scripts/check-sync.js` 对照实际改动集机械验证。设计：[../archive/governed-project-sync-groups.md](../archive/governed-project-sync-groups.md) + [../archive/sync-groups-mechanical-check.md](../archive/sync-groups-mechanical-check.md)
- **INIT 生成器脚本化** —— 确定性、可快照测试的 INIT 生成（`scripts/generate-governance.js`）；分 A → B → C 三期。设计：[../archive/init-scripted-generator.md](../archive/init-scripted-generator.md)
- **计划交付门禁** —— `scripts/check-plan-delivery.js`：计划与实际交付的机械对账（归档前 fail-closed）
- **计划归档门禁** —— 规范计划状态关键词（design/active/implemented/completed/archived）+ release 作用域的待归档门禁（`check-doc-consistency.js` 的 `--release-gate`）+ 交付提取修复（`####` 子节不再截断）
- **安装载荷完整性门禁** —— 3 项测试证明复制的门禁脚本自包含（无兄弟 `require`）且 `init-spec.json` 的复制清单与 INIT 实际写入一致
- **确认政策重写** —— 跨五个同步点提交前一次确认；计划批准降为意图对齐（`consent-policy-hardening` 计划）
- **治理原则索引** —— 18 条原则的纯指针索引 + 一个 `--gate` 检查保持每条来源可解析
- [x] **规则捕获** —— 不让口头要求只活在对话上下文里：Agent 对每条要求预分类（持久 / 一次性 / 模糊），开发者在 Phase 6 裁定，确认的规则写入 `AGENTS.md` / `docs/rules/**`，未确认的在行为轨迹里留 `rules_pending` 痕迹。设计：[../archive/rule-capture.md](../archive/rule-capture.md)

### 近期

- **多 Agent 协调协议** —— 并发 Agent 之间的标准化协调（锁检查已交付；review-manager 的并行子代理是其第一个真实用例）
- **Skill 生命周期管理** —— 独立 [`ai-skill-manager`](https://github.com/Consciencieux/ai-skill-manager) skill（管理 .agents/skills/ 下所有 skill 的 INSTALL → UPDATE → ROLLBACK，含本 skill）。自 v0.6.0/v0.7.0 顺延；当版本同步步骤证明不够用时再重启。设计：[plans/skill-lifecycle-management.md](plans/skill-lifecycle-management.md)
- **远程治理看板** —— 被治理仓库的可观测性（依赖：审计轨迹 + 健康分，均已交付）
- **monorepo 多治理域** —— 校验器多根解析 + 多 manifest（出现真实 monorepo 需求时再做）

### 中期

- **demo 示例仓库** —— 展示治理产物实际效果的真实示例项目（中期；在此之前本仓库仅作为*轻量治理*参考：发布流程 + plans/archive + ADR + 测试，**不是**完整的被治理软件项目——其 validator 默认模式必然失败属设计使然）
- **生态完善** —— IDE 扩展（治理感知的编辑器集成；真实用户需求出现时触发）+ Cursor 兼容实测（验证文档声明的 `.cursor/rules` 兼容性；机制变化或问题报告时触发）

说明：未实现功能的设计计划在各语言树的 `plans/`（如 `skill-lifecycle-management.md`）；已完成的 TASK 计划在发布时归档到 `docs/archive/`。被治理项目自身的开发计划由 INIT 生成在 `docs/plans/DEVELOPMENT_PLAN.md`。

**维护规则（每次发布滚动重排）：**

1. **完成时** —— 移到「已完成」，勾 `[x]`，去掉时间括号（已完成项不带时间尺度）。其设计文档归档到 `docs/archive/`（共享区，单语）。
2. **时间尺度是相对的** —— 移出已完成项后，剩余项整体前移：中期 → 近期、远期 → 中期、超远期 → 远期（视需求）。
3. **触发时机** —— 重排是发布流程的一部分（`release-manager` 归档计划时一并重排本 roadmap），不是随手改；否则时间标注会过期失真。
