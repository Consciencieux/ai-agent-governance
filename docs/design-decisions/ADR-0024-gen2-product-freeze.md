---
id: ADR-0024
status: Accepted
generation: gen2
---

# ADR-0024：2.0 产品冻结

## 背景

Phase 0–6 已 EXITED。ADR-0018 把 2.0 执行顺序定为 Phase 0–8，并把「Phase 8 重建阻断权威」读成发布前提。同时仓库后来说：2.0 产品 = 本仓 INSTALLED Gen2 skill；PLAN-0037 全文提炼放到 2.0 之后。两套定义叠在一起后，**没有一份「装什么才算能发」的冻结切片**。

RESEARCH-0006 保存了 PLAN-0001..0030 与 Pre-PLAN 的能力基线，第四列长期 `undecided`。PLAN-0035 Disposition 只裁定 checker / cluster / evaluator（KEEP/WRAP/EXTRACT），**不是**产品能力去留。Git 写协议（CTRL-0002）语义家是 `git.policy.md`，Agent 协议路径 `evaluation_binding: none`，且与 `AGENTS.md` 双写。

本 ADR 冻结 2.0 **产品切片**。它不增加 Phase 编号，不推倒 Phase 0–8，不 Active PLAN-0037，不授权立刻改 payload 脚本。

## 决策

**1. 2.0 产品 = 本仓 INSTALLED Gen2 skill。** 不是跨项目通用包（那是 PLAN-0037，仍冻结至 2.0 之后）。不是「Phase 8 checkpoint 绿了就算发布」。

**2. Phase 8 EXIT ≠ 2.0 发布。** 发布还须满足本 ADR § 发布门槛。ADR-0014 仍然：checkpoint ≠ SemVer / skill-release；Migration Mode 下禁止正式 tag。

**3. 产品处置词汇（与 PLAN-0035 checker 词汇正交）。** 一条能力必须恰好落入一档：

| 档 | 含义 |
| --- | --- |
| `must-ship` | 进入 2.0 INSTALLED 默认面；缺则不得发 |
| `repo-keep` | 本仓库继续要；不进 skill 默认面 |
| `later` | 2.0 后或后续阶段可做；**不挡**发布 |
| `retire` | 2.0 不带、不承诺迁移 |
| `out` | 已离开本仓库；禁止再吸收回来 |

载体可变。禁止「文件还在所以能力算装上」。禁止把 RESEARCH-0006 未列能力静默带进 2.0。

**4. 2.0 必装（must-ship）。** 语义必须出现在 INSTALLED 载荷（政策 / 生成器 / 脚本 / 生成子技能均可，不要求 1:1 旧文件）：

- 密钥扫描（不回显 secret）
- Git 工作流安全：受保护分支、禁止无人授权的 force / 直推受保护分支
- Git 写授权（consent）：不可逆写操作必须人授；失败即停；禁止静默 rebase/pull；计划批准 ≠ Git 授权
- 确定性 INIT / 生成器
- AUDIT / drift 巡检入口
- RELEASE 编排 + 人类批准（ADR-0004）
- 治理校验器（对照 manifest 的存在性/结构）
- 治理状态工件（manifest / state / validation / preflight 或其 Gen2 等价物）
- 证据分层（mechanical ≠ human-attested ≠ unverified claim）
- INSTALLED 内容可移植性（在被治理项目自身成立）
- Rule Capture、根因修复 / 失败预算、同类闭包、变更卫生
- 工程克制（机制测试）：原则进入 INSTALLED 政策，不是新 gate
- 种子负向 oracle：CTRL-0001–0006 + 路由完整性 + Safety Kernel 套件记账（PLAN-0042；`important_gap = 0`）
- 生成子技能作为**产品能力叶**（禁止折叠成「有生成机制」一行）：`repository-inspection`、`ci-generator`、`governance-validator`、`state-manager`、`drift-check`、`release-manager`、`plan-manager`、`review-manager`
- Implementation Review（现有 review-manager 定位；Phase 7 可换载体，不可删能力）

**5. 仓内保留（repo-keep）。** 本仓库继续要，默认不进 skill：

- 术语门禁（repo-owned）
- 计划交付锚点（CTRL-0005）
- 领域级测试入口（`--suite`）
- 本仓计划归档 / pending-archive 判定
- 三语产品文档与翻译新鲜度（本仓文档面）
- Producer/Product 分发角色与 role-completeness
- Task→Capability 路由图 / CLI（REPO-ONLY 施工权威）
- System Review / Research Review（Phase 7 落地；repo 知识面，不是 skill 默认子技能）

**6. 后置（later）。不挡 2.0：**

- 机器可读独立 Control 文件
- CONTROL-X 跨 profile 契约测试（ADR-0018 决策 4 仍有效；2.0 不作为发布门槛）
- 保证等级 L3 运行时拦截
- FINDING-0006 全量机械规则负向 oracle（超出种子集）
- Discovery Ledger L2、consistency 剩余集群落地、principles-index #9
- 5c leftover Capability 叶 / 可选 rename
- lifecycle 残留抽出 / `state.json` phase 降为 facet（FINDING-0029）
- 脚本 dogfood / `retire` 隔离（FINDING-0028）
- Agent 活动审计的完整 `activity.jsonl` 形态
- 多 Agent 锁的强化（FINDING-0012 原子性）
- opt-in githooks 作为 2.0 必装
- MIGRATE 编排的独立产品入口（1.x→2.0 升级路径可在发布后补；2.0 首发可用文档说明）
- Git consent 的机械 evaluator（协议必须 must-ship；机器拦 Agent 违规是 later）

**7. 退役（retire）或移出（out）：**

- `retire`：治理评分 / badge（PLAN-0004）。非基础 invariant；1.0 成熟错觉来源之一。
- `out`：Skill INSTALL/UPDATE/ROLLBACK（PLAN-0025）→ 未来 `ai-skill-manager`。本仓只保留 version / check-update 类元数据（`later`，非必装）。
- 已废语义不得回潮：PLAN-0017 与 Release 耦合的归档时序（ADR-0016 已解耦）。
- PLAN-0015 的价值是历史失效证据，不把当时那批 bug 永久架构化。

**8. Git 协议：保留 HITL 不变量，削薄手续。**

保留：人授 commit/push/tag 与独立危险操作；失败即停；push 被拒不得擅自 rebase/pull；密钥扫描；计划批准不是提交授权。

削薄（施工时改 `git.policy.md` 为唯一语义家；`AGENTS.md` 只保留指针/摘要，禁止第二份权威正文）：

- 用户明确的写指令，或 IDE 对「暂存+提交+推送」确认条的一次确认，**就是**该变更集的确认。回显命令序列是执行记录，不是第二次等待（与「指令本身不是确认」不矛盾：模糊任务级表述仍须先问）。
- CHANGELOG 按本仓 accession（ADR-0012 / `changelog-policy.md`），禁止「每次 push 必须改 CHANGELOG」。
- 分支命名服从当前仓库模型（含 `migration/2.0-governance-architecture`）；作废 `feature/agent-<date>-*` 作为硬规则。
- 被治理项目的分支/直推政策仍由 `.governance/git-policy.json` 承载（must-ship 语义；载体可换）。

**9. Phase 7 / 8 必须消费本冻结。** 禁止未对照本表开工「Review 三类拆分」或「重建全部 Gen1 gate」。Phase 7 验收面 = Implementation Review 能力仍在 + System/Research 两类在 repo 可运行。Phase 8 验收面 = **必装机械控制**的阻断权威回到 CI/release；不是把所有观测化 Gen1 cluster 重新变红。

**10. Confirmed Finding 不是一人一个 Phase。** 只有挡住 § 发布门槛的 Finding 才是 2.0 blocker。其余保持 Confirmed 并 `later` / 关闭条件另计。

## 发布门槛（2.0 skill-release 前）

同时成立才允许走 `repo-workflows/skill-release.md`（且须先退出或按 ADR-0014 允许的方式结束 Migration Mode 禁 tag）：

1. §4 必装能力在 INSTALLED 面可指出载体（允许仍是 WRAP 后的 Gen1 脚本）。
2. Git consent 单一语义权威 = `git.policy.md`；repo 入口不再作为第二权威。
3. 必装 INSTALLED 文本通过引用闭合：在被治理项目路径上成立（FINDING-0007 的 2.0 切片，不是全仓所有文档）。
4. 薄入口：SKILL / 生成 AGENTS 以指针加载 Capability，不把 lifecycle 全文当作 always-on（ADR-0022；允许 5c leftover 仍存在）。
5. PLAN-0042 种子 `important_gap = 0` 仍成立。
6. Phase 8：必装机械控制的阻断路径在 CI / release 上 fail-closed。
7. PLAN-0037 仍 Design 冻结。
8. 人类批准发布（ADR-0004）。

## 后果

- RESEARCH-0006 第四列改为本 ADR 投影；Research 仍不自己裁决。
- ADR-0018「Phase 8 后即可发布」由后续修正收窄：Phase 8 必要但不充分。
- Roadmap 索引本冻结；不把冻结表抄进路线图。
- 下一步施工仍是 Phase 7 Plan（待立），但其 In 集合必须引用本 ADR。

## 参考

- RESEARCH-0006 能力基线 · ADR-0018 阶段顺序 · ADR-0014 Migration Mode · ADR-0012 CHANGELOG 准入
- ADR-0004 HITL 发布 · ADR-0020 单一语义权威 · ADR-0022 薄入口 · ADR-0023 CTRL-0002
- PLAN-0035 checker Disposition（正交）· PLAN-0037 冻结 · PLAN-0042 种子 oracle
- FINDING-0006 / 0007 / 0014 / 0026 / 0028 / 0029
