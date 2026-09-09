---
id: RESEARCH-0005
status: Active
version: 1
---

# RESEARCH-0005：当前能力清单

> 回答「当前系统有哪些能力？」。本清单由原 roadmap 的「已完成」部分迁移而来（ADR-0015），按机制分类（见 `RESEARCH-0002-governance-mechanism-taxonomy.md`）组织。它是 Generation-1 的能力基线，不是路线图。

## 文件存在性检查

- 治理校验器（`scripts/verify-governance.js`）—— 校验器默认检查与 manifest 驱动路径
- 安装载荷完整性门禁 —— 复制的门禁脚本自包含（无兄弟 `require`）；`init-spec.json` 复制清单与 INIT 实际写入一致

## 文本匹配检查

- 密钥扫描门禁（`scripts/check-secrets.js`）—— 阻止暂存区密钥类内容（校验器门禁）
- 术语门禁 —— 术语表 `Forbidden zh-CN`/`Forbidden zh-TW` 列在三语树强制执行（`--gate` fail-closed、行级豁免、无术语表则 no-op）
- 治理健康分 —— 校验器 `--json` 输出综合 `score`（v1 等权）+ CI 产出 shields.io 徽章 endpoint 工件

## 结构解析检查

- 校验器内容检查 —— CHANGELOG 格式 + manifest `artifacts[].kind` 有效性
- 计划归档门禁 —— 规范计划状态关键词（design/active/implemented/completed/archived）+ release 作用域的待归档门禁（`--release-gate`）

## 一致性检查（Consistency / Drift）

- 内容一致性（`scripts/check-doc-consistency.js`）—— 标记文档间交叉矛盾（版本示例/受保护清单/ADR 状态/roadmap 目标/链接/数值声明；consent/受保护清单/原则索引/计划状态/术语簇在 `--gate`/`--release-gate` 下 fail-closed）
- 知识新鲜度（`scripts/check-doc-freshness.js`）—— 经 `git log` 提交日期标记过时治理文档，并按源/译文对派生译文新鲜度（`--release-gate` 阻断过时或 draft 译文）
- 翻译新鲜度 —— Git 派生的逐对状态（stale / draft / reviewed 标记）
- 计划交付门禁（`repo-tools/check-plan-delivery.js`）—— 计划与实际交付的机械对账（归档前 fail-closed）；锚点语法对已存在文件的声明按内容验证
- 分发角色完备门禁（`repo-tools/check-role-completeness.js`）—— `references/` 与 `scripts/` 下每个文件都携带唯一声明角色（INSTALLED / SKILL-INTERNAL），无未分类/无重叠/无陈旧/打包边界一致
- 物理分发边界 —— repo-only 文件（skill 发布流程、打包脚本、仓库专属门禁）从 `references/` 与 `scripts/` 移入 `repo-tools/` 与 `repo-workflows/`；角色门禁反向检查 + 完整 tarball 清单相等性测试
- 范围分级验证 + 证据层级 —— `check:docs` / `check:payload` / `check:tests` / `check:full` 条目与 AGENTS.md 范围表一致；`--release-gate` 仅用于发布阻断

## 测试执行型 Gate

- 测试架构拆分 + 编码卫生门禁 —— 单一发现入口 + 八个领域套件（集合对账），对单体回归与空套件设门禁
- 领域级测试入口 —— `node tests/run-tests.js --suite <name>` / `--list` 开发循环快速入口

## 行为 / 流程能力

- Git 工作流治理 —— `.governance/git-policy.json` + `scripts/check-git-policy.js`（受保护分支、分支开发、禁止直推）
- Agent 行为审计 —— 追加式 `.governance/activity.jsonl` 逐任务审计轨迹 + drift-check `activity-report` 模式
- 多 Agent 锁强制 —— `scripts/check-lock.js`（只读锁检查；INIT 复制、校验器必查）
- 审核管理器 —— 第 8 个子技能：多智能体深度审查工作流（固定 5 领域、严重度排序报告、修复 + 门禁验证）
- 分级审核门禁 —— release/push 风险分级（低 = 仅轻量级；中 = 批准时建议深度审查；高 = 必须 review-manager）
- 被治理项目同步组 —— （L1）声明式 `.governance/sync-rules.json`（watch/require）+ 清单驱动 Phase 5；（L2）`scripts/check-sync.js` 对照实际改动集机械验证
- INIT 生成器脚本化 —— 确定性、可快照测试的 INIT 生成（`scripts/generate-governance.js`）；分 A → B → C 三期
- 确认政策重写 —— 跨五个同步点提交前一次确认；计划批准降为意图对齐
- 治理原则索引 —— 27 条原则的纯指针索引 + 一个 `--gate` 检查保持每条来源可解析
- 规则捕获 —— Agent 对每条要求预分类（持久 / 一次性 / 模糊），开发者在 Phase 6 裁定，确认的规则写入 `AGENTS.md` / `docs/rules/**`
- 工程克制（机制测试）—— 未经批准的新增机制必须自证；已批准需求优先
- 根因修复协议 + 失败预算 —— 复现优先的计划字段、`repairSessionId` 绑定、失败升级
- 发布流程按受众拆分 —— `release.md` 仅覆盖被治理项目发布；本仓库自身流程在 `repo-workflows/skill-release.md`
- INSTALLED 内容项目可移植化 —— 载荷规则正文不再混用受众

## 治理产物（初始/生成）

- AGENTS.md 治理引导
- Feature 登记
- 发布工作流
- 多语言 CI 模板

## 关联

- 机制分类详见 RESEARCH-0002（RESEARCH-0002-governance-mechanism-taxonomy.md）
- 当前系统控制模型详见 RESEARCH-0001（RESEARCH-0001-system-model.md）
- 架构演进（Generation 0→3）详见 RESEARCH-0004（RESEARCH-0004-architecture-evolution.md）
- 已知限制见 `docs/findings/`（FINDING-0001..0019）
