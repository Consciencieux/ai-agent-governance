# Release Policy（发布策略 —— 单一事实源）

Release 是治理生命周期（Design → Implement → Validate → Release → Audit）的一环。本文件定义发布前置检查、**AI 辅助的 Human-in-the-loop 发布流程**、SemVer 2.0.0 版本判定规则与版本一致性规则；执行由生成的 `release-manager` 子技能（`.governance/generated/skills/release-manager`）负责，本 skill 的 RELEASE 模式负责编排与校验。

核心原则：**AI 负责分析与建议，开发者负责最终授权；未经过明确确认，不允许执行任何发布操作。**

## 发布流程总览（Human-in-the-Loop）

```
Analyze
   |
   v
Release Proposal
   |
   v
Developer Approval
   |
   v
Create Git Tag
   |
   v
Create Release
```

AI 仅在前两阶段自动行动（分析 + 提案，只读）；任何写操作（tag / push / gh release）都必须先获得开发者明确批准。

## release_requirements（前置检查全通过才允许发布）

| 检查 | 要求 | 失败处理 |
| --- | --- | --- |
| `git.require_clean_status` | 工作区干净（`git status --porcelain` 为空） | ⚠️ Blocked，先提交或清理 |
| `tests.required` | 测试通过（`npm test` 等，退出码 0） | ❌ 停止发布 |
| `changelog.required` | CHANGELOG 已记录本次变更 | ⚠️ Blocked |
| `version.manifest_match_tag` | package.json / CHANGELOG / `.governance/manifest.json` 的 `governance_version` 与 tag 一致 | ❌ 停止发布 |
| `release.tag_required` | 目标 tag 尚不存在（`git tag -l <tag>` 为空） | ⚠️ Blocked，tag 已存在 |
| `release.proposal_approved` | Release Proposal 已生成（`scripts/release-manager.js plan`）且开发者已**明确批准** | ⚠️ Blocked，等待批准 |
| `release.review_satisfied` | Proposal 风险/审核字段有效；高风险 Proposal 的 `reviewStatus` 为 `completed` 或 `explicitly-approved` | ❌ 停止发布，先完成深度审核或逐项取得开发者确认 |
| `validator.passed` | `scripts/verify-governance.js` 退出码 0 | ❌ 停止发布。**豁免**：skill 仓库自身发布不适用本项（skill 仓库无 `.governance/`、无软件项目形态工件，validator 按默认检查必然失败）；skill 仓库自身以 `tests.required`（npm test 退出码 0）替代 |
| `docs.parity_passed` | `scripts/check-doc-parity.js` 退出码 0（三语文档树结构平行） | ⚠️ Blocked，先同步缺失/漂移的文档；仅适用于维护三语文档树的仓库 |
| `sync.passed` | `scripts/check-sync.js` 退出码 0（同步组无漏项：watch 命中的组其 require 文件已一并更新） | ❌ 停止发布，先补齐漏同步的文件 |
| `plan.delivery_verified` | `scripts/check-plan-delivery.js` 退出码 0（待归档计划声明的 Affected Files / 标识符 / 验证手段均已实际交付） | ❌ 停止发布，先补齐声明未交付项或修正计划 |

## 版本一致性规则

同一版本**五处**必须一致：

- `package.json` 的 `version`
- `CHANGELOG.md` 顶部版本节
- `.governance/manifest.json` 的 `governance_version`
- SKILL.md frontmatter 的 `version`
- Git tag `v<version>`

SemVer：MAJOR.MINOR.PATCH —— 破坏性 → MAJOR，新能力 → MINOR，修复 → PATCH。

## Phase 1：Analyze（分析）

AI 首先分析当前仓库状态，包括：

- 当前 Git tag / 当前版本号（`git tag -l`、package.json）
- `git log` 与 `git diff`（自上次发布以来的变更）
- 文件变化、API/interface 变化、用户可见功能变化
- **已裁定延后的发布安全事项**：读 roadmap 的「Deferred release-safety decisions」小节（本仓库为 `docs/{en,zh-CN,zh-TW}/roadmap.md`；被治理项目为其等价路线图）。这些条目记录了「门禁绿灯」实际证明范围之外的已知缺口——发布前必须知道自己在依赖什么、不在依赖什么。它们不阻断发布，但若某条的触发条件已经成立（例如本次发布要求证明评审者身份），应先停下另开 TASK 计划。

然后运行只读分析工具生成 Proposal：

```bash
node scripts/release-manager.js plan --json '{"current":"X.Y.Z","changes":[{"type":"breaking|feature|fix|docs|refactor|test|ci|chore","description":"...","uncertain":false}]}'
```

`plan` 只读、永不写仓库；输出 JSON Proposal（含 `current` / `recommended` / `releaseType` / `reasons` / `releaseNotes` / `headSha`）。退出码 2 = 需要澄清（见不确定性处理）。

## Phase 2：Version Decision（SemVer 2.0.0）

版本判断严格遵循 SemVer 2.0.0，优先级从高到低：

### Major —— 仅当存在真实 Breaking Change

包括：

- 删除公开 API
- 修改公开 API 导致旧调用失效
- 删除公开配置
- 修改 CLI 行为导致已有脚本失效
- 修改公开协议或数据格式导致不兼容

规则：

- Breaking Change 必须影响**外部用户或开发者**。
- 内部重构不属于 Breaking Change。
- 文件移动、代码重构、架构调整不能触发 Major。

### Minor —— 仅当增加向后兼容的、用户可感知的新能力

**判定标准**：新能力必须**用户可感知**——开发者或被治理项目能直接感知其存在或效果（如新命令、新公开 API、新可见行为）。仅内部机制/工具完善不算 Minor。

包括：

- 新增用户功能
- 新增公开 API
- 新增 CLI 命令
- 新增配置能力
- 新增 Agent 能力（用户可感知的行为变化）

以下**不得**触发 Minor（归入 Patch）：

- README 修改、文档增加、测试增加、CI 修改
- 重构、性能优化、日志优化、类型注释增加
- 内部工具/机制完善（如锁检查、内容校验、模板补齐、流程顺序修正、内部参数增强）

### Patch —— 其余全部

包括：Bug 修复、重构、性能优化、文档更新、测试调整、配置调整、依赖更新、**内部工具与机制完善**。

### 禁止的启发式判断

禁止根据以下因素判断版本：

- diff 行数
- commit 数量
- 修改文件数量
- 新增代码数量

代码规模不代表版本影响范围。

## Phase 3：Approval Gate（审批门禁）

生成 Release Proposal 后，必须**等待开发者确认**。AI 必须展示：

```
Release Proposal

Current:
vX.Y.Z

Recommended:
vX.Y.Z

Reason:
...

Risk level:
low / medium / high

Review recommendation:
none / suggested (review-manager) / required (review-manager 或逐项确认)

Review status:
not-required / suggested / required / completed / explicitly-approved

Release Notes:
...

Proceed with release?
```

**风险分级规则（Tiered Review Gate）**：

| 风险等级 | 变更类型 | 审核要求 |
| --- | --- | --- |
| 低 | docs/typo/版本号/链接修正/格式 | 轻量级门禁（标准验证序列）自动跑，通过即提交，不询问 |
| 中 | 新功能/脚本逻辑/政策变更/模板变更 | 轻量级门禁 + Proposal 标注 suggested；开发者批准时决定是否先跑 review-manager |
| 高 | 安全/权限/删除保护/治理文件行为变更 | **必须**先跑 review-manager（范围 = git diff，非全项目），或开发者逐项明确确认，否则不发布 |

- 轻量级门禁**总是自动跑**（标准验证序列，见 lifecycle Phase 4）--底线，零成本
- 高风险清单**明确列举**（见上表），不依赖 AI 自由裁量；边界模糊时**取更高级别**
- review-manager 已实现（sub-skills.md 第 8 节）：**高风险变更默认运行「全量深度 × 本次变更集范围」**（逐行通读 + 对照开发计划 + 执行级验证 + 不信任门禁；范围 = 计划中的 `git diff` 变更集，不是全项目——全项目彻查成本高，仅在开发者显式要求时使用）；开发者也可选择逐项明确确认替代（二选一，不允许跳过）
- Proposal JSON 必须包含 `riskLevel`、`reviewRecommendation` 与 `reviewStatus`；高风险执行前，`reviewStatus` 必须为 `completed` 或 `explicitly-approved`，否则 `release-manager execute` 拒绝创建 tag。

批准后把 Proposal 记录到 `.governance/release-proposal.json`（运行时输出，git 忽略，非 required artifact）作为审批证据。

以下情况**禁止**自动执行：

- 未收到确认
- 用户回复含糊
- 存在未解决的 Breaking Change 判断
- 工作区状态发生变化

## Phase 4：Release Execution（执行）

开发者确认后，AI 执行：

1. **再次检查仓库状态**：`git status`、`git rev-parse HEAD`。要求工作区干净、HEAD 与 Proposal 中 `headSha` 一致；若检测到变化 → **停止执行并重新分析版本**（重新走 Phase 1-3）。
2. **版本同步**：更新 `package.json` → CHANGELOG（`[Unreleased]` 移入 `[X.Y.Z]`）→ `.governance/manifest.json` 的 `governance_version` 与 `release` 字段。**技能仓库自身发布时还须同步生成器的版本默认值**：`references/init-spec.json` 的 `inputs.governance_version.default` 与 `scripts/generate-governance.js` 的兜底哨兵——它们决定新 INIT 给被治理项目打上的版本号，漏改会让全新项目带着上一个版本号出生。
3. **计划交付对账（gate）**：归档前运行 `node scripts/check-plan-delivery.js --gate`（退出码必须 0）——比对待归档计划声明的 Affected Files / 标识符是否已实际交付。**声明未交付不得归档**：要么补齐交付，要么修正过时的计划声明。纯设计计划（顶部显式标注 `Status: design plan, not implemented`）跳过对账，也不得归档。同一步还需运行 `node scripts/check-doc-consistency.js --release-gate`（退出码必须 0）：待归档门禁——任何状态为 implemented/Completed 且仍留在 `docs/plans/` 或 `docs/*/plans/` 下的计划都会使其失败。没有该脚本的形态（如手写检查）逐字枚举 `docs/plans/` 与 `docs/*/plans/` 下全部计划的状态行，任何 implemented/Completed 计划未归档即停止。**多语言文档树的项目**追加运行 `node scripts/check-doc-freshness.js --release-gate`（退出码必须 0）：译文落后于源文档（或仍标注 draft）即阻断发布；单语项目该检查自然 no-op。
4. **归档计划**：本版本已完成的里程碑条目（含勾选状态与验收结果）聚合写入 `docs/plans/archive/vX.Y.Z.md`（一个版本一个文件）；已完成的 `TASK_<name>.md` 以独立文件原样移入 `docs/plans/archive/`（保留原文件名）。**保留原文，绝不删除**。未完成的里程碑继续留在 `docs/plans/`。归档运行的先决条件：不存在任何状态为 implemented/Completed 而未归档的计划（第 3 步的 release-gate 已强制）。
5. **提交 release commit**：`git add`（仅版本同步与归档相关文件）→ `git commit -m "release: vX.Y.Z - <summary>"`。**版本变更与归档必须进入同一个提交**——tag 稍后指向的 HEAD 必须包含它们。
6. **校验**：运行 `scripts/verify-governance.js`，退出码必须为 0。
7. **生成/更新 Proposal**：把 Proposal 的 `headSha` 更新为新 HEAD、`recommended` 为 `X.Y.Z`，写入 `.governance/release-proposal.json`（execute 依此做发布前重新验证）。
8. **创建 annotated tag**：

   ```bash
   node scripts/release-manager.js execute --proposal .governance/release-proposal.json --yes
   ```

   `--yes` 是开发者批准的记录标记；**没有 `--yes` 该工具拒绝一切写操作**（等价于手工 `git tag -a vX.Y.Z -m "Release vX.Y.Z: <summary>"`）。execute 会再次检查工作区干净且 HEAD == proposal `headSha`。
9. **推送**：`git push origin main` → `git push origin vX.Y.Z`（写操作均需用户确认，见权限）。
10. **创建 Release**：GitHub 项目执行 `gh release create vX.Y.Z --title "vX.Y.Z" --notes "<Release Notes>"`（gh 未登录/未安装 → ⚠️ Blocked，提示用户）。
11. **打包并上传技能载荷资产**：运行 `bash scripts/package-skill.sh vX.Y.Z` 生成 `dist/ai-agent-governance-skill.tar.gz`（版本稳定名，只含 SKILL.md + references/ + scripts/ + LICENSE，见 SKILL.md 安装载荷定义），随后 `gh release upload vX.Y.Z dist/ai-agent-governance-skill.tar.gz`。**校验**：`tar -tzf` 列出的内容必须只有载荷，不得含 docs/、tests/、README 等基础设施文件。
12. **更新状态**：把 `.governance/manifest.json` 的 `release.validated` 置为 `true`，重新校验并记录到 `validation.json`。

## 安全规则

### 禁止自动发布

AI 不得自动创建 tag、自动 push tag、自动创建 release，除非：

- 已生成 Release Proposal
- 开发者已明确批准

### 发布前重新验证

批准后、开始执行写操作前，必须重新检查（Phase 4 第 1 步）：

- git HEAD（与批准时 Proposal 的 `headSha` 比对）
- git status（工作区干净）

任一发生变化 → **取消当前 release 流程**，重新分析。

流程内的版本同步、归档与 release commit 是**预期变化**；`execute` 打 tag 前会再次检查工作区干净且 HEAD 与刷新后的 Proposal `headSha` 一致（Phase 4 第 6-7 步）。

## 不确定性处理

如果 AI 无法确定是否 Breaking Change、是否属于新功能：

1. 标记为 **Potential Breaking Change / Potential Feature**
2. 请求开发者确认
3. 暂停 release（`plan` 退出码 2，`releaseType: "unknown"`）

不得自行猜测。

## 0.x 版本规则

对于 `0.x.y` 版本：

- 仍然按照上述规则判断 Major / Minor / Patch。
- Breaking Change **不自动升级到 1.0.0**。
- 只有开发者明确要求稳定版本发布时，才允许进入 1.0.0。

## 事务性（Transactional Guarantee）

发布操作必须**事务化**，任何失败都不得留下半完成状态：

- 任何前置检查失败 → 在**开始写操作之前**中止，不触碰仓库（不版本同步、不 commit、不 tag、不 push）。
- 批准后、执行前的工作区/HEAD 意外变化 → 取消流程，重新 plan。
- 进入写操作后（版本同步 → 归档 → release commit → tag → push → GitHub Release）必须连续完成；任一步失败立即停止，报告 ⚠️/❌ 与已完成/未完成清单。
- tag 已创建但 GitHub Release 创建失败 → **不删除 tag、不强制重来**；报告 ⚠️ Blocked，说明差异（tag 已推、release 待建），由用户决定补建 release 或清理。
- 恢复：依据 `.governance/validation.json` 与 `git log` 判断已完成步骤，仅重做未完成部分。

## 权限

- 分析（`plan`）为只读操作，可自动执行。
- Git tag / push / gh release create 均为**写操作**：仅在 Proposal 已生成且开发者**明确批准**后执行（批准覆盖本次 release 序列的全部写操作）；任何写操作执行前仍须向用户说明。
- 修改 `references/workflows/release.md`、manifest 的 `release` 字段走「治理文件保护」流程。

## manifest release 字段

```json
{
  "release": {
    "version": "0.13.0",
    "tag": "v0.13.0",
    "validated": false
  }
}
```

- `version`：治理框架版本（与 `governance_version` 一致）
- `tag`：Git tag 名（`v<version>`）
- `validated`：发布后是否已通过校验（发布完成后置 `true`）
