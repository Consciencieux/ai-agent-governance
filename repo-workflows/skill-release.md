# Skill Repository Release（技能仓库发布流程）

本文件仅适用于**技能仓库自身发布**（ai-agent-governance）。被治理项目请使用 `references/workflows/release.md`——本文件不在该流程中引用，不被 INIT 安装，不进入生成的治理项目。

`AGENTS.md` 中的发布路径映射即指向本文件。

## release_requirements（技能仓库发布前置检查）

| 检查 | 要求 | 失败处理 |
| --- | --- | --- |
| `git.require_clean_status` | 工作区干净 | ⚠️ Blocked |
| `tests.required` | `npm test` 退出码 0 | ❌ 停止 |
| `changelog.required` | CHANGELOG 已记录本次变更 | ⚠️ Blocked |
| `version.manifest_match_tag` | `package.json` / CHANGELOG / `SKILL.md` frontmatter `version` 与 tag 一致（无 `.governance/manifest.json`） | ❌ 停止 |
| `release.tag_required` | 目标 tag 尚不存在 | ⚠️ Blocked |
| `release.proposal_approved` | Release Proposal 已生成且开发者已明确批准 | ⚠️ Blocked |
| `release.review_satisfied` | 高风险 Proposal 的 `reviewStatus` 为 `completed` 或 `explicitly-approved` | ❌ 停止 |
| `docs.parity_passed` | `check-doc-parity.js` 退出码 0（三语文档结构平行） | ⚠️ Blocked |
| `sync.passed` | `check-sync.js` 退出码 0 | ❌ 停止 |
| `plan.delivery_verified` | `check-plan-delivery.js` 退出码 0 | ❌ 停止 |

与被治理项目的差异：无 `validator.passed`。技能仓库没有 `.governance/manifest.json`，也没有软件项目形态的治理工件，`verify_governance.js` 按默认检查必然失败（ADR-0006）——该项由 `tests.required`（`npm test` 退出码 0）替代。注：`.governance/release-proposal.json` 是本流程的运行时产物（git 忽略），与上述「无 manifest」不矛盾。

## 版本一致性（版本号三处 + tag，无 manifest）

技能仓库无 `.governance/manifest.json`，版本一致性简化为三处：

- `package.json` 的 `version`
- `CHANGELOG.md` 顶部版本节（`[X.Y.Z]`）
- `SKILL.md` frontmatter `version`

+ Git tag `v<version>`

## Phase 1：Analyze（分析）

AI 分析当前仓库状态：

- 当前 Git tag / 当前版本号（`git tag -l`、`package.json`）
- `git log` 与 `git diff`（自上次发布以来的变更）
- 文件变化、API/interface 变化、用户可见功能变化
- **已裁定延后的发布安全事项**：读 `docs/{en,zh-CN,zh-TW}/roadmap.md` 的「Deferred release-safety decisions」小节。这些条目记录了「门禁绿灯」实际证明范围之外的已知缺口——发布前必须知道自己在依赖什么、不在依赖什么。它们不阻断发布，但若某条的触发条件已经成立（例如本次发布要求证明评审者身份），应先停下另开 TASK 计划。

运行只读分析工具生成 Proposal：

```bash
node scripts/release-manager.js plan --json '{"current":"X.Y.Z","changes":[{"type":"breaking|feature|fix|docs|refactor|test|ci|chore","description":"...","uncertain":false}]}'
```

`plan` 只读、永不写仓库；输出 JSON Proposal。退出码 2 = 需要澄清。

## Phase 2：Version Decision（SemVer 2.0.0）

版本判断严格遵循 SemVer 2.0.0，优先级从高到低：

**Major —— 仅当存在真实 Breaking Change**：删除公开 API、修改公开 API 导致旧调用失效、删除公开配置、修改 CLI 行为导致已有脚本失效、修改公开协议或数据格式导致不兼容。Breaking Change 必须影响**外部用户或开发者**；内部重构、文件移动、架构调整不能触发 Major。

**Minor —— 仅当增加向后兼容的、用户可感知的新能力**：新增用户功能 / 公开 API / CLI 命令 / 配置能力 / 用户可感知的 Agent 行为。判定标准是**用户可感知**——开发者或被治理项目能直接感知其存在或效果。以下**不得**触发 Minor（归入 Patch）：README 与文档修改、测试增加、CI 修改、重构、性能优化、日志优化、类型注释、内部工具与机制完善。

**Patch —— 其余全部**：Bug 修复、重构、性能优化、文档更新、测试调整、配置调整、依赖更新、内部工具与机制完善。

**禁止的启发式判断**：不得根据 diff 行数、commit 数量、修改文件数量、新增代码数量判断版本——代码规模不代表版本影响范围。

**0.x 规则**：`0.x.y` 仍按上述规则判断；Breaking Change **不自动升级到 1.0.0**，只有开发者明确要求稳定版本发布时才允许进入 1.0.0。

## Phase 3：Approval Gate（审批门禁）

生成 Release Proposal 后，必须等待开发者确认。**风险分级规则（Tiered Review Gate）**：

| 风险等级 | 变更类型 | 审核要求 |
| --- | --- | --- |
| 低 | docs/typo/版本号/链接修正/格式 | 轻量级门禁（标准验证序列）自动跑，通过即提交，不询问 |
| 中 | 新功能/脚本逻辑/政策变更/模板变更 | 轻量级门禁 + Proposal 标注 suggested；开发者批准时决定是否先跑 review-manager |
| 高 | 安全/权限/删除保护/治理文件行为变更 | **必须**先跑 review-manager（范围 = git diff，非全项目），或开发者逐项明确确认，否则不发布 |

轻量级门禁**总是自动跑**；高风险清单**明确列举**（见上表），不依赖 AI 自由裁量，边界模糊时**取更高级别**。Proposal JSON 必须包含 `riskLevel`、`reviewRecommendation` 与 `reviewStatus`；高风险执行前 `reviewStatus` 必须为 `completed` 或 `explicitly-approved`，否则 `release-manager execute` 拒绝创建 tag。

批准后把 Proposal 记录到 `.governance/release-proposal.json`。

## Phase 4：Release Execution（执行）

开发者确认后，AI 执行：

1. **再次检查仓库状态**：`git status`、`git rev-parse HEAD`。工作区干净且 HEAD 与 Proposal 中 `headSha` 一致；若变化 → 重新分析。
2. **版本同步**（技能仓库三处 + tag，无 manifest）：
   - 更新 `package.json` 的 `version`
   - 更新 CHANGELOG（`[Unreleased]` → `[X.Y.Z]`）
   - 更新 `SKILL.md` frontmatter 的 `version`
   - 同步更新 `references/init-spec.json` 的 `inputs.governance_version.default` 与 `scripts/generate-governance.js` 的兜底哨兵（决定新 INIT 给被治理项目打上的版本号）
3. **计划交付对账**：`node repo-tools/check-plan-delivery.js --gate`（退出码必须 0）
4. **归档计划**：已完成的 `TASK_<name>.md` 移入 `docs/archive/`（技能仓库共享单语），**保留原文，绝不删除**。
   - **归档冲突规则**：一份计划在本仓库存在三份语言副本（`docs/{en,zh-CN,zh-TW}/plans/X.md`），而 `docs/archive/` 是共享单语目录。**以简体中文副本为准**；en / zh-TW 副本不是归档候选。最终 `docs/archive/` 下只有一个 `X.md`。
   - 未完成的计划继续留在各语言树的 `plans/` 下。
5. **更新 roadmap**：按 `docs/en/roadmap.md` 维护规则重置 horizon
6. **提交 release commit**：`git add`（版本同步与归档相关文件）→ `git commit -m "release: vX.Y.Z - <summary>"`
7. **运行发布门禁**：`npm run check:skill-release`（exit 0；`npm run check:release` 是其兼容别名）。该命令是 REPO-ONLY 的仓库维护入口（定义在 `package.json`），被治理项目没有它——目标项目的发布门禁见 `references/workflows/release.md`。
8. **校验（本仓库以 `npm test` 为准）**：技能仓库的校验义务由第 7 步的 `npm test` + 发布门禁承担。`scripts/verify_governance.js` 在本仓库**预期退出码 1**（无 `.governance/`、无软件项目形态工件，validator 按默认检查必然失败——ADR-0006，本仓库不 dogfood 自身框架）。它不是本流程的门禁：**不得为了让它通过而伪造 `.governance/`**，也不得因其非零退出码而中止发布。
9. **生成/更新 Proposal**：`headSha` 更新为新 HEAD
10. **创建 annotated tag**：

    ```bash
    node scripts/release-manager.js execute --proposal .governance/release-proposal.json --yes
    ```

11. **推送**：`git push origin main` → `git push origin vX.Y.Z`
12. **创建 Release**：`gh release create vX.Y.Z --title "vX.Y.Z" --notes "<Release Notes>"`
13. **打包并上传技能载荷资产**：

    ```bash
    bash repo-tools/package-skill.sh vX.Y.Z
    gh release upload vX.Y.Z dist/ai-agent-governance-skill.tar.gz
    ```

    校验两项，缺一不可：
    - **内容白名单**：`tar -tzf` 列出的内容只含载荷（`SKILL.md` + `references/` + `scripts/` + `LICENSE`），不得含 `docs/`、`tests/`、`README` 等基础设施文件。
    - **校验和**：记录 tarball 的 SHA-256（`shasum -a 256 dist/ai-agent-governance-skill.tar.gz`），随 Release Notes 一并发布，供安装方核对下载完整性。

## 安全规则

AI 不得自动创建 tag、push tag、创建 release，除非：已生成 Release Proposal 且开发者已明确批准。

批准后、执行前，必须重新检查 git HEAD 与 git status。任一变化 → 取消流程，重新 plan。

**事务性**：任何前置检查失败 → 在开始写操作之前中止，不触碰仓库。进入写操作后（版本同步 → 归档 → release commit → tag → push → GitHub Release → 资产上传）必须连续完成；任一步失败立即停止，报告 ⚠️/❌ 与已完成/未完成清单，**不得改用别的方式重试**。tag 已创建但 GitHub Release 创建失败 → **不删除 tag、不强制重来**；报告 ⚠️ Blocked，由用户决定补建 release 或清理。
