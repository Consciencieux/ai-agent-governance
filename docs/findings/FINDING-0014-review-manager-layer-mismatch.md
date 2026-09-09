---
id: FINDING-0014
status: Confirmed
type: architecture-gap
observed_in: gen1
---

# FINDING-0014：review-manager 审查任务定义错了层级：实现保证（implementation assurance）≠ 架构质量（architecture quality）

## 分类

- 严重度：严重
- 影响范围：repo、skill
- 研究方向：G. 证据 / 研究方法论

## 观察

review-manager 对「发现具体缺陷」有效（GitLab stack template 错误命令、ADR false positive、vacuous checker、缺 negative oracle、fixture 不真实等都能发现），但对「项目为什么持续产生这些缺陷、架构是否在错误方向上变得越来越精密」能力明显不足。连续多轮 deep review 后项目出现 bug 更少、tests 更多、checkers 更严、docs 更一致，但用户感受不到：项目没变简单、AI 还是会忘规则、repo/skill 还是漂移、验证还是重、规则还是多。

## 证据

- **审查空间被写死在五个领域**：`same 5 domains, fixed, no dynamic expansion in v1`——Script logic / Doc consistency / Test coverage / Governance artifacts / Security。缺少 Architecture、Control model、Trigger architecture、Enforcement topology、Responsibility allocation、Producer/Product separation、Operational cost、Human/Agent attention dependency、Research validity、System-level complexity。
- **逐行深度 ≠ 抽象深度**：Full Audit 的「enumerate every file / read every line / execute tests / distrust gates」是 inspection depth，不是 abstraction depth。line-by-line depth ≠ systems thinking。
- **修复策略强化局部优化**：lightweight 与 Full audit 都要求发现 severe/general → 立即 fix → 重跑 gates。缺少关键阶段：*这个 defect 是独立 bug，还是某个 systemic failure mode 的实例？* 于是自动进入 `bug → patch`，而不是 `bug → characterize → classify → search siblings → identify systemic cause → decide patch vs architecture change`。
- **反直觉效果**：reviewer 越认真逐行看，越容易陷进局部实现细节；且「找到足够多局部 bug」会制造「团队持续忙于修复、延迟承认上层架构需要改变」的状态。

## 根因

- 审查任务定义在 implementation 层：优化目标一直是 `Defect count ↓`，而不是 `System complexity ↓ / Attention dependency ↓ / Trigger coverage ↑ / Control coverage ↑ / Validation cost ↓ / Cross-domain duplication ↓`。
- review-manager 的职责边界未声明：它保护 implementation quality，不负责证明 architecture quality；两者被混成一个「全面审查」。
- 边审边修有确认偏误风险：模型一旦开始修复，倾向认为「已经修好 → 方向是对的」，与其自己的 anti-confirmation-bias 规则（assume bugs exist）存在张力。

## 影响

- 「精致的狗屎」风险：局部质量 ↑↑↑（checker 数量、测试数量、文档精确度、edge-case 处理），但核心抽象质量持平、运行模型复杂度 ↑、规则数量 ↑、维护面 ↑、Agent attention burden ↑、用户可感知价值持平。
- 治理系统本来就是用来控制复杂度的；如果为了治理项目制造一个本身需要大量治理的治理系统，再增加 governance-of-governance，就进入递归。
- review-manager 非常适合找到足够多局部 bug，以至于团队可能持续忙于修复它们，而延迟承认上层架构需要改变。

## 关闭条件

1. **review 先分类再修复**：Full/System Audit 默认 `review is read-only until findings are classified`——Find → Collect evidence → Classify abstraction level → Search sibling/systemic instances → Determine root cause → THEN decide remediation。
2. **Finding Level（L0–L4）落地**：每个问题先标一层——L0 Defect / L1 Mechanism Gap / L2 Control Gap / L3 Architecture Gap / L4 Research Finding。
3. **严重度第二轴**：在 severe/general/trivial（impact）之外增加 local / recurrent / systemic / architectural（abstraction）轴。
4. **Review 分层**：Implementation Review（当前 review-manager）与 System Review（新能力）分离；科研成熟后加 Research Review。
5. **一条提升规则**：如果一个 L0 bug 在多个 subsystem/profile 出现，必须向上检查是否存在 L1/L2/L3 finding——这比再增加十个 review checklist 更有效。

## 解决情况

（待填。不通过「继续给 review-manager 堆功能」解决——那会制造第二个 check-doc-consistency.js。方向：分层 + findings 先行分类 + L0–L4 finding level。）

## 关联

- GitHub Issue #7

## 回归保护

- 每条机械规则有负向 oracle（延续 FINDING-0006）。
- 未来 review 产出必须包含 classification 证据：每个 defect 标注 L0–L4 层级，recurrent defect 必须追溯 systemic finding 或显式声明「无系统性根因」。
