---
id: FINDING-0038
status: Confirmed
type: architecture-gap
observed_in: gen2
---

# FINDING-0038：references 把常驻治理规则、任务怎么做、脚本调用混成同一路由面

## 分类

- 严重度：高（Agent 一次任务会读到不该读的脚本路径，或漏读该常驻的准则；能力叶与政策双写）
- 影响范围：`references/policies/` · `references/capabilities/` · `repo-tools/routing-graph.v0.json` · `enforcement.v0.json` · SKILL 能力叶表
- 研究方向：B. 政策/控制平面 · C. 执行缺口 · 与 FINDING-0037（脚本有效区）同轴

## 观察（仅据本仓现文件；标注切片前后）

对 `references/capabilities/**/*.md`（33）与 6 份 `policies`、路由图、`enforcement.v0.json` 对照后：

1. **能力叶模板是任务卡**（Trigger / Authority / Invoke / Verify），但一部分叶里塞了**常驻准则长文**（自称「本叶为权威正文」）。
2. **另一部分叶几乎只是脚本说明书**（Authority = `scripts/*.js`，Invoke = `node …`），没有独立语义。
3. **路由图曾把三类东西都挂进同一 `authorities.path`**：能力 md、policy md、**以及 `.js` 脚本**——Agent 会被指向去「读」脚本。**切片 1 后：** `.js` 已退出 authorities；脚本进 `binds`→`run_set`。
4. **`binds`→`run_set` 曾几乎空**（几乎只有 CTRL-0001）。**切片 1 后：** secret 含脚本路径，plan-delivery 进 run；与 `enforcement.v0.json` 全面对齐仍欠。
5. **政策与能力叶双写 / 指针打架**（同主题多权威）——正文归位仍欠。

这与「治理规则 = 时时准则；能力路由 = 某次任务怎么做；脚本 = 机械调用」的分工不一致。

## 证据

### A. 最像政策（常驻准则写进能力叶）的文件

| 路径 | 现象 |
| --- | --- |
| `capabilities/change-hygiene.md` | 全文台账/分层法；自称权威正文；`coding.policy.md` 仍有平行「变更归位」段；`lifecycle.policy.md` 指针指向叶；SKILL 又指回 coding.policy |
| `capabilities/root-cause-repair.md` | 失败预算/双域/sibling 等长规范 |
| `capabilities/discovery-ledger.md` | L1 契约 schema/枚举写在叶内 |
| `capabilities/rule-capture.md` | Phase 5a–5c 协议正文在叶内 |
| `capabilities/git-write-consent.md` | 复述同意规则；叶称 git.policy 唯一权威；路由 `git-write` 却绑 policy，SKILL 表绑本叶 |
| `capabilities/engineering-restraint.md` | Authority 指 coding.policy，叶内再述机制测试；路由绑**叶**而非 policy |
| `capabilities/installed-portability.md` | 叶自称可移植合同正文 |

### B. 几乎纯脚本说明书（宜机械调用，不宜当「读准则」）

`content-consistency.md` · `doc-freshness.md` · `secret-scanning.md` · `plan-sync.md` · `git-workflow-safety.md` · `governance-validator.md` · `sync-groups.md`（及部分 subskill 的「去跑门禁」指向）

### C. 路由混用（摘自盘点时的 `routing-graph.v0.json`；切片 1–2 已改）

- ~~`secret-protection` → `scripts/check-secrets.js`（当 authority）~~ → 现 READ=`secret-scanning.md`，RUN=binds
- ~~`plan-delivery` → `repo-tools/check-plan-delivery.js`~~ → 现 READ=`plan-sync.md`，RUN=binds
- `git-write` → `references/policies/git.policy.md`（政策，正确）
- ~~`change-hygiene` → 长文能力叶~~ → 现 READ=`coding.policy.md` § 变更归位
- ~~`root-cause-repair` / `discovery-ledger` / `rule-capture` → 长文叶~~ → 现 READ=`lifecycle.policy.md` 对应节

### D. 与 FINDING-0037 的关系

脚本对「习惯/语义」≈0、对「结构/同步/动作分类」有效。把脚本路径塞进**阅读权威**，既不能提高执行度，又挤占 read 预算；把常驻语义塞进**任务叶**，则每次相关任务重复灌长文，且与 policies 双写。

## 根因

目录名义上按「语义责任」分了 policies / capabilities，但**路由与写作习惯仍按「有个 md 就挂上」**，没有强制区分：

- **常驻准则**（跨任务仍成立）  
- **任务提示**（本次怎么做）  
- **机械载体**（跑哪个命令 / CTRL）

`enforcement.v0.json` 已按义务行分了 mechanical / judgment，但**调度器没用它来填 `run_set`**，却用 authorities 把脚本混进阅读面。

## 目标分工（本 Finding 主张，待落地）

| 种类 | 放哪 | 怎么进 Agent |
| --- | --- | --- |
| 常驻治理规则 | `references/policies/`（唯一正文） | 薄入口指针 + 任务触达时读 policy；**不是**能力叶长文 |
| 任务怎么做 | `references/capabilities/` 薄卡 | 路由 `read_set` 只解析到 **md/policy 文本** |
| 脚本/门禁 | `scripts/` + enforcement `carrier` | 只进 `run_set` / 显式 Invoke；**禁止**作为 read authority 路径 |

能力叶允许：Trigger + 指向政策的 Authority + Invoke（含 `node …`）+ Verify。  
能力叶禁止：再当第二份政策百科；也禁止只靠「读 .js」充当约束。

## 关闭条件

1. 路由：`authorities` 的可读路径不得指向 `.js`；脚本只通过 `binds` / carrier→`run_set`（或等价字段）出现。
2. A 表七份：准则正文只留在 policies（或单一已声明正文）；能力叶改为薄卡或删除重复段；SKILL / lifecycle 指针无打架。
3. B 表脚本说明书：可保留为薄 Invoke 卡，但不得被叙述成「读此叶 = 语义已加载」；日常路由以 run 为主。
4. `enforcement.v0.json` 与 routing 的 mechanical 义务可对上（至少 must-ship CTRL 进 run_set），或显式文档声明「enforcement 不对调度负责」并改掉现状暗示。
5. 回归：`npm test` routing 套件 + 人工跑 `route-task.js --task edit_scripts` 可见 read 无 `.js`、run 含密钥类 CTRL。

## 解决情况

- 2026-09-16 **切片 1（路由读写分离）：** `routing-graph` 中 `secret-protection` / `plan-delivery` 不再把 `.js` 当作 authority；脚本进入 `binds`→`run_set`；`engineering-restraint` 的可读权威改为 `coding.policy.md`。回归：routing 套件断言 authorities 无脚本后缀。
- 2026-09-16 **切片 2（A 表正文归位 + 删错位叶）：**
  - 正文进 `coding` / `lifecycle` / `testing` / `git` 政策后，**删除**七份错位能力叶（不再留空壳指针）。
  - `enforcement.v0.json` 对应 entry 的 `leaf` 改挂政策路径；init-spec 去掉对已删叶的 copy。
  - SKILL 路由表直接指向政策节；三语 architecture 树同步。
  - B 表脚本说明书仍保留为薄 Invoke 卡（Authority 标明 RUN，不当阅读权威）。
- **仍欠（不挡本切片）：** `enforcement` carrier 与 routing `binds` 全面自动对齐（关闭条件 4 余量）。

## 关联

- FINDING-0037（门禁有效区）
- FINDING-0003、FINDING-0015、FINDING-0026（相关但本条以**本轮文件盘点**为准）
- `repo-tools/routing-graph.v0.json` · `repo-tools/lib/routing.js` · `references/capabilities/enforcement.v0.json`

## 回归保护

关闭时必须有：routing 测试断言 authorities 富集路径非 `.js`；至少一条任务类 `run_set` 含已声明 CTRL；A 表主题在 policies 与 capabilities 之间无第二份完整正文。
