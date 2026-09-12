# 2.0 skill-release 剩余清单

REPO-ONLY。产品定义权威：[ADR-0024](../design-decisions/ADR-0024-gen2-product-freeze.md)。  
流程权威：[`repo-workflows/skill-release.md`](../../repo-workflows/skill-release.md)。  
**Phase 8 EXITED ≠ 本清单完成。** Approval Gate 批准前禁止 tag / push / GitHub Release。

## 已满足（Phase 8 / 机械面）

- [x] `npm run check:must-ship` fail-closed
- [x] Migration CI blocking 调用 `check:must-ship`
- [x] skill-release 含 `gates.must_ship`
- [x] 台账 gap=0（`docs/research/working/must-ship-gates.md`）
- [x] Git HITL 单一语义权威 = `references/policies/git.policy.md`
- [x] PLAN-0037 仍 Design 冻结
- [x] 未宣称 2.0 已发布

## 预检证据（agent 可完成；2026-09-12）

下列为 **skill-release 前的机械预检**，不是 Approval Gate，也不是 tag 授权。

| 项 | 结果 | 备注 |
| --- | --- | --- |
| `npm run check:must-ship` | pass | 非沙箱；含 security 全绿 |
| `bash repo-tools/package-skill.sh` | pass | `dist/ai-agent-governance-skill.tar.gz` |
| 空仓解压 + INIT Phase C | pass | `generate-governance.js --phase C`；8 子技能 |
| 干净目标 `verify_governance.js`（cwd=目标根） | **62/62** | 须在目标根执行；勿用错误 cwd |
| AUDIT/drift 人工走查 | 未做 | 留给 skill-release |
| RELEASE 走到人类批准前 | 未做 | 留给 skill-release |
| Mode 退出人类批准 | 未做 | 留给 skill-release |
| Findings 0007/0003/0018 关闭或豁免 | 部分 | 0003 必装切片已闭合；0007/0018 仍待 Proposal |

## 人类 / skill-release（2.0 阻断）

### A. 干净目标可用性（ADR-0024）

- [x] 打包 tarball（预检已做；发布提交须重跑）
- [x] 解压到空 git 仓 + INIT 至 `.governance/manifest.json`（预检已做）
- [x] 八个子技能生成（预检已做）
- [ ] AUDIT / drift-check 路径人工确认（可基于预检目标复跑）
- [ ] RELEASE 走到**人类批准**前一步（本清单本身不授权打 tag）
- [ ] 证据路径写入 Release Proposal

### B. Migration Mode 退出（ADR-0014）

- [x] must-ship 为 migration 阻断权威（Phase 8）
- [ ] `main` 合入后的 dual-CI / Gen1 observational 处置已决策
- [ ] **人类显式批准**退出 Migration Mode
- [ ] 按 Proposal 合入 / 集成（禁止即兴）

### C. Blocker Findings（ADR-0024）

| Finding | 2.0 角色 | 动作 |
| --- | --- | --- |
| FINDING-0007 | 可移植性 blocker | 干净目标预检已绿 — Proposal 附证据后关闭 **或** 书面豁免 |
| FINDING-0003 | 必装阻断面 | Phase 8 切片已覆盖；残留判断型 MUST = later — Proposal 写明边界 |
| FINDING-0018 | 成熟度误判 | 干净目标门禁成立后关闭或豁免 |

其余 Confirmed Finding = `later`（不挡 2.0）。

### D. 发布机械

- [ ] 版本升至 `2.0.0`（五同步点：package.json / CHANGELOG / SKILL.md frontmatter / init-spec default / generator sentinel）
- [ ] 发布提交上 `npm run check:must-ship` 绿
- [ ] 按 `skill-release.md` 走完门禁（含 `gates.must_ship`）
- [ ] Approval Gate → Proposal 批准
- [ ] 仅在显式同意回声后：tag + GitHub Release + tarball asset

## 2.0 前明确不做

- migration 分支上 Gen1 `npm run check` 全绿
- CONTROL-X / L3 / FINDING-0006 全量 oracle
- 解冻 PLAN-0037
- 拆分 AGENTS.md / SKILL.md 为多文件
- 重写或删除全部 Gen1 WRAP 脚本

## 证据表（发布时填写）

| 项 | 结果 | 路径 / 备注 |
| --- | --- | --- |
| `check:must-ship` | 预检 pass | 发布前重跑 |
| 打包 tarball | 预检 pass | `dist/ai-agent-governance-skill.tar.gz` |
| 干净 INIT | 预检 pass | Phase C；8 skills |
| verify 干净目标 | 预检 62/62 | cwd=目标根 |
| AUDIT/drift | | |
| RELEASE 走到批准前 | | |
| Mode 退出批准 | | |
| Findings 0007/0003/0018 | | |
