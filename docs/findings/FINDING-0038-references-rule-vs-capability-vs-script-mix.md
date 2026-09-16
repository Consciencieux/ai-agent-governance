---
id: FINDING-0038
status: Resolved
type: architecture-gap
observed_in: gen2
resolved_in: gen2
---

# FINDING-0038：references 把常驻治理规则、任务怎么做、脚本调用混成同一路由面

## 分类

- 严重度：高（Agent 一次任务会读到不该读的脚本路径，或漏读该常驻的准则；能力叶与政策双写）
- 影响范围：`references/policies/` · `references/capabilities/` · `repo-tools/routing-graph.v0.json` · `enforcement.v0.json` · SKILL 能力叶表
- 研究方向：B. 政策/控制平面 · C. 执行缺口 · 与 FINDING-0037（脚本有效区）同轴

## 观察（盘点当时；2026-09-16 初查）

对当时 `references/capabilities/**/*.md`（约 33）与 6 份 `policies`、路由图、`enforcement.v0.json` 对照后：

1. **能力叶模板是任务卡**（Trigger / Authority / Invoke / Verify），但一部分叶里塞了**常驻准则长文**（自称「本叶为权威正文」）。
2. **另一部分叶几乎只是脚本说明书**（Authority = `scripts/*.js`，Invoke = `node …`），没有独立语义。
3. **路由图把三类东西都挂进同一 `authorities.path`**：能力 md、policy md、**以及 `.js` 脚本**——Agent 会被指向去「读」脚本。
4. **`binds`→`run_set` 几乎空**（几乎只有 CTRL-0001）。
5. **政策与能力叶双写 / 指针打架**（同主题多权威）。

这与「治理规则 = 时时准则；能力路由 = 某次任务怎么做；脚本 = 机械调用」的分工不一致。

## 证据（盘点当时的路径；其后处置见「解决情况」）

### A. 最像政策（常驻准则写进能力叶）的文件

| 路径（盘点时） | 现象 |
| --- | --- |
| `capabilities/change-hygiene.md` | 全文台账/分层法；自称权威正文 |
| `capabilities/root-cause-repair.md` | 失败预算/双域/sibling 等长规范 |
| `capabilities/discovery-ledger.md` | L1 契约 schema/枚举写在叶内 |
| `capabilities/rule-capture.md` | Phase 5a–5c 协议正文在叶内 |
| `capabilities/git-write-consent.md` | 复述同意规则；叶与路由/SKILL 指针打架 |
| `capabilities/engineering-restraint.md` | 叶内再述机制测试；路由绑叶而非 policy |
| `capabilities/installed-portability.md` | 叶自称可移植合同正文 |

### B. 几乎纯脚本说明书（宜机械调用，不宜当「读准则」）

`content-consistency.md` · `doc-freshness.md` · `secret-scanning.md` · `plan-sync.md` · `git-workflow-safety.md` · `governance-validator.md` · `sync-groups.md`（及部分 subskill 的「去跑门禁」指向）

### C. 路由混用（盘点时）

- `secret-protection` → `scripts/check-secrets.js`（当 authority）
- `plan-delivery` → `repo-tools/check-plan-delivery.js`
- `change-hygiene` / `root-cause-repair` / `discovery-ledger` / `rule-capture` → 长文能力叶
- `git-write` → `references/policies/git.policy.md`（政策，正确）

### D. 与 FINDING-0037 的关系

脚本对「习惯/语义」≈0、对「结构/同步/动作分类」有效。把脚本路径塞进**阅读权威**，既不能提高执行度，又挤占 read 预算；把常驻语义塞进**任务叶**，则每次相关任务重复灌长文，且与 policies 双写。

## 根因

目录名义上按「语义责任」分了 policies / capabilities，但**路由与写作习惯仍按「有个 md 就挂上」**，没有强制区分：

- **常驻准则**（跨任务仍成立）  
- **任务提示**（本次怎么做）  
- **机械载体**（跑哪个命令 / CTRL）

`enforcement.v0.json` 已按义务行分了 mechanical / judgment，但**调度器没用它来填 `run_set`**，却用 authorities 把脚本混进阅读面。

## 目标分工（主张）

| 种类 | 放哪 | 怎么进 Agent |
| --- | --- | --- |
| 常驻治理规则 | `references/policies/`（唯一正文） | 薄入口指针 + 任务触达时读 policy；**不是**能力叶长文 |
| 任务怎么做 | `references/capabilities/` 薄卡 | 路由 `read_set` 只解析到 **md/policy 文本** |
| 脚本/门禁 | `scripts/` + enforcement `carrier` | 只进 `run_set` / 显式 Invoke；**禁止**作为 read authority 路径 |

能力叶允许：Trigger + 指向政策的 Authority + Invoke（含 `node …`）+ Verify。  
能力叶禁止：再当第二份政策百科；也禁止只靠「读 .js」充当约束。

**正文判定补充：** 不是「凡曾写在能力叶里的都是产品规则」。盘点后按正文区分——发现台账 / 根因修复 / 变更归位 / 工程克制 / 可移植性 / Git 确认卫生 = 产品常驻规则；Rule Capture Phase 5a–5c = 本仓施工协议，不进 INSTALLED。

## 关闭条件

| # | 条件 | 状态（2026-09-16） |
| --- | --- | --- |
| 1 | 路由：`authorities` 可读路径不得指向 `.js`；脚本只通过 `binds` / carrier→`run_set` | **已满足** |
| 2 | A 表：准则正文只留在 policies（或单一已声明正文）；错位叶删除或薄卡；SKILL / lifecycle 指针无打架 | **已满足**（产品规则归 policy；Rule Capture 从 INSTALLED 撤出） |
| 3 | B 表脚本说明书：可保留为薄 Invoke 卡；日常路由以 run 为主；不得叙述成「读此叶 = 语义已加载」 | **已满足**（零增量卡删除；SKILL 表分读/跑；剩余薄卡 Authority 标明 RUN） |
| 4 | `enforcement.v0.json` 与 routing 的 mechanical 义务可对上（至少 must-ship CTRL 进 run_set），或显式声明「enforcement 不对调度负责」 | **已满足**（`binds` 扩 must-ship CTRL + 主载体；`enforcement_align` 声明调度面=binds、分类面=enforcement；routing 套件断言） |
| 5 | 回归：routing 套件 + `route-task.js --task edit_scripts` 可见 read 无 `.js`、run 含密钥类 CTRL | **已满足** |

## 解决情况

- **切片 1：** `secret-protection` / `plan-delivery` 不再把 `.js` 当 authority；脚本进 `binds`→`run_set`；`engineering-restraint` READ=`coding.policy.md`。
- **切片 2：** 七份错位能力叶删除；enforcement / SKILL / 三语 architecture 同步。
- **切片 4：** 按正文恢复产品政策与 INIT 薄卡（`generated-subskill-lifecycle` / `ssot-repair`）；`seed-oracles` 不进 INSTALLED。
- **切片 5：** Rule Capture 5a–5c 从 lifecycle / SKILL / enforcement / routing / INIT state / 模板删除。
- **切片 6：** 清扫其他 INSTALLED 施工残留（H2a/Phase 7 名、must-ship/repo-keep 处置词、本仓版本叙事、REPO-ONLY 脚本指针、`oracle-inventory` carrier、门禁文案里的 skill-release.md）。
- **切片 7（关闭条件 4）：** 扩展 `routing-graph.binds`（git-write / plan-delivery / root-cause-repair / engineering-restraint / release-governance + 既有 secret）；新增 `enforcement_align`（aliases + must_ship_ctrls + ctrl_carrier_map）；routing 套件断言 binds 项 ∈ 对应 enforcement mechanical carriers，且 CTRL-0001/0002/0003/0004/0006 均出现在 binds。显式声明：enforcement = 分类清单，binds = RUN 调度面。`change-hygiene` 的 repo_only advisory 载体故意不自动调度。
- **切片 8（产品抛光）：** SKILL 能力叶表拆成「读 / 跑」两列；删除零增量卡（`content-consistency` / `doc-freshness` / `governance-validator` / `git-workflow-safety`）并把 `secret-scanning` 勿回显并进 `security.policy`、`ssot-repair`/`evidence-tiers` 改指 lifecycle/testing；enforcement leaf 同步指 policy；INIT / routing / 三语 architecture 树同步。保留有真实任务步骤的叶（deterministic-init、audit-drift、governance-state、release-*、review-mechanism、generated-subskill-lifecycle、plan-sync、sync-groups、subskills/*）。

## 关闭记录

**Resolved（2026-09-16）。** 关闭条件 1–5 均已满足。剩余非关闭项：脚本注释里的 `audit 2026-09-*` 考古注可后 scrub。

## 关联

- FINDING-0037（门禁有效区）
- FINDING-0003、FINDING-0015、FINDING-0026、FINDING-0029（相关但本条以本轮文件盘点为准）
- `repo-tools/routing-graph.v0.json` · `repo-tools/lib/routing.js` · `references/capabilities/enforcement.v0.json`

## 回归保护

关闭时必须有：routing 测试断言 authorities 富集路径非 `.js`；至少一条任务类 `run_set` 含已声明 CTRL；A 表主题在 policies 与 capabilities 之间无第二份完整正文；INSTALLED 不再教 Rule Capture 5a–5c。
