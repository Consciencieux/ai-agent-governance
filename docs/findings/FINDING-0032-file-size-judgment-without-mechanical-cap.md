---
id: FINDING-0032
status: Confirmed
type: control-gap
observed_in: gen2
---

# FINDING-0032：行数仅靠 judgment ≈ 无限制（缺机械上限检查）

## 分类

- 严重度：中高（肥胖文件持续堆积；拆分被无限推迟）
- 影响范围：repo（已有顾问 carrier）、skill / 被治理项目（几乎无对等机械约束）
- 研究方向：C. 执行强度缺口 · A. 生产者 / 产品分离 · G05 治理自身膨胀

## 观察

「按长度一刀切」不可取（职责密度、Context Economy、单一事实源才是裁决），但**只让 Agent 自行判断是否超长，在实践中约等于没有限制**：模型更倾向「严谨地容忍」巨型文件，不敢主动精简或拆分，以免误伤权威或破坏 SSOT。

本仓 2026-09-15 已落地 **REPO-ONLY** 顾问级预算与机械体（`docs/README.md` § 顾问级行数预算、`repo-tools/check-file-size-budget.js`、`AGENTS.md` always-on）。Skill 载荷侧仅有 [`coding.policy.md`](../../references/policies/coding.policy.md) 一句 judgment（「行数是信号不是证明」），**无数字表、无 INIT 脚本、无义务库存行**。被治理项目装 skill 后，对「AI 堆胖文件」几乎零机械压力。

## 证据

1. **行为假设与会话共识（2026-09-15）**：讨论明确区分「禁止自动硬拆」与「必须机械报黄/报红」；结论是前者管处置权、后者管注意力——缺后者时 Agent 会默默继续堆。
2. **非对称落地**：本仓 `npm run check:file-size` 已能列出 `ci.md` / `sub-skills.md` / `generate/run.js` 等 soft|review 命中；同一语义**未**进入 skill `scripts/` 或 INSTALLED 政策数字表（有意避免本仓卫生污染产品，但留下产品面空洞）。
3. **同族模式**：FINDING-0003（MUST ≠ deny / judgment 无 carrier）；FINDING-0015（静态长文靠注意力）。本条是「肥胖信号」上的同一失效：自然语言克制进了上下文 ≠ 会触发拆分动作。

## 根因

1. **Judgment 被当成上限**：把「别一刀切」误写成「不要机械计量」，删除了唯一能打断「不敢拆」惯性的注意力钩子。
2. **处置权与检出权绑死**：误以为「人确认后才拆」就必须「不能机械报红」；正确拆分是 **mechanical 检出 + require_review 处置**。
3. **生产者/产品不对称**：repo 有顾问 carrier，skill 只有弱 pointer → 装机项目重复本仓曾有的肥胖失败模式。

## 影响

- 载荷与本仓脚本/工作流持续变百科；Context Economy 与薄入口原则被架空。
- Agent 在审计时「看见很大但不改」→ 技术债只增不减。
- 用户误以为「工程克制已覆盖」，实际无 fail-closed / 甚至无 advisory 钩子。

## 关闭条件

1. **产品语义成文（INSTALLED 可移植）**：明确协议——超预算档必须向人汇报并提交拆分方案；禁止默默继续堆；**禁止**仅为过线自动硬拆。数字表可用项目默认/可配置，不得把本仓 Research/ADR/repo-tools 预算原样焊死为唯一产品表。
2. **Skill 侧至少一类机械 carrier**（INIT 拷贝或明确 SKILL-INTERNAL 仅服务执行器）：对约定路径做 soft/review 报告；`--gate` 对 review（或「继续扩大越过 review」）可失败；义务行记入 `capability-enforcement`（`mechanical` / `require_review`），不得标成「已靠 inherent_judgment 解决」。
3. **本仓**：顾问 carrier 已存在；关闭本条的 repo 半截须证明 daily/must-ship 是否晋升已裁决（未晋升不算缺陷，但须在关闭叙述中写明），且不得宣称「仅 AGENTS 指针」已关闭 skill 半截。

## 解决情况

（进行中。）Repo：顾问预算 + `repo-tools/check-file-size-budget.js` 已落地，**未**进 daily `check`。Skill：INSTALLED `scripts/check-file-size-budget.js` + `coding.md` 预算表 + engineering-restraint 叶 + enforcement 义务行已接入 INIT；关闭仍须验证装机后路径与「禁止空口声称已评估」的回归保护。

## 关联

- FINDING-0003（声明强度 ≠ 执行强度）
- FINDING-0015（注意力负担；无机械则靠自觉）
- FINDING-0001 / ADR-0020（生产者/产品分离；本仓卫生 ≠ 自动进载荷）
- `docs/README.md` § 顾问级行数预算
- `references/policies/coding.policy.md` § 工程克制 · 边界三

## 回归保护

- Repo：`npm run check:file-size` / `--json` 对已知超 soft 文件稳定输出；`CHANGELOG` 与 `docs/plans/archive/**` 豁免。
- Skill：关闭前须有负向或夹具证明「超 review 会进入报告/门禁路径」，且文档不得再写「仅靠 Agent 自觉判断行数即足够」。
